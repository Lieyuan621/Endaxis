import { getGameAttributeName } from '@/data/gameText'
import { getEffectName } from '@/data/effectPresets'

export function normalizeEquipmentStatArray(value) {
    if (Array.isArray(value)) return value.filter(Boolean)
    return value ? [value] : []
}

export function normalizeEquipmentAttributeId(attribute) {
    if (attribute === 'main') return 'primary_ability'
    if (attribute === 'sub') return 'secondary_ability'
    if (['strength', 'agility', 'intellect', 'will'].includes(attribute)) return attribute
    return ''
}

function getEquipmentElementPairId(elements) {
    const set = new Set(elements)
    if (set.size !== 2) return ''
    if (set.has('heat') && set.has('nature')) return 'heat_nature_dmg_bonus'
    if (set.has('cryo') && set.has('electric')) return 'cryo_electric_dmg_bonus'
    return ''
}

function isEquipmentArtsDmgElements(elements) {
    const set = new Set(normalizeEquipmentStatArray(elements))
    return (
        set.size === 4
        && set.has('heat')
        && set.has('cryo')
        && set.has('electric')
        && set.has('nature')
    )
}

function getEquipmentDmgBonusModifierIds(stat) {
    const elements = normalizeEquipmentStatArray(stat?.elements)

    if (elements.length > 0) {
        if (isEquipmentArtsDmgElements(elements)) {
            return ['arts_dmg']
        }

        const pairId = getEquipmentElementPairId(elements)
        if (pairId) return [pairId]

        const mapped = elements.map((element) => ({
            physical: 'physical_dmg',
            heat: 'blaze_dmg',
            cryo: 'cold_dmg',
            electric: 'emag_dmg',
            nature: 'nature_dmg',
        })[element]).filter(Boolean)

        return mapped.length > 0 ? mapped : ['all_skill_dmg_bonus']
    }

    const skillTypes = normalizeEquipmentStatArray(stat?.skillTypes)

    if (skillTypes.length > 0) {
        if (skillTypes.length === 1) {
            return [{
                basicAttack: 'attack_dmg_bonus',
                battleSkill: 'skill_dmg_bonus',
                comboSkill: 'link_dmg_bonus',
                ultimate: 'ultimate_dmg_bonus',
            }[skillTypes[0]] || 'all_skill_dmg_bonus']
        }

        if (
            skillTypes.includes('battleSkill')
            && skillTypes.includes('comboSkill')
            && skillTypes.includes('ultimate')
        ) {
            return ['all_skill_dmg_bonus']
        }
    }

    return ['all_skill_dmg_bonus']
}

export function getEquipmentEffectModifierIds(stat) {
    if (!stat?.modifier) return []

    if (stat.modifier === 'attributeFlat' || stat.modifier === 'attributePercent') {
        return normalizeEquipmentStatArray(stat.attribute)
            .map(normalizeEquipmentAttributeId)
            .filter(Boolean)
    }

    if (stat.modifier === 'atkFlat' || stat.modifier === 'atkPercent') return ['attack']
    if (stat.modifier === 'flatHp' || stat.modifier === 'hpPercent') return ['hp']
    if (stat.modifier === 'critRate') return ['crit_rate']
    if (stat.modifier === 'critDmg') return ['crit_dmg']
    if (stat.modifier === 'artsIntensity') return ['originium_arts_power']
    if (stat.modifier === 'ultimateGainEfficiency') return ['ult_charge_eff']
    if (stat.modifier === 'heal') return ['healing_effect']
    if (stat.modifier === 'protection') return ['final_dmg_reduction']
    if (stat.modifier === 'dmgBonus') return getEquipmentDmgBonusModifierIds(stat)

    if (stat.modifier === 'susceptibility') {
        const elements = normalizeEquipmentStatArray(stat.elements)
        return elements.length > 0
            ? elements.map(element => `susceptibility_${element}`)
            : ['susceptibility']
    }

    return [stat.modifier]
}

function trOrFallback(t, key, fallback) {
    const out = typeof t === 'function' ? t(key) : key
    return out === key ? fallback : out
}

export function getEquipmentModifierLabel(modifierId, t) {
    return trOrFallback(
        t,
        `timelineGrid.equipmentDialog.affixFilters.${modifierId}`,
        trOrFallback(t, `stats.${modifierId}`, modifierId)
    )
}

export function formatEquipmentEffectLabel(effect, t, locale) {
    const stat = effect?.stat
    if (!stat) return trOrFallback(t, 'common.unknown', 'Unknown')

    const modifierId = getEquipmentEffectModifierIds(stat)[0] || stat.modifier

    if (stat.modifier === 'attributeFlat' || stat.modifier === 'attributePercent') {
        const attr = normalizeEquipmentStatArray(stat.attribute)[0]
        const normalizedAttr = normalizeEquipmentAttributeId(attr)

        if (normalizedAttr === 'primary_ability' || normalizedAttr === 'secondary_ability') {
            return getEquipmentModifierLabel(normalizedAttr, t)
        }

        if (attr) return getGameAttributeName(attr, locale)
    }

    if (stat.modifier === 'dmgBonus') {
        return getEquipmentModifierLabel(modifierId, t)
    }

    if (stat.modifier === 'susceptibility') {
        const elements = normalizeEquipmentStatArray(stat.elements)

        if (elements.length === 1) {
            return trOrFallback(
                t,
                `game.stat.susceptibility:${elements[0]}`,
                trOrFallback(t, 'game.stat.susceptibility', '脆弱')
            )
        }

        return trOrFallback(t, 'game.stat.susceptibility', '脆弱')
    }

    if (stat.modifier === 'artsIntensity') return getEquipmentModifierLabel('originium_arts_power', t)
    if (stat.modifier === 'ultimateGainEfficiency') return getEquipmentModifierLabel('ult_charge_eff', t)
    if (stat.modifier === 'heal') return getEquipmentModifierLabel('healing_effect', t)
    if (stat.modifier === 'protection') return getEquipmentModifierLabel('final_dmg_reduction', t)

    return getEquipmentModifierLabel(modifierId, t) || getEffectName(effect)
}

export function equipmentValueNeedsPercent(stat) {
    return [
        'attributePercent',
        'atkPercent',
        'hpPercent',
        'critRate',
        'critDmg',
        'dmgBonus',
        'ultimateGainEfficiency',
        'susceptibility',
        'heal',
        'protection',
    ].includes(stat?.modifier)
}

export function formatEquipmentNumber(value) {
    const num = Number(value)
    if (!Number.isFinite(num)) return String(value ?? '')
    if (Math.abs(num - Math.round(num)) < 0.0001) return String(Math.round(num))
    return num.toFixed(1).replace(/\.0$/, '')
}

export function formatEquipmentEffectStatValue(effect, value) {
    const suffix = equipmentValueNeedsPercent(effect?.stat) ? '%' : ''
    return `${formatEquipmentNumber(value)}${suffix}`
}