import { desktopI18n } from '../../../i18n';
import type { SupportedLocale } from '@/i18n/elementPlusLocale';
import type { OverlayPlan } from './plan';

/** HUD 只消费此导出结果；不持有项目、模拟器或编辑器的可写引用。 */
export interface OverlaySnapshot {
  readonly version: 1;
  readonly id: string;
  readonly scenarioName: string;
  readonly locale: SupportedLocale;
  readonly plan: OverlayPlan;
}

const DATABASE_NAME = 'endaxis-overlay';
const STORE_NAME = 'snapshots';
let databasePromise: Promise<IDBDatabase> | null = null;

function database(): Promise<IDBDatabase> {
  if (databasePromise !== null) return databasePromise;
  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onerror = () =>
      reject(request.error ?? new Error(desktopI18n.global.t('overlay.storage.openFailed')));
    request.onsuccess = () => {
      request.result.onversionchange = () => {
        request.result.close();
        databasePromise = null;
      };
      resolve(request.result);
    };
  }).catch(error => {
    databasePromise = null;
    throw error;
  });
  return databasePromise;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function isSnapshot(value: unknown): value is OverlaySnapshot {
  if (!isRecord(value) || value.version !== 1 || typeof value.id !== 'string') return false;
  if (typeof value.scenarioName !== 'string' || !['zh-CN', 'en'].includes(String(value.locale)))
    return false;
  const plan = value.plan;
  if (!isRecord(plan) || !Array.isArray(plan.casts) || !Array.isArray(plan.tracks)) return false;
  return (
    Number.isFinite(plan.startTime) &&
    Number.isFinite(plan.duration) &&
    typeof plan.hasCasts === 'boolean' &&
    Number.isFinite(plan.maxSp) &&
    Number.isFinite(plan.initialSp) &&
    Array.isArray(plan.spPoints) &&
    isRecord(plan.gaugePoints) &&
    isRecord(plan.gaugeMaxValues) &&
    isRecord(plan.comboWindows)
  );
}

export async function saveOverlaySnapshot(snapshot: OverlaySnapshot): Promise<void> {
  const db = await database();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(snapshot, 'current');
    transaction.oncomplete = () => resolve();
    transaction.onabort = transaction.onerror = () =>
      reject(transaction.error ?? new Error(desktopI18n.global.t('overlay.storage.exportFailed')));
  });
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const channel = new BroadcastChannel('endaxis-overlay');
      try {
        channel.postMessage(snapshot.id);
      } finally {
        channel.close();
      }
    } catch {
      // 通知是加速路径；受限环境仍可由 HUD 定时读取已经保存成功的快照。
    }
  }
}

export async function loadOverlaySnapshot(): Promise<OverlaySnapshot | undefined> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get('current');
    request.onerror = () =>
      reject(request.error ?? new Error(desktopI18n.global.t('overlay.storage.readFailed')));
    request.onsuccess = () => {
      const value: unknown = request.result;
      if (value === undefined || isSnapshot(value)) resolve(value);
      else reject(new Error(desktopI18n.global.t('overlay.storage.invalidSnapshot')));
    };
  });
}
