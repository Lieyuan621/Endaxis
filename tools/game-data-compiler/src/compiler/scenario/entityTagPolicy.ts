import { ENTITY_TAG_POLICIES } from '../../../config/entityTagPolicies.ts';

/** 精确匹配审查配置，不按标签前缀或未知消费者数量推断可裁剪性。 */
export function retainReviewedEntityTags(tags: readonly string[], sourcePath: string): string[] {
  return tags.filter(tag => {
    const policy = Object.hasOwn(ENTITY_TAG_POLICIES, tag) ? ENTITY_TAG_POLICIES[tag] : undefined;
    if (!policy)
      throw new Error(
        `${sourcePath}: unreviewed entity tag ${JSON.stringify(tag)}; configure entityTagPolicies.ts with an explicit retain/omit decision and reason`,
      );
    return policy.disposition === 'retain';
  });
}
