// src/lib/familyIndex.ts
//
// One shared answer to "who is actually whose family?" — built once per
// members array and reused by the Family Relationship diagram and the
// DetailPanel, so those two can never disagree.
//
// WHY THIS EXISTS
// ---------------
// The club API describes relationships from ONE member's point of view at a
// time (Member.nodes — see src/lib/types.ts). A dependent sitting in a core
// member's 4(d) quota is NOT necessarily that member's own child: the
// relation text says whose child they really are.
//
//   DA-27's own nodes:  A4D  AFD-0038  "Daughter"          → DA-27's child
//                       A4D  PC-9      "Daughter of DH-3"  → DH-3's child,
//                                                            only parked in
//                                                            DA-27's quota
//
// The Member Relationship tab renders that quota view verbatim (PC-9 stays
// on DA-27's card there — that IS the membership fact). The Family
// Relationship tab and the panel's Children list want the BLOOD view
// instead, which means:
//
//   * "Son"/"Daughter" (plain)     → child of the member whose tree it is
//   * "Son of X"/"Daughter of X"   → child of X, NOT of that member
//   * a couple share their children, so each spouse's tab shows the union
//   * a child mentioned from ANYWHERE (someone else's quota rows, a Parent
//     row pointing back, a sibling's shared parents, flat fatherId/motherId)
//     still shows up under the right parent — that's the whole point of
//     indexing every member's nodes instead of reading only the focused
//     member's own list.
//
// Ids are matched case-insensitively (the source data is inconsistent about
// casing), so every map here is keyed by the upper-cased A/C number while
// RelLink.id keeps whatever the API actually said.

import type { Member, RelationNode } from './types';
import type { ResolvedNode } from './relationTypes';

export type { ResolvedNode };

/** One relationship edge, carrying the relation text that produced it. */
export interface RelLink {
  id: string;                 // target A/C, as spelled by the source row
  relation: string;           // raw relation text ("Daughter", "Son of PM-174", …)
  name?: string | null;       // name as spelled in THIS row (see displayMember)
  photoUrl?: string | null;
  inner?: RelationNode[];     // the row's own ChildNode list, if any
  // True when an actual API row said this, rather than the index working it
  // out. Only parents use it so far: what a member's own record says about
  // their parents beats anything inferred from a sibling's record.
  stated?: boolean;
  // On a parent link: how the child was described by the row that produced
  // it. "Daughter" is somebody stating a parent; a blank 4(d) row is an
  // account sitting in a quota, which is a much weaker claim to the same
  // thing. Kept on the parent side because the parent side is where the
  // competing claims have to be told apart.
  claim?: string;
}


export interface FamilyIndex {
  byId:     Map<string, Member>;
  spouses:  Map<string, Map<string, RelLink>>;
  children: Map<string, Map<string, RelLink>>;
  parents:  Map<string, Map<string, RelLink>>;
  siblings: Map<string, Map<string, RelLink>>;
}

const key = (id: string | null | undefined) => (id ?? '').trim().toUpperCase();

/**
 * A parent with no club A/C of their own gets a PENDING-<member>-father/mother
 * stand-in so they still get a card. That id belongs to ONE member's record —
 * two members' unnamed fathers are two different men even when neither holds
 * an account — so it must never be used to connect people to each other.
 */
const isPlaceholder = (id: string | null | undefined) => key(id).startsWith('PENDING-');

const SPOUSE_WORDS  = new Set(['wife', 'husband', 'spouse']);
const SIBLING_WORDS = new Set(['brother', 'sister', 'sibling', 'siblings']);

/**
 * Splits a relation string into its label and any cross-referenced A/C.
 *   "Daughter"          → { base: 'Daughter', ref: null   }
 *   "Son of PM-174"     → { base: 'Son',      ref: 'PM-174' }
 *   "Karim Mia (PA-41)" → { base: 'Karim Mia', ref: 'PA-41' }  (malformed rows)
 */
export function parseRelationText(relation: string | null | undefined): { base: string; ref: string | null } {
  const text = (relation ?? '').trim();
  if (!text) return { base: '', ref: null };

  const ofMatch = text.match(/^(.*?)\s+of\s+(\S+)$/i);
  if (ofMatch) return { base: ofMatch[1].trim(), ref: ofMatch[2].trim() };

  const parenMatch = text.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (parenMatch) return { base: parenMatch[1].trim(), ref: parenMatch[2].trim() };

  return { base: text, ref: null };
}

