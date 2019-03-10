const getId = (function() {
  let id = Date.now();

  return function generateId() {
    return id++;
  };
})();

module.exports = getId;
