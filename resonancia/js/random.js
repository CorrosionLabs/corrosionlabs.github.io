export function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

export function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function pickRandom(items, excludedValue = null) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  if (items.length === 1) {
    return items[0];
  }

  let candidate = items[randomInt(0, items.length - 1)];

  if (candidate === excludedValue) {
    candidate = items[(items.indexOf(candidate) + 1) % items.length];
  }

  return candidate;
}

export function weightedPick(items, weightSelector = (item) => item.weight ?? 1) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const total = items.reduce((sum, item) => sum + Math.max(0, weightSelector(item)), 0);

  if (total <= 0) {
    return items[randomInt(0, items.length - 1)];
  }

  let cursor = Math.random() * total;

  for (const item of items) {
    cursor -= Math.max(0, weightSelector(item));

    if (cursor <= 0) {
      return item;
    }
  }

  return items[items.length - 1];
}
