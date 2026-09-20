/**
 * 时间轴技能块连线的文档命令与端口类型。
 *
 * 这里只处理技能块间连线的持久化语义，不接触 DOM 和拖拽状态。
 */
import type { ConnectionDocument, ScenarioDocument } from '../../../core/project/schema';

export type TimelineConnectionPort =
  'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/** 端口标识用连字符，旧版翻译键用驼峰式。 */
export function connectionPortI18nKey(port: TimelineConnectionPort): string {
  return `connection.portPosition.${port.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())}`;
}

export interface CreateSkillCastConnectionInput {
  readonly id: string;
  readonly fromSkillCastId: string;
  readonly fromPort: TimelineConnectionPort;
  readonly toSkillCastId: string;
  readonly toPort: TimelineConnectionPort;
  readonly consumption?: boolean;
}

export interface UpdateTimelineConnectionInput {
  readonly fromPort?: TimelineConnectionPort;
  readonly toPort?: TimelineConnectionPort;
  readonly consumption?: boolean;
}

function containsSkillCast(scenario: ScenarioDocument, skillCastId: string): boolean {
  return scenario.tracks.some(track =>
    track?.skillCasts.some(skillCast => skillCast.id === skillCastId),
  );
}

/** 技能块端口拖放与最终文档命令共用的合法性判断。 */
export function canCreateSkillCastConnection(
  scenario: ScenarioDocument,
  fromSkillCastId: string,
  toSkillCastId: string,
  exceptConnectionId?: string,
): boolean {
  return (
    fromSkillCastId !== toSkillCastId &&
    containsSkillCast(scenario, fromSkillCastId) &&
    containsSkillCast(scenario, toSkillCastId) &&
    !scenario.connections.some(
      connection =>
        connection.id !== exceptConnectionId &&
        connection.from.skillCastId === fromSkillCastId &&
        connection.to.skillCastId === toSkillCastId,
    )
  );
}

/** 拖动已选连线终点时保留连线身份和来源端口，只修改目标。 */
export function retargetSkillCastConnection(
  scenario: ScenarioDocument,
  connectionId: string,
  toSkillCastId: string,
  toPort: TimelineConnectionPort,
): ScenarioDocument {
  const index = scenario.connections.findIndex(connection => connection.id === connectionId);
  if (index < 0) return scenario;
  const connection = scenario.connections[index]!;
  if (
    !canCreateSkillCastConnection(
      scenario,
      connection.from.skillCastId,
      toSkillCastId,
      connectionId,
    )
  )
    return scenario;
  if (connection.to.skillCastId === toSkillCastId && connection.to.port === toPort) return scenario;
  const connections = [...scenario.connections];
  connections[index] = {
    ...connection,
    to: { kind: 'skillCast', skillCastId: toSkillCastId, port: toPort },
  };
  return { ...scenario, connections };
}

/** 建立一条技能块到技能块的连接；非法、自连和重复连接不会产生历史记录。 */
export function createSkillCastConnection(
  scenario: ScenarioDocument,
  input: CreateSkillCastConnectionInput,
): ScenarioDocument {
  if (!canCreateSkillCastConnection(scenario, input.fromSkillCastId, input.toSkillCastId)) {
    return scenario;
  }

  const connection: ConnectionDocument = {
    id: input.id,
    consumption: input.consumption ?? false,
    from: {
      kind: 'skillCast',
      skillCastId: input.fromSkillCastId,
      port: input.fromPort,
    },
    to: {
      kind: 'skillCast',
      skillCastId: input.toSkillCastId,
      port: input.toPort,
    },
  };
  return { ...scenario, connections: [...scenario.connections, connection] };
}

/** 删除指定连接；找不到连接时保持文档引用不变。 */
export function removeTimelineConnection(
  scenario: ScenarioDocument,
  connectionId: string,
): ScenarioDocument {
  if (!scenario.connections.some(connection => connection.id === connectionId)) return scenario;
  return {
    ...scenario,
    connections: scenario.connections.filter(connection => connection.id !== connectionId),
  };
}

/** 更新连线端口和实例属性。 */
export function updateTimelineConnection(
  scenario: ScenarioDocument,
  connectionId: string,
  input: UpdateTimelineConnectionInput,
): ScenarioDocument {
  const index = scenario.connections.findIndex(connection => connection.id === connectionId);
  if (index < 0) return scenario;
  const connection = scenario.connections[index]!;
  const from =
    input.fromPort === undefined ? connection.from : { ...connection.from, port: input.fromPort };
  const to = input.toPort === undefined ? connection.to : { ...connection.to, port: input.toPort };
  const consumption = input.consumption ?? connection.consumption;
  if (
    from.port === connection.from.port &&
    to.port === connection.to.port &&
    consumption === connection.consumption
  ) {
    return scenario;
  }
  const connections = [...scenario.connections];
  connections[index] = { ...connection, from, to, consumption };
  return { ...scenario, connections };
}
