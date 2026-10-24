/** 本地小区域识别：只持久化选区，布防后顺序采样，不读取游戏进程。 */
const fs = require('node:fs');
const path = require('node:path');
const { message } = require('../../../app/messages.cjs');
const { performance } = require('node:perf_hooks');
const { createTemplate, matchTemplate, validateTemplate } = require('./template-match.cjs');

const WIDTH = 64;
const HEIGHT = 32;
const BITMAP_BYTES = WIDTH * HEIGHT * 4;
const MAX_STATE_BYTES = 128 * 1024;
const INTERVAL_MS = 200;
const THRESHOLD = 0.88;

function displaySignature(display) {
  const signature = {
    width: display?.bounds?.width,
    height: display?.bounds?.height,
    scaleFactor: display?.scaleFactor,
    rotation: display?.rotation,
  };
  return Object.values(signature).every(Number.isFinite) &&
    signature.width > 0 &&
    signature.height > 0 &&
    signature.scaleFactor > 0 &&
    [0, 90, 180, 270].includes(signature.rotation)
    ? signature
    : null;
}

function validRegion(region, signature) {
  if (!region || !signature) return false;
  const { x, y, width, height } = region;
  return (
    [x, y, width, height].every(value => typeof value === 'number' && Number.isFinite(value)) &&
    x >= 0 &&
    y >= 0 &&
    width > 0 &&
    height > 0 &&
    x + width <= 1 + Number.EPSILON &&
    y + height <= 1 + Number.EPSILON &&
    width * signature.width * signature.scaleFactor >= 16 &&
    height * signature.height * signature.scaleFactor >= 8
  );
}

function sameSignature(left, right) {
  return (
    left !== null &&
    right !== null &&
    ['width', 'height', 'scaleFactor', 'rotation'].every(key => left[key] === right[key])
  );
}

