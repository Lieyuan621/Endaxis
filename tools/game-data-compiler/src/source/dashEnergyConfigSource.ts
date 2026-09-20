import { requireRecord } from './primitives.ts';

export interface DashEnergyConfigSource {
  readonly maximumEnergyLimit: number;
  readonly costPerDash: number;
  readonly maximumCapacity: number;
}

/** 读取全局允许的最大能量与单次消耗；这不是账号当前的服务端能量上限。 */
export function parseDashEnergyConfigSource(
  value: unknown,
  sourcePath: string,
): DashEnergyConfigSource {
  const record = requireRecord(value, sourcePath);
  const maximumEnergyLimit = requirePositiveNumber(
    record.maxDashEnergyLimit,
    `${sourcePath}.maxDashEnergyLimit`,
  );
  const costPerDash = requirePositiveNumber(
    record.dashCostEnergyValue,
    `${sourcePath}.dashCostEnergyValue`,
  );
  return { maximumEnergyLimit, costPerDash, maximumCapacity: maximumEnergyLimit / costPerDash };
}

export function renderDashEnergyConfigModule(source: DashEnergyConfigSource): string {
  return `/** 由当前版本 TableCfg/GlobalConst.json 生成；不要手工编辑。 */\nexport const DASH_ENERGY_CONFIG = ${JSON.stringify(source, null, 2)} as const;\n`;
}

function requirePositiveNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${path} must be a positive finite number`);
  }
  return value;
}
