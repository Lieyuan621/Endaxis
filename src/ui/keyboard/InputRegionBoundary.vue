<script setup lang="ts">
import { useKeyboardInputRegion, useKeyboardShortcutScope } from './keyboardShortcutRouter';
import { provideInteractionSession } from '../interaction/interactionSessionContext';

const props = defineProps<{ label: string; active: boolean; modal?: boolean }>();
const region = useKeyboardInputRegion({
  label: props.label,
  modal: props.modal,
  active: () => props.active,
});
// A modal owns a separate gesture session. Its parent remains blocked while
// descendant editors and pickers coordinate inside this active region.
if (props.modal) provideInteractionSession(region);
// Child editors handle commands first. Unhandled keys remain available to native controls.
useKeyboardShortcutScope({
  id: 'input-region-boundary',
  region,
  priority: -1,
  active: () => props.active,
  blockLowerScopes: true,
  handle: () => false,
});
</script>

<template>
  <slot />
</template>
