<script setup lang="ts">
function activate(element: Element): void {
  const menu = element as HTMLElement;
  menu.inert = false;
  menu.removeAttribute('aria-hidden');
}

function deactivate(element: Element): void {
  const menu = element as HTMLElement;
  if (document.activeElement instanceof HTMLElement && menu.contains(document.activeElement)) {
    document.activeElement.blur();
  }
  menu.inert = true;
  menu.setAttribute('aria-hidden', 'true');
}
</script>

<template>
  <Teleport to="body">
    <Transition
      name="timeline-context-menu-motion"
      @before-enter="activate"
      @before-leave="deactivate"
      @leave-cancelled="activate"
    >
      <slot />
    </Transition>
  </Teleport>
</template>
