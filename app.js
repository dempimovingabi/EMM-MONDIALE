var currentUser = null;
var photoCandidatTemp = null;
var signatureCanvas = null, signatureCtx = null, signatureVide = true;
var seanceActive = null;
var tempOffrandes = { init: [], sorei: [], kannon: [], photo: [], shinrei: [], gosh: [], mita: [] };
var _releveFicheHTML = '';
var _releveGlobalHTML = '';
var _releveIndividuelHTML = '';
var userPremiumStatus = false;
var userPremiumExpire = 0;
var SUPER_ADMIN_EMAILS = ["dedickmpiana@gmail.com"];

var CATEGORIES_OFFRANDES = {
  init: 'Initiation', sorei: 'Sorei Saichi', kannon: 'Kannon',
  photo: 'Photo sacrée', shinrei: 'Shinrei Saichi',
  gosh: 'Goshintai familiale', mita: 'Mitamaya'
};

var PROVINCES_RDC = [
  'Kinshasa', 'Kongo-Central', 'Kwango', 'Kwilu', 'Mai-Ndombe',
  'Kasaï', 'Kasaï-Central', 'Kasaï-Oriental', 'Lomami', 'Sankuru',
  'Maniema', 'Sud-Kivu', 'Nord-Kivu', 'Ituri', 'Haut-Uélé',
  'Tshopo', 'Bas-Uélé', 'Nord-Ubangi', 'Mongala', 'Sud-Ubangi',
  'Équateur', 'Tshuapa', 'Tanganyika', 'Haut-Lomami', 'Lualaba', 'Haut-Katanga'
];
function getProvinceActive() { return DB.get('provinceActive', '') || ''; }
function setProvinceActive(p) {
  DB.set('provinceActive', p || '');
  rafraichirProvinceHeader(); refreshAll(); afficherDashboard(); afficherAnnonces();
}
function rafraichirProvinceHeader() {
  var btn = document.getElementById('btnProvince'); if (!btn) return;
  var p = getProvinceActive();
  btn.textContent = p ? (p === '__non_assignee' ? '📭 Non assignées' : '🌍 ' + p) : '🌍 Toutes';
}
function peuplerProvinceSelects() {
  var html = '<option value="">-- Toutes les provinces --</option>';
  PROVINCES_RDC.forEach(function(p) { html += '<option value="' + p + '">' + p + '</option>'; });
  html += '<option value="__non_assignee">📭 Non assignées (anciennes données)</option>';
  ['jProvinceEntite', 'cProvince', 'pProvinceSite'].forEach(function(id) {
    var sel = document.getElementById(id); if (!sel) return;
    var cur = sel.value; sel.innerHTML = html; if (cur) sel.value = cur;
  });
  var psel = document.getElementById('provinceSelect');
  if (psel) { var cur2 = psel.value; psel.innerHTML = html; psel.value = getProvinceActive() || ''; }
}
function exigerProvince() {
  var p = getProvinceActive();
  if (!p) { alert('⚠️ Sélectionnez d\'abord une province via le bouton 🌍 en haut à droite.'); ouvrirModalProvince(); return null; }
  if (p === '__non_assignee') { alert('⚠️ Impossible de créer un élément en mode "Non assignées".\nChoisissez une vraie province.'); ouvrirModalProvince(); return null; }
  return p;
}
function ouvrirModalProvince() {
  peuplerProvinceSelects();
  var sel = document.getElementById('provinceSelect'); if (sel) sel.value = getProvinceActive() || '';
  var info = document.getElementById('provinceInfo');
  if (info) { var p = getProvinceActive(); info.innerHTML = p ? (p === '__non_assignee' ? '📭 Non assignées' : '✅ ' + p) : '🌐 Toutes les provinces'; }
  document.getElementById('provinceModal').style.display = 'flex';
}
function fermerModalProvince() { document.getElementById('provinceModal').style.display = 'none'; }
function confirmerProvince() {
  var sel = document.getElementById('provinceSelect'); if (!sel) return;
  setProvinceActive(sel.value); fermerModalProvince();
  alert(sel.value ? '✅ Province : ' + (sel.value === '__non_assignee' ? 'Non assignées' : sel.value) : '🌐 Toutes les provinces');
}
function filtrerParProvinceListe(list, extraMatch) {
  var p = getProvinceActive(); if (!p) return list;
  if (p === '__non_assignee') return list.filter(function(x) { return !x.province && (!extraMatch || extraMatch(x)); });
  return list.filter(function(x) {
    if (x.province === p) return true;
    if (x.province) return false;
    return extraMatch ? extraMatch(x) : false;
  });
}
function entitesProvince() { return filtrerParProvinceListe(DB.get('entites', [])); }
function candidatsProvince() { return filtrerParProvinceListe(DB.get('candidats', [])); }
function sitesPatrimoineProvince() { return filtrerParProvinceListe(DB.get('patrimoineSites', [])); }
function versementsProvince() {
  var p = getProvinceActive(); if (!p) return DB.get('versements', []);
  var cands = candidatsProvince(); var ids = {}; cands.forEach(function(c) { ids[c.id] = true; });
  return DB.get('versements', []).filter(function(v) { return v.province === p || (!v.province && ids[v.candId]); });
}
function fichesProvince() {
  var p = getProvinceActive(); if (!p) return DB.get('fichesMensuelles', []);
  var ents = entitesProvince(); var ids = {}; ents.forEach(function(e) { ids[e.id] = true; });
  return DB.get('fichesMensuelles', []).filter(function(f) { return f.province === p || (!f.province && ids[f.entiteId]); });
}
function participationsProvince() {
  var p = getProvinceActive(); if (!p) return DB.get('participations', []);
  var ents = entitesProvince(); var ids = {}; ents.forEach(function(e) { ids[e.id] = true; });
  return DB.get('participations', []).filter(function(x) { return x.province === p || (!x.province && ids[x.entiteId]); });
}
function depouillementsProvince() {
  var p = getProvinceActive(); if (!p) return DB.get('depouillements', []);
  var ents = entitesProvince(); var noms = {}; ents.forEach(function(e) { noms[e.nom] = true; });
  return DB.get('depouillements', []).filter(function(d) { return d.province === p || (!d.province && d.entites && d.entites.some(function(e) { return noms[e.nomEntite]; })); });
}
function biensPatrimoineProvince() {
  var p = getProvinceActive(); if (!p) return DB.get('patrimoineBiens', []);
  var sites = sitesPatrimoineProvince(); var ids = {}; sites.forEach(function(s) { ids[s.id] = true; });
  return DB.get('patrimoineBiens', []).filter(function(b) { return b.province === p || (!b.province && ids[b.siteId]); });
    }
