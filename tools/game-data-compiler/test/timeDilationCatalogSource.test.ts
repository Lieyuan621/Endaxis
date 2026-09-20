import { describe, expect, it } from 'vitest';
import { gameplayTagIdFromPath } from '../src/source/nativeGameplayTags.ts';
import {
  parseTimeDilationCatalogDumpSource,
  renderTimeDilationCatalogModule,
} from '../src/source/timeDilationCatalogSource.ts';

const priorityPath = 'TimeDilation/Priority/Skill';
const globalSlotPath = 'TimeDilation/Layer/Global/UltiSkill';
const entitySlotPath = 'TimeDilation/Layer/Entity/Frozen';
const tagId = (path: string) => gameplayTagIdFromPath(path) as number;

const dump = `MonoBehaviour Base
\tSerializeFieldDictionary\`2 priorityMap
\t\tvector _keyData
\t\t\tArray Array
\t\t\tint size = 1
\t\t\t\t[0]
\t\t\t\tGameplayTag data
\t\t\t\t\tint tagId = ${tagId(priorityPath)}
\t\tvector _valueData
\t\t\tArray Array
\t\t\tint size = 1
\t\t\t\t[0]
\t\t\t\tint data = 17
\tSerializeFieldDictionary\`2 curveMap
\t\tvector _keyData
\t\t\tArray Array
\t\t\tint size = 1
\t\t\t\t[0]
\t\t\t\tstring data = "freeze"
\t\tvector _valueData
\t\t\tArray Array
\t\t\tint size = 1
\t\t\t\t[0]
\t\t\t\tAnimationCurve data
\t\t\t\t\tvector m_Curve
\t\t\t\t\t\tArray Array
\t\t\t\t\t\tint size = 1
\t\t\t\t\t\t\t[0]
\t\t\t\t\t\t\tKeyframe data
\t\t\t\t\t\t\t\tfloat time = 0
\t\t\t\t\t\t\t\tfloat value = 1
\t\t\t\t\t\t\t\tfloat inSlope = ∞
\t\t\t\t\t\t\t\tfloat outSlope = -∞
\t\t\t\t\t\t\t\tint weightedMode = 0
\t\t\t\t\t\t\t\tfloat inWeight = 0
\t\t\t\t\t\t\t\tfloat outWeight = 0
\tSlotSpecialConfig slotSpecialConfig
\t\tArray Array
\t\tint size = 1
\t\t\t[0]
\t\t\tSlotSpecialConfig data
\t\t\t\tGameplayTag globalSlot
\t\t\t\t\tint tagId = ${tagId(globalSlotPath)}
\t\t\t\tGameplayTag entitySlot
\t\t\t\t\tint tagId = ${tagId(entitySlotPath)}
\t\t\t\tUInt8 isInfluenceDuration = 1
`;

describe('TimeDilationConfig catalog source', () => {
  it('strictly pairs native dictionaries and resolves all tag identities through the same catalog', () => {
    const source = parseTimeDilationCatalogDumpSource(dump, 'TimeDilation.fixture');
    expect(source).toMatchObject({
      priorities: [{ tagId: tagId(priorityPath), value: 17 }],
      curves: {
        freeze: [
          {
            time: 0,
            value: 1,
            inTangent: Number.POSITIVE_INFINITY,
            outTangent: Number.NEGATIVE_INFINITY,
          },
        ],
      },
      slotSpecialConfigs: [
        {
          globalSlotId: tagId(globalSlotPath),
          entitySlotId: tagId(entitySlotPath),
          influencesDuration: true,
        },
      ],
    });
    const rendered = renderTimeDilationCatalogModule(source, [
      priorityPath,
      globalSlotPath,
      entitySlotPath,
    ]);
    expect(rendered).toContain(`"tagPath": "${priorityPath}"`);
    expect(rendered).toContain(`"globalSlot": "${globalSlotPath}"`);
    expect(rendered).toContain('Number.POSITIVE_INFINITY');
    expect(rendered).toContain('Number.NEGATIVE_INFINITY');
    expect(rendered).not.toContain('null');
  });

  it('rejects count mismatches, duplicate identities and unknown tag ids', () => {
    expect(() =>
      parseTimeDilationCatalogDumpSource(
        dump.replace(
          '\t\t\tint size = 1\n\t\t\t\t[0]\n\t\t\t\tint data = 17',
          '\t\t\tint size = 2\n\t\t\t\t[0]\n\t\t\t\tint data = 17',
        ),
        'count-mismatch',
      ),
    ).toThrow('priority key/value count mismatch');
    const duplicateDump = dump
      .replace(
        `\t\t\tint size = 1\n\t\t\t\t[0]\n\t\t\t\tGameplayTag data\n\t\t\t\t\tint tagId = ${tagId(priorityPath)}`,
        `\t\t\tint size = 2\n\t\t\t\t[0]\n\t\t\t\tGameplayTag data\n\t\t\t\t\tint tagId = ${tagId(priorityPath)}\n\t\t\t\t[1]\n\t\t\t\tGameplayTag data\n\t\t\t\t\tint tagId = ${tagId(priorityPath)}`,
      )
      .replace(
        '\t\t\tint size = 1\n\t\t\t\t[0]\n\t\t\t\tint data = 17',
        '\t\t\tint size = 2\n\t\t\t\t[0]\n\t\t\t\tint data = 17\n\t\t\t\t[1]\n\t\t\t\tint data = 18',
      );
    expect(() => parseTimeDilationCatalogDumpSource(duplicateDump, 'duplicate')).toThrow(
      'duplicate TimeDilation priority tag',
    );
    expect(() =>
      renderTimeDilationCatalogModule(parseTimeDilationCatalogDumpSource(dump, 'unknown-tag'), [
        globalSlotPath,
        entitySlotPath,
      ]),
    ).toThrow('无法解析 GameplayTag ID');
  });
});
