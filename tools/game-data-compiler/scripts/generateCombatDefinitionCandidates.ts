/**
 * 同一轮生成干员、公共 Buff、装备和机制候选。
 * 每个装备/机制领域只编译一次：先收集未优化定义的用途，再渲染同一批对象并释放。
 * 所有领域渲染成功后才写目录；独立检查重新调用本入口，不接收上一轮的定义或摘要。
 */
import path from 'node:path';
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

type EquipmentDomainReport =
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
  const equipment: EquipmentDomainReport[] = [];
  const externalUsage = await compileEntityValueConsumers(args, {
    weapons(batch) {
      const rendered = renderWeaponDefinitionsFromCompiled(batch, args.optimization);
      outputs.push(
        {
          directory: path.join(candidateRoot, 'src/data/equipment/generated-weapons'),
          files: rendered.files,
        },
        { directory: path.join(auditRoot, 'weapons'), files: rendered.auditFiles },
      );
      equipment.push({ domain: 'weapons', summary: rendered.summary });
    },
    async gears(batch) {
      const rendered = await renderGearDefinitionsFromCompiled(batch);
      outputs.push({
        directory: path.join(candidateRoot, 'src/data/equipment/generated'),
        files: rendered.files,
      });
      equipment.push({ domain: 'gears', summary: rendered.summary });
    },
    async gearSets(batch) {
      const rendered = await renderGearSetDefinitionsFromCompiled(batch, args.optimization);
      outputs.push({
        directory: path.join(candidateRoot, 'src/data/equipment/generated-gear-sets'),
        files: rendered.files,
      });
      equipment.push({ domain: 'gear-sets', summary: rendered.summary });
    },
    async mechanics(batch) {
      const rendered = await renderContingencyContractDefinitionsFromCompiled(batch);
      outputs.push({
        directory: path.join(candidateRoot, 'src/data/mechanics/generated'),
        files: rendered.files,
      });
      equipment.push({ domain: 'mechanics', summary: rendered.summary });
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
  if (operators.commonBuffs === undefined)
    throw new Error('combat candidates require the complete common Buff collection');
  outputs.push(
    { directory: operatorOutput, files: operators.files },
    { directory: operatorAudit, files: operators.auditFiles },
    {
      directory: path.join(candidateRoot, 'src/data/buffs/generated'),
      files: operators.commonBuffs.files,
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
  return { operators: operators.summary, equipment };
}

function containsDirectory(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return (
    relative === '' ||
    (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))
  );
}
