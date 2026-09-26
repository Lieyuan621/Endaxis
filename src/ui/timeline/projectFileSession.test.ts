import sharp from 'sharp';
import { effectScope } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEmptyProject, createEmptyScenario } from '../../core/project/createProject';
import {
  deriveProjectGearSetTemplate,
  deriveProjectGearTemplate,
  getProjectDefinitionLibrary,
  replaceProjectGearTemplateDefinition,
} from '../../core/project/projectDefinitionLibrary';
import { withProjectOperatorTemplate } from '../../test/projectOperatorTemplateFixture';
import { createDefaultOperatorInstance } from '../../application/editor/loadoutBuildFactory';
import { openProject } from '../../application/openProject';
import { createProjectGameDataRepository } from '../../data/projectGameDataRepository';
import { perlica } from '../../data/operators/perlica.generated';
import generatedGear from '../../data/equipment/generated/suit_wisdwill01/item_equip_t1_suit_wisdwill01_hand_01.generated';
import generatedSet from '../../data/equipment/generated-gear-sets/suit_wisdwill01.generated';
import { parseProjectDocument, serializeProjectDocument } from '../../core/project/serialization';
import { ProjectEditorSession } from '../../application/editor/projectEditorSession';
import { compressProjectCode } from './timelineExport';
import { embedProjectCodeInPng } from './pngProjectData';
import {
  createProjectFileReader,
  selectProjectExportScope,
  useProjectFileSession,
} from './projectFileSession';

const { saveBrowserProjectMock } = vi.hoisted(() => ({ saveBrowserProjectMock: vi.fn() }));
vi.mock('../../data/browserProjectStorage', () => ({ saveBrowserProject: saveBrowserProjectMock }));

