/** 标记副本按当前分支的时钟判断到期，不读取创建它的旧时钟对象。 */
import { expect, it } from 'vitest';
import { TimedMarkerContainer, sweepTimedMarkers } from './timedMarkers';
import { StateStepper } from '../runtime/stateStepper';

it('恢复相同标记，使用各分支自己的时钟推进', () => {
  const clock = { time: 1 };
  const markers = new TimedMarkerContainer('owner', clock);
  markers.add('marker', 2);
  const session = new StateStepper(markers.runtimeState, (step, time: number) => {
    const ended: string[] = [];
    sweepTimedMarkers(step.state, () => time, {
      finished: entry => ended.push(entry.sourceTargetId),
    });
    return ended;
  });
  const saved = session.save();
  clock.time = 100;
  expect(session.step(2)).toEqual([]);
  expect(session.step(4)).toEqual(['owner:timed-marker:1']);
  session.restore(saved);
  expect(session.step(3)).toEqual([]);
  expect(session.step(4)).toEqual(['owner:timed-marker:1']);
  expect(markers.runtimeState.entries).toHaveLength(1);
});
