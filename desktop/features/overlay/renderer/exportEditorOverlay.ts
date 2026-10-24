import type { GameDataRepository } from '@/core/game-data/gameDataRepository';
import type { EndaxisProjectDocument } from '@/core/project/schema';
import type { PublishedScenarioSimulation } from '@/ui/timeline/useScenarioSimulation';
import type { SupportedLocale } from '@/i18n/elementPlusLocale';
import { buildOverlayPlanFromProject } from './projectPlan';
import { saveOverlaySnapshot } from './snapshot';
import type {} from './desktopApi';

interface ExportState {
  readonly project: EndaxisProjectDocument;
  readonly published: PublishedScenarioSimulation | null;
  readonly locale: SupportedLocale;
  readonly revision: number;
}

/** 入口只等待主程序已有的完整结果，不创建模拟服务或改动项目。 */
export async function exportEditorOverlay(options: {
  repository: GameDataRepository;
  showWindow?: boolean;
  ensureCurrentSimulation(): Promise<boolean>;
  read(): ExportState;
  message(key: 'exportFailed' | 'exportChanged'): string;
  onError(message: string): void;
}): Promise<void> {
  const beforeRevision = options.read().revision;
  const desktop = window.endaxisDesktopEditor;
  if (!desktop) {
    options.onError(options.message('exportFailed'));
    return;
  }
  try {
    if (!(await options.ensureCurrentSimulation()))
      throw new Error(options.message('exportFailed'));
    const current = options.read();
    if (current.revision !== beforeRevision || !current.published)
      throw new Error(options.message('exportChanged'));
    const active = current.project.scenarios.find(s => s.id === current.project.activeScenarioId);
    if (active !== current.published.scenario) throw new Error(options.message('exportChanged'));
    const { plan, scenarioName } = buildOverlayPlanFromProject(
      current.project,
      options.repository,
      current.published.run,
      current.locale,
    );
    await saveOverlaySnapshot({
      version: 1,
      id: crypto.randomUUID(),
      scenarioName,
      locale: current.locale,
      plan,
    });
    if (options.showWindow !== false) await desktop.showOverlay();
  } catch (error) {
    options.onError(error instanceof Error ? error.message : String(error));
  }
}
