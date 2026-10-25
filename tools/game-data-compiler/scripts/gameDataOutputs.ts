import { OPERATOR_DEFINITION_OUTPUTS } from './operatorDefinitionOutputs.ts';

export const GAME_LOCALE_FILES = ['zh', 'en'].flatMap(locale =>
  [
    'operators',
    'terms',
    'weapons',
    'gearsets',
    'gearpieces',
    'enemies',
    'stages',
    'contingency-contracts',
    'consumables',
  ].map(name => `${locale}/${name}.json`),
);
export const GAME_LOCALE_REBUILD_OUTPUTS = GAME_LOCALE_FILES.map(
  file => `src/i18n/game-locales/${file}`,
);
export const GAME_DATA_PUBLISH_DIRECTORY_OUTPUTS = [
  'src/data/buffs/generated',
  'src/data/equipment/generated',
  'src/data/equipment/generated-weapons',
  'src/data/equipment/generated-gear-sets',
  'src/data/enemies/generated',
  'src/data/contingencyContract/generated',
  'src/data/consumables/generated',
  // These roots contain referenced game-derived WebP files plus the four explicitly audited
  // project defaults. Replacing the roots removes stale, no-longer-referenced game icons.
  'public/equipment',
  'public/consumables',
  'public/contingency_contract',
  'public/enemies',
  'public/icons',
  'public/operators',
  'public/weapons',
] as const;

export const GAME_DATA_PUBLISH_FILE_OUTPUTS = [
  'src/imageCatalog.generated.ts',
  ...OPERATOR_DEFINITION_OUTPUTS,
  'src/data/combat/gameplayTagCatalog.generated.ts',
  'src/data/combat/gameplayTagPredefine.generated.ts',
  'src/data/combat/hitStopCurveCatalog.generated.ts',
  'src/data/combat/timeDilationCatalog.generated.ts',
  'src/data/combat/battleCommandMappingCatalog.generated.ts',
  'src/data/combat/movementSettingCatalog.generated.ts',
  'src/data/combat/skillSettings.generated.ts',
  ...GAME_LOCALE_REBUILD_OUTPUTS,
] as const;
