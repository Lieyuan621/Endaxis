import { createHash } from 'node:crypto';

export interface MovementSettingCatalogSource {
  readonly dashInputCooldownSeconds: number;
  readonly dashSecondDashIntervalSeconds: number;
  readonly sha256: string;
}

/** 严格读取 Unity TypeTree 对 MovementSetting_Default 的连续 Dash 参数。 */
export function parseMovementSettingCatalogDumpSource(
  text: string,
  sourcePath: string,
): MovementSettingCatalogSource {
  const scalar = (name: string) => {
    const raw = new RegExp(`^\\tfloat ${name} = ([^\\r\\n]+)\\r?$`, 'm').exec(text)?.[1];
    if (raw === undefined) throw new Error(`${sourcePath}: missing ${name}`);
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) throw new Error(`${sourcePath}: invalid ${name}`);
    return value;
  };
  const dashInputCooldownSeconds = scalar('_dashInputCd');
  const dashSecondDashIntervalSeconds = scalar('_dashSecondDashInterval');
  if (dashSecondDashIntervalSeconds > dashInputCooldownSeconds) {
    throw new Error(`${sourcePath}: second Dash interval exceeds the outer input window`);
  }
  return {
    dashInputCooldownSeconds,
    dashSecondDashIntervalSeconds,
    sha256: createHash('sha256').update(text).digest('hex'),
  };
}

export function renderMovementSettingCatalogModule(source: MovementSettingCatalogSource): string {
  const { sha256, ...config } = source;
  return `/** 由当前版本 MovementSetting_Default TypeTree dump 生成；不要手工编辑。\n * Source SHA-256: ${sha256}\n */\nexport const MOVEMENT_SETTING_DEFAULT = ${JSON.stringify(config, null, 2)} as const;\n`;
}
