import type { OperatorDefinition } from '../core/game-data/operatorDefinition';
import type { EndaxisProjectDocument } from '../core/project/schema';
import { getProjectDefinitionLibrary } from '../core/project/projectDefinitionLibrary';

/** Build a persisted graph operator definition for read-path tests. */
export function withProjectOperatorTemplate(
  project: EndaxisProjectDocument,
  id: string,
  name: string,
  definition: OperatorDefinition,
): EndaxisProjectDocument {
  const library = getProjectDefinitionLibrary(project);
  const copiedDefinition = structuredClone({
    ...definition,
    slug: id,
    displayName: name,
    assetSlug: definition.assetSlug ?? definition.slug,
  });
  return {
    ...project,
    definitionLibrary: {
      ...library,
      operators: {
        ...library.operators,
        [id]: {
          id,
          name,
          origin: { templateId: definition.slug },
          definition: copiedDefinition,
        },
      },
    },
  };
}
