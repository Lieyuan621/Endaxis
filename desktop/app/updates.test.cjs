const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const http = require('node:http');
const {
  checkManifest,
  portableRoot,
  preparePortableUpdate,
  prunePortableVersions,
} = require('./updates.cjs');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');

test('stages only changed portable files and preserves the active version on failure', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'endaxis-portable-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const keys = crypto.generateKeyPairSync('ed25519');
  const publicKey = keys.publicKey.export({ type: 'spki', format: 'pem' });
  let signer = crypto.generateKeyPairSync('ed25519').privateKey;
  const files = {
    'Endaxis.exe': 'exe',
    'resources/app.asar': 'asar',
    'resources/dist/skill.js': 'A',
  };
  const manifest = (version, entries) =>
    JSON.stringify({
      format: 1,
      version,
      files: Object.entries(entries).map(([path, data]) => ({
        path,
        size: Buffer.byteLength(data),
        sha256: hash(data),
      })),
    });
  for (const [name, data] of Object.entries(files)) {
    await fs.mkdir(path.dirname(path.join(root, name)), { recursive: true });
    await fs.writeFile(path.join(root, name), data);
  }
  await fs.writeFile(path.join(root, 'portable-manifest.json'), manifest('2026.11.25-T123400', files));
  await fs.mkdir(path.join(root, 'data'));
  await fs.writeFile(path.join(root, 'data', 'axis.json'), 'saved');
  let version = '2026.11.25-T123401',
    body = 'B',
    served = 'broken';
  const requests = [];
  const server = http.createServer((req, res) => {
    const m = manifest(version, { ...files, 'resources/dist/skill.js': body });
    requests.push(req.url);
    if (['/latest.json', '/mirror/latest.json'].includes(req.url))
      res.end(
        JSON.stringify({
          version,
          manifestSha256: hash(m),
          signature: crypto.sign(null, Buffer.from(m), signer).toString('base64'),
        }),
      );
    else if (req.url.endsWith('/manifests/' + hash(m))) res.end(m);
    else if (req.url.endsWith('/objects/' + hash(body))) res.end(served);
    else {
      res.statusCode = 404;
      res.end();
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const feed = 'http://127.0.0.1:' + server.address().port + '/';
  const exe = path.join(root, 'Endaxis.exe');
  await preparePortableUpdate(exe);
  const config = path.join(root, 'update-source.json');
  await fs.writeFile(config, JSON.stringify({ url: '' }));
  await preparePortableUpdate(exe);
  assert.deepEqual(requests, []);
  await fs.writeFile(config, JSON.stringify({ url: feed }));
  await assert.rejects(preparePortableUpdate(exe), /no trusted update key/);
  await assert.rejects(preparePortableUpdate(exe, publicKey), /signature/);
  assert.ok(requests.every(url => !url.includes('/objects/')));
  signer = keys.privateKey;
  await assert.rejects(preparePortableUpdate(exe, publicKey), /size limit/);
  const versions = path.join(root, '.endaxis-versions');
  assert.deepEqual(await fs.readdir(versions), []);
  requests.length = 0;
  served = body;
  const progress = [];
  assert.deepEqual(await preparePortableUpdate(exe, publicKey, state => progress.push(state)), {
    downloadedFiles: 1,
    downloadedBytes: 1,
  });
  assert.equal(progress[0].phase, 'checking');
  assert.deepEqual(progress.at(-1), { phase: 'ready', version });
  const prepared = progress.filter(state => state.phase === 'preparing').at(-1);
  assert.equal(prepared.completed, prepared.total);
  assert.equal(prepared.received, 1);
  assert.deepEqual(
    requests.filter(url => url.startsWith('/objects/')),
    ['/objects/' + hash(body)],
  );
  const selected = path.join(versions, version, 'Endaxis.exe');
  assert.equal(portableRoot(selected), root);
  assert.equal(await fs.readFile(path.join(versions, 'current'), 'utf8'), version);
  version = '2026.11.25-T123402';
  body = 'C';
  served = 'X';
  requests.length = 0;
  await fs.writeFile(config, JSON.stringify({ url: feed + 'mirror' }));
  await assert.rejects(preparePortableUpdate(selected, publicKey), /checksum mismatch/);
  assert.equal(requests[0], '/mirror/latest.json');
  assert.equal(await fs.readFile(path.join(versions, 'current'), 'utf8'), '2026.11.25-T123401');
  served = body;
  assert.equal((await preparePortableUpdate(selected, publicKey)).downloadedBytes, 1);
  assert.equal(await fs.readFile(path.join(root, 'data', 'axis.json'), 'utf8'), 'saved');
});

test('rejects traversal, user profile files and ambiguous Windows paths', () => {
  for (const name of ['../data/x', 'data/x', 'x:stream', 'x/CON', 'C:/a', 'x.', 'a\\b']) {
    assert.throws(
      () =>
        checkManifest({
          format: 1,
          version: '2026.11.25-T123400',
          files: [{ path: name, size: 0, sha256: hash('') }],
        }),
      /Invalid portable update file/,
    );
  }
});

test('prunes interrupted downloads and keeps running, selected and previous versions', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'endaxis-prune-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const dir = path.join(root, '.endaxis-versions');
  for (const name of ['2026.11.1-T120000', '2026.11.2-T120000', '2026.11.3-T120000', '2026.11.4-T120000', '.download-ABC123', 'notes'])
    await fs.mkdir(path.join(dir, name), { recursive: true });
  await fs.writeFile(path.join(dir, 'current'), '2026.11.4-T120000');
  await prunePortableVersions(path.join(dir, '2026.11.3-T120000', 'Endaxis.exe'));
  assert.deepEqual((await fs.readdir(dir)).sort(), ['2026.11.2-T120000', '2026.11.3-T120000', '2026.11.4-T120000', 'current', 'notes']);
});
