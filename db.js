const DB = {
  get: function(key, def) {
    try {
      const v = localStorage.getItem('emmmondial_' + key);
      return v ? JSON.parse(v) : (def !== undefined ? def : null);
    } catch(e) { return def; }
  },
  set: function(key, val) {
    localStorage.setItem('emmmondial_' + key, JSON.stringify(val));
  },
  remove: function(key) {
    localStorage.removeItem('emmmondial_' + key);
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

  // Module I
  if (!DB.get('entites')) DB.set('entites', []);
  if (!DB.get('participations')) DB.set('participations', []);
  if (!DB.get('fichesMensuelles')) DB.set('fichesMensuelles', []);

  // Module II
  if (!DB.get('candidats')) DB.set('candidats', []);
  if (!DB.get('versements')) DB.set('versements', []);

  // Module III
  if (!DB.get('depouillements')) DB.set('depouillements', []);
  if (!DB.get('depensesGenerales')) DB.set('depensesGenerales', []);

  // Commun
  if (!DB.get('annonces')) DB.set('annonces', []);

  // Module IV
  if (!DB.get('patrimoineSites')) DB.set('patrimoineSites', []);
  if (!DB.get('patrimoineBiens')) DB.set('patrimoineBiens', []);
  if (!DB.get('patrimoineMouvements')) DB.set('patrimoineMouvements', []);
  if (!DB.get('patrimoineReparations')) DB.set('patrimoineReparations', []);

  ['entites','participations','fichesMensuelles','candidats','versements','depouillements','patrimoineSites','patrimoineBiens'].forEach(function(key) {
    var list = DB.get(key, []);
    var modifie = false;
    list.forEach(function(item) {
      if (item.archived === undefined) { item.archived = false; modifie = true; }
    });
    if (modifie) DB.set(key, list);
  });
}
initDB();
