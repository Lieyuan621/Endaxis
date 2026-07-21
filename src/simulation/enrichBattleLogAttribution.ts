/**
 * Fill missing sourceId / actionId on battle-log entries using recent apply history.
 * Cuts down “unassigned” rows for consume / natural expire events that omit a source.
 */

type LogEntry = {
  type: string;
  time: number;
  channel?: string;
  payload: Record<string, unknown>;
};

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function enrichBattleLogAttribution<T extends LogEntry>(entries: T[]): T[] {
  const lastInflictionSource = new Map<string, string>();
  const lastDebuffSource = new Map<string, string>();
  const lastStatusSource = new Map<string, string>();
  const lastOperatorApply = new Map<string, { sourceId?: string; actionId?: string }>();
  let lastVulnerabilitySource = '';
  let lastEnemySource = '';

  return entries.map(entry => {
    const payload = { ...entry.payload };
    let changed = false;

    if (entry.channel === 'operator' || entry.type.startsWith('OPERATOR_EFFECT_')) {
      const id = String(payload.id || '');
      const target = String(payload.targetTrackId || '');
      const key = `${target}:${id}`;

      if (entry.type === 'OPERATOR_EFFECT_APPLY' && id) {
        lastOperatorApply.set(key, {
          sourceId: hasText(payload.sourceId) ? String(payload.sourceId) : undefined,
          actionId: hasText(payload.actionId) ? String(payload.actionId) : undefined,
        });
      }

      if (entry.type === 'OPERATOR_EFFECT_EXPIRE' && id) {
        const prev = lastOperatorApply.get(key);
        if (prev) {
          if (!hasText(payload.sourceId) && prev.sourceId) {
            payload.sourceId = prev.sourceId;
            changed = true;
          }
          if (!hasText(payload.actionId) && prev.actionId) {
            payload.actionId = prev.actionId;
            changed = true;
          }
        }
        if (!hasText(payload.sourceId) && target) {
          // Fall back to the buffed operator track so time-heuristic ownership still works.
          payload.sourceId = target;
          changed = true;
        }
      }

      return changed ? ({ ...entry, payload } as T) : entry;
    }

    if (entry.channel !== 'enemy' && !entry.type.match(/^(INFLICTION_|ENEMY_|DEBUFF_|VULNERABILITY_|ARTS_|REACTION_|PHYSICAL_|CORROSION_)/)) {
      return entry;
    }

    let sourceId = hasText(payload.sourceId) ? String(payload.sourceId) : '';

    if (!sourceId) {
      if (entry.type === 'INFLICTION_CONSUMED' && payload.element) {
        sourceId =
          lastInflictionSource.get(String(payload.element)) || lastEnemySource;
      } else if (entry.type === 'ENEMY_EFFECT_EXPIRE') {
        const kind = String(payload.kind || '');
        if (kind === 'infliction' && payload.element) {
          sourceId =
            lastInflictionSource.get(String(payload.element)) || lastEnemySource;
        } else if (kind === 'debuff' && payload.debuffType) {
          sourceId = lastDebuffSource.get(String(payload.debuffType)) || lastEnemySource;
        } else if (kind === 'status' && payload.id) {
          sourceId = lastStatusSource.get(String(payload.id)) || lastEnemySource;
        } else if (kind === 'vulnerability') {
          sourceId = lastVulnerabilitySource || lastEnemySource;
        } else {
          sourceId = lastEnemySource;
        }
      } else if (entry.type === 'CORROSION_SPAN') {
        sourceId = lastDebuffSource.get('corrosion') || lastEnemySource;
      }

      if (sourceId) {
        payload.sourceId = sourceId;
        changed = true;
      }
    }

    if (sourceId) {
      lastEnemySource = sourceId;
      if (entry.type === 'INFLICTION_APPLY' && payload.element) {
        lastInflictionSource.set(String(payload.element), sourceId);
      }
      if (entry.type === 'DEBUFF_APPLY' && payload.debuffType) {
        lastDebuffSource.set(String(payload.debuffType), sourceId);
      }
      if (entry.type === 'ENEMY_STATUS_APPLY' && payload.id) {
        lastStatusSource.set(String(payload.id), sourceId);
      }
      if (
        entry.type === 'VULNERABILITY_APPLY' ||
        entry.type === 'VULNERABILITY_CHANGE' ||
        entry.type === 'PHYSICAL_STATUS'
      ) {
        lastVulnerabilitySource = sourceId;
      }
      if (entry.type === 'REACTION_TRIGGER' && payload.reactionType === 'corrosion') {
        lastDebuffSource.set('corrosion', sourceId);
      }
    }

    return changed ? ({ ...entry, payload } as T) : entry;
  });
}
