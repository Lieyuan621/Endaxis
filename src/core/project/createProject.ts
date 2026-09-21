/**
 * 新项目进入持久化模型的构造入口。调用方应提供创建者身份，
 * 不要在 UI 中复制默认文档结构，否则 schema 演进时容易产生多份默认值。
 */
import {
  PROJECT_FPS,
  PROJECT_KIND,
  PROJECT_SCHEMA_VERSION,
  type EndaxisProjectDocument,
  type ScenarioDocument,
} from './schema';

/** 创建项目时必须由应用环境提供、不能从 UI 默认值猜测的信息。 */
export interface CreateProjectOptions {
  projectId?: string;
  scenarioName?: string;
  createdWith: string;
  /** 仅用于需要固定时间的调用方和测试；默认取当前 UTC 时间。 */
  createdAt?: string;
}

export function createEmptyScenario(id: string, name: string): ScenarioDocument {
  return {
    id,
    name,
    tracks: [null, null, null, null],
    connections: [],
    enemy: {
      source: { kind: 'custom', level: 90 },
      rank: 'mob',
      editable: {
        hp: 100000,
        defense: 100,
        superArmor: 0,
        finisherMultiplier: 1,
        resistances: {},
        stagger: {
          maximum: 300,
          knotThresholds: [0.5],
          knotBreakDurationFrames: 60,
          brokenDurationFrames: 300,
          finisherSpRecovery: 100,
        },
      },
      edited: [],
    },
    battle: {
      prepFrames: 150,
      durationFrames: 3600,
      resourceRules: {
        maxSp: 300,
        initialSp: 200,
        spRecoveryPerSecond: 8,
        defaultSkillSpCost: 100,
      },
      cycleBoundaries: [],
      controlSwitches: [],
      externalEventMarkers: [],
      dodgeMarkers: [],
    },
    mechanics: { selections: [] },
    globalConfig: { modifiers: [] },
    editor: {
      trackHeightWeights: [1, 1, 1, 1],
      prepExpanded: false,
    },
  };
}

export function createEmptyProject(options: CreateProjectOptions): EndaxisProjectDocument {
  const scenarioId = options.projectId ? `${options.projectId}:scenario:1` : 'scenario:1';
  const createdAt = options.createdAt ?? new Date().toISOString();
  return {
    kind: PROJECT_KIND,
    schemaVersion: PROJECT_SCHEMA_VERSION,
    createdWith: options.createdWith,
    createdAt,
    fps: PROJECT_FPS,
    activeScenarioId: scenarioId,
    definitionLibrary: { operators: {}, weapons: {}, gears: {}, gearSets: {} },
    scenarios: [createEmptyScenario(scenarioId, options.scenarioName ?? 'Scenario 1')],
  };
}