// ========== OUTILS ET AFFICHAGE DE BASE ==========
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function fmtDate(d) { if (!d) return ''; return new Date(d).toLocaleDateString('fr-FR'); }
function echapper(s) { if (s === undefined || s === null) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function isAdmin() { return currentUser && currentUser.role === 'admin'; }
function isSuperAdmin() { return currentUser && SUPER_ADMIN_EMAILS.includes(currentUser.email); }
function filtrerListe(list, filtre) { if (filtre === 'archive') return list.filter(function(x) { return x.archived === true; }); if (filtre === 'tous') return list; return list.filter(function(x) { return !x.archived; }); }
function getEntiteNom(id) { var e = DB.get('entites', []).find(function(x) { return x.id === id; }); return e ? e.type + ' - ' + e.nom : 'Inconnu'; }

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); s.style.display = 'none'; });
  var el = document.getElementById(id); if (!el) return; el.classList.add('active');
  el.style.display = (id === 'splashScreen' || id === 'loginScreen') ? 'flex' : 'block';
  window.scrollTo(0, 0);
}
function toggleMainMenu() { var menu = document.getElementById('mainMenu'); if (menu) menu.classList.toggle('open'); }
function fermerMainMenu() { var menu = document.getElementById('mainMenu'); if (menu) menu.classList.remove('open'); }
function scrollToSection(id) { var el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
function showSplash() {
  showScreen('splashScreen');
  setTimeout(function() {
    var splash = document.getElementById('splashScreen');
    if (splash && splash.classList.contains('active')) { showScreen('loginScreen'); }
  }, 800);
}
function switchMainTab(name, btn) {
  fermerMainMenu();
  document.querySelectorAll('.main-tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.main-tab-content').forEach(function(c) { c.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  var tab = document.getElementById('tab-' + name); if (tab) tab.classList.add('active');
  if (name === 'general') afficherDashboard();
  if (name === 'finance') { setTimeout(initSignature, 100); }
  if (name === 'patrimoine') refreshPatrimoineSites();
  if (name === 'archives') afficherArchives();
  if (name === 'admin') { if (typeof majInterfacePremium === 'function') majInterfacePremium(); }
}
function appliquerSession() {
  if (!currentUser) return;
  var label = document.getElementById('userRoleLabel');
  if (label) label.textContent = (currentUser.role === 'admin' ? '👑 Admin' : '👤 ' + (currentUser.nom || currentUser.email));
  refreshAll(); afficherDashboard(); afficherAnnonces(); rafraichirProvinceHeader();
}
