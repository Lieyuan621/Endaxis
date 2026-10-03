/** Schema capabilities and runtime values meet here; core never imports generated UI metadata. */
import type {
  ActionGraphDataNode,
  ActionGraphStep,
} from '../../../packages/game-data-contract/src/actionGraph';
import { dataNodeInputs, listDataInputs } from '../../core/action-graph/actionGraphDataNodes';
import { dataNodeKind } from './nodePresentation';
import { actionNodeSchemas, dataNodeSchemas } from './actionNodeSchemas.generated';

export function actionTypedInputs(action: ActionGraphStep) {
  return listDataInputs(action, actionNodeSchemas[action.kind].fields);
}
export function dataTypedInputs(node: ActionGraphDataNode) {
  return dataNodeInputs(node, dataNodeSchemas[`${node.type}:${dataNodeKind(node)}`]?.fields);
}
