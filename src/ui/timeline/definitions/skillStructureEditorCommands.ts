import type {
  ActionSequenceDefinition,
  CombatStepDefinition,
  SkillDefinition,
} from '../../../core/game-data/operatorDefinition';

type PathToken = string | number;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function cloneStructureValue<T>(value: T): T {
  return clone(value);
}

export function structurePathSegments(path: string): readonly PathToken[] {
  const result: PathToken[] = [];
  let offset = 0;
  while (offset < path.length) {
    if (path[offset] === '.') {
      offset += 1;
      continue;
    }
    const tail = path.slice(offset);
    const property = /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(tail);
    if (property !== null) {
      result.push(property[0]);
      offset += property[0].length;
      continue;
    }
    const bracket = /^\[(\d+|"(?:\\.|[^"\\])*")\]/.exec(tail);
    if (bracket !== null) {
      result.push(
        bracket[1]!.startsWith('"') ? (JSON.parse(bracket[1]!) as string) : Number(bracket[1]),
      );
      offset += bracket[0].length;
      continue;
    }
    throw new TypeError(`invalid structure path at '${path.slice(offset)}' in '${path}'`);
  }
  return result;
}

/** 为原生 ID 等任意字符串键生成不会与结构字段混淆的稳定路径。 */
export function structureRecordEntryPath(recordPath: string, key: string): string {
  return `${recordPath}[${JSON.stringify(key)}]`;
}

function valueAtPath(root: unknown, path: string): unknown {
  let value = root;
  for (const token of structurePathSegments(path)) {
    if (value === undefined || value === null) return undefined;
    value = (value as Record<PathToken, unknown>)[token];
  }
  return value;
}

function setAtPath(root: unknown, path: string, value: unknown): void {
  const parts = structurePathSegments(path);
  if (parts.length === 0) throw new TypeError('cannot replace the skill root through a child path');
  let parent = root as Record<PathToken, unknown>;
  for (const token of parts.slice(0, -1)) {
    if (parent[token] === undefined || parent[token] === null) parent[token] = {};
    parent = parent[token] as Record<PathToken, unknown>;
  }
  parent[parts.at(-1)!] = value;
}

function deleteAtPath(root: unknown, path: string): void {
  const parts = structurePathSegments(path);
  if (parts.length === 0) throw new TypeError('cannot delete the structure root');
  let parent = root as Record<PathToken, unknown>;
  for (const token of parts.slice(0, -1)) {
    if (parent[token] === undefined || parent[token] === null) return;
    parent = parent[token] as Record<PathToken, unknown>;
  }
  delete parent[parts.at(-1)!];
}

function arrayItem(path: string): { readonly arrayPath: string; readonly index: number } {
  const match = /^(.*)\[(\d+)\]$/.exec(path);
  if (match === null) throw new TypeError(`not an array-item path: '${path}'`);
  return { arrayPath: match[1]!, index: Number(match[2]) };
}

export function removeStructureArrayItem<T>(root: T, itemPath: string): T {
  const item = arrayItem(itemPath);
  const next = clone(root);
  const values = [...(valueAtPath(next, item.arrayPath) as readonly unknown[])];
  values.splice(item.index, 1);
  setAtPath(next, item.arrayPath, values);
  return next;
}

export function insertStructureArrayItem<T>(
  root: T,
  arrayPath: string,
  value: unknown,
  index?: number,
): { readonly root: T; readonly itemPath: string } {
  const next = clone(root);
  const values = [...((valueAtPath(next, arrayPath) as readonly unknown[] | undefined) ?? [])];
  const target = Math.max(0, Math.min(index ?? values.length, values.length));
  values.splice(target, 0, value);
  setAtPath(next, arrayPath, values);
  return { root: next, itemPath: `${arrayPath}[${target}]` };
}

export function moveStructureArrayItem<T>(
  root: T,
  sourceItemPath: string,
  targetArrayPath: string,
  targetIndex?: number,
): { readonly root: T; readonly itemPath: string } {
  const source = arrayItem(sourceItemPath);
  if (
    targetArrayPath.startsWith(`${sourceItemPath}.`) ||
    targetArrayPath.startsWith(`${sourceItemPath}[`)
  )
    throw new TypeError('cannot move an item into its own subtree');
  // Removing a preceding sibling shifts the destination's ancestor index too.
  const siblingPrefix = `${source.arrayPath}[`;
  if (targetArrayPath.startsWith(siblingPrefix)) {
    const suffix = targetArrayPath.slice(siblingPrefix.length);
    const match = /^(\d+)\]/.exec(suffix);
    if (match && Number(match[1]) > source.index)
      targetArrayPath = `${siblingPrefix}${Number(match[1]) - 1}]${suffix.slice(match[0].length)}`;
  }
  const next = clone(root);
  const sourceValues = [...(valueAtPath(next, source.arrayPath) as readonly unknown[])];
  const [value] = sourceValues.splice(source.index, 1);
  setAtPath(next, source.arrayPath, sourceValues);
  const targetValues =
    source.arrayPath === targetArrayPath
      ? sourceValues
      : [...((valueAtPath(next, targetArrayPath) as readonly unknown[] | undefined) ?? [])];
  let insertion = targetIndex ?? targetValues.length;
  if (
    source.arrayPath === targetArrayPath &&
    targetIndex !== undefined &&
    source.index < targetIndex
  ) {
    insertion -= 1;
  }
  insertion = Math.max(0, Math.min(insertion, targetValues.length));
  targetValues.splice(insertion, 0, value);
  setAtPath(next, targetArrayPath, targetValues);
  return { root: next, itemPath: `${targetArrayPath}[${insertion}]` };
}

