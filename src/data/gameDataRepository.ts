/**
 * 将新版已经审核的数据定义装配成核心可读取的只读定义。
 * 数据仓库只按稳定身份查找，不读取旧版 store，也不为尚未迁移的数据伪造默认定义。
 */
import { createGameDataRepository } from './createGameDataRepository';
import { generatedSkillSettings } from './combat/skillSettings.generated';
import {
  alesh,
  antal,
  akekuri,
  ardelia,
  avywenna,
  catcher,
  arcane,
  arclight,
  camille,
  chenQianyu,
  daPan,
  ember,
  endministrator,
  estella,
  fluorite,
  gilberta,
  lastRite,
  laevatain,
  lifeng,
  liino,
  mifu,
  perlica,
  pogranichnik,
  rossi,
  snowshine,
  tangtang,
  typhoeus,
  wulfgard,
  xaihi,
  yvonne,
  zhuangFangyi,
} from './operators';
import { gearDefinitions, gearSetDefinitions, weaponDefinitions } from './equipment';
import { generatedEnemyDefinitions } from './enemies/generated/index.generated';
import { commonBuffDefinitions } from './buffs/commonDefinitions';
import { contingencyContractBuffDefinitions } from './mechanics/generated/contingencyContractDefinitions.generated';
import { contingencyContractMechanicDefinitions } from './mechanics/contingencyContractAdapter';
import { consumableBuffDefinitions, consumableDefinitions } from './consumables';

export { createGameDataRepository } from './createGameDataRepository';
export type { GameDataRepositoryInput } from './createGameDataRepository';

/** 当前正式默认数据仓库；所有可用定义必须在这里显式注册。 */
export const gameDataRepository = createGameDataRepository({
  revision: generatedSkillSettings.revision,
  commonBuffDefinitions: {
    ...commonBuffDefinitions,
    ...contingencyContractBuffDefinitions,
    ...consumableBuffDefinitions,
  },
  operators: [
    perlica,
    arcane,
    zhuangFangyi,
    arclight,
    gilberta,
    lifeng,
    estella,
    daPan,
    ember,
    akekuri,
    fluorite,
    endministrator,
    lastRite,
    chenQianyu,
    rossi,
    camille,
    pogranichnik,
    tangtang,
    typhoeus,
    laevatain,
    liino,
    mifu,
    yvonne,
    snowshine,
    wulfgard,
    antal,
    alesh,
    xaihi,
    avywenna,
    catcher,
    ardelia,
  ],
  weapons: weaponDefinitions,
  gears: gearDefinitions,
  gearSets: gearSetDefinitions,
  enemies: generatedEnemyDefinitions,
  mechanics: contingencyContractMechanicDefinitions,
  consumables: consumableDefinitions,
});
