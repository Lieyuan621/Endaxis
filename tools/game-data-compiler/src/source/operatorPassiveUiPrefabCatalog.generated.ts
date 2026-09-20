// 此文件由 generateOperatorPassiveUiPrefabCatalog.ts 从原生 prefab 对象快照生成，请勿手改。

import type { OperatorPassiveUiPrefabComponentEvidence } from './operatorPassiveUiPrefabEvidence.ts';

export const OPERATOR_PASSIVE_UI_COMPONENT_BY_PREFAB = {
  OverlayInfoNodeLaevat: {
    componentType: 'UICharPassiveCounter',
    layerCount: 4,
    activeCount: 4,
  },
  OverlayInfoNodeLiino: {
    componentType: 'UICharPassiveLiino',
    normalBuffId: 'buff_chr_0035_liino_normalskill_music_tag',
    ultimateBuffId: 'buff_chr_0035_liino_ultskill_music_tag',
  },
  OverlayInfoNodeLizhiyan: {
    componentType: 'UICharPassiveLizhiyan',
    fullCount: 3,
    stateCounts: [0, 1, 2, 3],
  },
  OverlayInfoNodeTangTang: {
    componentType: 'UICharPassiveMultiStates',
    fullCount: 2,
    stateCounts: [0, 1, 2],
  },
  OverlayInfoNodeTyphoea: {
    componentType: 'UICharPassiveTyphoea',
    arrowBuffId: 'buff_chr_0034_typhoea_passive_arrowrecover_exitfight',
    battleArrowBuffId: 'buff_chr_0034_typhoea_normal_skill_arrow_num',
    pointBuffId: 'buff_chr_0034_typhoea_normal_skill_arrow_energy',
    arrowCount: 4,
    pointCount: 8,
  },
  OverlayInfoNodeZhuangfy: {
    componentType: 'UICharPassiveZhuangfy',
    fullCount: 9,
    stateCounts: [0, 1, 9],
  },
} as const satisfies Readonly<Record<string, OperatorPassiveUiPrefabComponentEvidence>>;
