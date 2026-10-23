/* 本地冻结画面的框选交互。没有文件、网络或通用桌面访问。 */
(() => {
  const api = window.endaxisRegionPicker;
  const image = document.getElementById('screen');
  const area = document.getElementById('selection-area');
  const selection = document.getElementById('selection');
  const confirm = document.getElementById('confirm');
  const cancel = document.getElementById('cancel');
  const help = document.getElementById('help');
  const status = document.getElementById('status');
  let ready = false;
  let minSize = 8;
  let dragging = null;
  let region = null;

  function localPoint(event) {
    const bounds = area.getBoundingClientRect();
    return {
      x: Math.min(bounds.width, Math.max(0, event.clientX - bounds.left)),
      y: Math.min(bounds.height, Math.max(0, event.clientY - bounds.top)),
      width: bounds.width,
      height: bounds.height,
    };
  }

  function update(event) {
    if (!dragging) return;
    const point = localPoint(event);
    const x = Math.min(dragging.x, point.x);
    const y = Math.min(dragging.y, point.y);
    const width = Math.abs(point.x - dragging.x);
    const height = Math.abs(point.y - dragging.y);
    Object.assign(selection.style, {
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
      height: `${height}px`,
    });
    selection.hidden = false;
    const valid = width >= minSize && height >= minSize && point.width > 0 && point.height > 0;
    region = valid
      ? {
          x: x / point.width,
          y: y / point.height,
          width: width / point.width,
          height: height / point.height,
        }
      : null;
    confirm.disabled = !valid;
    status.textContent = valid
      ? `${Math.round(width)} × ${Math.round(height)} · 可重新拖动`
      : `区域至少 ${minSize} × ${minSize}`;
  }

  area.addEventListener('pointerdown', event => {
    if (!ready || event.button !== 0) return;
    dragging = { ...localPoint(event), pointerId: event.pointerId };
    // 框选顶部倒计时时把工具条移到底部，避免遮挡目标。
    help.classList.toggle('at-bottom', dragging.y < area.clientHeight / 2);
    area.setPointerCapture(event.pointerId);
    update(event);
  });
  area.addEventListener('pointermove', update);
  area.addEventListener('pointerup', event => {
    if (!dragging || dragging.pointerId !== event.pointerId) return;
    update(event);
    dragging = null;
    area.releasePointerCapture(event.pointerId);
  });
  area.addEventListener('pointercancel', () => {
    dragging = null;
    region = null;
    selection.hidden = true;
    confirm.disabled = true;
    status.textContent = '请重新拖动框选';
  });
  function finish() {
    if (!ready || !region || dragging) return;
    ready = false;
    confirm.disabled = true;
    api.confirm(region);
  }
  confirm.addEventListener('click', finish);
  cancel.addEventListener('click', () => api.cancel());
  window.addEventListener('keydown', event => {
    if (event.code === 'Escape') {
      event.preventDefault();
      api.cancel();
    } else if (event.code === 'Enter' && event.target !== cancel) {
      event.preventDefault();
      finish();
    }
  });
  image.addEventListener('load', () => {
    ready = true;
    status.textContent = '请拖动框选';
  });
  image.addEventListener('error', () => {
    status.textContent = '画面加载失败，请取消后重试';
  });
  void api
    .initialize()
    .then(data => {
      if (!data) {
        status.textContent = '画面已失效，请取消后重试';
        return;
      }
      minSize = data.minSize;
      image.src = data.image;
    })
    .catch(() => {
      status.textContent = '画面加载失败，请取消后重试';
    });
})();
