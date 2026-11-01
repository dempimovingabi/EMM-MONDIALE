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
