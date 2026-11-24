import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { EnemyWeaknessBreakOption } from '../../../../../packages/game-data-contract/src/enemies.ts';
import { numericDeclaredBlackboard, parseDeclaredBlackboard } from '../../source/blackboard.ts';
import { requireRecord, type SourceRecord } from '../../source/primitives.ts';

type Blackboard = Readonly<Record<string, number | undefined>>;
type ReadBuff = (id: string) => SourceRecord;

function records(value: unknown): SourceRecord[] {
  return Array.isArray(value)
    ? value.map(item => requireRecord(item, 'enemy weakness action'))
    : [];
}

function readScalar(raw: unknown, board: Blackboard): number | undefined {
  const value = requireRecord(raw, 'enemy weakness value');
  const number = value.useBlackboardKey ? board[String(value.blackboardKey)] : value.value;
  return typeof number === 'number' && Number.isFinite(number) ? number : undefined;
}

function getActionType(action: SourceRecord): string {
  return String(action.$type).split('+')[0]!.replace('Beyond.Gameplay.Core.', '');
}

function childBlackboard(buff: SourceRecord, spec: SourceRecord, parent: Blackboard): Blackboard {
  const values: Record<string, number | undefined> = {
    ...numericDeclaredBlackboard(parseDeclaredBlackboard(buff, String(buff.id))),
  };
  if (spec.assignBlackboard) {
    for (const item of records(spec.assignItems)) {
      const value = item.useDirectValue
        ? item.directValueType === 'Numeric' && item.numericValue
        : parent[String(item.inputValueKey)];
      values[String(item.targetKey)] = typeof value === 'number' ? value : undefined;
    }
  }
  return values;
}

// null 表示这条路径尚未遇到任何失衡结算，空数组表示无法确定该路径的数值。
type Amounts = readonly (number | null)[];

function addAmounts(left: Amounts, right: Amounts): Amounts {
  return [...new Set(left.flatMap(a => right.map(b => (a === null ? b : b === null ? a : a + b))))];
}

function readGroup(
  group: SourceRecord,
  board: Blackboard,
  readBuff: ReadBuff,
  inBuff = false,
): Amounts {
  let amounts: Amounts = [null];
  if (group.onlyExecuteWhenSourceIsMainChar || group.onlyExecuteWhenSourceIsGuard) return [];
  for (const action of records(group.actionData)) {
    if (action.isEnable === false) continue;
    const type = getActionType(action);
    if (type === 'DamageAction') {
      const target = requireRecord(action.targetSettings, type).targetSource;
      if (target !== 'Owner' && !(inBuff && target === 'Target')) continue;
      for (const unit of records(action.damageUnits)) {
        if (unit.damageAttributeType !== 'Poise') continue;
        const calc = requireRecord(unit.poiseCalculation, 'poiseCalculation');
        if (
          calc.$type !== 'Beyond.Gameplay.Core.DefiniteValueCalculation, Gameplay.Beyond' ||
          unit.onlyEnableForMainChar
        )
          return [];
        const base = readScalar(calc.value, board);
        const scale = calc.applyScale ? readScalar(calc.valueScale, board) : 1;
        if (base === undefined || scale === undefined) return [];
        amounts = addAmounts(amounts, [base * scale]);
      }
    } else if (type === 'IfElseAction') {
      const branches = [action.succeedActions, action.failActions].flatMap(branch =>
        branch ? readGroup(requireRecord(branch, type), board, readBuff, inBuff) : [null],
      );
      amounts = addAmounts(amounts, branches);
    } else if (type === 'CreateBuffAction') {
      const target = requireRecord(action.targetSettings, type).targetSource;
      if (target !== 'Owner' && target !== 'Source') continue;
      // 只跟随窗口对自身施加的 Buff，读取它实际在 OnBuffStart 执行的伤害动作。
      if (inBuff || readScalar(action.count, board) !== 1) return [];
      for (const spec of records(action.buffs)) {
        if (spec.readIdFromBlackboard || typeof spec.buffId !== 'string') return [];
        const buff = readBuff(spec.buffId);
        const values = childBlackboard(buff, spec, board);
        for (const event of records(buff.buffEventAction)) {
          if (event.buffEvent !== 'OnBuffStart') continue;
          for (const start of records(event.actions)) {
            amounts = addAmounts(amounts, readGroup(start, values, readBuff, true));
          }
        }
      }
    }
  }
  return amounts;
}

const WINDOW_ACTION = /Set(?:WeaknessAction|MultiTimesWeakness)\+Data/;
const BUFF_REFERENCE = /"buffId"\s*:\s*"([^"]+)"/g;