function addLink(map: Map<string, Map<string, RelLink>>, fromId: string, link: RelLink): void {
  const from = key(fromId);
  const to   = key(link.id);
  if (!from || !to || from === to) return;

  let bucket = map.get(from);
  if (!bucket) { bucket = new Map(); map.set(from, bucket); }

  const existing = bucket.get(to);
  // First writer wins, except that a later row carrying actual relation text
  // fills in for an earlier one that had none (e.g. a Parent row pointing
  // back at a child whose own label we only learn later).
  if (!existing) bucket.set(to, link);
  else if (!existing.relation && link.relation) bucket.set(to, { ...existing, relation: link.relation });
}

function pair(map: Map<string, Map<string, RelLink>>, a: RelLink & { id: string }, b: RelLink): void {
  addLink(map, a.id, b);
  addLink(map, b.id, { id: a.id, relation: a.relation, name: a.name, photoUrl: a.photoUrl });
}

export function buildFamilyIndex(members: Member[]): FamilyIndex {
  const index: FamilyIndex = {
    byId:     new Map(),
    spouses:  new Map(),
    children: new Map(),
    parents:  new Map(),
    siblings: new Map(),
  };

  members.forEach(m => index.byId.set(key(m.id), m));

  // Members whose only claim to a parent is convertApiData's fallback guess.
  // That converter gives every unclassified dependent a fatherId (and a
  // motherId pointing at the sponsor's spouse) so they list under the quota
  // holder — useful there, wrong here. When a node row has already told us
  // this person is an associate rather than family, the flat pass below must
  // not quietly reinstate the parent link. An explicit row naming them as
  // someone's child still counts: only the guess is ignored.
  const noInferredParents = new Set<string>();

  // `stated` marks a link an actual API row asserted, as opposed to one this
  // index worked out afterwards — see RelLink.stated.
  const linkChild = (parentId: string, child: RelLink, stated: boolean) => {
    addLink(index.children, parentId, child);
    addLink(index.parents, child.id, { id: parentId, relation: '', stated, claim: child.relation });
  };

  // ── pass 1: every core member's own raw node list ──────────────────────
  members.forEach(owner => {
    if (!owner.nodes) return;

    owner.nodes.forEach(n => {
      const link: RelLink = { id: n.acno, relation: n.relation, name: n.name, photoUrl: n.photoUrl, inner: n.inner };
      if (!key(n.acno)) return;

      switch (n.node) {
        case 'Spouse':
          pair(index.spouses, { id: owner.id, relation: n.relation }, link);
          return;

        case 'Parent':
          addLink(index.parents, owner.id, { ...link, stated: true });
          addLink(index.children, n.acno, { id: owner.id, relation: '' });
          return;

        case 'Siblings':
          pair(index.siblings, { id: owner.id, relation: '' }, link);
          return;

        case 'Children':
        case 'A4D':
        case 'Associate': {
          // The relation text decides — a quota row is not automatically a
          // parent-child fact (see the file header).
          const { base, ref } = parseRelationText(n.relation);
          const word = base.toLowerCase();

          if (SPOUSE_WORDS.has(word)) {
            pair(index.spouses, { id: owner.id, relation: n.relation }, link);
            return;
          }
          if (SIBLING_WORDS.has(word)) {
            pair(index.siblings, { id: owner.id, relation: n.relation }, link);
            return;
          }
          // "of X" names the real parent — the dependent then belongs to X's
          // family, and to nobody else's, even though their membership hangs
          // off this owner's quota.
          if (ref) { linkChild(ref, link, true); return; }

          // No cross-reference. A Children row, or a 4(d) row (that quota is
          // for the member's own dependents), means their own child — real
          // data labels those inconsistently, so the wording isn't required.
          // An Associate row is different: "Associate-01" is a slot number,
          // not a relationship, so unless it actually says Son/Daughter this
          // is somebody's associate member and no family claim is made.
          if (n.node === 'Associate' && word !== 'son' && word !== 'daughter' && word !== 'child') {
            noInferredParents.add(key(n.acno));
            return;
          }
          linkChild(owner.id, link, true);
          return;
        }

        default:
          // 'Transfer' carries no family meaning.
          return;
      }
    });
  });

  // ── pass 2: flat fields, for members the node lists never covered ──────
  // (dependents of a non-core sponsor, records built before nodes existed,
  // and the static demo data path — all still resolve here.)
  members.forEach(m => {
    if (!noInferredParents.has(key(m.id))) {
      if (m.fatherId) linkChild(m.fatherId, { id: m.id, relation: '' }, false);
      if (m.motherId) linkChild(m.motherId, { id: m.id, relation: '' }, false);
      if (!m.fatherId && !m.motherId && m.rel === 'child' && m.pid) {
        linkChild(m.pid, { id: m.id, relation: '' }, false);
      }
    }
    if (m.rel === 'spouse' && m.pid) {
      pair(index.spouses, { id: m.pid, relation: 'Spouse' }, { id: m.id, relation: 'Spouse' });
    }
  });

  // ── pass 3: siblings share parents ─────────────────────────────────────
  // So searching a father shows ALL of his children, not just the one whose
  // tree happened to name him.
  //
  // Read off a SNAPSHOT of what passes 1-2 established, never off the links
  // this pass is adding: real records contradict each other (the same pair
  // shows up as father/child in one member's tree and as siblings in
  // another's), and feeding inferences back in lets one bad row cascade into
  // invented parents several people away. Anything already recorded as a
  // different relationship between the two is left alone for the same
  // reason — a stated relationship always beats an inferred one.
  const snapshot = (map: Map<string, Map<string, RelLink>>) =>
    new Map([...map].map(([k, bucket]) => [k, [...bucket.values()]]));

  const parentsAt2 = snapshot(index.parents);
  const siblingsAt2 = snapshot(index.siblings);

  const related = (map: Map<string, Map<string, RelLink>>, a: string, b: string) =>
    map.get(key(a))?.has(key(b)) ?? false;

  members.forEach(m => {
    const sibs = siblingsAt2.get(key(m.id));
    const pars = parentsAt2.get(key(m.id));
    if (!sibs?.length || !pars?.length) return;

    pars.forEach(parent => {
      // A stand-in for one member's unnamed parent is not a person anyone
      // else can be a child of. Without this, every sibling inherits every
      // other sibling's placeholder father — so a member ends up with a row
      // of "Father of <someone else>" cards, and, through them, the whole
      // club as brothers.
      if (isPlaceholder(parent.id)) return;
      sibs.forEach(sib => {
        if (key(sib.id) === key(parent.id)) return;
        if (related(index.siblings, parent.id, sib.id)) return;  // stated siblings
        if (related(index.spouses, parent.id, sib.id)) return;   // stated spouses
        if (related(index.parents, parent.id, sib.id)) return;   // sib is the parent's parent
        linkChild(parent.id, { id: sib.id, relation: sib.relation, name: sib.name, photoUrl: sib.photoUrl }, false);
      });
    });
  });

  return index;
}

