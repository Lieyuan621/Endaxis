import { onScopeDispose, ref } from 'vue';
import type { ProjectEditorSession } from '../../application/editor/projectEditorSession';
import type { EndaxisProjectDocument } from '../../core/project/schema';
import { getProjectDefinitionLibrary } from '../../core/project/projectDefinitionLibrary';
import { serializeProjectDocument } from '../../core/project/serialization';
import { saveBrowserProject } from '../../data/browserProjectStorage';
import { decompressProjectCode, downloadBlob, projectFilename } from './timelineExport';
import type { ExportScenarioScope } from './components/TimelineExportDialog.vue';
import { readProjectCodeFromPng } from './pngProjectData';

/** 单方案仍是完整项目，只携带该方案引用的项目级模板及其套装依赖。 */
export function selectProjectExportScope(
  project: EndaxisProjectDocument,
  scope: ExportScenarioScope,
): EndaxisProjectDocument {
  if (scope === 'all') return project;
  const active = project.scenarios.find(scenario => scenario.id === project.activeScenarioId);
  if (active === undefined) throw new Error('当前方案不存在');
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
  for (const track of active.tracks) {
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
    scenarios: [active],
    definitionLibrary: { operators, weapons, gears, gearSets },
  };
}

/** 项目会话负责浏览器自动保存、文件读取代次和保存未完成时的离页保护。 */
export function useProjectFileSession(
  projectSession: ProjectEditorSession,
  options: { persistToBrowser?: boolean } = {},
) {
  const browserSaveError = ref<string | null>(null);
  let pendingBrowserSaves = 0;
  const projectFileReader = createProjectFileReader(() => projectSession.snapshot.revision);
  const unsubscribe = projectSession.subscribe(snapshot => {
    if (options.persistToBrowser) {
      pendingBrowserSaves += 1;
      void saveBrowserProject(snapshot.project).then(
        () => {
          browserSaveError.value = null;
          pendingBrowserSaves -= 1;
        },
        error => {
          browserSaveError.value =
            error instanceof Error ? error.message : '浏览器项目自动保存失败';
          pendingBrowserSaves -= 1;
        },
      );
    }
  });
  function exportProjectFile(filename?: string, scope: ExportScenarioScope = 'all') {
    const project = selectProjectExportScope(projectSession.snapshot.project, scope);
    const content = serializeProjectDocument(project, true);
    const activeScenario = project.scenarios.find(value => value.id === project.activeScenarioId);
    const fileBase = (activeScenario?.name ?? project.activeScenarioId)
      .replace(/[^A-Za-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    downloadProjectJson(
      content,
      filename === undefined ? `${fileBase || 'endaxis-project'}.json` : projectFilename(filename),
    );
  }
  function protectPendingBrowserSave(event: BeforeUnloadEvent) {
    if (!options.persistToBrowser || (pendingBrowserSaves === 0 && browserSaveError.value === null))
      return;
    event.preventDefault();
    event.returnValue = '';
  }
  window.addEventListener('beforeunload', protectPendingBrowserSave);
  onScopeDispose(() => {
    unsubscribe();
    projectFileReader.dispose();
    window.removeEventListener('beforeunload', protectPendingBrowserSave);
  });
  return {
    browserSaveError,
    projectFileReader,
    exportProjectFile,
  };
}

/** File selection is replaceable work: only the newest read may reach project parsing.
 * A revision protects intervening edits, including an undo back to the same document object. */
export function createProjectFileReader(getProjectRevision: () => number) {
  let generation = 0;
  let disposed = false;
  async function readUsing(readContent: () => Promise<string>): Promise<string | null> {
    if (disposed) return null;
    const request = ++generation;
    const revision = getProjectRevision();
    const current = () => !disposed && request === generation;
    let content: string;
    try {
      content = await readContent();
    } catch (error) {
      if (!current()) return null;
      throw error;
    }
    if (!current()) return null;
    if (revision !== getProjectRevision()) {
      throw new Error('读取文件期间当前项目已变化，请重新加载');
    }
    return content;
  }
  return {
    read(file: Pick<File, 'text'>): Promise<string | null> {
      return readUsing(() => file.text());
    },
    readPng(file: Blob): Promise<string | null> {
      return readUsing(async () => {
        const code = await readProjectCodeFromPng(file);
        if (code === null) throw new Error('这张 PNG 图片没有 Endaxis 项目数据');
        return decompressProjectCode(code);
      });
    },
    dispose(): void {
      disposed = true;
      generation += 1;
    },
  };
}

/** 触发浏览器下载，不把点击等同于持久化备份；对象 URL 保留到浏览器消费后再释放。 */
export function downloadProjectJson(content: string, filename: string): void {
  downloadBlob(new Blob([content], { type: 'application/json' }), filename);
}
