import { resolveEnemySpawn } from '../../core/project/enemyBirthEffects';
import { firstScenarioEnemy, levelEnemies } from '../../core/project/level';
/**
 * 协调敌人预制体选择和属性编辑，把一次 UI 意图转换为一次场景会话提交。
 * 组件不需要知道定义默认值、秒到帧换算或用户覆盖字段的记录方式。
 */
import { getEnemySourceDefinitionId } from '../../core/game-data/enemyDefinition';
import { computed, type Ref } from 'vue';
import {
  type StageEnemySelection,
  createDefinitionEnemyDocument,
  createCustomEnemyDocument,
  replaceEnemyEditableValues,
  setScenarioEnemy,
} from '../../application/editor/enemyEditorCommands';
import type { ScenarioEditingSession } from '../../application/editor/scenarioEditorSession';
import type { GameDataBrowser, GameDataRepository } from '../../core/game-data/gameDataRepository';
import type {
  EnemyEditableValues,
  ScenarioDocument,
  StageEnemyIdentity,
} from '../../core/project/schema';

type TimelineEnemyGameData = Pick<GameDataRepository, 'getEnemy' | 'getEnemyStage'> &
  Pick<GameDataBrowser, 'getEnemies'>;

export interface TimelineEnemyEditorOptions {
  readonly scenario: Readonly<Ref<ScenarioDocument>>;
  readonly session: ScenarioEditingSession;
  readonly gameData: TimelineEnemyGameData;
  readonly fps: number;
  readonly enemyInstanceId?: Readonly<Ref<string | undefined>>;
}

export function useTimelineEnemyEditor(options: TimelineEnemyEditorOptions) {
  const enemies = computed(() => options.gameData.getEnemies());
  const selectedEnemy = computed(() =>
    options.enemyInstanceId?.value === undefined
      ? firstScenarioEnemy(options.scenario.value).enemy
      : (levelEnemies(options.scenario.value.level).find(
          item => item.id === options.enemyInstanceId!.value,
        )?.enemy ?? firstScenarioEnemy(options.scenario.value).enemy),
  );
  const selectedDefinition = computed(() => {
    const source = selectedEnemy.value.source;
    const id = getEnemySourceDefinitionId(source);
    return id === null ? null : options.gameData.getEnemy(id);
  });

  function selectDefinitionEnemy(
    enemyId: string,
    level: number,
    stage?: StageEnemyIdentity,
    enabledBirthBuffs?: readonly string[],
  ): void {
    const definition = options.gameData.getEnemy(enemyId);
    if (definition === null) throw new Error(`missing enemy definition '${enemyId}'`);
    const enemy = createDefinitionEnemyDocument(
      definition,
      level,
      options.fps,
      stage,
      enabledBirthBuffs,
      stage
        ? resolveEnemySpawn(
            { kind: 'stage', ...stage, level },
            options.gameData.getEnemyStage?.(stage.stageId) ?? null,
          )
        : null,
    );
    options.session.commit('setScenarioEnemy', scenario =>
      setScenarioEnemy(
        scenario,
        { ...enemy, lifecycle: selectedEnemy.value.lifecycle },
        options.enemyInstanceId?.value,
      ),
    );
  }

  function selectStageEnemies(
    entries: readonly StageEnemySelection[],
    allocateId: () => string,
  ): void {
    if (!entries.length) return;
    // 先完整解析，避免部分定义不可用时留下半次应用。
    const instances = entries.flatMap(entry => {
      if (!Number.isSafeInteger(entry.count) || entry.count <= 0)
        throw new Error('invalid stage enemy count');
      return Array.from({ length: entry.count }, () => entry);
    });
    const documents = instances.map(entry => {
      const definition = options.gameData.getEnemy(entry.definitionId);
      if (!definition) throw new Error(`missing enemy definition '${entry.definitionId}'`);
      return createDefinitionEnemyDocument(
        definition,
        entry.level,
        options.fps,
        entry.source,
        undefined,
        resolveEnemySpawn(
          { kind: 'stage', ...entry.source, level: entry.level },
          options.gameData.getEnemyStage?.(entry.source.stageId) ?? null,
        ),
      );
    });
    const enemies = documents.map((enemy, index) => ({
      id: allocateId(),
      name: instances[index]!.name,
      enemy,
    }));
    options.session.commit('setStageEnemies', scenario => ({
      ...scenario,
      level: { kind: 'multiEnemies', enemies },
      battle: { ...scenario.battle, enemyTargetSwitches: [] },
    }));
  }

  function selectCustomEnemy(level = 90): void {
    const enemy = createCustomEnemyDocument(level);
    options.session.commit('setCustomEnemy', scenario =>
      setScenarioEnemy(
        scenario,
        { ...enemy, lifecycle: selectedEnemy.value.lifecycle },
        options.enemyInstanceId?.value,
      ),
    );
  }

  function saveEnemyValues(
    values: EnemyEditableValues,
    enabledBirthBuffs?: readonly string[],
  ): void {
    options.session.commit('updateEnemyValues', scenario =>
      replaceEnemyEditableValues(
        scenario,
        values,
        options.enemyInstanceId?.value,
        enabledBirthBuffs,
      ),
    );
  }

  return {
    enemies,
    selectedDefinition,
    selectDefinitionEnemy,
    selectStageEnemies,
    selectCustomEnemy,
    saveEnemyValues,
  };
}