// Rebuilding on every render would be wasteful (and the diagrams re-render a
// lot); the members array is replaced wholesale whenever data changes, so
// identity is a safe cache key.
const indexCache = new WeakMap<Member[], FamilyIndex>();

export function getFamilyIndex(members: Member[]): FamilyIndex {
  let cached = indexCache.get(members);
  if (!cached) {
    cached = buildFamilyIndex(members);
    indexCache.set(members, cached);
  }
  return cached;
}

/** O(1) member lookup — replaces members.find() in hot paths. */
export const findMember = (index: FamilyIndex, id: string | null | undefined): Member | undefined =>
  id ? index.byId.get(key(id)) : undefined;

function resolve(index: FamilyIndex, links: Iterable<RelLink> | undefined, skip: Set<string>): ResolvedNode[] {
  const out: ResolvedNode[] = [];
  if (!links) return out;
  for (const link of links) {
    const k = key(link.id);
    if (skip.has(k)) continue;
    const member = index.byId.get(k);
    if (!member) continue;   // referenced A/C we hold no record for
    skip.add(k);
    out.push({
      member,
      relation: link.relation ?? '',
      name: link.name || member.name,
      photoUrl: link.photoUrl ?? member.photoUrl,
      inner: link.inner,
    });
  }
  return out;
}

