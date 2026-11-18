/**
 * 新版干员定义的装配入口。应用层从这里取得已审核定义；
 * 新干员只有在结构校验和行为测试完成后才能加入导出列表。
 */
import { endministrator } from './endministrator.generated';
import { perlica } from './perlica.generated';
import { chenQianyu } from './chen-qianyu.generated';
import { wulfgard } from './wulfgard.generated';
import { arclight } from './arclight.generated';
import { ember } from './ember.generated';
import { xaihi } from './xaihi.generated';
import { avywenna } from './avywenna.generated';
import { gilberta } from './gilberta.generated';
import { snowshine } from './snowshine.generated';
import { lifeng } from './lifeng.generated';
import { laevatain } from './laevatain.generated';
import { yvonne } from './yvonne.generated';
import { daPan } from './da-pan.generated';
import { akekuri } from './akekuri.generated';
import { catcher } from './catcher.generated';
import { estella } from './estella.generated';
import { fluorite } from './fluorite.generated';
import { antal } from './antal.generated';
import { alesh } from './alesh.generated';
import { ardelia } from './ardelia.generated';
import { lastRite } from './last-rite.generated';
import { tangtang } from './tangtang.generated';
import { rossi } from './rossi.generated';
import { pogranichnik } from './pogranichnik.generated';
import { zhuangFangyi } from './zhuang-fangyi.generated';
import { mifu } from './mifu.generated';
import { arcane } from './arcane.generated';
import { camille } from './camille.generated';
import { default as typhoeus } from './typhoeus.generated';
import { liino } from './liino.generated';
import { si } from './si.generated';
import { minghe } from './minghe.generated';
import { purrchena } from './purrchena.generated';

export {
  endministrator,
  perlica,
  chenQianyu,
  wulfgard,
  arclight,
  ember,
  xaihi,
  avywenna,
  gilberta,
  snowshine,
  lifeng,
  laevatain,
  yvonne,
  daPan,
  akekuri,
  catcher,
  estella,
  fluorite,
  antal,
  alesh,
  ardelia,
  lastRite,
  tangtang,
  rossi,
  pogranichnik,
  zhuangFangyi,
  mifu,
  arcane,
  camille,
  typhoeus,
  liino,
  si,
  minghe,
  purrchena,
};

/**
 * 正式干员的统一显示顺序。按原生可操作角色 ID 的 chr_ 后数字升序排列；编号缺口正常。
 * 编号见 tools/game-data-compiler/config/operators.json；若 runtimeTemplate.sourceCharacterId
 * 与 charId 不同，以前者为展示排序依据（管理员的 charId=chr_9000 是编译用身份）。
 * 新增正式干员时先查清实际角色 ID，再插入对应位置；不要按加入时间追加。
 * 项目自定义干员不在此目录，由项目仓库接在正式干员之后。
 */
export const operatorDefinitions = [
  endministrator, // chr_0003_endminf（女；男为 chr_0002_endminm，编译用 chr_9000）
  perlica, // chr_0004
  chenQianyu, // chr_0005
  wulfgard, // chr_0006
  arclight, // chr_0007
  ember, // chr_0009
  xaihi, // chr_0011
  avywenna, // chr_0012
  gilberta, // chr_0013
  snowshine, // chr_0014
  lifeng, // chr_0015
  laevatain, // chr_0016
  yvonne, // chr_0017
  daPan, // chr_0018
  akekuri, // chr_0019
  catcher, // chr_0020
  estella, // chr_0021
  fluorite, // chr_0022
  antal, // chr_0023
  alesh, // chr_0024
  ardelia, // chr_0025
  lastRite, // chr_0026
  tangtang, // chr_0027
  rossi, // chr_0028
  pogranichnik, // chr_0029
  zhuangFangyi, // chr_0030
  mifu, // chr_0031
  arcane, // chr_0032
  camille, // chr_0033
  typhoeus, // chr_0034
  liino, // chr_0035
  si, // chr_0036
  minghe, // chr_0037
  purrchena, // chr_0038
] as const;
