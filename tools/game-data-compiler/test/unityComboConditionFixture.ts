/**
 * 1.4.4 诀角色条件的最小字段切片（非完整资源/生成中间产物）。
 * raw SHA256 33934515ea8b90efdf35f3fae4901124ed54fc16c087a9755574d8db58dca0bc。
 * 14 条 RID/事件/类型/数值来自完整消费的叶子；908 字节未解码后缀不在此夹具内。
 */
export function unityComboConditionFixture() {
  const target = (targetSource = 2, targetGroupKey = 'trigger') => ({
    targetSource,
    targetGroupKey,
    selectorOwner: 1,
    ownerContextKey: '',
    centerType: 0,
    centerContextKey: '',
    centerToGround: false,
    selectorData: { finderData: '-2', validatorData: [], postProcessorData: [] },
    enableAdvancedDirection: false,
    advancedDirection: {
      directionType: 0,
      source: '-2',
      target: '-2',
      sourceMountPoint: 0,
      targetMountPoint: 0,
      customSourceAndTarget: false,
      clampToXZ: true,
      invertDirection: false,
    },
    selectorDirection: 0,
    target: 0,
    targetContextKey: '',
  });
  const scalar = (value: number, key = '', useKey = false) => ({ useKey, value, key });
  const references: Record<
    string,
    {
      rid: string;
      class: string;
      namespace: string;
      assembly: string;
      decodeStatus: string;
      data: Record<string, unknown>;
    }
  > = {};
  let index = 1000;
  const action = (name: string, data: Record<string, unknown>, condition = true) => {
    const rid = String(2708501211437859822n + BigInt(index - 1000));
    references[rid] = {
      rid,
      class: `${name}/Data`,
      namespace: condition ? 'Beyond.Gameplay.Core.Conditions' : 'Beyond.Gameplay.Core',
      assembly: 'Gameplay.Beyond',
      decodeStatus: 'complete',
      data: {
        isEnable: true,
        priorityLevel: 0,
        priorityOffset: 0,
        serverActionIndex: index++,
        ...data,
      },
    };
    return rid;
  };
  const rows: string[][] = [];
  for (const [mask, tag] of [
    [8, null],
    [1, -1558844517],
    [2, 2123008650],
    [4, 1570888476],
  ] as const) {
    const row = [
      action('CheckObjectTypeMatch', { target: target(), objectTypeMask: 16 }),
      action('CheckSpellInflictionType', { mask, savedKey: '' }),
    ];
    if (tag !== null)
      row.push(
        action('CheckBuffStackNumByTag', {
          checkTarget: target(),
          tagQuery: {
            queryType: { value: 0, name: 'HasAny' },
            tags: [{ tagId: { value: tag, hex: `0x${(tag >>> 0).toString(16)}` } }],
          },
          buffStackNumType: 0,
          compareType: 3,
          value: scalar(1),
        }),
      );
    rows.push(row);
  }
  rows.push([
    action(
      'DebugPrintAction',
      {
        logType: 1,
        target: target(0, ''),
        color: { r: 1, g: 0, b: 0, a: 1 },
        bbKey: 'EntityBB_wisd_greater_will',
        identifier: 'xxxprecheck',
      },
      false,
    ),
    action(
      'CompareFloat',
      { valueA: scalar(0, 'EntityBB_wisd_greater_will', true), compare: 0, valueB: scalar(1, '1') },
      false,
    ),
    action('CheckSpellInflictionType', { mask: 15, savedKey: 'EntityBB_consumed_type' }),
  ]);
  return {
    references,
    conditions: rows.map(actionData => ({
      comboSkillEvent: 121,
      comboSkillConditionImmediately: false,
      comboSkillCheckAction: {
        actionData,
        onlyExecuteWhenSourceIsMainChar: false,
        onlyExecuteWhenSourceIsGuard: false,
      },
    })),
  };
}
