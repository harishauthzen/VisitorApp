import { sanitizeName } from '../utils/nameText.js'

export default function NameInput({ onChange, ...props }) {
  function handleChange(event) {
    const input = event.currentTarget
    const cursor = input.selectionStart ?? input.value.length
    const cleanValue = sanitizeName(input.value)

    if (cleanValue !== input.value) {
      const cleanCursor = sanitizeName(input.value.slice(0, cursor)).length
      input.value = cleanValue
      input.setSelectionRange(cleanCursor, cleanCursor)
    }

    onChange?.(event)
  }

  return <input {...props} onChange={handleChange} />
}