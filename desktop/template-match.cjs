'use strict';

// This is a bounded visual template comparison, not digit recognition or OCR.
const TEMPLATE_VERSION = 1;
const MAX_WIDTH = 128;
const MAX_HEIGHT = 64;
const MAX_PIXELS = 8192;
const MIN_CONTRAST = 6;
const MIN_EDGE_ENERGY = 4;

function validDimensions(width, height) {
  return (
    Number.isInteger(width) &&
    Number.isInteger(height) &&
    width >= 8 &&
    height >= 8 &&
    width <= MAX_WIDTH &&
    height <= MAX_HEIGHT &&
    width * height <= MAX_PIXELS
  );
}

function readGray(bitmap, width, height) {
  if (
    !validDimensions(width, height) ||
    !(bitmap instanceof Uint8Array || bitmap instanceof Uint8ClampedArray) ||
    bitmap.length !== width * height * 4
  ) {
    return null;
  }
  const gray = new Array(width * height);
  for (let index = 0; index < gray.length; index++) {
    const offset = index * 4;
    // Both NativeImage BGRA and RGBA buffers have alpha last.
    gray[index] = Math.round((bitmap[offset] + bitmap[offset + 1] + bitmap[offset + 2]) / 3);
  }
  return gray;
}

function features(gray, width, height) {
  const horizontal = new Float64Array(gray.length);
  const vertical = new Float64Array(gray.length);
  let sum = 0;
  let squared = 0;
  let edgeSquared = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const value = gray[index];
      sum += value;
      squared += value * value;
      const dx =
        gray[y * width + Math.min(width - 1, x + 1)] - gray[y * width + Math.max(0, x - 1)];
      const dy =
        gray[Math.min(height - 1, y + 1) * width + x] - gray[Math.max(0, y - 1) * width + x];
      horizontal[index] = dx;
      vertical[index] = dy;
      edgeSquared += dx * dx + dy * dy;
    }
  }
  const mean = sum / gray.length;
  const contrast = Math.sqrt(Math.max(0, squared / gray.length - mean * mean));
  const edgeEnergy = Math.sqrt(edgeSquared / (2 * gray.length));
  if (contrast < MIN_CONTRAST || edgeEnergy < MIN_EDGE_ENERGY) return null;
  return { gray, horizontal, vertical };
}

function validateTemplate(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  if (
    keys.length !== 4 ||
    !keys.every(key => ['version', 'width', 'height', 'gray'].includes(key)) ||
    value.version !== TEMPLATE_VERSION ||
    !validDimensions(value.width, value.height) ||
    !Array.isArray(value.gray) ||
    value.gray.length !== value.width * value.height
  ) {
    return false;
  }
  for (let index = 0; index < value.gray.length; index++) {
    const pixel = value.gray[index];
    if (!Number.isInteger(pixel) || pixel < 0 || pixel > 255) return false;
  }
  return features(value.gray, value.width, value.height) !== null;
}

function createTemplate(bitmap, width, height) {
  const gray = readGray(bitmap, width, height);
  if (!gray || !features(gray, width, height)) return null;
  return { version: TEMPLATE_VERSION, width, height, gray };
}

function clampScore(value) {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

function compareAtOffset(template, candidate, width, height, offsetX, offsetY) {
  let count = 0;
  let sumTemplate = 0;
  let sumCandidate = 0;
  let squaredTemplate = 0;
  let squaredCandidate = 0;
  let product = 0;
  let edgeProduct = 0;
  let templateEdgeSquared = 0;
  let candidateEdgeSquared = 0;
  // Skip boundary gradients so a one-pixel translation compares the shared content.
  const left = Math.max(1, 1 - offsetX);
  const right = Math.min(width - 1, width - 1 - offsetX);
  const top = Math.max(1, 1 - offsetY);
  const bottom = Math.min(height - 1, height - 1 - offsetY);
  for (let y = top; y < bottom; y++) {
    for (let x = left; x < right; x++) {
      const first = y * width + x;
      const second = (y + offsetY) * width + x + offsetX;
      const a = template.gray[first];
      const b = candidate.gray[second];
      count++;
      sumTemplate += a;
      sumCandidate += b;
      squaredTemplate += a * a;
      squaredCandidate += b * b;
      product += a * b;
      const ax = template.horizontal[first];
      const ay = template.vertical[first];
      const bx = candidate.horizontal[second];
      const by = candidate.vertical[second];
      edgeProduct += ax * bx + ay * by;
      templateEdgeSquared += ax * ax + ay * ay;
      candidateEdgeSquared += bx * bx + by * by;
    }
  }
  const covariance = product - (sumTemplate * sumCandidate) / count;
  const templateVariance = Math.max(0, squaredTemplate - (sumTemplate * sumTemplate) / count);
  const candidateVariance = Math.max(0, squaredCandidate - (sumCandidate * sumCandidate) / count);
  const grayNorm = Math.sqrt(templateVariance * candidateVariance);
  const edgeNorm = Math.sqrt(templateEdgeSquared * candidateEdgeSquared);
  const grayScore = clampScore(covariance / grayNorm);
  const edgeScore = clampScore(edgeProduct / edgeNorm);
  // A crop containing just a border can have a uniform interior; use its informative edges.
  if (grayNorm < 1e-6) return edgeScore;
  if (edgeNorm < 1e-6) return grayScore;
  // Normalized correlations tolerate uniform brightness/contrast changes; edges dominate.
  return clampScore(grayScore * 0.35 + edgeScore * 0.65);
}

function matchTemplate(template, bitmap, width, height) {
  if (!validateTemplate(template) || template.width !== width || template.height !== height)
    return 0;
  const gray = readGray(bitmap, width, height);
  if (!gray) return 0;
  const candidateFeatures = features(gray, width, height);
  if (!candidateFeatures) return 0;
  const templateFeatures = features(template.gray, width, height);
  let best = 0;
  for (let offsetY = -1; offsetY <= 1; offsetY++) {
    for (let offsetX = -1; offsetX <= 1; offsetX++) {
      best = Math.max(
        best,
        compareAtOffset(templateFeatures, candidateFeatures, width, height, offsetX, offsetY),
      );
    }
  }
  return best;
}

module.exports = { createTemplate, matchTemplate, validateTemplate };
