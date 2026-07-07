import contractsData from './contingencyContracts.json'

export interface ContingencyContractBlackboardEntry {
  key: string
  value: number
  valueStr: string
}

export interface ContingencyContractTerm {
  termType: number
  buffId: string
  blackboard: ContingencyContractBlackboardEntry[]
}

export interface ContingencyContractTag {
  id: number
  groupId: number
  name: string
  description: string
  rawDescription: string
  icon: string
  iconPath: string
  roman: string
  score: number
  keyId: string
  lockIds: string[]
  unlockScore: number
  unlockActivityStage: string
  conflictId: string
  canPreview: boolean
  terms: ContingencyContractTerm[]
  tips: {
    formation: string
    battleHud: string
  }
}

export interface ContingencyContractGroup {
  id: string
  groupId: number
  tags: ContingencyContractTag[]
}

export interface ContingencyContractKeyLock {
  id: string
  color: string
  keyDecoImg: string
  keyName: string
  lockName: string
}

export interface ContingencyContractSeason {
  id: string
  activityId: string
  name: string
  description: string
  tagMaxColumn: number
  scoreBand: number[]
  rangeArray: number[]
  keyLocks: Record<string, ContingencyContractKeyLock>
  groups: ContingencyContractGroup[]
}

interface ContingencyContractDatabase {
  defaultSeasonId: string
  seasons: ContingencyContractSeason[]
}

export const contingencyContractDatabase = contractsData as ContingencyContractDatabase

export function getContingencyContractSeasons(): ContingencyContractSeason[] {
  return contingencyContractDatabase.seasons
}

export function getDefaultContingencyContractSeason(): ContingencyContractSeason | null {
  return getContingencyContractSeason(contingencyContractDatabase.defaultSeasonId)
    ?? contingencyContractDatabase.seasons[0]
    ?? null
}

export function getContingencyContractSeason(id: string): ContingencyContractSeason | null {
  return contingencyContractDatabase.seasons.find(season => season.id === id) ?? null
}

export function getContingencyContractTags(season: ContingencyContractSeason): ContingencyContractTag[] {
  return season.groups.flatMap(group => group.tags)
}

export function getContingencyContractTagMap(season: ContingencyContractSeason): Map<number, ContingencyContractTag> {
  return new Map(getContingencyContractTags(season).map(tag => [tag.id, tag]))
}

export function getSelectedContractScore(
  season: ContingencyContractSeason,
  selectedTagIds: Iterable<number>,
): number {
  const tagMap = getContingencyContractTagMap(season)
  let total = 0
  for (const tagId of selectedTagIds) total += tagMap.get(tagId)?.score ?? 0
  return total
}

export function getSelectedContractKeys(
  season: ContingencyContractSeason,
  selectedTagIds: Iterable<number>,
): Set<string> {
  const tagMap = getContingencyContractTagMap(season)
  const keys = new Set<string>()
  for (const tagId of selectedTagIds) {
    const keyId = tagMap.get(tagId)?.keyId
    if (keyId) keys.add(keyId)
  }
  return keys
}

export function getContractTagDisabledReason(
  season: ContingencyContractSeason,
  tag: ContingencyContractTag,
  selectedTagIds: Iterable<number>,
): string {
  const selected = new Set(selectedTagIds)
  if (selected.has(tag.id)) return ''

  if (tag.conflictId) {
    for (const selectedId of selected) {
      const selectedTag = getContingencyContractTagMap(season).get(selectedId)
      if (selectedTag?.conflictId && selectedTag.conflictId === tag.conflictId) {
        return `Conflict: ${selectedTag.name}`
      }
    }
  }

  if (tag.lockIds.length > 0) {
    const keys = getSelectedContractKeys(season, selected)
    const missing = tag.lockIds.filter(keyId => !keys.has(keyId))
    if (missing.length > 0) return `Locked: ${missing.join(', ')}`
  }

  return ''
}
