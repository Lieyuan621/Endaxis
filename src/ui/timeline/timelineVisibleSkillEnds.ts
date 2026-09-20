export interface VisibleSkillInterval {
  readonly id: string;
  readonly startFrame: number;
  readonly durationFrames: number;
}

/** 单轨块体排版；包含禁用块，但绝不改变执行区间、hit 或效果。相同起点保持输入顺序。 */
export function timelineVisibleSkillEnds(
  skills: readonly VisibleSkillInterval[],
): ReadonlyMap<string, number> {
  const sorted = skills
    .map((skill, index) => ({ ...skill, index }))
    .sort((a, b) => a.startFrame - b.startFrame || a.index - b.index);
  return new Map(
    sorted.map((skill, index) => [
      skill.id,
      Math.max(
        skill.startFrame,
        Math.min(
          skill.startFrame + Math.max(0, skill.durationFrames),
          sorted[index + 1]?.startFrame ?? Infinity,
        ),
      ),
    ]),
  );
}
