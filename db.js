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
  // GESTION DES UTILISATEURS FORCÉE
  var users = DB.get('users', []);
  if (!Array.isArray(users)) users = [];
  
  var adminExists = users.find(function(u) { return u.nom === 'admin'; });
  if (!adminExists) {
    users.push({ id: 'u1', nom: 'admin', pass: 'admin123', role: 'admin' });
  } else {
    adminExists.pass = 'admin123'; // Force le mot de passe
    adminExists.role = 'admin';
  }

  var userExists = users.find(function(u) { return u.nom === 'utilisateur'; });
  if (!userExists) {
    users.push({ id: 'u2', nom: 'utilisateur', pass: 'user123', role: 'user' });
  }
  DB.set('users', users);

  if (!DB.get('session')) DB.set('session', null);

  // Modules
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
