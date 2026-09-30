import { describe, expect, it } from 'vitest';
import { gearDefinitions, gearSetDefinitions } from './equipmentDefinitions';

describe('equipmentDefinitions', () => {
  it('keeps every native set reference closed inside the generated set catalog', () => {
    const registered = new Set<string>(gearSetDefinitions.map(definition => definition.slug));
    const referenced = new Set(
      gearDefinitions
        .map(definition => definition.gearSetSlug)
        .filter((slug): slug is string => slug !== undefined),
    );
    for (const slug of referenced) {
      expect(registered.has(slug)).toBe(true);
    }
  });
});
