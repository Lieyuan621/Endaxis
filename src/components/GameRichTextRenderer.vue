<script setup>
import { computed, defineComponent, h } from 'vue';
import { ElTooltip } from 'element-plus';
import {
  getRichTextStyle,
  getRichTextTerm,
  parseGameRichText,
  resolveRichTextImage,
} from '@/data/gameRichText';

const props = defineProps({
  text: { type: String, default: '' },
  locale: { type: String, default: null },
  termTooltips: { type: Boolean, default: true },
});

const nodes = computed(() => parseGameRichText(props.text || ''));

const RichTextNodes = defineComponent({
  name: 'RichTextNodes',
  props: {
    nodes: { type: Array, required: true },
    locale: { type: String, default: null },
    depth: { type: Number, default: 0 },
    termTooltips: { type: Boolean, default: true },
  },
  setup(innerProps) {
    return () =>
      innerProps.nodes.flatMap((node, index) =>
        renderRichTextNode(
          node,
          `${innerProps.depth}-${index}`,
          innerProps.locale,
          innerProps.depth,
          innerProps.termTooltips,
        ),
      );
  },
});

function renderRichTextNode(node, key, locale, depth, termTooltips) {
  if (node.type === 'text') return [node.text];
  if (node.type === 'image') return renderImageNode(node, key);
  if (node.type === 'style') return [renderStyledChildren(node.id, node.children, key, locale, depth, termTooltips)];
  return [renderTermNode(node, key, locale, depth, termTooltips)];
}

function renderImageNode(node, key) {
  const src = resolveRichTextImage(node.path);
  if (!src) return [];
  return [
    h('img', {
      key,
      class: 'game-rich-text-icon game-rich-text-inline-image',
      src,
      alt: '',
    }),
  ];
}

function renderStyledChildren(styleId, children, key, locale, depth, termTooltips) {
  const style = getRichTextStyle(styleId);
  const content = h(RichTextNodes, { nodes: children, locale, depth, termTooltips });
  return wrapWithStyle(content, style, key, false);
}

function renderTermNode(node, key, locale, depth, termTooltips) {
  const term = getRichTextTerm(node.id, locale);
  const style = getRichTextStyle(term?.styleId || '');
  const isExplainable = Boolean(term?.description && termTooltips && depth < 2);
  const content = wrapWithStyle(
    h(RichTextNodes, { nodes: node.children, locale, depth, termTooltips }),
    style,
    `${key}-term`,
    {
      icon: isExplainable ? term?.icon || style.icon : null,
      underline: isExplainable,
    },
  );

  if (!term || !isExplainable) return content;

  return h(
    ElTooltip,
    {
      key,
      placement: 'top',
      effect: 'dark',
      showAfter: 120,
      enterable: true,
      teleported: false,
      popperClass: 'game-rich-text-term-popper',
    },
    {
      default: () => content,
      content: () => renderTermTooltip(term, locale, depth + 1),
    },
  );
}

function wrapWithStyle(content, style, key, termOptions) {
  const textStyle = {
    ...(style.color ? { color: style.color } : {}),
    ...(termOptions && termOptions.underline
      ? {
          cursor: 'help',
          textDecoration: 'underline',
          textDecorationThickness: '1px',
          textUnderlineOffset: '2px',
        }
      : {}),
  };
  const text = h(
    'span',
    {
      class: termOptions && termOptions.underline ? 'game-rich-text-term' : null,
      style: textStyle,
    },
    [content],
  );

  const icon = termOptions ? termOptions.icon : style.icon;
  if (!icon) return h('span', { key }, [text]);

  return h('span', { key, class: 'game-rich-text-icon-text' }, [
    h('img', {
      class: 'game-rich-text-icon',
      src: icon,
      alt: '',
    }),
    text,
  ]);
}

function renderTermTooltip(term, locale, depth) {
  return h('div', { class: 'game-rich-text-tooltip' }, [
    h('div', { class: 'game-rich-text-tooltip-title' }, [
      term.icon
        ? h('img', { class: 'game-rich-text-tooltip-icon', src: term.icon, alt: '' })
        : null,
      h('span', term.name),
    ]),
    h('div', { class: 'game-rich-text-tooltip-desc' }, [
      h(RichTextNodes, {
        nodes: parseGameRichText(term.description),
        locale,
        depth,
        termTooltips: true,
      }),
    ]),
  ]);
}
</script>

<template>
  <span class="game-rich-text">
    <RichTextNodes :nodes="nodes" :locale="locale" :term-tooltips="termTooltips" />
  </span>
</template>

<style scoped>
.game-rich-text {
  white-space: pre-wrap;
}

:global(.game-rich-text-icon-text) {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  vertical-align: middle;
}

:global(.game-rich-text-icon) {
  display: inline-block;
  width: auto;
  max-width: 1.75em;
  height: 1.16em;
  object-fit: contain;
  vertical-align: -0.18em;
}

:global(.game-rich-text-inline-image) {
  max-width: 1.75em;
}

:global(.game-rich-text-term) {
  cursor: help;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}

:global(.game-rich-text-term-popper) {
  max-width: 340px;
  pointer-events: auto;
}

:global(.game-rich-text-term-popper.el-popper.is-dark) {
  padding: 0 !important;
  background: #202126;
  color: #f1f1f1;
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.45);
}

:global(.game-rich-text-term-popper.el-popper.is-dark .el-popper__arrow::before) {
  background: #202126;
  border-color: rgba(255, 255, 255, 0.16);
}

:global(.game-rich-text-tooltip) {
  box-sizing: border-box;
  min-width: 200px;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px 10px;
  color: #f1f1f1;
}

:global(.game-rich-text-tooltip-title) {
  display: flex;
  align-items: center;
  gap: 5px;
  padding-bottom: 5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 13px;
  font-weight: 800;
  line-height: 1.25;
}

:global(.game-rich-text-tooltip-icon) {
  width: 1.5em;
  height: 1.5em;
  object-fit: contain;
}

:global(.game-rich-text-tooltip-desc) {
  color: rgba(255, 255, 255, 0.82);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.45;
  white-space: pre-wrap;
}
</style>
