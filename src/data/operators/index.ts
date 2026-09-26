/**
 * 新版干员定义的装配入口。应用层从这里取得已审核定义；
 * 新干员只有在结构校验和行为测试完成后才能加入导出列表。
 */
import { perlica } from './perlica.generated';
import { arcane } from './arcane.generated';
import { zhuangFangyi } from './zhuang-fangyi.generated';
import { arclight } from './arclight.generated';
import { gilberta } from './gilberta.generated';
import { lifeng } from './lifeng.generated';
import { estella } from './estella.generated';
import { daPan } from './da-pan.generated';
import { akekuri } from './akekuri.generated';
import { fluorite } from './fluorite.generated';
import { endministrator } from './endministrator.generated';
import { lastRite } from './last-rite.generated';
import { chenQianyu } from './chen-qianyu.generated';
import { rossi } from './rossi.generated';
import { camille } from './camille.generated';
import { pogranichnik } from './pogranichnik.generated';
import { tangtang } from './tangtang.generated';
import { laevatain } from './laevatain.generated';
import { mifu } from './mifu.generated';
import { yvonne } from './yvonne.generated';
import { ember } from './ember.generated';
import { snowshine } from './snowshine.generated';
import { wulfgard } from './wulfgard.generated';
import { antal } from './antal.generated';
import { alesh } from './alesh.generated';
import { xaihi } from './xaihi.generated';
import { avywenna } from './avywenna.generated';
import { catcher } from './catcher.generated';
import { ardelia } from './ardelia.generated';
import { liino } from './liino.generated';
import { default as typhoeus } from './typhoeus.generated';
import { purrchena } from './purrchena.generated';

export {
  perlica,
  arcane,
  zhuangFangyi,
  arclight,
  gilberta,
  lifeng,
  estella,
  daPan,
  akekuri,
  fluorite,
  endministrator,
  lastRite,
  chenQianyu,
  rossi,
  camille,
  pogranichnik,
  tangtang,
  laevatain,
  mifu,
  yvonne,
  ember,
  snowshine,
  wulfgard,
  antal,
  alesh,
  xaihi,
  avywenna,
  catcher,
  ardelia,
  liino,
  typhoeus,
  purrchena,
};

/** 正式干员目录及显示顺序；完整加载与按需加载共用同一注册入口。 */
export const operatorDefinitions = [
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
  purrchena,
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
] as const;
