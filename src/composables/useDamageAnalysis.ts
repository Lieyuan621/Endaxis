import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTimelineStore } from '@/stores/timelineStore';
import { ELEMENT_COLORS } from '@/utils/theme';
import { getGameElementName } from '@/data/gameText';

interface ContributionEntry {
  name: string;
  damage: number;
  buff: number;
  total: number;
  color: string;
}

const ANALYSIS_ELEMENT_COLORS: Record<string, string> = {
  ...ELEMENT_COLORS,
  physical: '#c9c9c9',
};

export function useDamageAnalysis() {
  const store = useTimelineStore();
  const { locale } = useI18n();

  const analysis = computed(() => {
    const timeline = store.compiledTimeline;
    const tracksInfo = store.teamTracksInfo;

    const operatorDamage = new Map<number, number>();
    const elementDamage = new Map<string, number>();
    const lmdiDamage = new Map<number, number>();
    const lmdiBuff = new Map<number, number>();
    const trackIdToIndex = new Map<string, number>();

    let totalDamage = 0;
    let maxTime = 0;
    const startlineTime = Number(store.prepDuration) || 0;

    if (timeline) {
      const actionElementMap = new Map<string, string>();
      for (const action of timeline.actions || []) {
        if (!trackIdToIndex.has(action.trackId)) {
          trackIdToIndex.set(action.trackId, action.trackIndex);
        }
        actionElementMap.set(action.id, action.node?.element || 'physical');
      }

      for (const entry of store.simLog || []) {
        if (entry.type !== 'DAMAGE_HIT') continue;

        const { sourceId, hitData, actionId } = entry.payload || {};
        const dmg =
          Number(store.getHitDisplayDamage?.(hitData) ?? hitData?._expectedDamage ?? 0) || 0;
        if (dmg <= 0) continue;
        if (Number(entry.time) < startlineTime) continue;

        const trackIdx = trackIdToIndex.get(sourceId);
        if (trackIdx == null) continue;

        const lmdiScale = hitData?._expectedDamage ? dmg / hitData._expectedDamage : 1;

        totalDamage += dmg;
        maxTime = Math.max(maxTime, Number(entry.time) || 0);
        operatorDamage.set(trackIdx, (operatorDamage.get(trackIdx) ?? 0) + dmg);

        const element =
          hitData?._reactionMeta?.element ??
          hitData?.element ??
          actionElementMap.get(actionId) ??
          'physical';
        elementDamage.set(element, (elementDamage.get(element) ?? 0) + dmg);

        const selfDmg = hitData?._lmdiSelf != null ? Number(hitData._lmdiSelf) * lmdiScale : dmg;
        lmdiDamage.set(trackIdx, (lmdiDamage.get(trackIdx) ?? 0) + selfDmg);

        if (hitData?._lmdiExternal && typeof hitData._lmdiExternal === 'object') {
          for (const [sourceTrackId, value] of Object.entries(hitData._lmdiExternal)) {
            const srcIdx = trackIdToIndex.get(sourceTrackId);
            if (srcIdx != null) {
              lmdiBuff.set(srcIdx, (lmdiBuff.get(srcIdx) ?? 0) + Number(value) * lmdiScale);
            }
          }
        }
      }
    }

    const operatorChartData = Array.from(operatorDamage.entries()).map(([trackIdx, damage]) => {
      const info = tracksInfo[trackIdx] as any;
      const name = info?.name ?? `Operator ${trackIdx + 1}`;
      return {
        name,
        value: Math.round(damage),
        itemStyle: { color: info?.element ? ANALYSIS_ELEMENT_COLORS[info.element] : '#888' },
      };
    });
    operatorChartData.sort((a, b) => b.value - a.value);

    const elementChartData = Array.from(elementDamage.entries()).map(([element, damage]) => ({
      name: getGameElementName(element, locale.value),
      value: Math.round(damage),
      itemStyle: { color: ANALYSIS_ELEMENT_COLORS[element] ?? '#888' },
    }));
    elementChartData.sort((a, b) => b.value - a.value);

    const allTrackIndices = new Set([...lmdiDamage.keys(), ...lmdiBuff.keys()]);
    const contributionData: ContributionEntry[] = Array.from(allTrackIndices).map(trackIdx => {
      const info = tracksInfo[trackIdx] as any;
      const name = info?.name ?? `Operator ${trackIdx + 1}`;
      const damage = Math.round(lmdiDamage.get(trackIdx) ?? 0);
      const buff = Math.round(lmdiBuff.get(trackIdx) ?? 0);
      return {
        name,
        damage,
        buff,
        total: damage + buff,
        color: info?.element ? (ANALYSIS_ELEMENT_COLORS[info.element] ?? '#888') : '#888',
      };
    });
    contributionData.sort((a, b) => b.total - a.total);

    const rotationTime = maxTime > 0 ? Math.max(0, maxTime - startlineTime) : 0;
    const dps = rotationTime > 0 ? totalDamage / rotationTime : 0;

    return {
      operatorChartData,
      elementChartData,
      contributionData,
      totalDamage: Math.round(totalDamage),
      rotationTime,
      dps: Math.round(dps),
      hasData: totalDamage > 0,
    };
  });

  return { analysis };
}
