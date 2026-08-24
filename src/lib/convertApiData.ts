// convertApiData.ts
//
// Converts the club's external membership system's two raw endpoints —
// CoreMemberDto[] from /coremember, and per-member TreeItemDto[] from
// /mtreedata?id=<internal id> — into this app's flat Member[] shape.
// Pulled out of src/app/api/ext-members/route.ts (which still does the
// actual HTTP fetching) so the exact same conversion also runs offline:
// src/lib/demoData.ts feeds this the static src/lib/demoApiData.ts
// fixtures, so the 'static' data source exercises this same code path.
//
// Besides flattening (pid/rel/via/fatherId/motherId — used everywhere else
// in the app: search, grid, DetailPanel, MemberForm), every core member
// also keeps its own raw node list on `nodes` (see src/lib/types.ts) — the
// two relationship-diagram components read that directly instead of
// re-deriving relationships by scanning the whole flat array.

import type { Member, NodeKind, RelationNode } from './types';

export interface CoreMemberDto {
  id: string;
  acno: string;
  name: string;
  img?: string | null;
}

export interface TreeItemDto {
  Node: string;    // "Parent" | "Spouse" | "Siblings" | "Children" | "A4D" | "Associate" | "Transfer"
  Acno: string;
  Name: string;
  Relation: string;
  Code: string;
  Status?: string | null;         // "Y" active | "N" closed | absent on older rows
  ChildNode?: TreeItemDto[] | null; // nodes belonging to THIS row's member
  img?: string | null;
}

const clean = (v: string | null | undefined) => (v ?? '').trim();

// "Y"/"N" → true/false. Anything else (blank, missing, junk) is "not stated"
// rather than "inactive": a lot of records are still incomplete, and greying
// out a perfectly good account because a field hasn't been filled in yet
// would be worse than saying nothing.
function parseStatus(raw: string | null | undefined): boolean | null {
  const v = clean(raw).toUpperCase();
  if (v === 'Y') return true;
  if (v === 'N') return false;
  return null;
}

const NODE_KINDS = new Set<string>(['Parent', 'Spouse', 'Siblings', 'Children', 'A4D', 'Associate', 'Transfer']);

// "Wife/Husband/Spouse" relation text is only a secondary signal — the
// primary one is Acno appearing in BOTH the Spouse row and an A4D row for
// the same core member (checked via a4dSpouseAcnos below). This just fills
// in gender when we can.
function isSpouseRelation(relation: string): boolean {
  const r = relation.toLowerCase();
  return r === 'wife' || r === 'husband' || r === 'spouse';
}

// "Son" / "Daughter" mean this dependent's account sits directly under the
// core member's own quota. "Son of PA-41" / "Daughter of PA-41" means the
// same, but the dependent's real parent is a DIFFERENT member (a
// grandchild scenario) — the referenced A/C is captured as a fatherId so
// the existing "Son of PA-41" caption (driven by getRef()) renders
// correctly. A few source records are malformed as "Fathers Name (ACNO)"
// instead of "Son/Daughter of ACNO" — still worth extracting the A/C.
function parseChildRelation(relation: string): { gender: 'M' | 'F' | null; sponsorAcno: string | null } {
  if (!relation) return { gender: null, sponsorAcno: null };

  const exact = relation.toLowerCase();
  if (exact === 'son') return { gender: 'M', sponsorAcno: null };
  if (exact === 'daughter') return { gender: 'F', sponsorAcno: null };

  const ofMatch = relation.match(/^(son|daughter)\s+of\s+(\S+)$/i);
  if (ofMatch) {
    return { gender: ofMatch[1].toLowerCase() === 'son' ? 'M' : 'F', sponsorAcno: ofMatch[2] };
  }

  const parenMatch = relation.match(/\(([^)]+)\)\s*$/);
  if (parenMatch) return { gender: null, sponsorAcno: parenMatch[1].trim() };

  return { gender: null, sponsorAcno: null };
}

// "Brother"/"Sister" — the only gender signal Siblings rows carry.
function genderFromSiblingRelation(relation: string): 'M' | 'F' | null {
  const r = relation.toLowerCase();
  if (r === 'brother') return 'M';
  if (r === 'sister') return 'F';
  return null;
}

