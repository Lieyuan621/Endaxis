import type { CombatVitals } from '../resources/combatVitals';
import { EnemyLifecycle, type EnemyLifecycleTransition } from './enemyLifecycle';

export interface EnemyLifeRuntimeHooks {
  readonly spawn: () => void;
  readonly healthCleared?: (previousHealth: number) => void;
  readonly emit: (event: 'ownerHpZero' | 'ownerDead') => void;
  /** 原生死亡完成后通知来源关联对象；回收及 Buff 清理不等同于死亡事件。 */
  readonly died: () => void;
  readonly transition: (event: EnemyLifecycleTransition) => void;
}

/** 将场景死亡输入与生命归零接到同一个入口；不产生虚构的击杀者。 */
export class EnemyLifeRuntime {
  #dying = false;

  constructor(
    readonly lifecycle: EnemyLifecycle,
    readonly vitals: CombatVitals,
    readonly hooks: EnemyLifeRuntimeHooks,
  ) {}

  advanceFrame(frame: number): void {
    this.lifecycle.advance(
      frame,
      event => {
        this.hooks.transition(event);
        if (event.kind === 'spawn') {
          this.hooks.spawn();
          this.healthChanged(event.frame);
        }
      },
      deathFrame => this.#die(deathFrame),
    );
  }

  /** 由生命账本已有的观察者调用，不覆盖生命/最大生命事件的观察者。 */
  healthChanged(frame: number): void {
    if (this.lifecycle.automaticDeath && this.vitals.health <= 0) this.#die(frame);
  }

  #die(frame: number): void {
    if (this.#dying || !this.lifecycle.alive) return;
    this.#dying = true;
    try {
      const previousHealth = this.vitals.health;
      this.vitals.setHealthToZero();
      if (previousHealth !== 0) this.hooks.healthCleared?.(previousHealth);
      // HP-zero 观察时仍存活；OwnerDead 观察时已死亡。两者不能合成一个事件。
      this.hooks.emit('ownerHpZero');
      this.lifecycle.die(frame, this.hooks.transition);
      this.hooks.emit('ownerDead');
      this.hooks.died();
    } finally {
      this.#dying = false;
    }
  }
}