/** 建窗 Buff 也可能经另一个 Buff 的触发事件施加。文本索引仅筛选需要解析的文件。 */
function findWindowBuffs(directory: string): Set<string> {
  const parents = new Map<string, Set<string>>();
  const windows = new Set<string>();
  for (const file of readdirSync(directory)) {
    if (!file.endsWith('.json')) continue;
    const text = readFileSync(join(directory, file), 'utf8');
    const id = file.slice(0, -5);
    if (WINDOW_ACTION.test(text)) windows.add(id);
    for (const match of text.matchAll(BUFF_REFERENCE)) {
      const child = match[1]!;
      const references = parents.get(child) ?? new Set<string>();
      references.add(id);
      parents.set(child, references);
    }
  }
  for (const id of windows) {
    for (const parent of parents.get(id) ?? []) windows.add(parent);
  }
  return windows;
}

function* windowActions(value: unknown): Generator<SourceRecord> {
  if (!value || typeof value !== 'object') return;
  const node = value as SourceRecord;
  if (
    node.isEnable === false ||
    node.onlyExecuteWhenSourceIsMainChar ||
    node.onlyExecuteWhenSourceIsGuard
  )
    return;
  if (
    node.$type &&
    ['SetWeaknessAction', 'SetMultiTimesWeakness', 'CreateBuffAction'].includes(getActionType(node))
  ) {
    yield node;
  } else {
    for (const child of Object.values(node)) yield* windowActions(child);
  }
}

/** 只发布红圈回调中能沿数据追到敌人自身失衡结算的值。不同窗口和互斥分支分别保留。 */
export function readSkillWeaknessBreakAmounts(
  skill: SourceRecord,
  readBuff: ReadBuff,
  windowBuffs: ReadonlySet<string>,
): number[] {
  const board = numericDeclaredBlackboard(parseDeclaredBlackboard(skill, String(skill.skillId)));
  const amounts = new Set<number>();
  function collect(group: unknown, current: Blackboard, ancestors: ReadonlySet<string>) {
    for (const window of windowActions(group)) {
      if (getActionType(window) === 'CreateBuffAction') {
        const target = requireRecord(window.targetSettings, 'window Buff target').targetSource;
        if (target !== 'Owner' && !(ancestors.size === 0 && target === 'Source')) continue;
        const count = readScalar(window.count, current);
        if (count === undefined || count <= 0) continue;
        for (const spec of records(window.buffs)) {
          if (
            spec.readIdFromBlackboard ||
            typeof spec.buffId !== 'string' ||
            !windowBuffs.has(spec.buffId) ||
            ancestors.has(spec.buffId)
          )
            continue;
          const buff = readBuff(spec.buffId);
          const values = childBlackboard(buff, spec, current);
          for (const event of records(buff.buffEventAction)) {
            if (
              ['DuringBuffEnable', 'OnBuffStart', 'OnBuffTrigger'].includes(String(event.buffEvent))
            ) {
              collect(event.actions, values, new Set([...ancestors, spec.buffId]));
            }
          }
        }
        continue;
      }
      const duration = readScalar(
        window.alertEffectDurationBB ?? window.alertEffectDuration,
        current,
      );
      if (duration === undefined || duration <= 0) continue;
      for (const amount of readGroup(
        requireRecord(window.triggerActions, 'triggerActions'),
        current,
        readBuff,
      )) {
        if (amount !== null && Number.isFinite(amount) && amount >= 0) amounts.add(amount);
      }
    }
  }
  collect(skill.actionGroupData, board, new Set());
  return [...amounts].sort((a, b) => a - b);
}

export function compileEnemyWeaknessBreakOptions(
  templates: readonly string[],
  skillDirectory: string,
  buffDirectory: string,
): Map<string, EnemyWeaknessBreakOption[]> {
  const options = new Map<string, EnemyWeaknessBreakOption[]>();
  const windowBuffs = findWindowBuffs(buffDirectory);
  const buffs = new Map<string, SourceRecord>();
  const readBuff = (id: string) => {
    let buff = buffs.get(id);
    if (!buff) {
      buff = requireRecord(JSON.parse(readFileSync(join(buffDirectory, id + '.json'), 'utf8')), id);
      buffs.set(id, buff);
    }
    return buff;
  };
  for (const file of readdirSync(skillDirectory).sort()) {
    if (!file.startsWith('eny_') || !file.endsWith('.json')) continue;
    const template = templates.find(id => file.startsWith(id + '_'));
    if (!template) continue;
    const text = readFileSync(join(skillDirectory, file), 'utf8');
    if (
      !WINDOW_ACTION.test(text) &&
      !Array.from(text.matchAll(BUFF_REFERENCE)).some(match => windowBuffs.has(match[1]!))
    )
      continue;
    const skill = requireRecord(JSON.parse(text), file);
    if (skill.skillId + '.json' !== file) throw new Error(file + ': skill identity mismatch');
    const amounts = readSkillWeaknessBreakAmounts(skill, readBuff, windowBuffs);
    if (!amounts.length) continue;
    const list = options.get(template) ?? [];
    list.push(...amounts.map(stagger => ({ skillId: String(skill.skillId), stagger })));
    options.set(template, list);
  }
  return options;
}
