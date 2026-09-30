/** Render repeated schema objects once while preserving their JSON values and field order. */
import { createHash } from 'node:crypto';

export function renderSharedSchemaObjects(
  value: unknown,
  prefix: string,
  minimumLength = 600,
): { declarations: string; expression: string } {
  const counts = new Map<string, number>();
  function collect(item: unknown): void {
    if (item === null || typeof item !== 'object') return;
    if (!Array.isArray(item)) {
      const key = JSON.stringify(item);
      if (key.length >= minimumLength) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    for (const child of Object.values(item)) collect(child);
  }
  collect(value);

  const repeated = [...counts]
    .filter(([key, count]) => count > 1 && (count - 1) * key.length > minimumLength)
    .map(([key]) => key)
    .sort((left, right) => left.length - right.length || left.localeCompare(right));
  const names = new Map(
    repeated.map(key => [
      key,
      `${prefix}_${createHash('sha256').update(key).digest('hex').slice(0, 16)}`,
    ]),
  );

  function render(item: unknown, isDeclaration = false): string {
    if (item === null || typeof item !== 'object') {
      const literal = JSON.stringify(item);
      if (literal === undefined) throw new Error('schema contains a non-JSON value');
      return literal;
    }
    if (!Array.isArray(item) && !isDeclaration) {
      const name = names.get(JSON.stringify(item));
      if (name !== undefined) return name;
    }
    if (Array.isArray(item)) return `[${item.map(child => render(child)).join(',')}]`;
    return `{${Object.entries(item)
      .map(([key, child]) => `${JSON.stringify(key)}:${render(child)}`)
      .join(',')}}`;
  }

  const declarations = repeated
    .map(key => `const ${names.get(key)} = ${render(JSON.parse(key), true)} as const;`)
    .join('\n');
  return { declarations, expression: render(value) };
}
