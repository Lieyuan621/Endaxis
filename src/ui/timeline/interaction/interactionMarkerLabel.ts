import type { InteractionMarker } from '../../../core/project/scenarioMarkers';

export function interactionMarkerLabel(event: InteractionMarker) {
  return event.kind === 'comboCooldownControl' ? event.mode : event.kind;
}
