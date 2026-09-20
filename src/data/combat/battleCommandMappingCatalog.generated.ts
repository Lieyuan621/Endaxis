/** 由当前版本 BattleCommandMappingConfig TypeTree dump 生成；不要手工编辑。
 * Source SHA-256: 2b0eb8ce2db404cc4b5c4a0b160b6e3e982b318d60fb9cb05109954120583bd6
 */
export const BATTLE_COMMAND_MAPPING_CONFIG = {
  defaultCacheTimes: [0.15, 0.2, 0.1, 0.1, 0.1, 0.1],
  dashOffsetCacheTime: 1,
  skillOffsetCacheTime: 1,
  jumpOffsetCacheTime: 1,
  attackCacheTimeInDash: 0.4,
  blockAttackTimeInDash: 0.1,
  allowAttackTimeAfterDash: 0.35,
  attackCacheTimeInPerfectDodge: 0.3,
  blockAttackTimeInPerfectDodge: 0.1,
  allowAttackTimeAfterPerfectDodge: 0.25,
  allowDashInPerfectDodge: 0.5,
} as const;
