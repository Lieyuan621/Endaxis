import type { GraphSharedEntityValueUsage } from '../src/compiler/optimization/graphValueOptimization.ts';
/**
 * 同一轮生成干员、公共 Buff、装备和机制候选。
 * 每个装备/机制领域只编译一次：先收集未优化定义的用途，再渲染同一批对象并释放。
 * 所有领域渲染成功后才写目录；独立检查重新调用本入口，不接收上一轮的定义或摘要。
 */
import path from 'node:path';
import { renderConsumableDefinitionsFromCompiled } from './generateConsumableDefinitions.ts';
import {
  renderOperatorDefinitionBatch,
  type OperatorDefinitionCandidateArguments,
} from './generateOperatorDefinitionCandidates.ts';
import { compileEntityValueConsumers } from './compileEntityValueConsumers.ts';
import { renderWeaponDefinitionsFromCompiled } from './generateWeaponDefinitions.ts';
import { formatGeneratedSource } from './formatGeneratedSource.ts';
import { renderGearDefinitionsFromCompiled } from './generateGearDefinitions.ts';
import { renderGearSetDefinitionsFromCompiled } from './generateGearSetDefinitions.ts';
import { renderContingencyContractDefinitionsFromCompiled } from './generateContingencyContractDefinitions.ts';
import {
  checkGeneratedDefinitionFiles,
  writeGeneratedDefinitionFiles,
  type RenderedDefinitionFileSource,
} from '../src/compiler/publication/writeGeneratedDefinitionFiles.ts';

export interface CombatDefinitionCandidateArguments extends Omit<
  OperatorDefinitionCandidateArguments,
  'outputRoot' | 'auditRoot' | 'commonBuffOutput'
> {
  readonly candidateRoot: string;
  readonly auditRoot: string;
  readonly mechanicScope?: string;
}

type ResourceDomainReport =
  | {
      readonly domain: 'consumables';
      readonly summary: Awaited<
        ReturnType<typeof renderConsumableDefinitionsFromCompiled>
      >['summary'];
    }
  | {
      readonly domain: 'weapons';
      readonly summary: ReturnType<typeof renderWeaponDefinitionsFromCompiled>['summary'];
    }
  | {
      readonly domain: 'gears';
      readonly summary: Awaited<ReturnType<typeof renderGearDefinitionsFromCompiled>>['summary'];
    }
  | {
      readonly domain: 'gear-sets';
      readonly summary: Awaited<ReturnType<typeof renderGearSetDefinitionsFromCompiled>>['summary'];
    }
  | {
      readonly domain: 'mechanics';
      readonly summary: Awaited<
        ReturnType<typeof renderContingencyContractDefinitionsFromCompiled>
      >['summary'];
    };

