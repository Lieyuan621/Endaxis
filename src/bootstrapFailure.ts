/** Resource failures must leave a recoverable screen, not an empty RouterView. */
export function showBootstrapFailure(error: unknown): void {
  console.error('Endaxis startup failed', error);
  const host = document.getElementById('boot-loader') ?? document.getElementById('app');
  if (host === null) return;
  const panel = document.createElement('div');
  panel.setAttribute('role', 'alert');
  panel.style.cssText =
    'max-width:560px;margin:auto;padding:24px;line-height:1.6;color:var(--ea-fg,#eee);background:var(--ea-bg,#18181c);font:14px sans-serif;letter-spacing:normal';
  const message = document.createElement('p');
  message.textContent =
    '页面资源加载失败，请确认服务连接后重试。 / Page resources failed to load. Check the connection and retry.';
  const detail = document.createElement('pre');
  detail.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px';
  detail.textContent = error instanceof Error ? error.message : String(error);
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.textContent = '重新加载 / Reload';
  retry.style.cssText = 'padding:8px 16px;cursor:pointer';
  // Only an explicit click reloads. Never clear projects or start a reload loop.
  retry.addEventListener('click', () => window.location.reload());
  panel.append(message, detail, retry);
  host.replaceChildren(panel);
}
