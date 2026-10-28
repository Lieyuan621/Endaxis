/** Independent theoretical calculator. Coordinates are metres, time is seconds, Y is up. */
export type Vector3 = readonly [number, number, number];
export interface TrajectoryInput {
  position: Vector3;
  velocity: Vector3;
  acceleration?: Vector3;
  durationSeconds: number;
  stepSeconds?: number;
  target?: { center: Vector3; radius: number };
  groundY?: number;
}
export interface Contact {
  seconds: number;
  frame: number;
  position: Vector3;
}
const point = (input: TrajectoryInput, time: number): Vector3 => {
  const axis = (i: 0 | 1 | 2) =>
    input.position[i] +
    input.velocity[i] * time +
    ((input.acceleration?.[i] ?? 0) * time * time) / 2;
  return [axis(0), axis(1), axis(2)];
};
const contact = (input: TrajectoryInput, seconds: number): Contact => ({
  seconds,
  frame: Math.ceil(seconds * 30 - 1e-9),
  position: point(input, seconds),
});

/** Target contacts use swept segments; reducing stepSeconds improves curved-path accuracy. */
export function calculateTrajectory(input: TrajectoryInput) {
  const step = input.stepSeconds ?? 1 / 300;
  const vectors = [input.position, input.velocity, input.acceleration ?? [0, 0, 0]];
  if (
    vectors.some(v => v.length !== 3 || v.some(n => !Number.isFinite(n))) ||
    !Number.isFinite(step) ||
    step <= 0 ||
    !Number.isFinite(input.durationSeconds) ||
    input.durationSeconds < 0 ||
    input.durationSeconds / step > 1_000_000
  )
    throw new Error('Invalid trajectory parameters');
  if (
    input.target &&
    (!Number.isFinite(input.target.radius) ||
      input.target.radius < 0 ||
      input.target.center.length !== 3 ||
      input.target.center.some(n => !Number.isFinite(n)))
  )
    throw new Error('Invalid target sphere');
  if (input.groundY !== undefined && !Number.isFinite(input.groundY))
    throw new Error('Invalid ground');
  const samples: Contact[] = [contact(input, 0)];
  const targetEntries: Contact[] = [];
  const sphereDistance = (p: Vector3) =>
    input.target
      ? p.reduce((s, x, i) => s + (x - input.target!.center[i]!) ** 2, 0) - input.target.radius ** 2
      : Infinity;
  let inside = sphereDistance(input.position) <= 0;
  if (inside) targetEntries.push(contact(input, 0));
  let ground: Contact | undefined;
  if (input.groundY !== undefined && input.position[1] <= input.groundY) ground = contact(input, 0);
  for (let index = 1; !ground && samples.at(-1)!.seconds < input.durationSeconds; index++) {
    const previous = samples.at(-1)!;
    let end = Math.min(index * step, input.durationSeconds);
    let next = point(input, end);
    if (input.groundY !== undefined && next[1] <= input.groundY) {
      let low = previous.seconds;
      let high = end;
      for (let j = 0; j < 40; j++) {
        const middle = (low + high) / 2;
        if (point(input, middle)[1] > input.groundY) low = middle;
        else high = middle;
      }
      ground = contact(input, high);
      end = high;
      next = ground.position;
    }
    if (input.target && !inside) {
      const delta = next.map((n, i) => n - previous.position[i]!);
      const relative = previous.position.map((n, i) => n - input.target!.center[i]!);
      const a = delta.reduce((s, n) => s + n * n, 0);
      const b = 2 * delta.reduce((s, n, i) => s + n * relative[i]!, 0);
      const c = sphereDistance(previous.position);
      const discriminant = b * b - 4 * a * c;
      if (a > 0 && discriminant >= 0) {
        const fraction = (-b - Math.sqrt(discriminant)) / (2 * a);
        if (fraction >= 0 && fraction <= 1)
          targetEntries.push(
            contact(input, previous.seconds + fraction * (end - previous.seconds)),
          );
      }
    }
    inside = sphereDistance(next) <= 0;
    samples.push(contact(input, end));
  }
  return { samples, targetEntries, ground, endReason: ground ? 'ground' : 'timeLimit' };
}
