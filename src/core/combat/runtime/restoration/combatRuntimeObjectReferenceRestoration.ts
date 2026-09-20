/**
 * 给 Buff 生命周期中的 SkillAffix 接回实体 reset 与 Buff recycle 引用。
 *
 * 配置发生在 Buff 固定定义编译前，实际解析发生在最终关系阶段。普通能力实体和投射物共享实例编号
 * 空间，但由两个目录持有；先查投射物数据即可确定唯一对象类型，不根据事件名称或来源猜测。
 */
import type { RestoredCombatAbilityEntityDirectory } from './combatRuntimeAbilityEntityRestoration';
import type { ProjectileLifecycleRuntime } from '../../abilities/projectileLifecycleRuntime';

export function configureRestoredCombatObjectReferences(options: {
  readonly entities: RestoredCombatAbilityEntityDirectory;
  readonly projectiles: ProjectileLifecycleRuntime;
}): void {
  for (const target of options.entities.targets.values()) {
    if (target.configureRestoredSkillAffixObjectReferenceBinder === undefined) continue;
    target.configureRestoredSkillAffixObjectReferenceBinder((reference, release) => {
      if (reference.kind === 'buff') {
        const owner = options.entities.targets.get(reference.reference.ownerId);
        if (owner?.bindRestoredBuffRecycleCallback === undefined) {
          throw new Error(
            `restored SkillAffix Buff target '${reference.reference.ownerId}' cannot bind recycle callbacks`,
          );
        }
        return owner.bindRestoredBuffRecycleCallback(
          reference.reference,
          reference.recycleRegistrationId,
          release,
        );
      }
      if (options.projectiles.runtimeState.instances.has(reference.target.instanceId)) {
        return options.projectiles.bindRestoredResetCallback(
          reference.target.instanceId,
          reference.resetRegistrationId,
          release,
        );
      }
      return options.entities.runtime.bindResetCallback(
        reference.target,
        reference.resetRegistrationId,
        release,
      );
    });
  }
}
