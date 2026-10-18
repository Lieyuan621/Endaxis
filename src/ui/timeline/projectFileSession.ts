import { onScopeDispose, ref } from 'vue';
import type { ProjectEditorSession } from '../../application/editor/projectEditorSession';
import { serializeProjectDocument } from '../../core/project/serialization';
import { saveBrowserProject } from '../../data/browserProjectStorage';
import { decompressProjectCode, downloadBlob, projectFilename } from './timelineExport';
import {
  selectProjectExportScope,
  type ExportScenarioScope,
} from '../../application/editor/projectTransfer';
export { selectProjectExportScope } from '../../application/editor/projectTransfer';
import { readProjectCodeFromPng } from './pngProjectData';

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
