import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  exportShareString: vi.fn(async (options?: { includeScenarios?: string | string[] | null }) =>
    options?.includeScenarios ? `current:${String(options.includeScenarios)}` : 'all',
  ),
  writeText: vi.fn(async () => undefined),
}));

vi.mock('@/stores/timelineStore', () => ({
  useTimelineStore: () => ({ exportShareString: mocks.exportShareString }),
}));

vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

import { useShareProject } from './useShareProject';

describe('useShareProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('navigator', { clipboard: { writeText: mocks.writeText } });
  });

  it('copies a data code for only the requested scenario', async () => {
    const { copyShareCode } = useShareProject();

    await copyShareCode({ includeScenarios: 'scenario-02' });

    expect(mocks.writeText).toHaveBeenCalledWith('current:scenario-02');
  });
});
