const base = require('./electron-builder.json');

const { encodeBuildVersion } = require('../app/build-version.cjs');

const keyFile = process.env.ENDAXIS_UPDATE_PUBLIC_KEY_FILE;
let publicKey;
if (keyFile) {
  const pem = require('node:fs').readFileSync(keyFile, 'utf8');
  if (!pem.startsWith('-----BEGIN PUBLIC KEY-----')) throw Error('Expected a public PEM key');
  const key = require('node:crypto').createPublicKey(pem);
  if (key.asymmetricKeyType !== 'ed25519') throw Error('Expected an Ed25519 update key');
  publicKey = key.export({ type: 'spki', format: 'pem' });
}

module.exports = {
  ...base,
  extraMetadata: { endaxisUpdatePublicKey: publicKey, version: encodeBuildVersion(new Date()) },
};
