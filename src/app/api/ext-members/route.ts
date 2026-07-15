// src/app/api/ext-members/route.ts
//
// Converts the club's external membership system (two REST endpoints, a
// different JSON shape) into this app's flat Member[] shape. See the
// per-section comments below — the source data has several real-world
// quirks (padded blank strings, relation text that sometimes encodes a
// grandparent reference, spouses who are also their own A4D dependent,
// members with no A/C yet) that all needed explicit handling.

import { NextResponse } from 'next/server';

const BASE = 'http://118.179.152.53/myweb01/api';

interface CoreMemberDto {
  id: string;
  acno: string;
  name: string;
}

interface TreeItemDto {
  Node: string;    // "A4D" | "Associate" | "Parent" | "Spouse"
  Acno: string;
  Name: string;
  Relation: string;
  Code: string;
}

const clean = (v: string | null | undefined) => (v ?? '').trim();

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

export async function GET() {
  try {
    const coreRes = await fetch(`${BASE}/coremember`, { cache: 'no-store' });
    if (!coreRes.ok) throw new Error(`coremember ${coreRes.status}`);
    const coreList: CoreMemberDto[] = await coreRes.json();
    if (!Array.isArray(coreList)) throw new Error('coremember did not return an array');

    const members: Record<string, unknown>[] = [];
    const seen = new Set<string>();

    await Promise.all(
      coreList.map(async core => {
        const clubAcno = clean(core.acno);
        const internalId = clean(core.id);
        const name = clean(core.name);

        if (!clubAcno || !name || seen.has(clubAcno)) return;
        seen.add(clubAcno);

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
        };
        members.push(rootMember);

        if (!internalId) return;

        let tree: TreeItemDto[] = [];
        try {
          const treeRes = await fetch(`${BASE}/mtreedata?id=${internalId}`, { cache: 'no-store' });
          if (!treeRes.ok) throw new Error(`mtreedata ${treeRes.status}`);
          const json = await treeRes.json();
          if (Array.isArray(json)) tree = json;
        } catch (err) {
          console.error(`[ext-members] mtreedata failed for ${internalId}`, err);
          return;
        }

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

        // ── PASS 1: Parent + independent ("core") spouse ─────────────────
        for (const item of tree) {
          const node = clean(item.Node);
          const relation = clean(item.Relation);
          const itemAcno = clean(item.Acno);
          const itemName = clean(item.Name);

          if (node === 'Parent') {
            // A parent occasionally has their own club A/C (Acno present) —
            // link it, on top of always keeping the plain name as a
            // fallback for when it doesn't resolve to anyone we fetched.
            if (relation === 'Father') {
              rootMember.fatherName = itemName || null;
              if (itemAcno) rootMember.fatherId = itemAcno;
            } else if (relation === 'Mother') {
              rootMember.motherName = itemName || null;
              if (itemAcno) rootMember.motherId = itemAcno;
            }
            continue;
          }

          if (node === 'Spouse') {
            if (!itemName && !itemAcno) continue; // fully empty row

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
              });
            } else {
              // No A/C on file for this spouse yet — still show them.
              const pendingId = `PENDING-${clubAcno}-spouse`;
              if (seen.has(pendingId)) continue;
              seen.add(pendingId);
              members.push({
                id: pendingId,
                name: itemName,
                via: 'core',
                pid: clubAcno,
                rel: 'spouse',
                gender: null,
                since: null,
                note: 'No club A/C registered',
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
          } else if (relationLower === 'father') {
            // Relation "Father" here means this Associate/A4D entry's OWN
            // dependent is the core member's father — but on real data this
            // occasionally names someone different from (and inconsistent
            // with) the dedicated Parent-node record for the same core
            // member. Only the Parent node is trustworthy enough to set
            // rootMember.fatherId/fatherName from — this just tags this
            // dependent's own gender/relation, no cross-linking.
            rel = 'other';
            gender = 'M';
          } else if (relationLower === 'mother') {
            rel = 'other';
            gender = 'F';
          } else if (gender) {
            rel = 'child';
          } else {
            rel = 'other';
          }

          members.push({
            id: itemAcno,
            name: itemName,
            via: node === 'A4D' ? 'a4d' : 'associate',
            // Explicit type override: real A/C prefixes for A4D/Associate
            // dependents don't follow this app's own P/D/L/AFD/AS prefix
            // convention (e.g. "AN-54" for Associate), so prefix-guessing
            // in getType() would mis-color them — set it directly instead.
            type: node === 'A4D' ? 'A4D' : 'Associate',
            pid: clubAcno,
            rel,
            gender,
            since: null,
            fatherId: !isSpouse && sponsorAcno ? sponsorAcno : null,
            quotaNote: node === 'A4D' ? `4(d) via ${clubAcno}` : `Associate via ${clubAcno}`,
          });
        }
      }),
    );

    return NextResponse.json(members);
  } catch (err) {
    console.error('[ext-members]', err);
    return NextResponse.json({ error: 'Failed to fetch from external API' }, { status: 502 });
  }
}