function createBeforeUnloadEvent(): Event {
  const event = new Event('beforeunload', { cancelable: true });
  // 浏览器 BeforeUnloadEvent 的 returnValue 可写；Node 的普通 Event 在部分版本中只读。
  Object.defineProperty(event, 'returnValue', { value: '', writable: true });
  return event;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('project export scope', () => {
  it('keeps every scenario when exporting the whole project', () => {
    const project = createEmptyProject({ createdWith: 'test' });
    project.scenarios.push(createEmptyScenario('scenario:2', 'Second'));

    expect(selectProjectExportScope(project, 'all')).toBe(project);
  });

  it('exports an inherited current scenario with its frozen edit boundary', () => {
    const project = createEmptyProject({ createdWith: 'test' });
    const child = createEmptyScenario('scenario:2', 'Second');
    child.inheritance = { frame: 30, sourceScenarioId: project.activeScenarioId };
    project.scenarios.push(child);
    project.activeScenarioId = child.id;

    const exported = selectProjectExportScope(project, 'current');
    expect(exported.scenarios.map(scenario => scenario.id)).toEqual([child.id]);
    expect(exported.scenarios[0]?.inheritance).toEqual(child.inheritance);
    expect(child.inheritance).toBeDefined();
    expect(parseProjectDocument(serializeProjectDocument(exported)).ok).toBe(true);
  });

  it('exports only templates used by the selected scenario, including its custom gear set', async () => {
    let project = createEmptyProject({ createdWith: 'test' });
    project = withProjectOperatorTemplate(project, 'project:operator:unused', '未使用', perlica);
    project = deriveProjectGearSetTemplate(project, {
      id: 'project:gearSet:1',
      name: '自定义套装',
      baseTemplateId: generatedSet.slug,
      definition: generatedSet,
    });
    project = deriveProjectGearTemplate(project, {
      id: 'project:gear:1',
      name: '自定义手套',
      baseTemplateId: generatedGear.slug,
      definition: generatedGear,
    });
    project = replaceProjectGearTemplateDefinition(project, 'project:gear:1', {
      ...getProjectDefinitionLibrary(project).gears['project:gear:1']!.definition,
      gearSetSlug: 'project:gearSet:1',
    });
    const second = createEmptyScenario('scenario:2', 'Second');
    second.inheritance = { frame: 30, sourceScenarioId: project.activeScenarioId };
    second.tracks[0] = {
      id: 'track:1',
      operator: createDefaultOperatorInstance(perlica),
      weapon: null,
      gears: {
        armor: null,
        gloves: { gearSlug: 'project:gear:1', artificingLevels: generatedGear.traits.map(() => 1) },
        accessory1: null,
        accessory2: null,
      },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    project.scenarios.push(second);
    project.activeScenarioId = second.id;

    const exported = selectProjectExportScope(project, 'current');
    expect(Object.keys(getProjectDefinitionLibrary(exported).operators)).toEqual([]);
    expect(Object.keys(getProjectDefinitionLibrary(exported).gears)).toEqual(['project:gear:1']);
    expect(Object.keys(getProjectDefinitionLibrary(exported).gearSets)).toEqual([
      'project:gearSet:1',
    ]);
    expect(exported.scenarios[0]?.inheritance).toEqual(second.inheritance);
    const repository = await createProjectGameDataRepository(exported);
    expect(
      openProject(serializeProjectDocument(exported), { gameDataRepository: repository }).ok,
    ).toBe(true);
  });
});

it('reads an exported PNG through the project file reader', async () => {
  const bytes = await sharp({
    create: { width: 2, height: 2, channels: 3, background: '#191a1d' },
  })
    .png()
    .toBuffer();
  const content = '{"kind":"test"}';
  const image = await embedProjectCodeInPng(
    new Blob([Uint8Array.from(bytes)], { type: 'image/png' }),
    await compressProjectCode(content),
  );
  let revision = 0;
  const reader = createProjectFileReader(() => revision);
  await expect(reader.readPng(image)).resolves.toBe(content);
  revision += 1;
  await expect(reader.readPng(image)).resolves.toBe(content);
  reader.dispose();
  await expect(reader.readPng(image)).resolves.toBeNull();
});

it('allows refresh after browser autosave completes, but protects edits while it is pending', async () => {
  const target = new EventTarget();
  vi.stubGlobal('window', target);
  let completeSave!: () => void;
  saveBrowserProjectMock.mockImplementation(
    () =>
      new Promise<void>(resolve => {
        completeSave = resolve;
      }),
  );
  const project = new ProjectEditorSession(createEmptyProject({ createdWith: 'test' }));
  const scope = effectScope();
  scope.run(() => useProjectFileSession(project, { persistToBrowser: true }));
  try {
    project.commit('edit', value => ({ ...value, createdWith: 'edited' }));
    const pending = createBeforeUnloadEvent();
    target.dispatchEvent(pending);
    expect(pending.defaultPrevented).toBe(true);
    completeSave();
    await Promise.resolve();
    const saved = createBeforeUnloadEvent();
    target.dispatchEvent(saved);
    expect(saved.defaultPrevented).toBe(false);
    expect(saveBrowserProjectMock).toHaveBeenCalledWith(project.snapshot.project);
  } finally {
    scope.stop();
  }
});

it('keeps refresh protection and exposes the error when browser autosave fails', async () => {
  const target = new EventTarget();
  vi.stubGlobal('window', target);
  saveBrowserProjectMock.mockRejectedValue(new Error('storage unavailable'));
  const project = new ProjectEditorSession(createEmptyProject({ createdWith: 'test' }));
  const scope = effectScope();
  const files = scope.run(() => useProjectFileSession(project, { persistToBrowser: true }))!;
  try {
    project.commit('edit', value => ({ ...value, createdWith: 'edited' }));
    await Promise.resolve();
    expect(files.browserSaveError.value).toBe('storage unavailable');
    const event = createBeforeUnloadEvent();
    target.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  } finally {
    scope.stop();
  }
});

it('does not warn about unexported edits when browser persistence is disabled', () => {
  vi.stubGlobal('window', new EventTarget());
  const project = new ProjectEditorSession(createEmptyProject({ createdWith: 'test' }));
  const scope = effectScope();
  scope.run(() => useProjectFileSession(project));
  try {
    project.commit('edit', value => ({ ...value, createdWith: 'edited' }));
    const event = createBeforeUnloadEvent();
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  } finally {
    scope.stop();
  }
});

it('cancels pending file reads and removes leave protection when its scope ends', async () => {
  const target = new EventTarget();
  vi.stubGlobal('window', target);
  const project = new ProjectEditorSession(createEmptyProject({ createdWith: 'test' }));
  saveBrowserProjectMock.mockImplementation(() => new Promise<void>(() => {}));
  const scope = effectScope();
  const files = scope.run(() => useProjectFileSession(project, { persistToBrowser: true }))!;
  project.commit('edit', value => ({ ...value, createdWith: 'edited' }));
  const before = createBeforeUnloadEvent();
  target.dispatchEvent(before);
  expect(before.defaultPrevented).toBe(true);
  let finish!: (text: string) => void;
  const pending = files.projectFileReader.read({
    text: () =>
      new Promise<string>(resolve => {
        finish = resolve;
      }),
  });
  scope.stop();
  finish('stale');
  await expect(pending).resolves.toBeNull();
  const after = createBeforeUnloadEvent();
  target.dispatchEvent(after);
  expect(after.defaultPrevented).toBe(false);
});
