import { expect, it } from 'vitest';
import { CombatClock } from '../time/combatClock';
import { CombatSimulation } from './combatSimulation';
import { bindCombatFramePipeline } from './combatFramePipeline';

it.each(['present', 'absent', 'unspawned', 'dead'])(
  '敌人 %s 时按生命周期推进生命，回收结束后才执行技能',
  phase => {
    const events: string[] = [];
    const runtime = (name: string) => ({
      advanceFrame: () => {
        events.push(name);
      },
    });
    const enemy = (ownerId: string) => ({
      ownerId,
      control: {
        advance: () => {
          events.push(`${ownerId}:control`);
        },
      },
      buffs: {
        ...runtime(`${ownerId}:buff`),
        recycleFinishedBuffs: () => {
          events.push(`${ownerId}:recycle`);
        },
      },
      vitals: runtime(`${ownerId}:vitals`),
    });
    const primary = enemy('enemy');
    const simulation = new CombatSimulation(new CombatClock());
    bindCombatFramePipeline(simulation, {
      primaryEnemyId: primary.ownerId,
      timeDilation: null,
      isEnemyAlive: id => id !== 'a' || phase === 'present' || phase === 'absent',
      control: runtime('input'),
      enemyControl: primary.control,
      enemyBuffs: primary.buffs,
      enemyVitals: primary.vitals,
      additionalEnemies: [enemy('a'), enemy('b')],
      resources: runtime('resources'),
      globalBuffs: runtime('global'),
      abilityEntities: runtime('entities'),
      projectiles: { ...runtime('projectiles'), beginAbilityFrame() {}, advanceAbilityFrame() {} },
      comboWindows: runtime('combo'),
      playerMultiDash: runtime('dash'),
      operatorCenters: [],
      abilities: [runtime('skill')],
      bindInputPhases: false,
    });
    simulation.advanceFrame();
    expect(events.filter(event => event.includes(':') || event === 'skill')).toEqual([
      'enemy:control',
      'a:control',
      'b:control',
      'enemy:buff',
      'a:buff',
      'b:buff',
      'enemy:vitals',
      ...(phase === 'present' || phase === 'absent' ? ['a:vitals'] : []),
      'b:vitals',
      'enemy:recycle',
      'a:recycle',
      'b:recycle',
      'skill',
    ]);
  },
);
