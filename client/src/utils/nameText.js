const letterOrMark = /^[\p{L}\p{M}]$/u
const emojiComponent = /^\p{Emoji_Component}$/u
const namePunctuation = new Set([' ', "'", '’', '-', '‐', '‑', '‒', '–', '—'])

export function sanitizeName(value) {
  return Array.from(String(value || ''))
    .filter((character) => !emojiComponent.test(character) && (letterOrMark.test(character) || namePunctuation.has(character)))
    .join('')
    .replace(/ {2,}/g, ' ')
}