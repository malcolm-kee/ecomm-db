export const getId = (function() {
  let id = 20000;

  return function generateId() {
    return id++;
  };
})();
