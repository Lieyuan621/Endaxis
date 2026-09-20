/**
 * 新版战斗核心的回归基准入口。只在行为测试通过后用它比较性能，
 * 不得为了基准数字改变已确认的执行顺序或精度边界。
 */
import { bench, describe } from 'vitest';
import { ActionSequence } from '../core/combat/actions/actionSequence';
import { CombatStep, type CombatExecutionContext } from '../core/combat/actions/combatStep';
import { TimelineActionProcessor } from '../core/combat/timeline/timelineActionProcessor';
import { compileSkill } from '../core/compiler/compileSkill';
import type { SkillDefinition } from '../core/game-data/operatorDefinition';
import { perlica } from '../data/operators/perlica.generated';

class EmptyStep extends CombatStep {
  execute(): void {}
}

function findPerlicaSkill(key: string): SkillDefinition {
  for (const group of perlica.skillGroups) {
    const skills = Array.isArray(group.skills) ? group.skills : [group.skills];
    const skill = skills.find(candidate => candidate.key === key);
    if (skill !== undefined) return skill;
  }
  throw new Error(`missing Perlica skill '${key}'`);
}

const battleSkill = findPerlicaSkill('battleSkill');
const longTimeline = Array.from({ length: 1_800 }, (_, frame) => ({
  startFrame: frame,
  sequence: new ActionSequence([new EmptyStep()]),
}));
const context: CombatExecutionContext = {};
let benchmarkSink = 0;

describe('combat core', () => {
  bench('compile 1,000 resolved Perlica battle skills', () => {
    for (let index = 0; index < 1_000; index += 1) {
      const program = compileSkill({
        operatorId: perlica.slug,
        skillGroupKey: 'battleSkill',
        skillType: 'battleSkill',
        skillLevel: 12,
        skill: battleSkill,
      });
      benchmarkSink += program.timelineBlockFrames + program.timelineActions.length;
    }
  });

  bench('process a 60-second sparse timeline with 1,800 actions', () => {
    const processor = new TimelineActionProcessor(longTimeline);
    processor.reset(context);
    for (let frame = 0; frame < 1_800; frame += 1) {
      processor.tick(frame, 1 / 30, context);
    }
    benchmarkSink += processor.isComplete ? 1 : 0;
  });
});
