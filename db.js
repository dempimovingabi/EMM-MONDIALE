// ============================================
// BASE DE DONNÉES LOCALE — EMM MONDIAL v5
// + Ajout provinceActive
// ============================================

const DB = {
  _cache: {},
  _idb: null,
  _ready: false,
  _idbDispo: false,

  _openIdb: function() {
    return new Promise(function(resolve, reject) {
      if (!window.indexedDB) { reject(new Error('IndexedDB non supporté')); return; }
      var req = indexedDB.open('emmmondial_db', 1);
      req.onupgradeneeded = function(e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains('data')) db.createObjectStore('data');
      };
      req.onsuccess = function(e) { resolve(e.target.result); };
      req.onerror = function(e) { reject(e.target.error || new Error('Erreur IndexedDB')); };
      req.onblocked = function() { reject(new Error('IndexedDB bloqué')); };
    });
  },

  _idbGet: function(key) {
    var self = this;
    return new Promise(function(resolve, reject) {
      if (!self._idb) { reject(new Error('IDB absent')); return; }
      try {
        var tx = self._idb.transaction('data', 'readonly');
        var req = tx.objectStore('data').get(key);
        req.onsuccess = function() { resolve(req.result); };
        req.onerror = function() { reject(req.error); };
      } catch(e) { reject(e); }
    });
  },

  _idbSet: function(key, val) {
    var self = this;
    return new Promise(function(resolve, reject) {
      if (!self._idb) { reject(new Error('IDB absent')); return; }
      try {
        var tx = self._idb.transaction('data', 'readwrite');
        var req = tx.objectStore('data').put(val, key);
        req.onsuccess = function() { resolve(); };
        req.onerror = function() { reject(req.error); };
      } catch(e) { reject(e); }
    });
  },

  _idbKeys: function() {
    var self = this;
    return new Promise(function(resolve, reject) {
      if (!self._idb) { resolve([]); return; }
      try {
        var tx = self._idb.transaction('data', 'readonly');
        var req = tx.objectStore('data').getAllKeys();
        req.onsuccess = function() { resolve(req.result || []); };
        req.onerror = function() { reject(req.error); };
      } catch(e) { reject(e); }
    });
  },

  _idbClear: function() {
    var self = this;
    return new Promise(function(resolve, reject) {
      if (!self._idb) { resolve(); return; }
      try {
        var tx = self._idb.transaction('data', 'readwrite');
        var req = tx.objectStore('data').clear();
        req.onsuccess = function() { resolve(); };
        req.onerror = function() { reject(req.error); };
      } catch(e) { reject(e); }
    });
  },

  _migrerDepuisLocalStorage: async function() {
    var dejaMigre = false;
    try { dejaMigre = !!(await this._idbGet('__migrated_v1')); } catch(e) {}
    if (dejaMigre) return;

    var keys = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('emmmondial_') === 0) keys.push(k.replace('emmmondial_', ''));
      }
    } catch(e) {}

    for (var j = 0; j < keys.length; j++) {
      var key = keys[j];
      try {
        var v = localStorage.getItem('emmmondial_' + key);
        if (v !== null) await this._idbSet(key, JSON.parse(v));
      } catch(e) { console.warn('Migration échouée:', key, e); }
    }
    try { await this._idbSet('__migrated_v1', true); } catch(e) {}
    console.log('✅ Migration localStorage → IndexedDB (' + keys.length + ' clés)');
  },

  init: async function() {
    try {
      this._idb = await this._openIdb();
      this._idbDispo = true;
      await this._migrerDepuisLocalStorage();

      var keys = await this._idbKeys();
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (k === '__migrated_v1') continue;
        try { this._cache[k] = await this._idbGet(k); } catch(e) {}
      }
      console.log('✅ IndexedDB prêt — ' + (keys.length - 1) + ' clés chargées');
    } catch(e) {
      console.warn('⚠️ Fallback localStorage:', e.message);
      this._idbDispo = false;
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var fullKey = localStorage.key(i);
          if (fullKey && fullKey.indexOf('emmmondial_') === 0) {
            try { this._cache[fullKey.replace('emmmondial_', '')] = JSON.parse(localStorage.getItem(fullKey)); } catch(err) {}
          }
        }
      } catch(e2) {}
    }
    this._ready = true;
  },

  get: function(key, def) {
    if (key in this._cache) return this._cache[key];
    try {
      var v = localStorage.getItem('emmmondial_' + key);
      if (v !== null) return JSON.parse(v);
    } catch(e) {}
    return def !== undefined ? def : null;
  },

  set: function(key, val) {
    this._cache[key] = val;
    if (this._idbDispo) {
      this._idbSet(key, val).then(function() {
        if (window._signalerSauvegarde) window._signalerSauvegarde();
      }).catch(function(err) { console.warn('IDB write:', key, err); });
    }
    try { localStorage.setItem('emmmondial_' + key, JSON.stringify(val)); }
    catch(e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.warn('⚠️ localStorage saturé pour ' + key);
        try { localStorage.removeItem('emmmondial_' + key); } catch(e2) {}
      }
    }
  },

  remove: function(key) {
    delete this._cache[key];
    try { localStorage.removeItem('emmmondial_' + key); } catch(e) {}
    if (this._idbDispo && this._idb) {
      try {
        var tx = this._idb.transaction('data', 'readwrite');
        tx.objectStore('data').delete(key);
      } catch(e) {}
    }
  },

  clearAll: async function() {
    this._cache = {};
    try { localStorage.clear(); } catch(e) {}
    if (this._idbDispo) { try { await this._idbClear(); } catch(e) {} }
  },

  diagnostique: async function() {
    var info = {
      indexedDB: this._idbDispo ? '✅ Actif' : '❌ Indisponible',
      clesCache: Object.keys(this._cache).length,
      localStorageUtilise: '?',
      localStorageMax: '~5 Mo'
    };
    try {
      var total = 0;
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('emmmondial_') === 0) total += (localStorage.getItem(k) || '').length;
      }
      info.localStorageUtilise = (total / 1024).toFixed(1) + ' Ko';
    } catch(e) {}
    return info;
  }
};

