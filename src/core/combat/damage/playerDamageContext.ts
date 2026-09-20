// 纯数据契约由独立包唯一声明；此路径保留兼容导出。
export {
  DAMAGE_MODIFIER_SIDES,
  DAMAGE_PROCESS_TIMINGS,
  DAMAGE_TARGET_HEALTH_TYPES,
  type DamageModifierSide,
  type DamageProcessTiming,
  type DamageTargetHealthType,
} from '../../../../packages/game-data-contract/src/modifiers.ts';
import {
  type DamageModifierSide,
  type DamageProcessTiming,
  type DamageTargetHealthType,
} from '../../../../packages/game-data-contract/src/modifiers.ts';
/**
 * 单次玩家伤害包跨原生处理阶段传递的唯一上下文。
 * 每次命中都应新建实例；处理器只能在自己的阶段修改允许的字段。
 */
import type {
  DamageFeature,
  DamageTag,
  DamageType,
  SkillType,
} from '../../game-data/operatorDefinition';
import type {
  AttributeModifierTiming,
  AttributeModifierValues,
} from '../attributes/combatAttributes';
import type { CombatSkillCastInfo } from '../state/foundationState';
import type { GameplayTag } from '../tags/gameplayTags';
import { DamageScaleAccumulator } from './damageScale';
import type { DamageScaleAttributeSnapshot } from './damageScaleAttributes';
import type {
  PlayerDamageAttackerSnapshot,
  PlayerDamageDefenderSnapshot,
} from './playerActiveDamageInput';

/** 单次伤害包冻结的来源方与目标方属性快照。 */
export interface PlayerDamageAttributeSnapshots {
  readonly attacker: PlayerDamageAttackerSnapshot &
    DamageScaleAttributeSnapshot & {
      readonly modifierDetails?: readonly import('./damageScale').AppliedDamageModifier[];
      readonly attackDetail?: import('../state/foundationState').AttackReceiptSnapshot;
    };
  readonly defender: PlayerDamageDefenderSnapshot &
    DamageScaleAttributeSnapshot & {
      readonly modifierDetails?: readonly import('./damageScale').AppliedDamageModifier[];
    };
}

/** 伤害处理阶段临时加入、结束后必须清理的属性修正请求。 */
export interface InstantAttributeModifierRequest {
  readonly attribute: string;
  readonly values: AttributeModifierValues;
  readonly timing: AttributeModifierTiming;
}

/** 伤害上下文访问属性修正注册表所需的受控端口。 */
export interface PlayerDamageContextPorts {
  readonly captureAttributeSnapshots: () => PlayerDamageAttributeSnapshots;
  readonly applyModifiers: (
    timing: DamageProcessTiming,
    side: DamageModifierSide,
    context: PlayerDamageContext,
  ) => void;
  readonly addInstantAttributeModifier: (
    side: DamageModifierSide,
    request: InstantAttributeModifierRequest,
  ) => void;
  readonly clearInstantAttributeModifiers: (side: DamageModifierSide) => void;
}

interface PlayerDamageContextInput {
  readonly sourceId: string;
  readonly targetId: string;
  readonly damageType: DamageType;
  readonly targetHealthType: DamageTargetHealthType;
  readonly tags?: readonly DamageTag[];
  readonly gameplayTags?: readonly GameplayTag[];
  readonly features?: readonly DamageFeature[];
  readonly skillCastId?: number;
  readonly skillCastInfo?: CombatSkillCastInfo | null;
  readonly skillId?: string;
  readonly skillType?: SkillType;
  readonly ports: PlayerDamageContextPorts;
}

/** 遵循已还原原生伤害包生命周期的单次命中可变状态。 */
export class PlayerDamageContext {
  readonly sourceId: string;
  readonly targetId: string;
  readonly damageType: DamageType;
  readonly targetHealthType: DamageTargetHealthType;
  readonly tags: readonly DamageTag[];
  readonly gameplayTags: readonly GameplayTag[];
  readonly features: readonly DamageFeature[];
  readonly skillCastId: number | null;
  readonly skillCastInfo: CombatSkillCastInfo | null | undefined;
  readonly skillId?: string;
  readonly skillType?: SkillType;
  readonly damageScales = new DamageScaleAccumulator();
  readonly appliedDamageModifiers: import('./damageScale').AppliedDamageModifier[] = [];
  readonly #ports: PlayerDamageContextPorts;
  #baseValue = 0;
  #value = 0;
  #pendingCalculationScale = 1;
  #hasCalculationResult = false;
  readonly #instantModifiedSides = new Set<DamageModifierSide>();
  #beforeCalculationInstantSnapshots: Partial<PlayerDamageAttributeSnapshots> = {};
  #snapshots: PlayerDamageAttributeSnapshots;

