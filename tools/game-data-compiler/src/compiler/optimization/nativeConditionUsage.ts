import type { NativeActionNodeSource } from '../../source/controlFlow.ts';
import type { KnownNativeActionLeafSource } from '../../source/actionLeaf.ts';
import type { TargetReferenceSource } from '../../source/target.ts';

/** 无随机选择或处理器写入的目标读取，可以随无用途计算一起省略。 */
export function isReadOnlyNativeTarget(target: TargetReferenceSource | undefined): boolean {
  return (
    target !== undefined &&
    (target.targetSource !== 'InstantSearch' ||
      ((target.finderType === 'ShapeFinder' || target.finderType === 'MainTargetFinder') &&
        target.validatorTypes.length === 0 &&
        target.postProcessorTypes.length === 0 &&
        target.priorityFilters.length === 0 &&
        target.shuffleTargets.length === 0 &&
        target.distanceValidators.length === 0))
  );
}

/** 判断未使用的条件能否省略，不为仅影响无效分支的输入建立运行模型。 */
export function canOmitUnusedNativeCondition(
  node: NativeActionNodeSource<KnownNativeActionLeafSource>,
): boolean {
  if (isPureEmptyContinuingBranch(node)) return true;
  if (node.body.kind !== 'leaf' || node.body.value.family !== 'condition') return false;
  const condition = node.body.value.action;
  // 普通引用、主目标读取及无过滤重叠查询无战斗写入；随机或其他处理器仍须保留。
  const readOnly = isReadOnlyNativeTarget;
  switch (condition.kind) {
    case 'entityCount':
      return condition.storeKey === '' && readOnly(condition.target);
    case 'twoDirectionAngle':
      return [
        condition.dir1Source,
        condition.dir1Target,
        condition.dir2Source,
        condition.dir2Target,
      ].every(readOnly);
    case 'targetAngle':
      return readOnly(condition.origin) && readOnly(condition.target);
    case 'distance':
      return readOnly(condition.source) && readOnly(condition.target);
    case 'targetContains':
      return readOnly(condition.parent) && readOnly(condition.child);
    case 'objectTypeMatch':
    case 'superArmor':
    case 'targetInScreen':
      return readOnly(condition.target);
  }
  return [
    'mainOperator',
    'floatCompare',
    'comboCameraAlphaSetting',
    'skillCameraMotionFree',
    'moveInput',
    'perfectDodgeDirection',
  ].includes(condition.kind);
}

/** 只处理源树已无有效分支动作的窄结构，不执行跨组件活性优化。 */
export function isPureEmptyContinuingBranch(
  node: NativeActionNodeSource<KnownNativeActionLeafSource>,
): boolean {
  const body = node.body;
  return (
    body.kind === 'ifElse' &&
    body.alwaysNext &&
    body.whenTrue.actions.every(child => !child.metadata.enabled) &&
    body.whenFalse.actions.every(child => !child.metadata.enabled) &&
    body.condition.actions.every(
      child => !child.metadata.enabled || canOmitUnusedNativeCondition(child),
    )
  );
}
