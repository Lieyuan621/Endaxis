/**
 * 一轮干员规划共用的只读来源。固定表和解析后的目录跨干员复用，技能、Buff、投射物原文按干员释放。
 * 每次生成、每次独立检查都必须新建实例；这里不缓存依赖等级、黑板或场景的动作图和编译结果。
 */
import path from 'node:path';
import { SourceFileCache } from '../src/source/sourceFileCache.ts';
import type { CompiledAbilityEntityTemplateCatalogSource } from '../src/compiler/abilities/abilityEntityCatalog.ts';
import {
  parseGlobalBuffTemplateCatalogSource,
  type GlobalBuffTemplateCatalogSource,
} from '../src/source/globalBuffTemplate.ts';
import {
  parseSkillSettingCatalogSource,
  type SkillSettingCatalogSource,
} from '../src/source/skillSettingCatalog.ts';
import { readGeneratedTimeDilationPriorities } from '../src/compiler/catalogs/generatedTimeDilationCatalog.ts';
import { readAbilityEntityTemplates } from './readAbilityEntityTemplates.ts';
import { readGameplayTagPaths } from './readGameplayTagPaths.ts';

export class OperatorPlanningSources {
  private readonly shared = new SourceFileCache(32 * 1024 * 1024);
  private readonly currentOperator = new SourceFileCache(16 * 1024 * 1024);
  private readonly sharedPaths: ReadonlySet<string>;
  private readonly entities = new Map<string, CompiledAbilityEntityTemplateCatalogSource>();
  private readonly globals = new Map<string, GlobalBuffTemplateCatalogSource>();
  private readonly settings = new Map<string, SkillSettingCatalogSource>();
  private readonly tags = new Map<string, readonly string[]>();
  private readonly priorities = new Map<string, ReadonlyMap<number, number>>();

  constructor(paths: {
    readonly manifest?: string;
    readonly tableRoot?: string;
    readonly skillPatchTable: string;
    readonly globalBuffCatalog?: string;
    readonly skillSettingCatalog?: string;
  }) {
    this.sharedPaths = new Set(
      [
        paths.manifest,
        paths.skillPatchTable,
        paths.globalBuffCatalog,
        paths.skillSettingCatalog,
        ...(paths.tableRoot === undefined
          ? []
          : [
              'CharacterTable',
              'CharGrowthTable',
              'CharacterPotentialTable',
              'PotentialTalentEffectTable',
              'SkillConditionTable',
            ].map(name => path.join(paths.tableRoot!, `${name}.json`))),
      ]
        .filter((file): file is string => file !== undefined)
        .map(file => path.resolve(file)),
    );
  }

  private cache(file: string): SourceFileCache {
    return this.sharedPaths.has(path.resolve(file)) ? this.shared : this.currentOperator;
  }

  readonly readJson = (file: string): unknown => this.cache(file).readJson(file);
  readonly readJsonDocument = (file: string) => this.cache(file).readJsonDocument(file);
  readonly readText = (file: string): string => this.cache(file).readText(file);

  /** 完成一名干员的规划后释放原始资源；已收集的定义不依赖此缓存继续存活。 */
  releaseOperator(): void {
    this.currentOperator.clear();
  }

  /** 全部来源编译完成后释放原文与解析目录，避免它们与后续优化、渲染同时驻留。 */
  clear(): void {
    this.shared.clear();
    this.currentOperator.clear();
    this.entities.clear();
    this.globals.clear();
    this.settings.clear();
    this.tags.clear();
    this.priorities.clear();
  }

  abilityEntities(file: string): CompiledAbilityEntityTemplateCatalogSource {
    const key = path.resolve(file);
    let value = this.entities.get(key);
    if (value === undefined) {
      value = readAbilityEntityTemplates(key, this.readJson);
      this.entities.set(key, value);
    }
    return value;
  }

  globalBuffs(file: string): GlobalBuffTemplateCatalogSource {
    const key = path.resolve(file);
    let value = this.globals.get(key);
    if (value === undefined) {
      value = parseGlobalBuffTemplateCatalogSource(this.readJson(key));
      this.globals.set(key, value);
    }
    return value;
  }

  skillSettings(file: string): SkillSettingCatalogSource {
    const key = path.resolve(file);
    let value = this.settings.get(key);
    if (value === undefined) {
      value = parseSkillSettingCatalogSource(this.readJson(key));
      this.settings.set(key, value);
    }
    return value;
  }

  gameplayTags(file: string): readonly string[] {
    const key = path.resolve(file);
    let value = this.tags.get(key);
    if (value === undefined) {
      value = Object.freeze(readGameplayTagPaths(key, this.readText(key)));
      this.tags.set(key, value);
    }
    return value;
  }

  timeDilationPriorities(file: string): ReadonlyMap<number, number> {
    const key = path.resolve(file);
    let value = this.priorities.get(key);
    if (value === undefined) {
      value = readGeneratedTimeDilationPriorities(key, this.readText(key));
      this.priorities.set(key, value);
    }
    return value;
  }

  statistics() {
    return {
      shared: this.shared.statistics(),
      currentOperator: this.currentOperator.statistics(),
      parsedCatalogs:
        this.entities.size +
        this.globals.size +
        this.settings.size +
        this.tags.size +
        this.priorities.size,
    };
  }
}
