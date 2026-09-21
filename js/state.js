// One state object, autosaved to IndexedDB (photos are too large for localStorage).

const MAX_SPEAKERS = 6;

function emptySpeaker() {
  return { name: '', role: '', company: '', photo: null };
}

function defaultState() {
  return {
    show: 'ama',
    episode: '',
    // What each show looked like the last time it was used, so switching back restores it.
    showMemory: {},
    template: 'speakers',
    count: 3,
    title: 'GenLayer\nAMA',
    subtitle: 'Ask the founders\nCatch the latest news\nClaim a POAP live on the GenLayer portal',
    date: 'July 13, Monday 5PM UTC',
    agenda: '',
    speakers: Array.from({ length: MAX_SPEAKERS }, emptySpeaker),
    handles: ['X', '@genlayer.com'],
    logos: [{ src: '' }, { src: '' }],
  };
}

const store = {
  db: null,
  open() {
    return new Promise((resolve) => {
      const req = indexedDB.open('gl-livestream-builder', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('kv');
      req.onsuccess = () => {
        store.db = req.result;
        resolve();
      };
      // Private windows can refuse IndexedDB; the app still works, it just won't remember.
      req.onerror = () => resolve();
    });
  },
  get(key) {
    return new Promise((resolve) => {
      if (!store.db) return resolve(null);
      const req = store.db.transaction('kv').objectStore('kv').get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  },
  set(key, value) {
    if (!store.db) return;
    store.db.transaction('kv', 'readwrite').objectStore('kv').put(value, key);
  },
};