export function familySpouses(index: FamilyIndex, id: string): ResolvedNode[] {
  return resolve(index, index.spouses.get(key(id))?.values(), new Set([key(id)]));
}

/**
 * The parent links worth showing. A member's own record is the authority on
 * who their parents are: when it names them, nothing inferred from anyone
 * else's record is added beside them. Only a member whose own record is
 * silent falls back to what the rest of the data implies — which is how a
 * dependent, who carries no Parent row at all, still finds their parents.
 */
function parentLinks(index: FamilyIndex, id: string): RelLink[] {
  const all = [...(index.parents.get(key(id))?.values() ?? [])];
  const self = index.byId.get(key(id));
  // A link the member's own flat record points at is kept whatever produced
  // it — that is the reading the rest of the app already goes by, and it is
  // usually the only thing naming the mother of a plainly-listed child.
  const own = (l: RelLink) =>
    !!self && (key(l.id) === key(self.fatherId) || key(l.id) === key(self.motherId));
  const kept = all.filter(l => l.stated || own(l));
  return kept.length ? kept : all;
}

/** Which side of a person's parentage a link is claiming, if it says. */
type ParentSlot = 'father' | 'mother' | 'unknown';

function parentSlot(entry: ResolvedNode, self: Member | undefined): ParentSlot {
  const word = parseRelationText(entry.relation).base.toLowerCase();
  if (word === 'father') return 'father';
  if (word === 'mother') return 'mother';
  if (self && key(entry.member.id) === key(self.fatherId)) return 'father';
  if (self && key(entry.member.id) === key(self.motherId)) return 'mother';
  if (entry.member.gender === 'M') return 'father';
  if (entry.member.gender === 'F') return 'mother';
  return 'unknown';
}

/**
 * Nobody has three parents.
 *
 * The club's records don't guarantee that: an A/C written into several
 * members' trees makes every one of those members a claimed parent of that
 * dependent, and a panel listing a column of "Parent" rows is wrong however
 * many rows the data has. So the claims are weighed, and at most one father
 * and one mother come out.
 *
 * A claim carries real evidence of which parent it is when the row says
 * "Father"/"Mother" outright, when the member's own record points at that
 * person, or when the person's gender is known. Claims with none of that
 * are only named when there is no competition — one unlabelled claim is a
 * parent whose details are simply missing, but a dozen of them are a
 * mistake in the records, and naming two at random would be inventing an
 * answer the data doesn't have.
 */
const CHILD_WORDS = new Set(['son', 'daughter', 'child']);

function pickParents(entries: ResolvedNode[], claims: Map<string, string>, self: Member | undefined): ResolvedNode[] {
  if (entries.length <= 1) return entries;

  // Lower is better. 4 means the row asserted nothing at all — an account
  // number sitting in somebody's quota with no relationship written on it.
  const confidence = (e: ResolvedNode): number => {
    const word = parseRelationText(e.relation).base.toLowerCase();
    if (word === 'father' || word === 'mother') return 0;
    if (self && (key(e.member.id) === key(self.fatherId) || key(e.member.id) === key(self.motherId))) return 1;
    if (CHILD_WORDS.has(parseRelationText(claims.get(key(e.member.id))).base.toLowerCase())) return 2;
    if (e.member.gender) return 3;
    return 4;
  };

  const ranked = entries
    .map((entry, i) => ({ entry, i, score: confidence(entry), slot: parentSlot(entry, self) }))
    .sort((a, b) => a.score - b.score || a.i - b.i);

  // Nothing but blank quota rows to go on. One of those is a parent whose
  // details are simply missing; a dozen of them is a mistake in the
  // records, and naming two at random would invent an answer.
  if (ranked.every(r => r.score === 4)) return entries.length <= 2 ? entries : [];

  const out: ResolvedNode[] = [];
  const taken = new Set<ParentSlot>();
  for (const r of ranked) {
    if (r.score === 4) break;                              // ranked, so the rest are too
    if (r.slot !== 'unknown' && taken.has(r.slot)) continue; // never two fathers
    out.push(r.entry);
    if (r.slot !== 'unknown') taken.add(r.slot);
    if (out.length === 2) break;
  }
  return out;
}

