import type { ActorSnapshot } from '@/simulation/state/types.ts';
import type { EnemyState } from '../state/EnemyState';
import type { GameState } from '../state/GameState';

export interface StaggerContext {
  source: ActorSnapshot;
  target: EnemyState;
  baseValue: number;
  tags: string[];
  state: GameState;
}

export interface CalculationResult {
  baseValue: number;
  finalValue: number;
  breakdown: BreakdownEntry[];
}

export interface BreakdownEntry {
  // name
  source: string;
  type: 'BASE' | 'FLAT' | 'MULTIPLIER';
  value: number;
  contribution: number;
}
