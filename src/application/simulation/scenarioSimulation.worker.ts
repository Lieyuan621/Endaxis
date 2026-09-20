import { createScenarioSimulationService } from './createScenarioSimulationService';
import type {
  SimulationWorkerRequest,
  SimulationWorkerResponse,
} from './scenarioSimulationWorkerProtocol';
import { toSimulationWorkerResult } from './scenarioSimulationWorkerProtocol';
import type { ScenarioSimulationPerformanceSample } from './scenarioSimulationService';
import { restoreScenarioSimulationGameData } from './scenarioSimulationGameData';

let service: ReturnType<typeof createScenarioSimulationService> | undefined;
// 主线程保证单个在途请求；此处只执行正式模拟与投影，不维护另一套模型。
self.onmessage = async (event: MessageEvent<SimulationWorkerRequest>) => {
  const request = event.data;
  if (request.gameData !== undefined)
    service = createScenarioSimulationService(restoreScenarioSimulationGameData(request.gameData));
  const samples: ScenarioSimulationPerformanceSample[] = [];
  const currentService = service;
  let response: SimulationWorkerResponse;
  if (currentService === undefined) {
    self.postMessage({
      id: request.id,
      ok: false,
      message: '后台模拟缺少当前场景的游戏数据',
      samples,
    } satisfies SimulationWorkerResponse);
    return;
  }
  const unsubscribe = currentService.subscribePerformance(sample => samples.push(sample));
  try {
    const result = request.plan
      ? await currentService.planSkillChain(
          request.scenario,
          request.plan.castIds,
          request.endFrame,
          undefined,
          request.plan.mode,
          request.plan.extension,
        )
      : await currentService.simulate(request.scenario, request.endFrame);
    response = { id: request.id, ok: true, result: toSimulationWorkerResult(result), samples };
  } catch (error) {
    response = {
      id: request.id,
      ok: false,
      message: error instanceof Error ? error.message : String(error),
      samples,
    };
  } finally {
    unsubscribe();
  }
  self.postMessage(response);
};
