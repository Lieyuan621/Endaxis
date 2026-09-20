import type { ScenarioDocument } from '../../../core/project/schema';
import type { PublishedOperatorMetadata } from './publishedOperatorMetadata';

export interface PublishedEquipmentIdentity {
  readonly slug: string;
  readonly assetSlug?: string;
  readonly displayName?: string;
  readonly iconPath?: string;
  readonly traits?: readonly {
    readonly key: string;
    readonly eventHandlers?: readonly { readonly key: string }[];
  }[];
}

/** 冻结本次发布的武器或装备显示身份与词条对应关系；后续模板编辑不能改变旧结果的来源。 */
export function capturePublishedEquipmentSources(
  weapons: readonly PublishedEquipmentIdentity[],
  kind: 'weapon' | 'gear' = 'weapon',
): ReadonlyMap<string, PublishedBuffSource> {
  return new Map(
    weapons.map(weapon => [
      weapon.slug,
      {
        kind,
        slug: weapon.assetSlug ?? weapon.slug,
        ...(weapon.displayName === undefined ? {} : { name: weapon.displayName }),
        ...(weapon.iconPath === undefined ? {} : { iconPath: weapon.iconPath }),
        ...(weapon.traits === undefined
          ? {}
          : {
              traits: weapon.traits.map(trait => ({
                key: trait.key,
                handlerKeys: (trait.eventHandlers ?? []).map(handler => handler.key),
              })),
            }),
      },
    ]),
  );
}

export type PublishedBuffSource =
  | { kind: 'custom'; name: string }
  | { kind: 'skill'; slug: string | null; key: string; fallbackKey?: string }
  | {
      kind: 'weapon';
      slug: string;
      name?: string;
      iconPath?: string;
      traits?: readonly { readonly key: string; readonly handlerKeys: readonly string[] }[];
    }
  | {
      kind: 'gear';
      slug: string;
      name?: string;
      traits?: readonly { readonly key: string; readonly handlerKeys: readonly string[] }[];
    }
  | { kind: 'gearSet'; slug: string }
  | { kind: 'talent' | 'potential'; slug: string; index: number };

/** 仅解释已发布身份，返回可本地化的描述，不读取当前模板。合约另用发布的 selections。 */
export function resolvePublishedBuffSource(
  source: { sourceActionId?: string; sourceId?: string },
  scenario: ScenarioDocument | undefined,
  operators: ReadonlyMap<string, PublishedOperatorMetadata>,
  weapons: ReadonlyMap<string, PublishedBuffSource> = new Map(),
  gears: ReadonlyMap<string, PublishedBuffSource> = new Map(),
): PublishedBuffSource | undefined {
  const id = source.sourceActionId;
  if (id === undefined || scenario === undefined) return undefined;
  // 技能块 ID 在方案内全局唯一；Buff 的 sourceId 可能是接收者，不能拿它限制施法轨道。
  for (const track of scenario.tracks) {
    const cast = track?.skillCasts.find(cast => cast.id === id);
    if (cast === undefined) continue;
    if (cast.source.kind === 'custom') return { kind: 'custom', name: cast.source.name };
    const slug = track?.operator?.operatorSlug;
    return {
      kind: 'skill',
      slug: slug === undefined ? null : (operators.get(slug)?.assetSlug ?? slug),
      key: cast.source.skillKey,
      ...(slug !== undefined &&
      operators.get(slug)?.skillLevelSources?.[cast.source.skillKey] !== undefined
        ? { fallbackKey: operators.get(slug)!.skillLevelSources![cast.source.skillKey]! }
        : {}),
    };
  }
  const equipment =
    /^(?:equipment:|upgrade-initialization:)(weaponTrait|gearTrait|gearSet|weapon-trait|gear-trait|gear-set):([^:]+)/.exec(
      id,
    );
  if (equipment?.[1]?.startsWith('weapon') && weapons.has(equipment[2]!))
    return weapons.get(equipment[2]!);
  if (
    (equipment?.[1] === 'gearTrait' || equipment?.[1] === 'gear-trait') &&
    gears.has(equipment[2]!)
  )
    return gears.get(equipment[2]!);
  if (equipment)
    return {
      kind: equipment[1]!.startsWith('weapon')
        ? 'weapon'
        : equipment[1]!.startsWith('gearT') || equipment[1]!.startsWith('gear-t')
          ? 'gear'
          : 'gearSet',
      slug: equipment[2]!,
    };
  const slug = scenario.tracks.find(track => track?.id === source.sourceId)?.operator?.operatorSlug;
  const metadata = slug === undefined ? undefined : operators.get(slug);
  if (!metadata) return undefined;
  const initialization = /^upgrade-initialization:(talent|potential):(\d+)$/.exec(id);
  const passive = id.startsWith('passive:') ? id.slice('passive:'.length) : undefined;
  for (const kind of ['talent', 'potential'] as const) {
    const values = kind === 'talent' ? metadata.talents : metadata.potentials;
    const index = values.findIndex(
      (value, slot) =>
        (initialization?.[1] === kind && slot === Number(initialization[2])) ||
        (passive !== undefined && value.passiveKeys.includes(passive)),
    );
    if (index >= 0)
      return {
        kind,
        slug: metadata.assetSlug,
        index:
          kind === 'talent'
            ? values.slice(0, index).reduce((sum, value) => sum + value.levels, 0)
            : index,
      };
  }
  return metadata.skillKeys.includes(id)
    ? {
        kind: 'skill',
        slug: metadata.assetSlug,
        key: id,
        ...(metadata.skillLevelSources?.[id] === undefined
          ? {}
          : { fallbackKey: metadata.skillLevelSources[id] }),
      }
    : undefined;
}

/** 程序身份中的尾段在初始化时是词条键，在事件响应时是处理器键，不能混为一谈。 */
export function resolvePublishedEquipmentTrait(
  source: PublishedBuffSource,
  actionId: string,
): string | undefined {
  if (source.kind !== 'weapon' && source.kind !== 'gear') return undefined;
  const initialization = /^upgrade-initialization:(?:weapon|gear)-trait:[^:]+:(.+)$/.exec(actionId);
  const handler = /^equipment:(?:weapon|gear)Trait:[^:]+:(.+)$/.exec(actionId);
  const candidates = source.traits?.filter(trait =>
    initialization
      ? trait.key === initialization[1]
      : handler !== null && trait.handlerKeys.includes(handler[1]!),
  );
  return candidates?.length === 1 ? candidates[0]!.key : undefined;
}
