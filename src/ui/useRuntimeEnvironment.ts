import { onScopeDispose, shallowRef } from 'vue';
import { observeRuntimeEnvironment, readRuntimeEnvironment } from '../platform/runtimeEnvironment';

/** 快照由当前界面作用域持有，卸载后不保留全局监听或过期的视口信息。 */
export function useRuntimeEnvironment() {
  const environment = shallowRef(readRuntimeEnvironment());
  onScopeDispose(observeRuntimeEnvironment(value => (environment.value = value)));
  return environment;
}
