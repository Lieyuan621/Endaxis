import type { GameDataRepository } from '../../core/game-data/gameDataRepository';
import type { EndaxisProjectDocument } from '../../core/project/schema';
import type { PublishedScenarioSimulation } from '../timeline/useScenarioSimulation';
import type { SupportedLocale } from '../../i18n/elementPlusLocale';
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
  href: string;
  repository: GameDataRepository;
  ensureCurrentSimulation(): Promise<boolean>;
  read(): ExportState;
  message(key: 'exportFailed' | 'exportChanged' | 'popupBlocked'): string;
  onError(message: string): void;
}): Promise<void> {
  const beforeRevision = options.read().revision;
  // 弹窗必须在点击的同步阶段创建；等模拟完成再开会被浏览器拦截。
  if (window.endaxisDesktopEditor) {
    void window.endaxisDesktopEditor.showOverlay().catch(error => {
      options.onError(error instanceof Error ? error.message : String(error));
    });
  } else {
    const popup = window.open('', 'endaxis-overlay', 'popup=yes,width=1180,height=300');
    if (!popup) options.onError(options.message('popupBlocked'));
    else {
      // 对已有同名 HUD 传 URL 会重载并打断播放；只有新窗口需要导航。
      try {
        if (popup.location.href === 'about:blank') popup.location.href = options.href;
      } catch {
        popup.location.href = options.href;
      }
    }
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
  } catch (error) {
    options.onError(error instanceof Error ? error.message : String(error));
  }
}
