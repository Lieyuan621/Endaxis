const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { blockSize, digest, checkManifest, manifestName } = require('../app/updates.cjs');

module.exports = async function beforeArchive({ file, targetPresentableName }) {
  if (targetPresentableName !== 'zip') return;
  const root = path.join(path.dirname(file), 'win-unpacked');
  const version = /^Endaxis-(.+)-windows-x64\.zip$/.exec(path.basename(file))?.[1];
  const files = [];
  async function visit(dir) {
    for (const item of await fs.readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, item.name);
      if (item.isDirectory()) await visit(file);
      else if (file !== path.join(root, manifestName) && file !== path.join(root, 'update-source.json')) {
        const relative = path.relative(root, file).split(path.sep).join('/');
        const size = (await fs.stat(file)).size;
        const entry = { path: relative, size, sha256: await digest(file) };
        if (size > 4 * blockSize) {
          const handle = await fs.open(file, 'r');
          try {
            entry.blocks = [];
            for (let offset = 0; offset < size; offset += blockSize) {
              const block = Buffer.alloc(Math.min(blockSize, size - offset));
              const { bytesRead } = await handle.read(block, 0, block.length, offset);
              if (bytesRead !== block.length) throw Error('Incomplete file: ' + relative);
              entry.blocks.push(crypto.createHash('sha256').update(block).digest('hex'));
            }
          } finally { await handle.close(); }
        }
        files.push(entry);
      }
    }
  }
  await visit(root);
  files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  const result = checkManifest({ format: 1, version, files, publicKey: require('./package-config.cjs').extraMetadata.endaxisUpdatePublicKey });
  await fs.writeFile(path.join(root, manifestName), JSON.stringify(result));
};
