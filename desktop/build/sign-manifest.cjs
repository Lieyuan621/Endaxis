const fs = require('node:fs');
const crypto = require('node:crypto');
const content = fs.readFileSync(0);
const privateKey = crypto.createPrivateKey(fs.readFileSync(process.argv[2]));
const publicKey = crypto.createPublicKey(privateKey).export({ type: 'spki', format: 'pem' });
if (privateKey.asymmetricKeyType !== 'ed25519' || JSON.parse(content).publicKey !== publicKey)
  throw Error('Signing key does not match the portable build');
process.stdout.write(crypto.sign(null, content, privateKey).toString('base64'));
