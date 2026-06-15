import type { OperatorSheet, WeaponSheet, GearPieceSheet, GearSetSheet, EnemySheet } from './types';
import type { OperatorListEntry, WeaponListEntry, GearPieceListEntry } from '../types';
import { getEnemyGameName } from './gameText';
// Gear piece sheets (loaded via glob)
const gearPieceModules = import.meta.glob('./gearpieces/**/*.ts', {
  eager: true,
  import: 'default',
}) as Record<string, GearPieceSheet>;

// Re-export timeline data accessors
export {
  getCharacterRoster,
  getEquipmentDatabase,
  getSystemConstants,
  getEquipmentCategories,
  getEquipmentCategoryConfigs,
  getIconDatabase,
} from './timeline';

// Operator effect sheets
import akekuri from './operators/akekuri';
import alesh from './operators/alesh';
import antal from './operators/antal';
import arclight from './operators/arclight';
import ardelia from './operators/ardelia';
import avywenna from './operators/avywenna';
import camille from './operators/camille';
import catcher from './operators/catcher';
import chen_qianyu from './operators/chen-qianyu';
import da_pan from './operators/da-pan';
import ember from './operators/ember';
import endministrator from './operators/endministrator';
import estella from './operators/estella';
import fluorite from './operators/fluorite';
import gilberta from './operators/gilberta';
import laevatain from './operators/laevatain';
import last_rite from './operators/last-rite';
import lifeng from './operators/lifeng';
import mifu from './operators/mifu';
import perlica from './operators/perlica';
import pogranichnik from './operators/pogranichnik';
import rossi from './operators/rossi';
import snowshine from './operators/snowshine';
import tangtang from './operators/tangtang';
import wulfgard from './operators/wulfgard';
import xaihi from './operators/xaihi';
import yvonne from './operators/yvonne';
import zhuang_fangyi from './operators/zhuang-fangyi';

// Weapon effect sheets (loaded via glob)
const weaponModules = import.meta.glob('./weapons/**/*.ts', {
  eager: true,
  import: 'default',
}) as Record<string, WeaponSheet>;

// Enemy sheets (loaded via glob)
const enemyModules = import.meta.glob('./enemies/*.ts', {
  eager: true,
  import: 'default',
}) as Record<string, EnemySheet>;

// Gear set effect sheets
import aburreys_legacy from './gearsets/aburreys-legacy';
import aethertech from './gearsets/aethertech';
import aic_heavy from './gearsets/aic-heavy';
import aic_light from './gearsets/aic-light';
import armored_msgr from './gearsets/armored-msgr';
import bonekrusha from './gearsets/bonekrusha';
import catastrophe from './gearsets/catastrophe';
import eternal_xiranite from './gearsets/eternal-xiranite';
import frontiers from './gearsets/frontiers';
import grizzled_edge from './gearsets/grizzled-edge';
import hot_work from './gearsets/hot-work';
import lynx from './gearsets/lynx';
import mi_security from './gearsets/mi-security';
import mordvolt_insulation from './gearsets/mordvolt-insulation';
import mordvolt_resistant from './gearsets/mordvolt-resistant';
import pulser_labs from './gearsets/pulser-labs';
import qingbo from './gearsets/qingbo';
import roving_msgr from './gearsets/roving-msgr';
import swordmancer from './gearsets/swordmancer';
import tide_surge from './gearsets/tide-surge';
import type_50_yinglung from './gearsets/type-50-yinglung';
import xiranflow from './gearsets/xiranflow';
import no_set_bonuses from './gearsets/no-set-bonuses';

const operatorSheets: Record<string, OperatorSheet> = {
  akekuri: akekuri,
  alesh: alesh,
  antal: antal,
  arclight: arclight,
  ardelia: ardelia,
  avywenna: avywenna,
  camille: camille,
  catcher: catcher,
  'chen-qianyu': chen_qianyu,
  'da-pan': da_pan,
  ember: ember,
  endministrator: endministrator,
  estella: estella,
  fluorite: fluorite,
  gilberta: gilberta,
  laevatain: laevatain,
  'last-rite': last_rite,
  lifeng: lifeng,
  mifu: mifu,
  perlica: perlica,
  pogranichnik: pogranichnik,
  rossi: rossi,
  snowshine: snowshine,
  tangtang: tangtang,
  wulfgard: wulfgard,
  xaihi: xaihi,
  yvonne: yvonne,
  'zhuang-fangyi': zhuang_fangyi,
};

