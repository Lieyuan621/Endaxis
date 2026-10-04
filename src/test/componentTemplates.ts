import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as Vue from 'vue';
import { compileScript, compileTemplate, parse } from '@vue/compiler-sfc';
import { expect } from 'vitest';
import ts from 'typescript';

// Node-mode Vite imports SSR-only SFCs. Compile their unchanged production templates,
// keeping the imported production setup functions and object identities.
export function compileComponentTemplates(
  components: readonly (readonly [Pick<Vue.ComponentOptions, 'render'>, string])[],
  baseUrl: string,
) {
  for (const [component, path] of components) {
    const filename = fileURLToPath(new URL(path, baseUrl));
    const { descriptor } = parse(readFileSync(filename, 'utf8'), { filename });
    const script = compileScript(descriptor, { id: path });
    const result = compileTemplate({
      source: descriptor.template!.content,
      filename,
      id: path,
      compilerOptions: { bindingMetadata: script.bindings, expressionPlugins: ['typescript'] },
    });
    expect(result.errors).toEqual([]);
    const code = ts
      .transpileModule(result.code, {
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
      })
      .outputText.replace(
        /import \{([^}]+)\} from ["']vue["'];?/g,
        (_match, bindings: string) => `const {${bindings.replace(/ as /g, ': ')}} = Vue;`,
      )
      .replace('export function render', 'return function render');
    component.render = new Function('Vue', code)(Vue);
  }
}
