/** 仅供测试构造简化 Buff 句柄；生产编号由各目标的 Buff 容器分配。 */
import type { BuffReference } from '../state/foundationState';

let nextInstanceId = 1;

export function createTestBuffReference(): BuffReference {
  return { ownerId: 'test-buff-owner', instanceId: nextInstanceId++ };
}