function initDB() {
  if (!DB.get('users')) {
    DB.set('users', [
      { id: 'u1', nom: 'admin', pass: 'admin123', role: 'admin' },
      { id: 'u2', nom: 'utilisateur', pass: 'user123', role: 'user' }
    ]);
  }
  if (!DB.get('session')) DB.set('session', null);
  if (!DB.get('entites')) DB.set('entites', []);
  if (!DB.get('participations')) DB.set('participations', []);
  if (!DB.get('fichesMensuelles')) DB.set('fichesMensuelles', []);
  if (!DB.get('candidats')) DB.set('candidats', []);
  if (!DB.get('versements')) DB.set('versements', []);
  if (!DB.get('depouillements')) DB.set('depouillements', []);
  if (!DB.get('depensesGenerales')) DB.set('depensesGenerales', []);
  if (!DB.get('annonces')) DB.set('annonces', []);
  if (!DB.get('patrimoineSites')) DB.set('patrimoineSites', []);
  if (!DB.get('patrimoineBiens')) DB.set('patrimoineBiens', []);
  if (!DB.get('patrimoineMouvements')) DB.set('patrimoineMouvements', []);
  if (!DB.get('patrimoineReparations')) DB.set('patrimoineReparations', []);
  if (!DB.get('rapportsNumeriques')) DB.set('rapportsNumeriques', []);

  // Province active ('' = toutes)
  if (!DB.get('provinceActive')) DB.set('provinceActive', '');

  ['entites','participations','fichesMensuelles','candidats','versements','depouillements','patrimoineSites','patrimoineBiens','rapportsNumeriques'].forEach(function(key) {
    var list = DB.get(key, []);
    var modifie = false;
    list.forEach(function(item) {
      if (item.archived === undefined) { item.archived = false; modifie = true; }
    });
    if (modifie) DB.set(key, list);
  });
  }
