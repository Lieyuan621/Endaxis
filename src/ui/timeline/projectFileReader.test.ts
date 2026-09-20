import { expect, it } from 'vitest';
import { createProjectFileReader } from './projectFileSession';
import { createEmptyProject } from '../../core/project/createProject';
import { ProjectEditorSession } from '../../application/editor/projectEditorSession';

function deferred() {
  let resolve!: (value: string) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<string>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { file: { text: () => promise }, resolve, reject };
}

it.each(['old-first', 'new-first'])('accepts only the newest file (%s)', async order => {
  const reader = createProjectFileReader(() => 0);
  const a = deferred(),
    b = deferred();
  const old = reader.read(a.file),
    latest = reader.read(b.file);
  if (order === 'old-first') {
    a.resolve('A');
    expect(await old).toBeNull();
    b.resolve('B');
  } else {
    b.resolve('B');
    expect(await latest).toBe('B');
    a.resolve('A');
  }
  expect(await latest).toBe('B');
  expect(await old).toBeNull();
});
it('does not revive an earlier selection when the newest read fails', async () => {
  const reader = createProjectFileReader(() => 0);
  const a = deferred(),
    b = deferred();
  const old = reader.read(a.file),
    latest = reader.read(b.file);
  b.reject(new Error('read failed'));
  await expect(latest).rejects.toThrow('read failed');
  a.resolve('A');
  expect(await old).toBeNull();
});
it('suppresses superseded read failures', async () => {
  const reader = createProjectFileReader(() => 0);
  const a = deferred();
  const old = reader.read(a.file);
  expect(await reader.read({ text: async () => 'B' })).toBe('B');
  a.reject(new Error('obsolete'));
  expect(await old).toBeNull();
});
it('rejects an edit then undo even if project identity is restored', async () => {
  const initial = createEmptyProject({ createdWith: 'test' });
  const session = new ProjectEditorSession(initial);
  const reader = createProjectFileReader(() => session.snapshot.revision);
  const a = deferred();
  const pending = reader.read(a.file);
  session.commit('edit', project => ({ ...project }));
  session.undo();
  expect(session.snapshot.project).toBe(initial);
  a.resolve('A');
  await expect(pending).rejects.toThrow('读取文件期间当前项目已变化');
  expect(await reader.read({ text: async () => 'retry' })).toBe('retry');
});
it.each(['resolve', 'reject'])('ignores completion after disposal: %s', async outcome => {
  const reader = createProjectFileReader(() => 0);
  const a = deferred(),
    pending = reader.read(a.file);
  reader.dispose();
  if (outcome === 'resolve') a.resolve('A');
  else a.reject(new Error('late'));
  expect(await pending).toBeNull();
  expect(
    await reader.read({
      text: () => {
        throw new Error('must not read');
      },
    }),
  ).toBeNull();
});
