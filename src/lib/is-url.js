/**
 * Check if the path starts with "http://" or "https://"
 * @param {string} path
 */
module.exports = function isUrl(path) {
  return /^https?:\/\//.test(path);
};
