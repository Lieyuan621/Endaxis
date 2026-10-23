const { createHash } = require('node:crypto');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

/** 每个工作树使用独立存储和固定来源，重启后 IndexedDB 仍属于同一项目。 */
function workspaceIdentity(root = ROOT) {
  const normalized =
    process.platform === 'win32' ? path.resolve(root).toLowerCase() : path.resolve(root);
  return createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

function serverOptions(root = ROOT) {
  const identity = workspaceIdentity(root);
  return {
    root,
    configFile: path.join(root, 'vite.config.ts'),
    configLoader: 'runner',
    server: {
      host: '127.0.0.1',
      port: 25000 + (Number.parseInt(identity.slice(0, 8), 16) % 20000),
      strictPort: true,
      open: false,
    },
  };
}

function validateUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new TypeError('桌面页面地址必须是无登录凭据的 HTTP(S) URL。');
  }
  return url.href;
}

/** 只创建本工作树的服务器；端口冲突直接失败，不能连接其它工作树。 */
async function startServer(root = ROOT, createServer) {
  const create = createServer || (await import('vite')).createServer;
  const server = await create(serverOptions(root));
  try {
    await server.listen();
    const address = server.httpServer?.address();
    if (!address || typeof address === 'string') {
      throw new Error('开发服务器没有可用的 HTTP 地址。');
    }
    return { server, url: `http://127.0.0.1:${address.port}/overlay` };
  } catch (error) {
    await server.close();
    throw error;
  }
}

module.exports = { ROOT, workspaceIdentity, serverOptions, validateUrl, startServer };
