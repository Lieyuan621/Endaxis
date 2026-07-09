import { describe, expect, test } from 'vitest'
import source from './TimelineBuffLayer.vue?raw'

describe('TimelineBuffLayer structure', () => {
  test('timeline effect icons and bars expose visible hover feedback', () => {
    expect(source).toContain('.timeline-buff-icon-box:hover')
    expect(source).toContain('.timeline-buff-icon-box:hover .timeline-buff-icon')
    expect(source).toContain('.timeline-buff-duration-bar:hover')
    expect(source).toContain('scale(1.18)')
    expect(source).toContain('z-index: 12')
  })
})
