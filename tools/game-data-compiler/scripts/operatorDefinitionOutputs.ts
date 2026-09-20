import manifest from '../config/operators.json' with { type: 'json' };

/** 干员目录同时包含helper和测试，发布与候选覆盖只能选择清单中的生成文件。 */
export const OPERATOR_DEFINITION_OUTPUTS = manifest.operators.map(operator => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(operator.slug))
    throw new Error(`unsafe operator slug: ${operator.slug}`);
  return `src/data/operators/${operator.slug}.generated.ts`;
});
