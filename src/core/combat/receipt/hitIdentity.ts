import { rootIdentity, DerivedObjectOccurrences } from '../../derivedObjectIdentity';
import type { CombatObjectRef, CombatReceiptEntry } from './combatReceipt';
import { runtimeTargetFromEntityId } from '../../game-data/logicalAbilityEntity';
import { combatObjectKey } from './combatObjectIdentity';

type Fact = Omit<CombatReceiptEntry, 'sequence'>;

/** 用户可见的创建链。动作图节点、帧号和全场实例流水号不参与身份。 */
export class HitIdentityIndex {
  readonly #objects = new Map<string, string>();
  readonly #occurrences = new DerivedObjectOccurrences();

  #origin(ref: CombatObjectRef | undefined): string | undefined {
    if (ref === undefined) return undefined;
    // action 是来源图中的技能释放或构筑入口。
    switch (ref.kind) {
      case 'action': {
        const owner = this.#owner(ref.ownerId);
        return owner === undefined ? undefined : rootIdentity({ ...ref, ownerId: owner });
      }
      case 'operator':
      case 'enemy':
      case 'godEntity':
        return rootIdentity(ref);
      default:
        return this.#objects.get(combatObjectKey(ref));
    }
  }

  observeCreation(entry: Fact): void {
    const subject = entry.subject;
    if (!subject) return;
    let definition: unknown;
    let ownerId = entry.sourceId;
    switch (entry.event) {
      case 'AbilityEntitySpawned':
      case 'ProjectileLaunched':
        if (subject.kind !== 'abilityEntity') return;
        definition =
          entry.event === 'ProjectileLaunched'
            ? entry.data?.projectileId
            : entry.data?.abilityEntityId;
        break;
      case 'BuffCreated':
        if (subject.kind !== 'buff') return;
        definition = entry.data?.buffId;
        ownerId = subject.ownerId;
        break;
      case 'GlobalBuffCreated':
        if (subject.kind !== 'globalBuff') return;
        definition = entry.data?.buffId;
        break;
      default:
        return;
    }
    if (typeof definition !== 'string' || !definition || ownerId === undefined) return;
    const parent = this.#origin(entry.producedBy);
    const owner = this.#owner(ownerId);
    if (parent === undefined || owner === undefined) return;
    this.#objects.set(
      combatObjectKey(subject),
      this.#occurrences.child(parent, subject.kind, definition, owner),
    );
  }

  restoreHit(key: string): void {
    this.#occurrences.restoreHit(key);
  }

  #owner(id: string): string | undefined {
    const ref = runtimeTargetFromEntityId(id);
    return ref.kind === 'abilityEntity' ? this.#origin(ref) : id;
  }

  nextHit(
    producer: CombatObjectRef | undefined,
    ownerId: string,
    targetId: string,
  ): string | undefined {
    const parent = this.#origin(producer);
    if (parent === undefined) return undefined;
    const owner = this.#owner(ownerId);
    const target = this.#owner(targetId);
    if (owner === undefined || target === undefined) return undefined;
    return this.#occurrences.hit(parent, owner, target);
  }
}
