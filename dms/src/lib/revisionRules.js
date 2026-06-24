// Lógica de numeração de revisão, configurável via revision_numbering_settings.
//
// Regra padrão:
//  - Sem revisão anterior -> "0A" (initial_number + initial_letter)
//  - Revisão normal (não emissão) -> incrementa a letra: 0A -> 0B -> 0C ...
//  - Emissão -> incrementa o número e reinicia a letra: 0C -> 1A, 1B -> 2A ...
//
// O eixo que cada tipo de revisão incrementa (letra ou número) é configurável
// via pre_emission_increment / post_emission_increment.

export const DEFAULT_REVISION_SETTINGS = {
  pre_emission_increment: 'letter',
  post_emission_increment: 'number',
  initial_number: 0,
  initial_letter: 'A'
};

export function nextLetter(letter) {
  const chars = letter.split('');
  let i = chars.length - 1;
  while (i >= 0) {
    if (chars[i] === 'Z') {
      chars[i] = 'A';
      i--;
    } else {
      chars[i] = String.fromCharCode(chars[i].charCodeAt(0) + 1);
      return chars.join('');
    }
  }
  return 'A' + chars.join('');
}

export function parseRevisionCode(code) {
  if (!code) return null;
  const match = /^(\d+)([A-Z]+)$/.exec(String(code).trim().toUpperCase());
  if (!match) return null;
  return { number: parseInt(match[1], 10), letter: match[2] };
}

export function formatRevisionCode(number, letter) {
  return `${number}${letter}`;
}

/**
 * Calcula o próximo código de revisão.
 * @param {string|null} currentCode - código atual (ex: "0A"), ou null se for a primeira revisão.
 * @param {{ isEmission?: boolean }} options
 * @param {object} settings - revision_numbering_settings (ou DEFAULT_REVISION_SETTINGS).
 */
export function getNextRevisionCode(currentCode, options = {}, settings = {}) {
  const cfg = { ...DEFAULT_REVISION_SETTINGS, ...settings };
  const { isEmission = false } = options;

  const parsed = parseRevisionCode(currentCode);
  if (!parsed) {
    return formatRevisionCode(cfg.initial_number, cfg.initial_letter);
  }

  const axis = isEmission ? cfg.post_emission_increment : cfg.pre_emission_increment;

  if (axis === 'number') {
    return formatRevisionCode(parsed.number + 1, cfg.initial_letter);
  }
  return formatRevisionCode(parsed.number, nextLetter(parsed.letter));
}