// Stable id for a parent with no club A/C — mirrors the existing
// PENDING-<clubAcno>-spouse pattern, so this parent still gets a card in
// the first-layer Parents row (displayAcno() shows "No A/C" for it)
// instead of silently disappearing just because they never held an
// account.
function pendingParentId(clubAcno: string, relation: string): string {
  return `PENDING-${clubAcno}-${relation === 'Father' ? 'father' : 'mother'}`;
}

// One raw row → a RelationNode, recursively including whatever its
// ChildNode array carried. Returns null for rows this app can't place: an
// unknown Node kind, or (for everything but Parent/Spouse) no A/C to point
// at — the malformed empty `{}` rows the API sometimes emits land here too.
function toRelationNode(
  item: TreeItemDto,
  hostAcno: string,
  effectiveSpouseId: string | null,
): RelationNode | null {
  const kind = clean(item.Node);
  if (!NODE_KINDS.has(kind)) return null;

  const itemAcno = clean(item.Acno);
  const itemName = clean(item.Name);
  const relation = clean(item.Relation);
  const photoUrl = clean(item.img) || null;
  const active = parseStatus(item.Status);

  // Spouse and Parent rows are worth keeping even with no club A/C — they
  // still get a card (labelled "No A/C") in both tabs. Everyone else needs a
  // real account number, since every other card is looked up by one.
  let acno = itemAcno;
  if (!acno && itemName) {
    if (kind === 'Spouse') acno = effectiveSpouseId ?? '';
    else if (kind === 'Parent') acno = pendingParentId(hostAcno, relation);
  }
  if (!acno || !itemName) return null;

  const node: RelationNode = {
    node: kind as NodeKind,
    acno,
    name: itemName,
    relation,
    // a placeholder id has no photo of its own to show
    photoUrl: itemAcno ? photoUrl : null,
    active,
  };

  const inner = Array.isArray(item.ChildNode)
    ? item.ChildNode
        .map(child => toRelationNode(child, acno, null))
        .filter((n): n is RelationNode => n !== null)
    : [];
  if (inner.length) node.inner = inner;

  return node;
}

// Every account mentioned anywhere in a row's ChildNode needs its own member
// record, or the diagrams have nothing to render when they follow the link.
// These are reference stubs: `pid` records whose row they arrived on, but
// rel/fatherId are deliberately left unset so the family index never mistakes
// an inner node for a blood relationship of the member hosting it.
function collectInnerMembers(
  nodes: RelationNode[],
  hostAcno: string,
  members: Record<string, unknown>[],
  seen: Set<string>,
): void {
  nodes.forEach(n => {
    if (!seen.has(n.acno)) {
      seen.add(n.acno);
      members.push({
        id: n.acno,
        name: n.name,
        via: n.node === 'A4D' ? 'a4d' : n.node === 'Associate' ? 'associate' : 'core',
        type: n.node === 'A4D' ? 'A4D' : n.node === 'Associate' ? 'Associate' : null,
        pid: hostAcno,
        rel: null,
        gender: null,
        since: null,
        photoUrl: n.photoUrl ?? null,
        active: n.active ?? null,
      });
    }
    if (n.inner?.length) collectInnerMembers(n.inner, n.acno, members, seen);
  });
}

