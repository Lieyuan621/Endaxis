import { describe, expect, test } from 'vitest'
import source from './HitEditorDialog.vue?raw'

describe('HitEditorDialog structure', () => {
  test('uses Endaxis Element Plus selects instead of native select controls', () => {
    expect(source).not.toContain('<select')
    expect(source).toContain('class="effect-select-dark"')
    expect(source).toContain('popper-class="hit-editor-select-popper"')
  })

  test('filters display type options by effect kind and avoids duplicate default damage element', () => {
    expect(source).toContain('filteredEffectOptions')
    expect(source).toContain('selectableDamageElements')
    expect(source).toContain('damageElementValue')
    expect(source).toContain('defaultElementKey')
    expect(source).toContain('DEFAULT_DAMAGE_ELEMENT_VALUE')
    expect(source).not.toContain('<el-option value="" :label="defaultElementKey')
    expect(source).toContain("fieldLabel('treatAsReaction')")
    expect(source).toContain("fieldLabel('treatAsSkillType')")
  })

  test('does not render a visible drag handle in the effect list', () => {
    expect(source).not.toContain('effect-row__drag')
  })

  test('uses a basic section without showing the hit id', () => {
    expect(source).toContain('<div class="section-title">{{ t(\'hitEditor.basic\') }}</div>')
    expect(source).not.toContain("{{ t('hitEditor.basic') }} / {{ t('hitEditor.damageResource') }}")
    expect(source).not.toContain("patchHit('id'")
  })

  test('separates input and select controls into dedicated rows with four columns', () => {
    expect(source).toContain('field-grid field-grid--input-row')
    expect(source).toContain('field-grid field-grid--select-row')
    expect(source).toContain('grid-template-columns: repeat(4, minmax(0, 1fr))')
    expect(source.indexOf("propertiesPanel.damage.tickSpGain")).toBeLessThan(source.indexOf("hitEditor.durationExtension"))
  })

  test('labels hit overrides as treated-as fields', () => {
    expect(source).toContain("fieldLabel('treatAsReaction')")
    expect(source).toContain("fieldLabel('treatAsSkillType')")
  })

  test('uses global icon danger buttons in the effect list', () => {
    expect(source).toContain('ea-btn ea-btn--icon ea-btn--icon-24 ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger effect-row__delete')
    expect(source).not.toContain('>x</button>')
  })

  test('uses the shared Endaxis checkbox option style for effect toggles', () => {
    expect(source).toContain('check-field ea-check-rect')
    expect(source).toContain('type="checkbox"')
  })

  test('does not show effect icons in the effect list', () => {
    expect(source).not.toContain('effect-icon-wrapper')
    expect(source).not.toContain('effect-mini-icon')
    expect(source).not.toContain('effectIconPath')
  })

  test('uses category and concrete effect labels with an ungrouped none option', () => {
    expect(source).toContain("t('hitEditor.effectKind')")
    expect(source).toContain("t('hitEditor.displayType')")
    expect(source).toContain('<el-option value="default" :label="t(\'common.none\')" />')
  })

  test('exposes stack strategy for state-like enemy effects', () => {
    expect(source).toContain('canEditStackStrategy')
    expect(source).toContain('selectedStackStrategyValue')
    expect(source).toContain('getDefaultStackStrategy')
    expect(source).toContain("t('hitEditor.stackStrategy')")
  })

  test('groups effect detail fields by control type', () => {
    expect(source).toContain('effect-field-groups')
    expect(source).toContain('kind-field-groups')
    expect(source).toContain('field-grid field-grid--effect-select-row')
    expect(source).toContain('field-grid field-grid--effect-input-row')
    expect(source).toContain('field-grid field-grid--effect-text-row')
    expect(source).toContain('field-grid field-grid--effect-check-row')
    expect(source.indexOf("t('hitEditor.effectKind')")).toBeLessThan(source.indexOf("selectedEffect.duration"))
    expect(source.indexOf('selectedEffect.duration')).toBeLessThan(source.indexOf('selectedEffect.icdGroup'))
    expect(source.indexOf('selectedEffect.icdGroup')).toBeLessThan(source.indexOf('selectedEffect.hide'))
  })

  test('matches dialog number input background to select controls', () => {
    expect(source).toContain(':global(.hit-editor-dialog .custom-number-input)')
    expect(source).toContain('background-color: #111')
  })
})
