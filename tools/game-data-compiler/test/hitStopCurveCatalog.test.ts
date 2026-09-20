import { describe, expect, it } from 'vitest';
import {
  parseHitStopCurveCatalogDumpSource,
  renderHitStopCurveCatalogModule,
} from '../src/source/hitStopCurveCatalog';

const dump = `MonoBehaviour Base
\t\tvector _keyData
\t\t\tArray Array
\t\t\tint size = 1
\t\t\t\t[0]
\t\t\t\tstring data = "step"
\t\tHitSopSetting _valueData
\t\t\tArray Array
\t\t\tint size = 1
\t\t\t\t[0]
\t\t\t\tHitSopSetting data
\t\t\t\t\tAnimationCurve timeScaleCurve
\t\t\t\t\t\tvector m_Curve
\t\t\t\t\t\t\tArray Array
\t\t\t\t\t\t\tint size = 1
\t\t\t\t\t\t\t\t[0]
\t\t\t\t\t\t\t\tKeyframe data
\t\t\t\t\t\t\t\t\tfloat time = 0
\t\t\t\t\t\t\t\t\tfloat value = 1
\t\t\t\t\t\t\t\t\tfloat inSlope = ∞
\t\t\t\t\t\t\t\t\tfloat outSlope = -∞
\t\t\t\t\t\t\t\t\tint weightedMode = 0
\t\t\t\t\t\t\t\t\tfloat inWeight = 0
\t\t\t\t\t\t\t\t\tfloat outWeight = 0
`;

describe('HitStopConfig curve catalog', () => {
  it('pairs dictionary identities with strict Unity keyframes and preserves stepped tangents', () => {
    const source = parseHitStopCurveCatalogDumpSource(dump, 'HitStopConfig.fixture');
    expect(source.curves.step).toEqual([
      expect.objectContaining({
        time: 0,
        value: 1,
        inTangent: Number.POSITIVE_INFINITY,
        outTangent: Number.NEGATIVE_INFINITY,
      }),
    ]);
    const rendered = renderHitStopCurveCatalogModule(source);
    expect(rendered).toContain('Number.POSITIVE_INFINITY');
    expect(rendered).toContain('Number.NEGATIVE_INFINITY');
    expect(rendered).not.toContain('null');
  });

  it('rejects dictionary count mismatches', () => {
    expect(() =>
      parseHitStopCurveCatalogDumpSource(
        dump.replace(
          '\t\tHitSopSetting _valueData\n\t\t\tArray Array\n\t\t\tint size = 1',
          '\t\tHitSopSetting _valueData\n\t\t\tArray Array\n\t\t\tint size = 2',
        ),
        'bad',
      ),
    ).toThrow('key/value count mismatch');
  });
});
