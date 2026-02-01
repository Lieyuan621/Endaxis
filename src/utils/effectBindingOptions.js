function formatSeconds(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return '0'
  const rounded = Math.round(num * 10) / 10
  if (Math.abs(rounded - Math.round(rounded)) < 1e-9) return String(Math.round(rounded))
  return String(rounded)
}

export function buildEffectBindingOptions(raw, { getEffectName } = {}) {
  if (!raw || raw.length === 0) return []
  const rows = Array.isArray(raw[0]) ? raw : [raw]

  const flattened = []
  const typeCounts = new Map()
  const seen = new Set()

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex]
    if (!Array.isArray(row)) continue
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const effect = row[colIndex]
      const id = effect?._id
      if (!effect || !id || seen.has(id)) continue
      seen.add(id)

      const type = effect.type || 'unknown'
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1)
      flattened.push({ effect, type, id, rowIndex, colIndex })
    }
  }

  const typeSerials = new Map()
  return flattened.map(({ effect, type, id, rowIndex, colIndex }) => {
    const baseName = (typeof getEffectName === 'function' ? getEffectName(type, effect) : null) || type || 'Unknown'
    const duplicates = (typeCounts.get(type) || 0) > 1
    const serial = (typeSerials.get(type) || 0) + 1
    typeSerials.set(type, serial)

    const label = duplicates ? `${baseName}#${serial}` : baseName

    const offset = Number(effect.offset) || 0
    const duration = Number(effect.duration) || 0
    const stacks = Number(effect.stacks) || 1
    const hintParts = [`R${rowIndex + 1}C${colIndex + 1}`, `${formatSeconds(offset)}s`]

    const parts = [...hintParts]
    if (duration > 0) parts.push(`持续${formatSeconds(duration)}s`)
    if (stacks > 1) parts.push(`x${stacks}`)

    return {
      value: id,
      label,
      hint: hintParts.join(' · '),
      description: parts.join(' · '),
      type,
      rowIndex,
      colIndex,
      offset,
      duration,
      stacks,
    }
  })
}