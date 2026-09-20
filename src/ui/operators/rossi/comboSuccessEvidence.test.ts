import { expect, it } from 'vitest';
import { projectRossiComboSuccessCastIds } from './comboSuccessEvidence';

function pressed(succeeded: boolean, sourceActionId = 'cast:rossi') {
  return { event: 'ComboRingQtePressed', sequence: 1, data: { succeeded, sourceActionId } };
}

it('只高亮实际命中圆环 QTE 的连携输入', () => {
  const success = pressed(true);
  expect(
    projectRossiComboSuccessCastIds([
      success,
      success,
      pressed(false, 'cast:failed'),
      {
        event: 'BuffApplied',
        sequence: 2,
        data: {
          buffId: 'buff_chr_0028_wulfa_tut_comboskill_success',
          sourceActionId: 'cast:buff-source',
        },
      },
    ]),
  ).toEqual(new Set(['cast:rossi']));
});

it('损坏的成功 QTE 回执不猜测施法归属', () => {
  expect(() => projectRossiComboSuccessCastIds([pressed(true, '')])).toThrow(
    'ring-QTE sourceActionId',
  );
});
