import { getProjectDefinitionLibrary } from '../../core/project/projectDefinitionLibrary';
import type { EndaxisProjectDocument } from '../../core/project/schema';

export type ExportScenarioScope = 'all' | 'current' | { scenarioIds: readonly string[] };

/** 部分方案沿用项目存档格式及原有模板收集规则。 */
export function selectProjectExportScope(
  project: EndaxisProjectDocument,
  scope: ExportScenarioScope,
): EndaxisProjectDocument {
  if (scope === 'all') return project;
  const ids = new Set(scope === 'current' ? [project.activeScenarioId] : scope.scenarioIds);
  const scenarios = project.scenarios.filter(scenario => ids.has(scenario.id));
  if (!scenarios.length || scenarios.length !== ids.size) throw new Error('请选择有效的方案');
  const library = getProjectDefinitionLibrary(project);
  const operators: typeof library.operators = {};
  const weapons: typeof library.weapons = {};
  const gears: typeof library.gears = {};
  const gearSets: typeof library.gearSets = {};
  const requireTemplate = <T>(records: Record<string, T>, id: string): T => {
    const template = records[id];
    if (template === undefined) throw new Error(`方案引用了不存在的自定义模板：${id}`);
    return template;
  };
  for (const track of scenarios.flatMap(scenario => scenario.tracks)) {
    if (track === null) continue;
    const operatorId = track.operator?.operatorSlug;
    if (operatorId?.startsWith('project:'))
      operators[operatorId] = requireTemplate(library.operators, operatorId);
    const weaponId = track.weapon?.weaponSlug;
    if (weaponId?.startsWith('project:'))
      weapons[weaponId] = requireTemplate(library.weapons, weaponId);
    for (const slot of Object.values(track.gears)) {
      const gearId = slot?.gearSlug;
      if (!gearId?.startsWith('project:')) continue;
      const gear = requireTemplate(library.gears, gearId);
      gears[gearId] = gear;
      const setId = gear.definition.gearSetSlug;
      if (setId?.startsWith('project:')) gearSets[setId] = requireTemplate(library.gearSets, setId);
    }
  }
  return {
    ...project,
    scenarios,
    activeScenarioId: ids.has(project.activeScenarioId)
      ? project.activeScenarioId
      : scenarios[0]!.id,
    definitionLibrary: { operators, weapons, gears, gearSets },
  };
}

/** 追加方案保留目标项目公共信息；资产迁移不在此入口处理。 */
export function appendProjectScenarios(
  target: EndaxisProjectDocument,
  source: EndaxisProjectDocument,
  scenarioIds: readonly string[],
  allocateId: () => string,
): EndaxisProjectDocument {
  const incoming = structuredClone(selectProjectExportScope(source, { scenarioIds }));
  const used = new Set(target.scenarios.map(scenario => scenario.id));
  const ids = new Map<string, string>();
  // 来源未选中的继承父方案也分配隔离身份，避免误指向目标项目里碰巧同 ID 的方案。
  const remap = (id: string) => {
    let mapped = ids.get(id);
    if (mapped !== undefined) return mapped;
    mapped = allocateId();
    if (used.has(mapped)) throw new Error('Duplicate imported scenario ID');
    used.add(mapped);
    ids.set(id, mapped);
    return mapped;
  };
  for (const scenario of incoming.scenarios) remap(scenario.id);
  const scenarios = incoming.scenarios.map(scenario => ({
    ...scenario,
    id: remap(scenario.id),
    ...(scenario.inheritance
      ? {
          inheritance: {
            ...scenario.inheritance,
            sourceScenarioId: remap(scenario.inheritance.sourceScenarioId),
          },
        }
      : {}),
  }));
  return {
    ...target,
    scenarios: [...target.scenarios, ...scenarios],
    activeScenarioId: scenarios[0]!.id,
  };
}
