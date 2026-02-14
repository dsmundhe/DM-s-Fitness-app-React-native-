import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'cache:v1:';

const toStorageKey = (key) => `${CACHE_PREFIX}${key}`;

export const readCache = async (key, maxAgeMs) => {
  try {
    const raw = await AsyncStorage.getItem(toStorageKey(key));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed?.ts) {
      return null;
    }
    if (Date.now() - parsed.ts > maxAgeMs) {
      return null;
    }
    return parsed.data ?? null;
  } catch (error) {
    return null;
  }
};

export const writeCache = async (key, data) => {
  try {
    const payload = JSON.stringify({
      ts: Date.now(),
      data
    });
    await AsyncStorage.setItem(toStorageKey(key), payload);
  } catch (error) {
    // Ignore cache write errors so UI flow is not blocked.
  }
};

export const removeCacheByPrefix = async (prefix) => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const fullPrefix = toStorageKey(prefix);
    const matched = keys.filter((key) => key.startsWith(fullPrefix));
    if (matched.length) {
      await AsyncStorage.multiRemove(matched);
    }
  } catch (error) {
    // Ignore cache cleanup errors.
  }
};
