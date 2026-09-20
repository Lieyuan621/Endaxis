/** 浏览器中的当前时间轴项目。使用 IndexedDB，避免较大项目触及 localStorage 配额。 */
import type { EndaxisProjectDocument } from '../core/project/schema';
import { serializeProjectDocument } from '../core/project/serialization';

const DATABASE_NAME = 'endaxis-timeline';
const STORE_NAME = 'projects';
const CURRENT_PROJECT_KEY = 'current';
let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise !== null) return databasePromise;
  const opening = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('当前浏览器不支持项目自动保存'));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('无法打开浏览器项目存储'));
  }).catch(error => {
    databasePromise = null;
    throw error;
  });
  databasePromise = opening;
  return opening;
}

export async function loadBrowserProject(): Promise<string | undefined> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(CURRENT_PROJECT_KEY);
    request.onsuccess = () => {
      const value: unknown = request.result;
      if (value === undefined || typeof value === 'string') resolve(value);
      else reject(new Error('浏览器中的项目数据格式不正确'));
    };
    request.onerror = () => reject(request.error ?? new Error('读取浏览器项目失败'));
  });
}

export async function saveBrowserProject(project: EndaxisProjectDocument): Promise<void> {
  const content = serializeProjectDocument(project);
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(content, CURRENT_PROJECT_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error('浏览器项目自动保存失败'));
    transaction.onerror = () => reject(transaction.error ?? new Error('浏览器项目自动保存失败'));
  });
}
