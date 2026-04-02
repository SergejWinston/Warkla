const ENTITY_PATTERN = /&(?:[a-z\d]+|#\d+|#x[a-f\d]+);/i

const fallbackDecode = (value) => {
  return value
    .replace(/&nbsp;/gi, '\u00A0')
    .replace(/&laquo;/gi, '«')
    .replace(/&raquo;/gi, '»')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
}

export const decodeHtmlEntities = (input) => {
  if (input === null || input === undefined) return ''

  let value = String(input)
  if (!ENTITY_PATTERN.test(value)) {
    return value
  }

  if (typeof document === 'undefined') {
    return fallbackDecode(value)
  }

  const textarea = document.createElement('textarea')

  for (let index = 0; index < 3; index += 1) {
    textarea.innerHTML = value
    const decoded = textarea.value

    if (decoded === value) {
      break
    }

    value = decoded
    if (!ENTITY_PATTERN.test(value)) {
      break
    }
  }

  return value
}
