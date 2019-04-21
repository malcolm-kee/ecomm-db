export const getId = (function() {
  let id = 0;

  return function generateId() {
    return id++;
  };
})();
