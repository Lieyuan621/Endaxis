import { describe, expect, test } from 'vitest'
import source from './ActionItem.vue?raw'

describe('ActionItem display labels', () => {
  test('uses the final basic attack segment name instead of the group name', () => {
    expect(source).toContain('const finalSegmentName = name.trim() || props.action.attackGroupName')
    expect(source).toContain('return `${finalSegmentName}${suffix}`')
    expect(source).not.toContain('return `${groupName}${suffix}`')
  })
})