function normalizeLookupKey(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

function getIconBasename(iconPath: string | null | undefined): string | null {
  if (!iconPath) return null;
  const last = String(iconPath).split('/').pop() || '';
  if (!last) return null;
  return last.replace(/\.[^.]+$/, '');
}

function expandLegacyWeaponAliases(value: string | null | undefined): string[] {
  if (!value) return [];
  const raw = String(value).trim();
  if (!raw) return [];

  const out = new Set([
    raw,
    raw.toLowerCase(),
    normalizeLookupKey(raw),
  ]);

  const replacements: Array<[string, string]> = [
    ['wpn_claym_', 'wpn_greatsword_'],
    ['wpn_lance_', 'wpn_polearm_'],
    ['wpn_pistol_', 'wpn_handcannon_'],
    ['wpn_funnel_', 'wpn_artsunit_'],
    ['/weapons/claym/', '/weapons/greatsword/'],
    ['/weapons/lance/', '/weapons/polearm/'],
    ['/weapons/pistol/', '/weapons/handcannon/'],
    ['/weapons/funnel/', '/weapons/arts-unit/'],
  ];

  for (const [from, to] of replacements) {
    if (raw.includes(from)) {
      const replaced = raw.replace(from, to);
      out.add(replaced);
      out.add(replaced.toLowerCase());
      out.add(normalizeLookupKey(replaced));
      const iconBasename = getIconBasename(replaced);
      if (iconBasename) {
        out.add(iconBasename);
        out.add(normalizeLookupKey(iconBasename));
      }
    }
  }

  const iconBasename = getIconBasename(raw);
  if (iconBasename) {
    out.add(iconBasename);
    out.add(normalizeLookupKey(iconBasename));
  }

  return [...out].filter(Boolean);
}

const operatorSlugAliases: Record<string, string> = Object.fromEntries(
  Object.entries(operatorSheets).flatMap(([slug, sheet]) => {
    const aliases = new Set(
      [slug, slug.toLowerCase(), normalizeLookupKey(slug), sheet.gameId, String(sheet.gameId || '').toLowerCase(), normalizeLookupKey(sheet.gameId)].filter(Boolean),
    );
    return [...aliases].map(alias => [alias, slug]);
  }),
);

const weaponSheets: Record<string, WeaponSheet> = Object.fromEntries(
  Object.entries(weaponModules).map(([path, sheet]) => {
    const slug = (path.split('/').pop() || '').replace(/\.ts$/, '');
    return [slug, sheet];
  }),
);

const weaponSlugAliases: Record<string, string> = Object.fromEntries(
  Object.entries(weaponSheets).flatMap(([slug, sheet]) => {
    const iconBasename = getIconBasename(sheet.icon);
    const aliases = new Set([slug, slug.toLowerCase(), normalizeLookupKey(slug), iconBasename, normalizeLookupKey(iconBasename)].filter(Boolean));
    return [...aliases].map(alias => [alias, slug]);
  }),
);

const enemySheets: Record<string, EnemySheet> = Object.fromEntries(
  Object.entries(enemyModules).map(([, sheet]) => [sheet.gameId, sheet]),
);

const gearSetSheets: Record<string, GearSetSheet> = {
  'aburreys-legacy': aburreys_legacy,
  aethertech: aethertech,
  'aic-heavy': aic_heavy,
  'aic-light': aic_light,
  'armored-msgr': armored_msgr,
  bonekrusha: bonekrusha,
  catastrophe: catastrophe,
  'eternal-xiranite': eternal_xiranite,
  frontiers: frontiers,
  'grizzled-edge': grizzled_edge,
  'hot-work': hot_work,
  lynx: lynx,
  'mi-security': mi_security,
  'mordvolt-insulation': mordvolt_insulation,
  'mordvolt-resistant': mordvolt_resistant,
  'pulser-labs': pulser_labs,
  qingbo: qingbo,
  'roving-msgr': roving_msgr,
  swordmancer: swordmancer,
  'tide-surge': tide_surge,
  'type-50-yinglung': type_50_yinglung,
  xiranflow: xiranflow,
  'no-set-bonuses': no_set_bonuses,
};

// ─── Unified Data Accessors ─────────────────────────────────────────────────
// These return the new unified sheet types that embed both identity data and
// effects. During transition, uses type assertions until sheets are regenerated.

export function getOperator(slug: string): OperatorSheet | undefined {
  const resolved = resolveOperatorSlug(slug);
  return resolved ? operatorSheets[resolved] : undefined;
}

export function resolveOperatorSlug(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return operatorSlugAliases[slug] || operatorSlugAliases[String(slug).toLowerCase()] || operatorSlugAliases[normalizeLookupKey(slug)] || null;
}

export function getOperatorList(): OperatorListEntry[] {
  return Object.entries(operatorSheets).map(([slug, sheet]) => {
    return { slug, rarity: sheet.rarity, class: sheet.class, new: sheet.new, beta: sheet.beta };
  });
}

export function getWeapon(slug: string): WeaponSheet | undefined {
  const resolved = resolveWeaponSlug(slug);
  return resolved ? weaponSheets[resolved] : undefined;
}

export function resolveWeaponSlug(slug: string | null | undefined): string | null {
  if (!slug) return null;
  for (const alias of expandLegacyWeaponAliases(slug)) {
    const resolved = weaponSlugAliases[alias];
    if (resolved) return resolved;
  }
  return null;
}

export function getWeaponList(type?: string): WeaponListEntry[] {
  const list = Object.entries(weaponSheets).map(([slug, sheet]) => {
    return { slug, rarity: sheet.rarity, type: sheet.type };
  });
  if (type) return list.filter(w => w.type === type);
  return list;
}

export function getEnemy(slug: string): EnemySheet | undefined {
  return enemySheets[slug];
}

export function getEnemyList(): {
  id: string;
  name: string;
  avatar: string;
  category: string;
  tier: string;
  maxStagger: number;
  staggerNodeCount: number;
  staggerNodeDuration: number;
  staggerBreakDuration: number;
  finisherRecovery: number;
}[] {
  return Object.entries(enemySheets).map(([slug, sheet]) => {
    return {
      id: slug,
      name: getEnemyGameName(slug),
      avatar: sheet.avatar,
      category: sheet.category,
      tier: sheet.tier,
      maxStagger: sheet.maxStagger,
      staggerNodeCount: sheet.staggerNodeCount,
      staggerNodeDuration: sheet.staggerNodeDuration,
      staggerBreakDuration: sheet.staggerBreakDuration,
      finisherRecovery: sheet.finisherRecovery,
    };
  });
}

export function getEnemyCategories(): string[] {
  return [...new Set(Object.values(enemySheets).map(e => e.category))].sort();
}

const gearPieceSheets: Record<string, GearPieceSheet> = Object.fromEntries(
  Object.entries(gearPieceModules).map(([path, sheet]) => {
    const slug = (path.split('/').pop() || '').replace(/\.ts$/, '');
    return [slug, sheet];
  }),
);

const gearPieceSlugAliases: Record<string, string> = Object.fromEntries(
  Object.entries(gearPieceSheets).flatMap(([slug, piece]) => {
    const iconBasename = getIconBasename(piece.icon);
    const aliases = new Set([slug, slug.toLowerCase(), normalizeLookupKey(slug), iconBasename, normalizeLookupKey(iconBasename)].filter(Boolean));
    return [...aliases].map(alias => [alias, slug]);
  }),
);

export function getGearPiece(slug: string): GearPieceSheet | undefined {
  const resolved = resolveGearPieceSlug(slug);
  return resolved ? gearPieceSheets[resolved] : undefined;
}

export function resolveGearPieceSlug(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return gearPieceSlugAliases[slug] || gearPieceSlugAliases[String(slug).toLowerCase()] || gearPieceSlugAliases[normalizeLookupKey(slug)] || null;
}

export function getGearPieceList(): GearPieceListEntry[] {
  return Object.entries(gearPieceSheets).map(([slug, piece]) => ({
    slug,
    slotType: piece.slotType,
    levelRequirement: piece.levelRequirement,
    setSlug: piece.setSlug,
  }));
}

export function getGearSet(slug: string): GearSetSheet | undefined {
  return gearSetSheets[slug];
}

export function getOperatorTalentGroups(slug: string): OperatorSheet['talents'] {
  const op = getOperator(slug);
  return op?.talents ?? [];
}

export function getQualityTier(levelRequirement: number): 'green' | 'blue' | 'purple' | 'gold' {
  if (levelRequirement >= 60) return 'gold';
  if (levelRequirement >= 40) return 'purple';
  if (levelRequirement >= 20) return 'blue';
  return 'green';
}
