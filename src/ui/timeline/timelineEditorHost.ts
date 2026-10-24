import type { EndaxisProjectDocument, ScenarioDocument } from '../../core/project/schema';
import type { GameDataRepository } from '../../core/game-data/gameDataRepository';
import type { ProjectGameDataRepository } from '../../data/projectGameDataRepository';
import type { SupportedLocale } from '../../i18n/elementPlusLocale';
import type { PublishedScenarioSimulation } from './useScenarioSimulation';

/** 编辑器宿主只传入初始状态，后续修改由编辑器会话管理。 */
export interface TimelineEditorProps {
  initialScenario?: ScenarioDocument;
  initialProject?: unknown;
  gameDataRepository: ProjectGameDataRepository;
  browserPersistenceEnabled?: boolean;
  browserRestoreError?: string;
  browserRestoreRaw?: string;
}

export type TimelineEditorEvents = {
  projectChange: [project: EndaxisProjectDocument];
  initialReady: [];
};

/** 工具栏扩展只读取当前发布单元，不取得编辑命令或另建模拟服务。 */
export interface TimelineExportContext {
  readonly repository: GameDataRepository;
  readonly ensureCurrentSimulation: () => Promise<boolean>;
  readonly read: () => {
    readonly project: EndaxisProjectDocument;
    readonly published: PublishedScenarioSimulation | null;
    readonly revision: number;
    readonly locale: SupportedLocale;
  };
}