export async function generateCombatDefinitionCandidates(args: CombatDefinitionCandidateArguments) {
  const candidateRoot = path.resolve(args.candidateRoot);
  const auditRoot = path.resolve(args.auditRoot);
  const projectRoot = path.resolve(import.meta.dirname, '../../..');
  for (const output of [candidateRoot, auditRoot]) {
    if (output === path.dirname(output) || containsDirectory(output, projectRoot))
      throw new Error('combat candidates require isolated output directories');
    for (const formal of ['src', 'public', 'tools', 'docs']) {
      if (containsDirectory(path.join(projectRoot, formal), output))
        throw new Error('combat candidates cannot replace project source directories');
    }
  }
  if (containsDirectory(candidateRoot, auditRoot) || containsDirectory(auditRoot, candidateRoot))
    throw new Error('combat candidate and audit directories must not overlap');

  const outputs: {
    readonly directory: string;
    readonly files: readonly RenderedDefinitionFileSource[];
  }[] = [];
  const resources: ResourceDomainReport[] = [];
  let consumableBuffFile: RenderedDefinitionFileSource | undefined;
  // 只保留投影后的定义；全部消费者收齐后再优化，不重复编译来源。
  const pendingRendering: ((
    usage: GraphSharedEntityValueUsage | undefined,
  ) => void | Promise<void>)[] = [];
  const externalUsage = await compileEntityValueConsumers(args, {
    consumables(batch) {
      pendingRendering.push(async sharedUsage => {
        const rendered = await renderConsumableDefinitionsFromCompiled(
          batch,
          args.optimization,
          sharedUsage,
        );
        consumableBuffFile = rendered.buffFile;
        outputs.push({
          directory: path.join(candidateRoot, 'src/data/consumables/generated'),
          files: [rendered.definitionFile],
        });
        resources.push({ domain: 'consumables', summary: rendered.summary });
      });
    },
    weapons(batch) {
      pendingRendering.push(async sharedUsage => {
        const rendered = renderWeaponDefinitionsFromCompiled(batch, args.optimization, sharedUsage);
        outputs.push(
          {
            directory: path.join(candidateRoot, 'src/data/equipment/generated-weapons'),
            files: rendered.files,
          },
          { directory: path.join(auditRoot, 'weapons'), files: rendered.auditFiles },
        );
        resources.push({ domain: 'weapons', summary: rendered.summary });
      });
    },
    gears(batch) {
      pendingRendering.push(async () => {
        const rendered = await renderGearDefinitionsFromCompiled(batch);
        outputs.push({
          directory: path.join(candidateRoot, 'src/data/equipment/generated'),
          files: rendered.files,
        });
        resources.push({ domain: 'gears', summary: rendered.summary });
      });
    },
    gearSets(batch) {
      pendingRendering.push(async sharedUsage => {
        const rendered = await renderGearSetDefinitionsFromCompiled(
          batch,
          args.optimization,
          sharedUsage,
        );
        outputs.push({
          directory: path.join(candidateRoot, 'src/data/equipment/generated-gear-sets'),
          files: rendered.files,
        });
        resources.push({ domain: 'gear-sets', summary: rendered.summary });
      });
    },
    mechanics(batch) {
      pendingRendering.push(async sharedUsage => {
        const rendered = await renderContingencyContractDefinitionsFromCompiled(
          batch,
          args.optimization,
          sharedUsage,
        );
        outputs.push({
          directory: path.join(candidateRoot, 'src/data/contingencyContract/generated'),
          files: rendered.files,
        });
        resources.push({ domain: 'mechanics', summary: rendered.summary });
      });
    },
  });
  const operatorOutput = path.join(candidateRoot, 'src/data/operators');
  const operatorAudit = path.join(auditRoot, 'operators');
  const operators = await renderOperatorDefinitionBatch(
    {
      ...args,
      outputRoot: operatorOutput,
      auditRoot: operatorAudit,
      includeCommonBuffs: true,
    },
    externalUsage,
  );
  while (pendingRendering.length > 0) await pendingRendering.shift()!(operators.sharedEntityUsage);
  if (operators.commonBuffs === undefined || consumableBuffFile === undefined)
    throw new Error('combat candidates require the complete common Buff collection');
  outputs.push(
    { directory: operatorOutput, files: operators.files },
    { directory: operatorAudit, files: operators.auditFiles },
    {
      directory: path.join(candidateRoot, 'src/data/buffs/generated'),
      files: [...operators.commonBuffs.files, consumableBuffFile],
    },
  );
  for (const output of outputs) {
    const files: RenderedDefinitionFileSource[] = [];
    for (const file of output.files) {
      files.push({
        ...file,
        content: await formatGeneratedSource(
          file.content,
          path.join(output.directory, file.relativePath),
        ),
      });
    }
    if (args.check) checkGeneratedDefinitionFiles(output.directory, files);
    else await writeGeneratedDefinitionFiles(output.directory, files);
  }
  return { operators: operators.summary, resources };
}

function containsDirectory(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return (
    relative === '' ||
    (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))
  );
}
