/** 预施法请求监听目录的登记、校验和注销操作。 */
import type { PostSkillRequestListenerState } from '../state/environmentState';

export function registerPostSkillRequestListener(
  state: PostSkillRequestListenerState,
  ownerId: string,
): number {
  const id = state.nextRegistrationId++;
  const registrations = state.registrationsByOwner.get(ownerId) ?? [];
  if (!state.registrationsByOwner.has(ownerId)) {
    state.registrationsByOwner.set(ownerId, registrations);
  }
  registrations.push(id);
  return id;
}

export function requirePostSkillRequestListener(
  state: PostSkillRequestListenerState,
  ownerId: string,
  registrationId: number,
): void {
  if (!state.registrationsByOwner.get(ownerId)?.includes(registrationId)) {
    throw new Error(`post-skill request listener '${ownerId}:${registrationId}' is missing`);
  }
}

export function unregisterPostSkillRequestListener(
  state: PostSkillRequestListenerState,
  ownerId: string,
  registrationId: number,
): void {
  const registrations = state.registrationsByOwner.get(ownerId);
  if (registrations === undefined) return;
  const index = registrations.indexOf(registrationId);
  if (index < 0) return;
  registrations.splice(index, 1);
  if (registrations.length === 0) state.registrationsByOwner.delete(ownerId);
}
