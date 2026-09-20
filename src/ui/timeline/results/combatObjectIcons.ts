import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import type { CombatObjectNode } from '../../../core/projection/combatObjectOrigins';
import { eventBuff } from '../../../core/projection/combatObjectOrigins';
import type { ScenarioDocument } from '../../../core/project/schema';
import { combatObjectKey } from '../../../core/combat/receipt/combatObjectIdentity';
import {
  getIconAssetPath,
  getOperatorAvatarPath,
  getOperatorTalentIconPath,
  getSpellBurstIconPath,
  getElementIconPath,
} from '../../gameAssetPaths';
import type { PublishedOperatorMetadata } from './publishedOperatorMetadata';
import { resolvePublishedBuffSource, type PublishedBuffSource } from './publishedBuffSource';
import { physicalStatusIconPath } from './physicalStatusDisplay';

export type CombatObjectIconResolver = (
  node: CombatObjectNode,
  throughSequence: number,
) => string | undefined;

/** 与发布结果绑定的展示索引；按实例找 Buff 图标，不按定义 ID 猜实例或读取新草稿。 */
export function createCombatObjectIconResolver(
  entries: readonly CombatReceiptEntry[],
  scenario: ScenarioDocument | undefined,
  operators: ReadonlyMap<string, PublishedOperatorMetadata>,
  weapons: ReadonlyMap<string, PublishedBuffSource>,
  gearIcons: ReadonlyMap<string, string> = new Map(),
  gearSetIcons: ReadonlyMap<string, string> = new Map(),
): CombatObjectIconResolver {
  const presentations = new Map<string, CombatReceiptEntry[]>();
  const owners = new Map(
    scenario?.tracks.flatMap(track =>
      track?.operator ? [[track.id, operators.get(track.operator.operatorSlug)] as const] : [],
    ) ?? [],
  );
  const byAsset = new Map([...operators.values()].map(operator => [operator.assetSlug, operator]));
  for (const entry of entries) {
    if (
      entry.event !== 'BuffApplied' ||
      entry.targetId === undefined ||
      typeof entry.data?.instanceId !== 'number'
    )
      continue;
    const key = combatObjectKey({
      kind: 'buff',
      ownerId: entry.targetId,
      instanceId: entry.data.instanceId,
    });
    const values = presentations.get(key) ?? [];
    values.push(entry);
    presentations.set(key, values);
  }
  const sourceIcon = (sourceId?: string, sourceActionId?: string) => {
    const source = resolvePublishedBuffSource(
      { sourceId, sourceActionId },
      scenario,
      operators,
      weapons,
    );
    if (source?.kind === 'weapon') return source.iconPath;
    if (source?.kind === 'gear') return gearIcons.get(source.slug);
    if (source?.kind === 'gearSet') return gearSetIcons.get(source.slug);
    if (source?.kind === 'talent') {
      // 来源名称使用展开等级后的索引，图标按天赋槽位编号。
      const talents = byAsset.get(source.slug)?.talents ?? [];
      let levelOffset = 0;
      for (let slot = 0; slot < talents.length; slot++) {
        if (levelOffset === source.index) return getOperatorTalentIconPath(source.slug, slot + 1);
        levelOffset += talents[slot]!.levels;
      }
    }
    if (source?.kind === 'skill' && source.slug !== null)
      return byAsset.get(source.slug)?.skillIcons?.[source.key];
    return undefined;
  };
  const presentationIcon = (entry: CombatReceiptEntry): string | undefined => {
    const data = entry.data;
    const physicalIcon =
      typeof data?.buffId === 'string' ? physicalStatusIconPath(data.buffId) : undefined;
    if (physicalIcon) return physicalIcon;
    const source = resolvePublishedBuffSource(
      {
        sourceId: entry.sourceId,
        sourceActionId: typeof data?.sourceActionId === 'string' ? data.sourceActionId : undefined,
      },
      scenario,
      operators,
      weapons,
    );
    return (
      (source?.kind === 'weapon' ? source.iconPath : undefined) ??
      (source?.kind === 'gearSet' ? gearSetIcons.get(source.slug) : undefined) ??
      (typeof data?.iconPath === 'string' ? data.iconPath : undefined) ??
      (typeof data?.iconId === 'string' ? (getIconAssetPath(data.iconId) ?? undefined) : undefined)
    );
  };
  const buffIcon = (key: string, cutoff: number) => {
    const records = presentations.get(key) ?? [];
    for (let i = records.length - 1; i >= 0; i--) {
      const entry = records[i]!;
      if (entry.sequence <= cutoff) {
        const icon = presentationIcon(entry);
        if (icon) return icon;
      }
    }
    return undefined;
  };
  return (node, cutoff) => {
    const ref = node.ref;
    if (ref.kind === 'operator') {
      const owner = owners.get(ref.operatorId);
      return owner ? getOperatorAvatarPath(owner.assetSlug) : undefined;
    }
    if (ref.kind === 'action') return sourceIcon(ref.ownerId, ref.actionId);
    if (ref.kind === 'buff') return buffIcon(combatObjectKey(ref), cutoff);
    const fact = node.fact;
    if (!fact || fact.sequence > cutoff) return undefined;
    if (ref.kind === 'modifier') {
      const item = fact.appliedDamageModifiers?.[ref.index];
      return item ? sourceIcon(item.sourceId, item.sourceActionId) : undefined;
    }
    const data = fact.data;
    if (ref.kind === 'receipt') {
      const buff = fact.subject?.kind === 'buff' ? fact.subject : eventBuff(fact);
      if (buff !== undefined) {
        const icon = buffIcon(combatObjectKey(buff), cutoff);
        if (icon) return icon;
      }
      const burst =
        typeof data?.spellBurstType === 'string'
          ? getSpellBurstIconPath(data.spellBurstType)
          : null;
      if (burst) return burst;
      const element = data?.damageType;
      if (
        element === 'physical' ||
        element === 'heat' ||
        element === 'cryo' ||
        element === 'electric' ||
        element === 'nature'
      )
        return getElementIconPath(element);
    }
    return presentationIcon(fact);
  };
}