export function convertApiMembers(
  coreList: CoreMemberDto[],
  treeByInternalId: Record<string, TreeItemDto[]>,
): Member[] {

  const members: Record<string, unknown>[] = [];
  const seen = new Set<string>();

  // Every core member's own acno is reserved up front, so a Parent/Sibling/
  // Children stub pushed while processing one core member never clobbers
  // another core member's own (fuller) record, regardless of processing
  // order.
  coreList.forEach(core => {
    const a = clean(core.acno);
    if (a) seen.add(a);
  });

  // Transfer rows ("account transferred from/to another member") are
  // resolved in a pass AFTER every core member has its own full record —
  // so `succession` (see Member in types.ts) can be set on the SOURCE
  // member's record whether that record already exists (a real coremember
  // processed earlier or later in this same loop) or needs a fresh stub.
  const transfers: { sourceAcno: string; sourceName: string; sourcePhoto: string | null; targetAcno: string }[] = [];

  // Status travels on the ROWS that mention an account, not on the account's
  // own /coremember entry — so it is collected here from every tree and
  // applied to the member records once they all exist. First statement wins;
  // the same account is described the same way wherever it appears.
  const statusByAcno = new Map<string, boolean>();

  // Inner (ChildNode) members are created last, so a reference stub can never
  // land on top of the fuller record a sibling/child/spouse row builds below.
  const innerRoots: { host: string; nodes: RelationNode[] }[] = [];

  coreList.forEach(core => {
    const clubAcno = clean(core.acno);
    const internalId = clean(core.id);
    const name = clean(core.name);

    if (!clubAcno || !name) return;
    if (members.some(m => m.id === clubAcno)) return; // dup entry in /coremember

    const rootMember: Record<string, unknown> = {
      id: clubAcno,
      name,
      via: 'core',
      pid: null,
      rel: null,
      gender: null,
      since: null,
      fatherId: null,
      motherId: null,
      fatherName: null,
      motherName: null,
      photoUrl: clean(core.img) || null,
      nodes: [] as RelationNode[],
    };
    members.push(rootMember);

    if (!internalId) return;

    const tree = treeByInternalId[internalId];
    if (!Array.isArray(tree)) return;

    // Spouse + A4D overlap detect: same Acno appearing as BOTH a Spouse
    // row and an A4D row means that partner holds her own A4D account —
    // she renders once, below, as via:'a4d' rel:'spouse' (PASS 2), not
    // as a second "beside" card.
    const spouseAcnos = new Set(
      tree.filter(i => clean(i.Node) === 'Spouse' && clean(i.Acno)).map(i => clean(i.Acno)),
    );
    const a4dAcnos = new Set(
      tree.filter(i => clean(i.Node) === 'A4D' && clean(i.Acno)).map(i => clean(i.Acno)),
    );
    const a4dSpouseAcnos = new Set([...spouseAcnos].filter(a => a4dAcnos.has(a)));

    // Stable id for "this core member's registered spouse" — resolved once
    // so both the flat pid/motherId wiring below AND the raw `nodes` list
    // agree on the same synthetic id for a spouse with no club A/C yet.
    const spouseRow = tree.find(i => clean(i.Node) === 'Spouse');
    const spouseRowAcno = spouseRow ? clean(spouseRow.Acno) : '';
    const spouseRowName = spouseRow ? clean(spouseRow.Name) : '';
    const effectiveSpouseId = spouseRowAcno || (spouseRowName ? `PENDING-${clubAcno}-spouse` : null);

    // ── raw node list — every "other node" this member's own tree
    // mentions, resolved to a stable target id. A Spouse row with no club
    // A/C still gets an entry (using effectiveSpouseId) since the Family/
    // Member relationship tabs need to seat her beside regardless of
    // whether she holds an account. Every other kind needs a real Acno —
    // no card renders without one anywhere else in this app either. ──
    const nodes: RelationNode[] = tree
      .map(item => toRelationNode(item, clubAcno, effectiveSpouseId))
      .filter((n): n is RelationNode => n !== null);
    rootMember.nodes = nodes;

    const noteStatus = (list: RelationNode[]) => list.forEach(n => {
      if (n.active != null && !statusByAcno.has(n.acno)) statusByAcno.set(n.acno, n.active);
      if (n.inner?.length) noteStatus(n.inner);
    });
    noteStatus(nodes);

    nodes.forEach(n => { if (n.inner?.length) innerRoots.push({ host: n.acno, nodes: n.inner }); });

    // ── PASS 1: Parent + Siblings + independent ("core") spouse ──────
    for (const item of tree) {
      const node = clean(item.Node);
      const relation = clean(item.Relation);
      const itemAcno = clean(item.Acno);
      const itemName = clean(item.Name);

      if (node === 'Parent') {
        // A parent occasionally has their own club A/C (Acno present) —
        // link it. When they don't, fall back to a PENDING-<clubAcno>-
        // father/mother id (same idea as the no-A/C spouse below) so this
        // parent still gets a fatherId/motherId reference AND their own
        // stub record — the first-layer Parents row (buildMemberRelGraph)
        // and DetailPanel both need something to resolve to, not just a
        // free-text name.
        const isFather = relation === 'Father';
        const isMother = relation === 'Mother';
        const resolvedAcno = itemAcno || (itemName && (isFather || isMother) ? pendingParentId(clubAcno, relation) : null);

        // A resolvable father/mother with a REAL A/C ALSO becomes this
        // member's own pid/rel ("child" of that parent) — not just
        // fatherId/motherId — so getBioChildren()'s quota-mode branch
        // (rel==='child' && via==='core' && pid===parent.id), which
        // MemberRelationshipTree always uses, can walk from a core parent
        // down into their own core-member children. A PENDING (no-A/C)
        // parent never holds real quota, so pid/rel stay untouched for
        // that case — only fatherId/motherId (reference only) get set.
        // Father wins when both resolve, so a child is only ever
        // reachable from ONE parent's own traversal (the other parent is
        // still found via the spouse-inclusive half of that same check).
        if (isFather) {
          rootMember.fatherName = itemName || null;
          if (resolvedAcno) rootMember.fatherId = resolvedAcno;
          if (itemAcno) {
            rootMember.pid = itemAcno;
            rootMember.rel = 'child';
          }
        } else if (isMother) {
          rootMember.motherName = itemName || null;
          if (resolvedAcno) rootMember.motherId = resolvedAcno;
          if (itemAcno && !rootMember.pid) {
            rootMember.pid = itemAcno;
            rootMember.rel = 'child';
          }
        }

        // A parent with a real A/C needs their own member record too -
        // otherwise fatherId/motherId above points at someone who
        // doesn't exist anywhere in `members`, so the Parents row in
        // DetailPanel (and the Family Relationship diagram) can never
        // be clicked through to their own card. `seen` already holds
        // every core member's own id by this point, so this only fires
        // for a parent who ISN'T already going to get their own full
        // record - e.g. a deceased parent no longer in the active
        // coremember list, or one linked from a sibling processed
        // earlier in this same pass. A PENDING parent (no A/C at all)
        // always needs a fresh stub — nothing else could have created it.
        if (resolvedAcno && itemName && !seen.has(resolvedAcno)) {
          seen.add(resolvedAcno);
          members.push({
            id: resolvedAcno,
            name: itemName,
            via: 'core',
            pid: null,
            rel: null,
            gender: isFather ? 'M' : isMother ? 'F' : null,
            since: null,
            photoUrl: itemAcno ? (clean(item.img) || null) : null,
          });
        }
        continue;
      }

      if (node === 'Siblings') {
        if (itemAcno && itemName && !seen.has(itemAcno)) {
          seen.add(itemAcno);
          members.push({
            id: itemAcno,
            name: itemName,
            via: 'core',
            pid: null,
            rel: 'sibling',
            gender: genderFromSiblingRelation(relation),
            since: null,
            photoUrl: clean(item.img) || null,
          });
        }
        continue;
      }

      if (node === 'Children') {
        if (itemAcno && itemName && !seen.has(itemAcno)) {
          seen.add(itemAcno);
          const { gender } = parseChildRelation(relation);
          members.push({
            id: itemAcno,
            name: itemName,
            via: 'core',
            pid: clubAcno,
            rel: 'child',
            gender,
            since: null,
            photoUrl: clean(item.img) || null,
          });
        }
        continue;
      }

      if (node === 'Transfer') {
        // "Transfer from" — this member (clubAcno) received the A/C from
        // itemAcno; "Transfer to" — the reverse. Either way, `succession`
        // always lives on the GIVING member's record, pointing at the
        // RECEIVING member's id — resolved below, once every core member
        // has its own record.
        if (itemAcno && itemName) {
          const relLower = relation.toLowerCase();
          if (relLower.includes('to')) {
            rootMember.succession = itemAcno;
          } else {
            transfers.push({ sourceAcno: itemAcno, sourceName: itemName, sourcePhoto: clean(item.img) || null, targetAcno: clubAcno });
          }
        }
        continue;
      }

      if (node === 'Spouse') {
        if (itemAcno) {
          if (a4dSpouseAcnos.has(itemAcno)) continue; // handled in PASS 2
          if (seen.has(itemAcno)) continue;
          seen.add(itemAcno);
          members.push({
            id: itemAcno,
            name: itemName || itemAcno,
            via: 'core',
            pid: clubAcno,
            rel: 'spouse',
            gender: null,
            since: null,
            photoUrl: clean(item.img) || null,
          });
        } else if (itemName && !seen.has(effectiveSpouseId!)) {
          // No club A/C — not a member, so she never appears in the
          // Member Relationship tab (isBesideSpouse excludes PENDING
          // ids). She still needs a record so the Family Relationship
          // tab can seat her beside the root and resolve her own
          // spouse/children when clicked.
          seen.add(effectiveSpouseId!);
          members.push({
            id: effectiveSpouseId!,
            name: itemName,
            via: 'core',
            pid: clubAcno,
            rel: 'spouse',
            gender: null,
            since: null,
          });
        }
      }
    }

    // ── PASS 2: A4D + Associate dependents ───────────────────────────
    for (const item of tree) {
      const node = clean(item.Node);
      if (node !== 'A4D' && node !== 'Associate') continue;

      const itemAcno = clean(item.Acno);
      const itemName = clean(item.Name);
      if (!itemAcno || !itemName || seen.has(itemAcno)) continue;
      seen.add(itemAcno);

      const relation = clean(item.Relation);
      const relationLower = relation.toLowerCase();
      const isSpouse = a4dSpouseAcnos.has(itemAcno) || isSpouseRelation(relation);
      const { gender: childGender, sponsorAcno } = parseChildRelation(relation);

      let gender: 'M' | 'F' | null = childGender;
      let rel: string;

      if (isSpouse) {
        rel = 'spouse';
        if (!gender) gender = relationLower === 'wife' ? 'F' : relationLower === 'husband' ? 'M' : null;
      } else {
        // Default to "child" for everything that isn't the registered
        // spouse — including relation text like "Father"/"Mother",
        // which on real data doesn't mean this dependent IS a parent
        // figure; it's just inconsistent labeling for what is actually
        // one of the core member's own children. The dedicated Parent
        // node (handled above) is the only source ever used for the
        // core member's own father/mother — this branch never
        // cross-links into that. Unlike "Son"/"Daughter" (handled in
        // parseChildRelation), the "Father"/"Mother" tag carries no
        // reliable gender signal, so gender stays null here.
        rel = 'child';
      }

      const isPlainChild = rel === 'child' && !sponsorAcno;

      members.push({
        id: itemAcno,
        name: itemName,
        via: node === 'A4D' ? 'a4d' : 'associate',
        // Explicit type override: real A/C prefixes for A4D/Associate
        // dependents don't follow this app's own P/D/L/AFD/AS prefix
        // convention, so prefix-guessing in getType() would mis-color
        // them — set it directly instead.
        type: node === 'A4D' ? 'A4D' : 'Associate',
        pid: clubAcno,
        rel,
        gender,
        since: null,
        // "Son"/"Daughter" (plain) means their real parent IS the core
        // member — same as "Son of X" but with clubAcno standing in for
        // X. Setting fatherId either way is what makes them show up in
        // the side panel's Children list, which matches on
        // fatherId/motherId, not pid.
        fatherId: rel === 'child' ? (sponsorAcno ?? clubAcno) : null,
        // Only linked to the registered spouse for plain children (real
        // parent is this couple) — never for the "of X" grandchild
        // case, whose mother is someone else entirely.
        motherId: isPlainChild && effectiveSpouseId ? effectiveSpouseId : null,
        quotaNote: node === 'A4D' ? `4(d) via ${clubAcno}` : `Associate via ${clubAcno}`,
        photoUrl: clean(item.img) || null,
      });
    }
  });

  // ── reference stubs for everything that only appeared inside a row's
  // ChildNode, so those cards have something to resolve to ──
  innerRoots.forEach(({ host, nodes }) => collectInnerMembers(nodes, host, members, seen));

  // ── resolve Transfer rows now that every core member has its own full
  // record — patch `succession` onto the giving member if they already
  // exist (as a real coremember, wherever it fell in the loop above), or
  // create a minimal stub for them if they don't appear anywhere else.
  transfers.forEach(({ sourceAcno, sourceName, sourcePhoto, targetAcno }) => {
    const existing = members.find(m => m.id === sourceAcno);
    if (existing) {
      existing.succession = targetAcno;
    } else if (!seen.has(sourceAcno)) {
      seen.add(sourceAcno);
      members.push({
        id: sourceAcno,
        name: sourceName,
        via: 'core',
        pid: null,
        rel: null,
        gender: null,
        since: null,
        photoUrl: sourcePhoto,
        succession: targetAcno,
      });
    }
  });

  // ── active/closed, from whichever rows stated it ──
  members.forEach(m => {
    if (m.active == null) {
      const stated = statusByAcno.get(m.id as string);
      if (stated !== undefined) m.active = stated;
    }
  });

  return members as unknown as Member[];
}
