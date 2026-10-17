import type { PlungingAttackMotionState } from '../state/abilityState';

/** 固定地面 y=0 的纵向移动投影。参数来自 MovementSetting、GameplayMiscSetting 和角色模板。 */
export interface PlungingAttackMotionConfig {
  readonly jumpDelaySeconds: number;
  readonly maxJumpHeight: number;
  readonly gravity: number;
  readonly fallingGravity: number;
  readonly minPlungingAttackHeight: number;
  readonly startDurationSeconds: number;
  readonly downSpeed: number;
}

export function createPlungingAttackMotion(
  config: PlungingAttackMotionConfig,
): PlungingAttackMotionState {
  for (const [key, value] of Object.entries(config)) {
    if (!Number.isFinite(value) || value < 0)
      throw new RangeError(`invalid plunging motion ${key}`);
  }
  if (
    config.gravity <= 0 ||
    config.downSpeed <= 0 ||
    config.minPlungingAttackHeight <= 0 ||
    config.maxJumpHeight < config.minPlungingAttackHeight
  )
    throw new RangeError(
      'plunging attack requires a reachable height and positive movement speeds',
    );
  return {
    stage: 'jump',
    height: 0,
    velocity: Math.fround(
      Math.sqrt(Math.fround(Math.fround(2 * config.maxJumpHeight) * config.gravity)),
    ),
    stageSeconds: 0,
  };
}

/** 无时间膨胀、从地面起跳的预览；与运行时共用积分和阶段转换，返回落地前的帧数。 */
export function estimatePlungingAttackLandingFrames(
  config: PlungingAttackMotionConfig,
  framesPerSecond: number,
): number {
  const state = createPlungingAttackMotion(config);
  const maxFrames = Math.ceil(
    (config.jumpDelaySeconds +
      2 * Math.sqrt((2 * config.maxJumpHeight) / config.gravity) +
      config.startDurationSeconds +
      (2 * config.maxJumpHeight) / config.downSpeed +
      2) *
      framesPerSecond,
  );
  for (let frame = 1; frame <= maxFrames; frame += 1) {
    if (advancePlungingAttackMotion(state, config, 1 / framesPerSecond) === 'landed') return frame;
  }
  throw new RangeError('plunging attack cannot reach landing within its movement bounds');
}

/**
 * 合并输入会保留攻击意图直到达到最低高度，不伪造在地面已可释放下落攻击。
 * 原生 MovePipelinePlunge 的 Start 段速度为零，Fall 段使用固定 downSpeed。
 * 此投影不含水平移动、碰撞胶囊、水面和根运动。
 */
export function advancePlungingAttackMotion(
  state: PlungingAttackMotionState,
  config: PlungingAttackMotionConfig,
  deltaSeconds: number,
): 'start' | 'landed' | undefined {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0)
    throw new RangeError('invalid movement delta');
  if (deltaSeconds === 0 || state.stage === 'landed') return;
  if (state.stage === 'pendingStart') {
    state.stage = 'start';
    state.stageSeconds = 0;
    state.velocity = 0;
    return 'start';
  }
  const dtFrame = Math.fround(deltaSeconds);
  const previousSeconds = state.stageSeconds;
  state.stageSeconds = Math.fround(state.stageSeconds + dtFrame);
  if (state.stage === 'jump') {
    const dt = Math.fround(
      Math.max(0, state.stageSeconds - config.jumpDelaySeconds) -
        Math.max(0, previousSeconds - config.jumpDelaySeconds),
    );
    const oldVelocity = state.velocity;
    state.velocity = Math.fround(oldVelocity - Math.fround(config.gravity * dt));
    // MovePipelineAir.ProcessPosition: (oldVelocityFinal + velocityFinal) * (dt * 0.5)。
    state.height = Math.max(
      0,
      Math.fround(
        state.height +
          Math.fround(Math.fround(oldVelocity + state.velocity) * Math.fround(dt * 0.5)),
      ),
    );
    if (state.height + 0.00001 < config.minPlungingAttackHeight) return;
    state.stage = 'start';
    state.stageSeconds = 0;
    state.velocity = 0;
    return 'start';
  }
  if (state.stage === 'start') {
    if (state.stageSeconds >= Math.fround(config.startDurationSeconds)) {
      state.stage = 'fall';
      state.stageSeconds = 0;
      // PostMove 才切换阶段；本帧仍保持 Start 的零速度。
    }
    return;
  }
  const oldVelocity = state.velocity;
  state.velocity =
    state.stage === 'freeFall'
      ? Math.fround(oldVelocity - Math.fround(config.fallingGravity * dtFrame))
      : Math.fround(-config.downSpeed);
  state.height = Math.max(
    0,
    Math.fround(
      state.height +
        Math.fround(Math.fround(oldVelocity + state.velocity) * Math.fround(dtFrame * 0.5)),
    ),
  );
  if (state.height === 0) {
    state.stage = 'landed';
    state.stageSeconds = 0;
    state.velocity = 0;
    return 'landed';
  }
}
