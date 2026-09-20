export type OperatorPassiveUiPrefabComponentEvidence =
  | {
      readonly componentType: 'UICharPassiveMultiStates';
      readonly fullCount: number;
      readonly stateCounts: readonly number[];
    }
  | {
      readonly componentType: 'UICharPassiveCounter';
      readonly layerCount: number;
      readonly activeCount: number;
    }
  | {
      readonly componentType: 'UICharPassiveZhuangfy';
      readonly fullCount: number;
      readonly stateCounts: readonly number[];
    }
  | {
      readonly componentType: 'UICharPassiveLizhiyan';
      readonly fullCount: number;
      readonly stateCounts: readonly number[];
    }
  | {
      readonly componentType: 'UICharPassiveLiino';
      readonly normalBuffId: string;
      readonly ultimateBuffId: string;
    }
  | {
      readonly componentType: 'UICharPassiveTyphoea';
      readonly arrowBuffId: string;
      readonly battleArrowBuffId: string;
      readonly pointBuffId: string;
      readonly arrowCount: number;
      readonly pointCount: number;
    };