function createCountdownTrigger(options) {
  const { desktopCapturer, screen, nativeImage, stateFile, onUpdate, onTrigger } = options;
  const text = options.text ?? (key => message('zh-CN', key));
  const services = options.services ?? {};
  const files = services.fs ?? fs;
  const now = services.now ?? (() => performance.now());
  const delay = services.setTimeout ?? setTimeout;
  const cancel = services.clearTimeout ?? clearTimeout;
  let configuration = null;
  let phase = 'unconfigured';
  let armed = false;
  let disposed = false;
  let generation = 0;
  let timer = null;
  let capturing = false;
  let score = null;
  let error = null;
  let candidateAt = null;

  function info() {
    return {
      phase,
      configured: configuration !== null,
      armed,
      ...(configuration
        ? { displayLabel: configuration.displayLabel, previewUrl: configuration.previewUrl }
        : {}),
      ...(score === null ? {} : { score }),
      ...(error === null ? {} : { error }),
    };
  }

  function publish() {
    const value = info();
    try {
      onUpdate?.(value);
    } catch {
      // UI 监听器失败不能留下未处理的采集 Promise。
    }
    return value;
  }

  function stop() {
    generation++;
    armed = false;
    candidateAt = null;
    if (timer !== null) cancel(timer);
    timer = null;
  }

  function fail(message) {
    stop();
    phase = 'error';
    error = message;
    return publish();
  }

  function currentDisplay(displayId) {
    return screen.getAllDisplays().find(display => String(display.id) === displayId);
  }

  function requireCurrentDisplay() {
    const display = currentDisplay(configuration.displayId);
    if (!display) throw new Error(text('displayMissing'));
    if (!sameSignature(configuration.signature, displaySignature(display))) {
      throw new Error(text('displayChanged'));
    }
    return display;
  }

  function previewFromBitmap(bitmap) {
    const image = nativeImage.createFromBitmap(bitmap, { width: WIDTH, height: HEIGHT });
    if (image.isEmpty()) throw new Error(text('referenceUnreadable'));
    return image.toDataURL();
  }

  function load() {
    if (!stateFile || !files.existsSync(stateFile)) return;
    try {
      if (files.statSync(stateFile).size > MAX_STATE_BYTES) throw new Error('invalid state size');
      const value = JSON.parse(files.readFileSync(stateFile, 'utf8'));
      if (
        value?.version !== 1 ||
        typeof value.displayId !== 'string' ||
        value.displayId.length < 1 ||
        value.displayId.length > 128 ||
        !sameSignature(
          value.signature,
          displaySignature({ bounds: value.signature, ...value.signature }),
        ) ||
        !validRegion(value.region, value.signature) ||
        !validateTemplate(value.template) ||
        value.template.width !== WIDTH ||
        value.template.height !== HEIGHT ||
        typeof value.bitmap !== 'string'
      ) {
        throw new Error('invalid saved configuration');
      }
      const bitmap = Buffer.from(value.bitmap, 'base64');
      const template = createTemplate(bitmap, WIDTH, HEIGHT);
      if (
        bitmap.length !== BITMAP_BYTES ||
        bitmap.toString('base64') !== value.bitmap ||
        template === null ||
        JSON.stringify(template) !== JSON.stringify(value.template)
      ) {
        throw new Error('invalid saved reference');
      }
      const display = currentDisplay(value.displayId);
      configuration = {
        displayId: value.displayId,
        signature: {
          width: value.signature.width,
          height: value.signature.height,
          scaleFactor: value.signature.scaleFactor,
          rotation: value.signature.rotation,
        },
        region: {
          x: value.region.x,
          y: value.region.y,
          width: value.region.width,
          height: value.region.height,
        },
        template,
        bitmap: value.bitmap,
        displayLabel: String(display?.label || `${text('displayLabel')} ${value.displayId}`).slice(
          0,
          256,
        ),
        previewUrl: previewFromBitmap(bitmap),
      };
      requireCurrentDisplay();
      phase = 'ready';
    } catch {
      phase = 'error';
      error = text('configurationInvalid');
    }
  }

  function persist(next) {
    if (!stateFile) return;
    const temporary = `${stateFile}.tmp`;
    const value = {
      version: 1,
      displayId: next.displayId,
      signature: next.signature,
      region: next.region,
      template: next.template,
      bitmap: next.bitmap,
    };
    try {
      files.mkdirSync(path.dirname(stateFile), { recursive: true });
      files.writeFileSync(temporary, JSON.stringify(value), { encoding: 'utf8', mode: 0o600 });
      files.renameSync(temporary, stateFile);
    } catch (caught) {
      try {
        files.unlinkSync(temporary);
      } catch {
        // 原配置仍在，不把部分写入文件当作可用配置。
      }
      throw caught;
    }
  }

  function configure(selection) {
    if (disposed) return info();
    stop();
    try {
      if (typeof selection?.displayId !== 'string') throw new Error(text('chooseDisplay'));
      const display = currentDisplay(selection.displayId);
      const signature = displaySignature(display);
      if (!display || !validRegion(selection.region, signature)) {
        throw new Error(text('regionInvalid'));
      }
      if (!selection.referenceImage || selection.referenceImage.isEmpty()) {
        throw new Error(text('regionEmpty'));
      }
      const reference = selection.referenceImage.resize({ width: WIDTH, height: HEIGHT });
      const bitmap = reference.toBitmap();
      const template = createTemplate(bitmap, WIDTH, HEIGHT);
      if (template === null) {
        throw new Error(text('lowContrast'));
      }
      const next = {
        displayId: selection.displayId,
        displayLabel: String(
          display.label || `${text('displayLabel')} ${selection.displayId}`,
        ).slice(0, 256),
        signature,
        region: {
          x: selection.region.x,
          y: selection.region.y,
          width: selection.region.width,
          height: selection.region.height,
        },
        bitmap: bitmap.toString('base64'),
        template,
        previewUrl: reference.toDataURL(),
      };
      persist(next);
      configuration = next;
      score = null;
      error = null;
      phase = 'ready';
      return publish();
    } catch (caught) {
      return fail(caught.message || text('saveRegionFailed'));
    }
  }

  function schedule(token) {
    if (!armed || disposed || token !== generation) return;
    timer = delay(() => {
      timer = null;
      void sample(token);
    }, INTERVAL_MS);
    timer?.unref?.();
  }

  async function sample(token) {
    if (!armed || disposed || token !== generation) return;
    if (capturing) {
      schedule(token);
      return;
    }
    capturing = true;
    try {
      const display = requireCurrentDisplay();
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          width: Math.round(display.bounds.width * display.scaleFactor),
          height: Math.round(display.bounds.height * display.scaleFactor),
        },
        fetchWindowIcons: false,
      });
      if (!armed || disposed || token !== generation) return;
      requireCurrentDisplay();
      const image = sources.find(
        source => source.display_id === configuration.displayId,
      )?.thumbnail;
      if (!image || image.isEmpty()) throw new Error(text('captureDenied'));
      const size = image.getSize();
      if (
        !Number.isInteger(size.width) ||
        !Number.isInteger(size.height) ||
        size.width < 1 ||
        size.height < 1
      ) {
        throw new Error(text('captureInvalid'));
      }
      const region = configuration.region;
      // 与冻结图框选使用相同的向外取整，避免非整数 DPI 下模板错开一个像素。
      const x = Math.max(0, Math.min(size.width - 1, Math.floor(region.x * size.width)));
      const y = Math.max(0, Math.min(size.height - 1, Math.floor(region.y * size.height)));
      const right = Math.min(size.width, Math.ceil((region.x + region.width) * size.width));
      const bottom = Math.min(size.height, Math.ceil((region.y + region.height) * size.height));
      const bitmap = image
        .crop({ x, y, width: Math.max(1, right - x), height: Math.max(1, bottom - y) })
        .resize({ width: WIDTH, height: HEIGHT })
        .toBitmap();
      score = matchTemplate(configuration.template, bitmap, WIDTH, HEIGHT);
      if (phase === 'checking') {
        phase = score >= THRESHOLD ? 'waiting-clear' : 'watching';
      } else if (phase === 'waiting-clear') {
        if (score < THRESHOLD) phase = 'watching';
      } else if (score >= THRESHOLD) {
        if (candidateAt === null) {
          candidateAt = now();
          phase = 'confirming';
        } else {
          const elapsedSeconds = Math.max(0, (now() - candidateAt) / 1000);
          stop();
          phase = 'triggered';
          publish();
          try {
            const result = onTrigger?.({ elapsedSeconds });
            result?.catch?.(() => {});
          } catch {
            // 识别已停止，不让 UI 回调异常重新激活捕获。
          }
          return;
        }
      } else {
        candidateAt = null;
        phase = 'watching';
      }
      publish();
    } catch (caught) {
      if (armed && !disposed && token === generation) {
        fail(caught.message || text('captureFailed'));
      }
    } finally {
      capturing = false;
      schedule(token);
    }
  }

  function arm() {
    if (disposed) return info();
    stop();
    if (!configuration) return fail(text('selectFirst'));
    try {
      requireCurrentDisplay();
      armed = true;
      score = null;
      error = null;
      phase = 'checking';
      publish();
      void sample(generation);
      return info();
    } catch (caught) {
      return fail(caught.message);
    }
  }

  function disarm() {
    if (disposed) return info();
    stop();
    phase = configuration ? 'ready' : 'unconfigured';
    error = null;
    score = null;
    return publish();
  }

  function clear() {
    if (disposed) return info();
    stop();
    configuration = null;
    phase = 'unconfigured';
    score = null;
    error = null;
    try {
      if (stateFile && files.existsSync(stateFile)) files.unlinkSync(stateFile);
    } catch {
      return fail(text('clearFailed'));
    }
    return publish();
  }

  function onDisplayChanged() {
    if (!configuration || disposed) return;
    try {
      requireCurrentDisplay();
    } catch (caught) {
      fail(caught.message);
    }
  }

  function dispose() {
    if (disposed) return;
    stop();
    disposed = true;
    phase = configuration ? 'ready' : 'unconfigured';
    screen.removeListener?.('display-removed', onDisplayChanged);
    screen.removeListener?.('display-metrics-changed', onDisplayChanged);
  }

  load();
  screen.on?.('display-removed', onDisplayChanged);
  screen.on?.('display-metrics-changed', onDisplayChanged);
  return { info, configure, arm, disarm, clear, dispose };
}

module.exports = { createCountdownTrigger };