  constructor(input: PlayerDamageContextInput) {
    this.sourceId = input.sourceId;
    this.targetId = input.targetId;
    this.damageType = input.damageType;
    this.targetHealthType = input.targetHealthType;
    this.tags = input.tags ?? [];
    this.gameplayTags = input.gameplayTags ?? [];
    this.features = input.features ?? [];
    this.skillCastId = input.skillCastId ?? null;
    this.skillCastInfo = input.skillCastInfo;
    this.skillId = input.skillId;
    this.skillType = input.skillType;
    this.#ports = input.ports;
    this.#snapshots = input.ports.captureAttributeSnapshots();
  }

  get baseValue(): number {
    return this.#baseValue;
  }

  get value(): number {
    return this.#value;
  }

  get hasCalculationResult(): boolean {
    return this.#hasCalculationResult;
  }

  get attackerAttributes(): PlayerDamageAttributeSnapshots['attacker'] {
    return this.#snapshots.attacker;
  }

  get defenderAttributes(): PlayerDamageAttributeSnapshots['defender'] {
    return this.#snapshots.defender;
  }

  getEntityId(side: DamageModifierSide): string {
    return side === 'attacker' ? this.sourceId : this.targetId;
  }

  addInstantAttributeModifier(
    side: DamageModifierSide,
    request: InstantAttributeModifierRequest,
  ): void {
    this.#ports.addInstantAttributeModifier(side, request);
    this.#instantModifiedSides.add(side);
  }

  applyModifiers(timing: DamageProcessTiming): void {
    try {
      this.#ports.applyModifiers(timing, 'attacker', this);
      this.#ports.applyModifiers(timing, 'defender', this);
      const captured = this.#ports.captureAttributeSnapshots();
      if (timing === 'beforeCalculation') {
        this.#beforeCalculationInstantSnapshots = {
          ...(this.#instantModifiedSides.has('attacker') ? { attacker: captured.attacker } : {}),
          ...(this.#instantModifiedSides.has('defender') ? { defender: captured.defender } : {}),
        };
        this.#snapshots = captured;
      } else {
        // 原生在每个处理阶段重采样后立即清理 Instant 修正。最终公式仍须使用
        // BeforeCalculation 为被修改一侧冻结的包内副本；另一侧继续接收后阶段快照。
        this.#snapshots = {
          attacker: this.#beforeCalculationInstantSnapshots.attacker ?? captured.attacker,
          defender: this.#beforeCalculationInstantSnapshots.defender ?? captured.defender,
        };
        this.#beforeCalculationInstantSnapshots = {};
        this.#instantModifiedSides.clear();
      }
    } catch (error) {
      this.#beforeCalculationInstantSnapshots = {};
      this.#instantModifiedSides.clear();
      throw error;
    } finally {
      this.#ports.clearInstantAttributeModifiers('attacker');
      this.#ports.clearInstantAttributeModifiers('defender');
    }
  }

  dispose(): void {
    if (this.#instantModifiedSides.size === 0) return;
    this.#ports.clearInstantAttributeModifiers('attacker');
    this.#ports.clearInstantAttributeModifiers('defender');
    this.#beforeCalculationInstantSnapshots = {};
    this.#instantModifiedSides.clear();
  }

  setCalculationResult(value: number): void {
    this.#baseValue = value;
    this.#value = value * this.#pendingCalculationScale;
    this.#hasCalculationResult = true;
  }

  multiplyCalculationValue(scale: number): void {
    if (this.#hasCalculationResult) {
      this.#value *= scale;
      return;
    }
    this.#pendingCalculationScale *= scale;
  }

  resolveFinalAttackValue(): number {
    if (this.damageType === 'lifeDrain') return this.#value;
    this.applyModifiers('afterCalculation');
    return this.#value * this.damageScales.getFinalValue();
  }
}