export function familyParents(index: FamilyIndex, id: string): ResolvedNode[] {
  const links = parentLinks(index, id);
  const claims = new Map(links.map(l => [key(l.id), l.claim ?? '']));
  const entries = resolve(index, links, new Set([key(id)]));
  return pickParents(entries, claims, index.byId.get(key(id)));
}

/**
 * Stated siblings first, then anyone else who shares a parent — two children
 * of the same couple are siblings even though neither one's record says so
 * (dependents don't carry Siblings rows at all).
 */
export function familySiblings(index: FamilyIndex, id: string): ResolvedNode[] {
  const self = key(id);
  const skip = new Set([self]);
  index.spouses.get(self)?.forEach((_, k) => skip.add(k));
  index.parents.get(self)?.forEach((_, k) => skip.add(k));

  const out = resolve(index, index.siblings.get(self)?.values(), skip);
  // Through the two parents actually shown, and never through a placeholder:
  // that stand-in stands for this member's own parent, so the only child it
  // can produce is this member.
  familyParents(index, id).forEach(parent => {
    if (isPlaceholder(parent.member.id)) return;
    out.push(...resolve(index, index.children.get(key(parent.member.id))?.values(), skip));
  });
  return out;
}

/**
 * Every biological child of this member AND of their spouse(s) — the union
 * a family tree should show, wherever in the data each child was mentioned.
 * Spouses, parents and siblings are never returned, so one malformed
 * relation string can't seat a parent in the children row.
 */
export function familyChildren(index: FamilyIndex, id: string): ResolvedNode[] {
  const self = key(id);
  const spouseKeys = [...(index.spouses.get(self)?.keys() ?? [])];

  const skip = new Set<string>([self, ...spouseKeys]);
  index.parents.get(self)?.forEach((_, k) => skip.add(k));
  index.siblings.get(self)?.forEach((_, k) => skip.add(k));

  const out: ResolvedNode[] = [];
  [self, ...spouseKeys].forEach(parentKey => {
    out.push(...resolve(index, index.children.get(parentKey)?.values(), skip));
  });
  return out;
}

/**
 * Caption for a child card: the relation as stated, minus any "of X"
 * cross-reference (in the family view the child is shown under the very
 * parent that reference points at, so repeating it would just be noise).
 */
export function childCaption(entry: ResolvedNode): string {
  const { base } = parseRelationText(entry.relation);
  const word = base.toLowerCase();
  if (word === 'son' || word === 'daughter') return word === 'son' ? 'Son' : 'Daughter';
  return entry.member.gender === 'M' ? 'Son' : entry.member.gender === 'F' ? 'Daughter' : 'Child';
}

/** "Father"/"Mother" — stated wording first, then the flat links, then gender. */
export function parentCaption(entry: ResolvedNode, owner: Member): string {
  const word = parseRelationText(entry.relation).base.toLowerCase();
  if (word === 'father' || word === 'mother') return word === 'father' ? 'Father' : 'Mother';
  if (key(entry.member.id) === key(owner.fatherId)) return 'Father';
  if (key(entry.member.id) === key(owner.motherId)) return 'Mother';
  return entry.member.gender === 'M' ? 'Father' : entry.member.gender === 'F' ? 'Mother' : 'Parent';
}

export function siblingCaption(entry: ResolvedNode): string {
  const word = parseRelationText(entry.relation).base.toLowerCase();
  if (word === 'brother' || word === 'sister') return word === 'brother' ? 'Brother' : 'Sister';
  return entry.member.gender === 'M' ? 'Brother' : entry.member.gender === 'F' ? 'Sister' : 'Sibling';
}

/** Father before Mother before anyone else — the order a panel reads best in. */
export function sortParents(entries: ResolvedNode[], owner: Member): ResolvedNode[] {
  const rank = (e: ResolvedNode) => {
    const c = parentCaption(e, owner);
    return c === 'Father' ? 0 : c === 'Mother' ? 1 : 2;
  };
  return [...entries].sort((a, b) => rank(a) - rank(b));
}