export function replaceStructureValueAtPath<T>(root: T, path: string, value: unknown): T {
  const next = clone(root);
  setAtPath(next, path, value);
  return next;
}

export function deleteStructureValueAtPath<T>(root: T, path: string): T {
  const next = clone(root);
  deleteAtPath(next, path);
  return next;
}

export function appendCombatStepInStructure<T>(
  root: T,
  sequencePath: string,
  step: CombatStepDefinition,
): { readonly root: T; readonly stepPath: string } {
  const next = clone(root);
  const sequence = valueAtPath(next, sequencePath) as ActionSequenceDefinition | undefined;
  if (sequencePath === '') {
    return {
      root: { ...next, steps: [...sequence!.steps, step] },
      stepPath: `steps[${sequence!.steps.length}]`,
    };
  }
  if (sequence === undefined) {
    setAtPath(next, sequencePath, { steps: [step] });
    return { root: next, stepPath: `${sequencePath}.steps[0]` };
  }
  const index = sequence.steps.length;
  setAtPath(next, sequencePath, { ...sequence, steps: [...sequence.steps, step] });
  return { root: next, stepPath: `${sequencePath}.steps[${index}]` };
}

export function removeCombatStepInStructure<T>(root: T, path: string): T {
  const match = /^((?:.*\.)?steps)\[(\d+)\]$/.exec(path);
  if (match === null) throw new TypeError(`not a combat-step path: '${path}'`);
  const next = clone(root);
  const steps = valueAtPath(next, match[1]!) as readonly CombatStepDefinition[];
  setAtPath(
    next,
    match[1]!,
    steps.filter((_, index) => index !== Number(match[2])),
  );
  return next;
}

export function moveCombatStepInStructure<T>(
  root: T,
  path: string,
  offset: -1 | 1,
): { readonly root: T; readonly stepPath: string } {
  const match = /^((?:.*\.)?steps)\[(\d+)\]$/.exec(path);
  if (match === null) throw new TypeError(`not a combat-step path: '${path}'`);
  const next = clone(root);
  const steps = [...(valueAtPath(next, match[1]!) as readonly CombatStepDefinition[])];
  const index = Number(match[2]);
  const target = index + offset;
  if (target < 0 || target >= steps.length) return { root, stepPath: path };
  [steps[index], steps[target]] = [steps[target]!, steps[index]!];
  setAtPath(next, match[1]!, steps);
  return { root: next, stepPath: `${match[1]}[${target}]` };
}

export function duplicateCombatStepInStructure<T>(
  root: T,
  path: string,
  duplicate: (step: CombatStepDefinition) => CombatStepDefinition,
): { readonly root: T; readonly stepPath: string } {
  const match = /^((?:.*\.)?steps)\[(\d+)\]$/.exec(path);
  if (match === null) throw new TypeError(`not a combat-step path: '${path}'`);
  const next = clone(root);
  const steps = [...(valueAtPath(next, match[1]!) as readonly CombatStepDefinition[])];
  const index = Number(match[2]);
  steps.splice(index + 1, 0, duplicate(steps[index]!));
  setAtPath(next, match[1]!, steps);
  return { root: next, stepPath: `${match[1]}[${index + 1}]` };
}

export function resolveSkillStructureValue(skill: SkillDefinition, path: string): unknown {
  return path === '' ? skill : valueAtPath(skill, path);
}

export function resolveStructureValue(root: unknown, path: string): unknown {
  return path === '' ? root : valueAtPath(root, path);
}

export function replaceCombatStepAtPath(
  skill: SkillDefinition,
  path: string,
  step: CombatStepDefinition,
): SkillDefinition {
  const next = clone(skill);
  setAtPath(next, path, step);
  return next;
}

export function appendCombatStepAtSequencePath(
  skill: SkillDefinition,
  sequencePath: string,
  step: CombatStepDefinition,
): { readonly skill: SkillDefinition; readonly stepPath: string } {
  const result = appendCombatStepInStructure(skill, sequencePath, step);
  return { skill: result.root, stepPath: result.stepPath };
}

export function removeCombatStepAtPath(skill: SkillDefinition, path: string): SkillDefinition {
  return removeCombatStepInStructure(skill, path);
}

export function moveCombatStepAtPath(
  skill: SkillDefinition,
  path: string,
  offset: -1 | 1,
): { readonly skill: SkillDefinition; readonly stepPath: string } {
  const result = moveCombatStepInStructure(skill, path, offset);
  return { skill: result.root, stepPath: result.stepPath };
}

export function duplicateCombatStepAtPath(
  skill: SkillDefinition,
  path: string,
  duplicate: (step: CombatStepDefinition) => CombatStepDefinition,
): { readonly skill: SkillDefinition; readonly stepPath: string } {
  const result = duplicateCombatStepInStructure(skill, path, duplicate);
  return { skill: result.root, stepPath: result.stepPath };
}
