const path = require('node:path');
const crypto = require('node:crypto');
const fs = require('node:fs');
const { pipeline } = require('node:stream/promises');
const { spawn } = require('node:child_process');

// Electron treats app.asar as a directory; hashing and linking need the actual archive.
const disk = process.versions.electron ? require('original-fs') : fs;
const io = disk.promises;
const blockSize = 1024 * 1024;
const manifestName = 'portable-manifest.json';
const { versionPattern, versionOrder } = require('./build-version.cjs');
const hashPattern = /^[a-f0-9]{64}$/;

function verifySignature(bytes, signature, key) {
  if (
    typeof signature !== 'string' ||
    !/^[A-Za-z0-9+/]{86}==$/.test(signature) ||
    !key ||
    crypto.createPublicKey(key).asymmetricKeyType !== 'ed25519' ||
    !crypto.verify(null, bytes, key, Buffer.from(signature, 'base64'))
  )
    throw Error('Invalid portable update signature');
}

async function* limitedBody(response, limit, advance = () => {}) {
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > limit) throw Error('Portable update download exceeds size limit');
    advance(chunk.length);
    yield chunk;
  }
}

async function readLimited(url, limit) {
  const chunks = [];
  for await (const chunk of limitedBody(await request(url), limit)) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function newer(a, b) {
  return versionOrder(a) > versionOrder(b);
}

function portableRoot(exe) {
  const dir = path.dirname(exe);
  return path.basename(path.dirname(dir)) === '.endaxis-versions' &&
    versionPattern.test(path.basename(dir))
    ? path.dirname(path.dirname(dir))
    : dir;
}

async function digest(file) {
  const hash = crypto.createHash('sha256');
  for await (const chunk of disk.createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

function checkManifest(m) {
  if (m.format !== 1 || !versionPattern.test(m.version) || !Array.isArray(m.files))
    throw Error('Unsupported portable update manifest');
  if (m.files.length > 20000) throw Error('Too many portable update files');
  let total = 0;
  const paths = new Set();
  for (const file of m.files) {
    if (
      typeof file.path !== 'string' ||
      !hashPattern.test(file.sha256) ||
      !Number.isSafeInteger(file.size) ||
      file.size < 0 ||
      file.size > 1024 ** 3 ||
      file.path
        .split('/')
        .some(
          part =>
            !part ||
            /[<>:"\\|?*\x00-\x1f]/.test(part) ||
            /[. ]$/.test(part) ||
            /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(part),
        ) ||
      /^(data|\.endaxis-versions|portable-manifest\.(json|sig)|update-source\.json)(\/|$)/i.test(
        file.path,
      ) ||
      paths.has(file.path.toLowerCase())
    )
      throw Error('Invalid portable update file: ' + file.path);
    if (
      file.blocks !== undefined &&
      (!Array.isArray(file.blocks) ||
        file.blocks.length !== Math.ceil(file.size / blockSize) ||
        !file.blocks.every(hash => hashPattern.test(hash)))
    )
      throw Error('Invalid block list');
    total += file.size;
    if (total > 4 * 1024 ** 3) throw Error('Portable update exceeds install size limit');
    paths.add(file.path.toLowerCase());
  }
  if (!paths.has('endaxis.exe') || !paths.has('resources/app.asar'))
    throw Error('Incomplete portable update');
  return m;
}

function selectedVersion(root) {
  try {
    const version = disk.readFileSync(path.join(root, '.endaxis-versions', 'current'), 'utf8');
    return versionPattern.test(version) ? version : null;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return null;
  }
}

async function prunePortableVersions(exe) {
  const root = portableRoot(exe);
  const dir = path.join(root, '.endaxis-versions');
  const stat = await io.lstat(dir).catch(error => {
    if (error.code !== 'ENOENT') throw error;
  });
  if (!stat || !stat.isDirectory() || stat.isSymbolicLink()) return;
  const entries = await io.readdir(dir, { withFileTypes: true });
  const running = path.dirname(exe) === root ? null : path.basename(path.dirname(exe));
  const selected = selectedVersion(root);
  const keep = new Set([running, selected]);
  const newest = entries
    .filter(e => e.isDirectory() && versionPattern.test(e.name))
    .map(e => e.name)
    .sort((a, b) => (newer(a, b) ? -1 : 1));
  const reference = running || selected;
  keep.add(newest.find(v => !reference || newer(reference, v)));
  for (const entry of entries) {
    const stale =
      entry.isDirectory() &&
      (/^\.download-[a-zA-Z0-9]{6}$/.test(entry.name) ||
        (versionPattern.test(entry.name) && !keep.has(entry.name)));
    const pointer = entry.isFile() && /^current-[a-f0-9-]{36}$/.test(entry.name);
    if (stale || pointer)
      await io.rm(path.join(dir, entry.name), { recursive: stale, force: true });
  }
}

function launchSelectedVersion(exe, args) {
  const root = portableRoot(exe);
  if (root !== path.dirname(exe)) return false;
  const version = selectedVersion(root);
  if (!version) return false;
  const target = path.join(root, '.endaxis-versions', version, path.basename(exe));
  if (!disk.existsSync(target)) return false;
  const base = JSON.parse(disk.readFileSync(path.join(root, manifestName), 'utf8'));
  if (!newer(version, base.version)) return false;
  try {
    const bytes = disk.readFileSync(path.join(path.dirname(target), manifestName));
    verifySignature(
      bytes,
      disk.readFileSync(path.join(path.dirname(target), 'portable-manifest.sig'), 'utf8'),
      require('../package.json').endaxisUpdatePublicKey,
    );
    if (JSON.parse(bytes).version !== version) return false;
  } catch {
    return false;
  }
  const child = spawn(target, args, { detached: true, stdio: 'ignore' });
  child.unref();
  return true;
}

function feedUrl(base, relative) {
  const url = new URL(relative, base);
  url.search = base.search;
  return url;
}

async function request(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw Error('Update request failed: ' + response.status);
  return response;
}

async function downloadBlocks(file, prior, dest, feed, advance) {
  const source = await io.open(prior, 'r').catch(error => {
    if (error.code !== 'ENOENT') throw error;
    return null;
  });
  let downloaded = 0;
  try {
    const output = await io.open(dest, 'wx');
    try {
      for (const [i, expected] of file.blocks.entries()) {
        const offset = i * blockSize;
        const length = Math.min(blockSize, file.size - offset);
        let block = Buffer.alloc(length);
        let fetched = 0;
        const read = await source?.read(block, 0, length, offset);
        if (
          read?.bytesRead !== length ||
          crypto.createHash('sha256').update(block).digest('hex') !== expected
        ) {
          block = await readLimited(feedUrl(feed, 'objects/' + expected), length);
          if (
            block.length !== length ||
            crypto.createHash('sha256').update(block).digest('hex') !== expected
          )
            throw Error('Update block checksum mismatch: ' + file.path);
          downloaded += length;
          fetched = length;
        }
        await output.writeFile(block);
        advance(length, fetched);
      }
    } finally {
      await output.close();
    }
  } finally {
    await source?.close();
  }
  return downloaded;
}

async function preparePortableUpdate(
  exe,
  publicKey = require('../package.json').endaxisUpdatePublicKey,
  report = () => {},
) {
  const dir = path.dirname(exe);
  const root = portableRoot(exe);
  let config;
  try {
    config = JSON.parse(await io.readFile(path.join(root, 'update-source.json'), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  if (config.url === '') return;
  report({ phase: 'checking' });
  if (typeof config.url !== 'string') throw Error('Invalid portable update URL');
  const feed = new URL(config.url);
  if (!['http:', 'https:'].includes(feed.protocol))
    throw Error('Expected an HTTP(S) portable update URL');
  if (!feed.pathname.endsWith('/')) feed.pathname += '/';
  const local = checkManifest(JSON.parse(await io.readFile(path.join(dir, manifestName), 'utf8')));
  if (!publicKey) throw Error('Portable build has no trusted update key');
  const latest = JSON.parse(await readLimited(feedUrl(feed, 'latest.json'), 8192));
  if (!versionPattern.test(latest.version) || !hashPattern.test(latest.manifestSha256))
    throw Error('Invalid portable update channel');
  if (!newer(latest.version, local.version)) {
    report({ phase: 'idle' });
    return;
  }
  const active = selectedVersion(root);
  if (active && !newer(latest.version, active)) {
    report({ phase: 'ready', version: active });
    return;
  }
  const content = await readLimited(
    feedUrl(feed, 'manifests/' + latest.manifestSha256),
    4 * 1024 ** 2,
  );
  verifySignature(content, latest.signature, publicKey);
  if (crypto.createHash('sha256').update(content).digest('hex') !== latest.manifestSha256)
    throw Error('Manifest checksum mismatch');
  const remote = checkManifest(JSON.parse(content));
  if (remote.version !== latest.version) throw Error('Manifest version mismatch');
  const versions = path.join(root, '.endaxis-versions');
  await io.mkdir(versions, { recursive: true });
  const stage = await io.mkdtemp(path.join(versions, '.download-'));
  const total = remote.files.reduce((sum, file) => sum + file.size, 0);
  let completed = 0,
    received = 0,
    lastReport = 0;
  function advance(bytes, networkBytes) {
    completed += bytes;
    received += networkBytes;
    const now = Date.now();
    if (now - lastReport >= 100 || completed === total) {
      report({ phase: 'preparing', version: remote.version, completed, total, received });
      lastReport = now;
    }
  }
  advance(0, 0);
  const old = new Map(local.files.map(file => [file.path, file]));
  let downloadedBytes = 0,
    downloadedFiles = 0;
  try {
    for (const file of remote.files) {
      const dest = path.join(stage, file.path);
      await io.mkdir(path.dirname(dest), { recursive: true });
      const prior = path.join(dir, file.path);
      if (
        old.get(file.path)?.sha256 === file.sha256 &&
        (await digest(prior).catch(() => null)) === file.sha256
      ) {
        try {
          await io.link(prior, dest);
        } catch {
          await io.copyFile(prior, dest);
        }
        advance(file.size, 0);
      } else {
        if (file.blocks) downloadedBytes += await downloadBlocks(file, prior, dest, feed, advance);
        else {
          const response = await request(feedUrl(feed, 'objects/' + file.sha256));
          await pipeline(
            limitedBody(response, file.size, bytes => advance(bytes, bytes)),
            disk.createWriteStream(dest, { flags: 'wx' }),
          );
          downloadedBytes += file.size;
        }
        if ((await io.stat(dest)).size !== file.size || (await digest(dest)) !== file.sha256)
          throw Error('Update checksum mismatch: ' + file.path);
        downloadedFiles++;
      }
    }
    await io.writeFile(path.join(stage, manifestName), content);
    await io.writeFile(path.join(stage, 'portable-manifest.sig'), latest.signature);
    const final = path.join(versions, remote.version);
    try {
      await io.rename(stage, final);
    } catch (error) {
      // A previous run can finish staging before writing the pointer.
      if (
        !['EEXIST', 'ENOTEMPTY', 'EPERM'].includes(error.code) ||
        (await digest(path.join(final, manifestName))) !== latest.manifestSha256 ||
        (await io.readFile(path.join(final, 'portable-manifest.sig'), 'utf8')) !== latest.signature
      )
        throw error;
    }
    const pointer = path.join(versions, 'current-' + crypto.randomUUID());
    await io.writeFile(pointer, remote.version);
    await io.rename(pointer, path.join(versions, 'current'));
    report({ phase: 'ready', version: remote.version });
    return { downloadedFiles, downloadedBytes };
  } finally {
    await io.rm(stage, { recursive: true, force: true });
  }
}

module.exports = {
  blockSize,
  checkManifest,
  digest,
  manifestName,
  portableRoot,
  launchSelectedVersion,
  preparePortableUpdate,
  prunePortableVersions,
};
