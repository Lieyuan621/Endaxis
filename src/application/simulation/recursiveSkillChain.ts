import type { ScenarioDocument, SkillCastDocument } from '../../core/project/schema';
import type { CombatReceiptEntry } from '../../core/combat/receipt/combatReceipt';

/** 编辑建议使用预留的文档身份；不进入存档，不改技能定义。 */
export interface RecursiveSkillChain {
  readonly allowedSkillKeys: readonly string[];
  readonly terminalSkillKey: string;
  /** 由技能组 maxSegments 预留的追加身份；耗尽即停止，不另设私有段数上限。 */
  readonly reservedCastIds: readonly string[];
}

export function planRecursiveSkillChain(input: {
  readonly scenario: ScenarioDocument;
  readonly seedCastId: string;
  readonly extension: RecursiveSkillChain;
  readonly endFrame: number;
  readonly run: (
    scenario: ScenarioDocument,
    endFrame: number,
  ) => {
    readonly receiptEntries: readonly CombatReceiptEntry[];
  };
  readonly checkCancelled: () => void;
}) {
  const scenario = structuredClone(input.scenario);
  const track = scenario.tracks.find(track =>
    track?.skillCasts.some(cast => cast.id === input.seedCastId),
  );
  const seed = track?.skillCasts.find(cast => cast.id === input.seedCastId);
  if (!track || !seed || seed.source.kind !== 'operatorSkill')
    throw new Error('missing recursive chain seed');
  const seedFrame = seed.placement.startFrame;
  if (seedFrame === undefined) throw new Error('recursive placement requires an absolute seed');
  const castIds = [seed.id];
  const occupiedIds = new Set(
    scenario.tracks.flatMap(track => track?.skillCasts.map(cast => cast.id) ?? []),
  );
  const reserved = input.extension.reservedCastIds;
  if (new Set(reserved).size !== reserved.length || reserved.some(id => occupiedIds.has(id))) {
    throw new Error('recursive chain requires unique reserved cast IDs');
  }
  const stopFrame = Math.min(
    input.endFrame,
    ...track.skillCasts.flatMap(cast =>
      cast.id !== seed.id &&
      cast.placement.startFrame !== undefined &&
      cast.placement.startFrame >= seedFrame
        ? [cast.placement.startFrame - 1]
        : [],
    ),
  );
  const finish = (complete: boolean) => ({ scenario, skillCastIds: castIds, complete });
  const diagnostics = (entries: readonly CombatReceiptEntry[], id: string) =>
    entries.filter(
      entry =>
        entry.data?.castId === id &&
        entry.event.startsWith('SkillInput') &&
        entry.event !== 'SkillInputProcessed',
    );
  let last: SkillCastDocument = seed;
  for (let index = 0; ; index++) {
    input.checkCancelled();
    const lastFrame = last.placement.startFrame;
    if (lastFrame === undefined || lastFrame > stopFrame) return finish(false);
    const run = input.run(scenario, Math.max(0, stopFrame));
    if (
      diagnostics(run.receiptEntries, last.id).length > 0 ||
      !run.receiptEntries.some(
        entry =>
          entry.event === 'SkillInputProcessed' &&
          entry.data?.castId === last.id &&
          entry.data.accepted === true,
      )
    ) {
      if (last.id !== seed.id) {
        track.skillCasts.pop();
        castIds.pop();
      }
      return finish(false);
    }
    if (last.source.kind !== 'operatorSkill') return finish(false);
    if (last.source.skillKey === input.extension.terminalSkillKey) return finish(true);
    const id = reserved[index];
    if (id === undefined) return finish(false);
    const boundary = run.receiptEntries.find(
      entry => entry.event === 'SkillOperableBoundaryReached' && entry.data?.castId === last.id,
    );
    if (!boundary) return finish(false);
    const frame = boundary.frame + 1;
    if (frame <= lastFrame || frame > stopFrame) return finish(false);
    // 临时输入只用于读取正式路由诊断；其执行结果和回执不会发布或缓存。
    const probe: SkillCastDocument = {
      id,
      source: { ...last.source },
      placement: { startFrame: frame },
    };
    track.skillCasts.push(probe);
    let entries: readonly CombatReceiptEntry[];
    try {
      entries = input.run(scenario, Math.max(0, frame)).receiptEntries;
    } finally {
      track.skillCasts.pop();
    }
    const warnings = diagnostics(entries, id);
    if (warnings.some(entry => entry.event !== 'SkillInputResolvedToDifferentSkill'))
      return finish(false);
    const mismatch = warnings.find(entry => entry.event === 'SkillInputResolvedToDifferentSkill');
    const key = mismatch?.data?.actualSkillId ?? last.source.skillKey;
    if (typeof key !== 'string' || !input.extension.allowedSkillKeys.includes(key))
      return finish(false);
    last = { ...probe, source: { ...last.source, skillKey: key } };
    track.skillCasts.push(last);
    castIds.push(id);
  }
}
