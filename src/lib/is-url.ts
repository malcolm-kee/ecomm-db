/**
 * Check if the path starts with "http://" or "https://"
 * @param {string} path
 */
export function isUrl(path: string) {
  return /^https?:\/\//.test(path);
}
