/**
 * Returns a Promise that resolves after a randomized delay between min and max milliseconds.
 * @param {number} min 
 * @param {number} max 
 * @returns {Promise<void>}
 */
export function randomDelay(min = 500, max = 1200) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, ms));
}
