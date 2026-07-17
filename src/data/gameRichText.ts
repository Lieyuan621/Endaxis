import { i18n } from '@/i18n';
import battleTermsEn from '../i18n/game-locales/en/terms.json';
import battleTermsZh from '../i18n/game-locales/zh/terms.json';

type GameLocale = 'en' | 'zh';

type RichTextTermEntry = {
  name?: string;
  description?: string;
  styleId?: string;
  iconPath?: string;
};

export type GameRichTextNode =
  | { type: 'text'; text: string }
  | { type: 'image'; path: string }
  | { type: 'style'; id: string; children: GameRichTextNode[] }
  | { type: 'term'; id: string; children: GameRichTextNode[] };

export type ResolvedRichTextStyle = {
  color: string | null;
  icon: string | null;
};

export type ResolvedRichTextTerm = {
  id: string;
  name: string;
  description: string;
  styleId: string;
  icon: string | null;
};

const battleTermsTables: Record<string, Record<string, RichTextTermEntry>> = {
  en: battleTermsEn as Record<string, RichTextTermEntry>,
  zh: battleTermsZh as Record<string, RichTextTermEntry>,
};

const RICH_TEXT_STYLES: Record<string, ResolvedRichTextStyle> = {
  'ba.airborne': { color: '#e2c099', icon: '/icons/icon_term_ba_airborne.webp' },
  'ba.burning': { color: '#ff8e59', icon: '/icons/icon_term_ba_burning.webp' },
  'ba.conduct': { color: '#ffcc00', icon: '/icons/icon_term_ba_conduct.webp' },
  'ba.corrupt': { color: '#b4d945', icon: '/icons/icon_term_ba_corrupt.webp' },
  'ba.crush': { color: '#e2c099', icon: '/icons/icon_term_ba_crush.webp' },
  'ba.cryst': { color: '#2fc2cb', icon: null },
  'ba.crystbreak': { color: '#2fc2cb', icon: '/icons/icon_term_ba_crystbreak.webp' },
  'ba.crystinflict': { color: '#2fc2cb', icon: '/icons/icon_term_ba_crystinflict.webp' },
  'ba.ether': { color: '#9959FF', icon: null },
  'ba.fire': { color: '#ff8e59', icon: null },
  'ba.fireinflict': { color: '#ff8e59', icon: '/icons/icon_term_ba_fireinflict.webp' },
  'ba.fracture': { color: '#e2c099', icon: '/icons/icon_term_ba_fracture.webp' },
  'ba.frozen': { color: '#2fc2cb', icon: '/icons/icon_term_ba_frozen.webp' },
  'ba.heal': { color: '#b4d945', icon: null },
  'ba.info': { color: '#999999', icon: null },
  'ba.key': { color: '#33c2ff', icon: null },
  'ba.knockdown': { color: '#e2c099', icon: '/icons/icon_term_ba_knockdown.webp' },
  'ba.natur': { color: '#b4d945', icon: null },
  'ba.naturalinflict': { color: '#b4d945', icon: '/icons/icon_term_ba_naturalinflict.webp' },
  'ba.noguard': { color: '#e2c099', icon: '/icons/icon_term_ba_noguard.webp' },
  'ba.pd': { color: '#e2c099', icon: null },
  'ba.phy': { color: '#e2c099', icon: null },
  'ba.poise': { color: '#FFAE6B', icon: null },
  'ba.pulse': { color: '#ffcc00', icon: null },
  'ba.pulseinflict': { color: '#ffcc00', icon: '/icons/icon_term_ba_pulseinflict.webp' },
  'ba.vup': { color: '#9eb7ff', icon: null },
};

function resolveGameLocale(localeLike?: string | null): GameLocale {
  const locale = String(localeLike || i18n.global.locale.value || '').toLowerCase();
  return locale.startsWith('zh') ? 'zh' : 'en';
}

function getBattleTermsTable(locale?: string | null) {
  return battleTermsTables[resolveGameLocale(locale)];
}

export function resolveRichTextImage(path: string) {
  const normalized = String(path || '').replace(/\\/g, '/').trim();
  if (normalized.startsWith('/icons/')) return normalized;
  if (normalized.startsWith('icons/')) return `/${normalized}`;
  return null;
}

export function getRichTextStyle(id: string): ResolvedRichTextStyle {
  return RICH_TEXT_STYLES[id] ?? { color: null, icon: null };
}

export function getRichTextTerm(
  id: string,
  locale?: string | null,
): ResolvedRichTextTerm | null {
  const term = getBattleTermsTable(locale)?.[id];
  if (!term) return null;
  return {
    id,
    name: term.name || id,
    description: term.description || '',
    styleId: term.styleId || '',
    icon: term.iconPath ? resolveRichTextImage(term.iconPath) : null,
  };
}

export function parseGameRichText(text: string): GameRichTextNode[] {
  return parseNodes(String(text || ''), 0, String(text || '').length).nodes;
}

function parseNodes(
  text: string,
  start: number,
  end: number,
): { nodes: GameRichTextNode[]; index: number } {
  const nodes: GameRichTextNode[] = [];
  let index = start;
  let textBuffer = '';

  function pushText() {
    if (!textBuffer) return;
    nodes.push({ type: 'text', text: textBuffer });
    textBuffer = '';
  }

  while (index < end) {
    if (text.startsWith('</>', index)) break;

    if (text[index] !== '<') {
      textBuffer += text[index];
      index += 1;
      continue;
    }

    const imageMatch = text.slice(index).match(/^<image="([^"]+)">/);
    if (imageMatch) {
      pushText();
      nodes.push({
        type: 'image',
        path: imageMatch[1] ?? '',
      });
      index += imageMatch[0].length;
      continue;
    }

    const tagMatch = text.slice(index).match(/^<([@#])([^>]+)>/);
    if (!tagMatch) {
      textBuffer += text[index];
      index += 1;
      continue;
    }

    const tagStart = index;
    const tagLength = tagMatch[0].length;
    const closeIndex = findMatchingClose(text, index + tagLength, end);
    if (closeIndex < 0) {
      textBuffer += text[index];
      index += 1;
      continue;
    }

    pushText();
    nodes.push({
      type: tagMatch[1] === '@' ? 'style' : 'term',
      id: tagMatch[2] ?? '',
      children: parseNodes(text, index + tagLength, closeIndex).nodes,
    });
    index = closeIndex + 3;

    if (index <= tagStart) index = tagStart + 1;
  }

  pushText();
  return { nodes, index };
}

function findMatchingClose(text: string, start: number, end: number) {
  let depth = 1;
  let index = start;
  while (index < end) {
    if (text.startsWith('</>', index)) {
      depth -= 1;
      if (depth === 0) return index;
      index += 3;
      continue;
    }
    if (/^<[@#][^>]+>/.test(text.slice(index))) depth += 1;
    index += 1;
  }
  return -1;
}
