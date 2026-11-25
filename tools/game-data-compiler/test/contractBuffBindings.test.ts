import { describe, expect, it } from 'vitest';
import { resolveContractBuffBindings } from '../src/domains/contingencyContract/contractBuffBindings.ts';

describe('合约人工绑定参数', () => {
  const configuration = {
    season: {
      1: {
        pending: '尚有未绑定效果',
        buffs: [
          { buffId: 'lock', owner: 'caster', blackboardIndex: 0 },
          { buffId: 'damage', owner: 'caster', blackboardIndex: 1 },
        ],
      },
    },
  };
  const supplement = {
    gameId: 'season',
    tags: {
      1: {
        serverBlackboards: [
          { value: { strValue: '', floatValue: 2, isDynamic: false } },
          { value: { strValue: '', floatValue: 0.5, isDynamic: false } },
        ],
      },
    },
  };
  it('同名参数按绑定的服务器黑板组分别读取，并保留未完成标记', () => {
    expect(resolveContractBuffBindings(configuration, supplement)).toEqual([
      {
        tagId: 1,
        pending: '尚有未绑定效果',
        buffs: [
          { buffId: 'lock', owner: 'caster', blackboard: { value: 2 } },
          { buffId: 'damage', owner: 'caster', blackboard: { value: 0.5 } },
        ],
      },
    ]);
  });
  it('参数组缺失时不采用另一个组或填零', () => {
    expect(() =>
      resolveContractBuffBindings(configuration, {
        ...supplement,
        tags: { 1: { serverBlackboards: [{}] } },
      }),
    ).toThrow('serverBlackboards[1]');
  });
});
