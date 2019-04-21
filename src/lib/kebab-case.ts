/**
 * @param {string} str
 */
export function kebabCase(str: string) {
  return str
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\W/g, m => (/[À-ž]/.test(m) ? m : '-'))
    .toLowerCase();
}
