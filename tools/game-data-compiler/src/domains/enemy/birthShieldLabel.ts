import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireRecord } from '../../source/primitives.ts';

/** 收集出生时可能创建的护盾；这里读取选项说明，不判断当前战斗是否满足分支条件。 */
function* birthActions(group: Record<string, unknown>): Generator<Record<string, unknown>> {
  for (const raw of Array.isArray(group.actionData) ? group.actionData : []) {
    const action = requireRecord(raw, 'actionData');
    if (action.isEnable === false) continue;
    yield action;
    if (action.$type === 'Beyond.Gameplay.Core.IfElseAction+IfElseActionData, Gameplay.Beyond') {
      for (const key of ['succeedActions', 'failActions']) {
        if (action[key]) yield* birthActions(requireRecord(action[key], key));
      }
    }
  }
}

/** 读取已支持护盾的出生链；不把入口 Buff 的同名黑板误当作子 Buff 参数。 */
export function readBirthShieldCount(
  source: Record<string, unknown>,
  overrides: Readonly<Record<string, number>>,
  directory: string,
  visited = new Set<string>(),
): number | undefined {
  const values: Record<string, number> = {};
  for (const raw of Array.isArray(source.blackboard) ? source.blackboard : []) {
    const entry = requireRecord(raw, 'blackboard');
    if (typeof entry.key === 'string' && typeof entry.valueDouble === 'number')
      values[entry.key] = entry.valueDouble;
  }
  Object.assign(values, overrides);
  for (const rawEvent of Array.isArray(source.buffEventAction) ? source.buffEventAction : []) {
    const event = requireRecord(rawEvent, 'buffEventAction');
    if (event.buffEvent !== 'OnBuffStart') continue;
    for (const rawGroup of Array.isArray(event.actions) ? event.actions : []) {
      const group = requireRecord(rawGroup, 'actions');
      for (const action of birthActions(group)) {
        if (
          action.$type === 'Beyond.Gameplay.Core.CountShieldUIAction+Data, Gameplay.Beyond' &&
          !action.removeCountShieldUI
        ) {
          const current = requireRecord(action.curCountShield, 'curCountShield');
          const count = current.useBlackboardKey
            ? values[String(current.blackboardKey)]
            : current.value;
          if (typeof count !== 'number' || !Number.isFinite(count))
            throw new Error('Unresolved initial layered shield count');
          return count;
        }
        if (action.$type !== 'Beyond.Gameplay.Core.CreateBuffAction+Data, Gameplay.Beyond')
          continue;
        for (const rawBuff of Array.isArray(action.buffs) ? action.buffs : []) {
          const buff = requireRecord(rawBuff, 'buffs');
          if (
            typeof buff.buffId !== 'string' ||
            buff.readIdFromBlackboard ||
            visited.has(buff.buffId)
          )
            continue;
          visited.add(buff.buffId);
          const assignments: Record<string, number> = {};
          for (const raw of buff.assignBlackboard && Array.isArray(buff.assignItems)
            ? buff.assignItems
            : []) {
            const item = requireRecord(raw, 'assignItems');
            const value = item.useDirectValue
              ? item.numericValue
              : values[String(item.inputValueKey)];
            if (typeof item.targetKey === 'string' && typeof value === 'number')
              assignments[item.targetKey] = value;
          }
          const child = requireRecord(
            JSON.parse(readFileSync(join(directory, `${buff.buffId}.json`), 'utf8')),
            buff.buffId,
          );
          const count = readBirthShieldCount(child, assignments, directory, visited);
          if (count !== undefined) return count;
        }
      }
    }
  }
  return undefined;
}
