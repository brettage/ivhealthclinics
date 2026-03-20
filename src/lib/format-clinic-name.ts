// Smart title case for clinic names
// Handles medical abbreviations, roman numerals, and name prefixes

const UPPERCASE_WORDS = new Set([
  'MD', 'DO', 'PA', 'NP', 'RN', 'LPN', 'BSN', 'MSN', 'DNP', 'PHD',
  'LLC', 'PC', 'PLLC', 'INC', 'CORP', 'LTD', 'LP', 'DBA',
  'IV', 'IM', 'NAD',
  'USA', 'US',
  'II', 'III', 'VI', 'VII', 'VIII', 'IX', 'XI', 'XII',
])

const LOWERCASE_WORDS = new Set([
  'of', 'the', 'and', 'in', 'at', 'to', 'for', 'by', 'on', 'with', 'a', 'an',
])

export function formatClinicName(name: string): string {
  if (!name) return ''

  return name
    .split(' ')
    .map((word, index, arr) => {
      const upper = word.toUpperCase()

      // Keep uppercase abbreviations
      if (UPPERCASE_WORDS.has(upper)) return upper

      // Lowercase small words (unless first or last)
      if (LOWERCASE_WORDS.has(word.toLowerCase()) && index !== 0 && index !== arr.length - 1) {
        return word.toLowerCase()
      }

      // Handle McX / MacX prefixes
      if (/^mc/i.test(word) && word.length > 2) {
        return 'Mc' + word.charAt(2).toUpperCase() + word.slice(3).toLowerCase()
      }
      if (/^mac/i.test(word) && word.length > 3 && /^mac[a-z]/i.test(word)) {
        return 'Mac' + word.charAt(3).toUpperCase() + word.slice(4).toLowerCase()
      }

      // Handle O'X prefixes
      if (/^o'/i.test(word) && word.length > 2) {
        return "O'" + word.charAt(2).toUpperCase() + word.slice(3).toLowerCase()
      }

      // Handle ordinals (1st, 2nd, 3rd, etc.)
      if (/^\d+(st|nd|rd|th)$/i.test(word)) {
        return word.toLowerCase()
      }

      // Standard title case
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}
