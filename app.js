// ============================================
// EMM MONDIAL — LOGIQUE PRINCIPALE (PARTIE 1)
// ============================================

var currentUser = null;
var photoCandidatTemp = null;
var signatureCanvas = null, signatureCtx = null, signatureVide = true;
var seanceActive = null;
var tempOffrandes = { init: [], sorei: [], kannon: [], photo: [], shinrei: [], gosh: [], mita: [] };
var _releveFicheHTML = '';
var _releveGlobalHTML = '';
var _releveIndividuelHTML = '';

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
function parProvince(list) {
  var p = getProvinceActive(); if (!p) return list;
  if (p === '__non_assignee') return list.filter(function(x) { return !x.province; });
  return list.filter(function(x) { return x.province === p; });
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
function rapportsNumProvince() {
  var p = getProvinceActive(); if (!p) return DB.get('rapportsNumeriques', []);
  var ents = entitesProvince(); var ids = {}; ents.forEach(function(e) { ids[e.id] = true; });
  return DB.get('rapportsNumeriques', []).filter(function(r) { return r.province === p || (!r.province && ids[r.entiteId]); });
}
function biensPatrimoineProvince() {
  var p = getProvinceActive(); if (!p) return DB.get('patrimoineBiens', []);
  var sites = sitesPatrimoineProvince(); var ids = {}; sites.forEach(function(s) { ids[s.id] = true; });
  return DB.get('patrimoineBiens', []).filter(function(b) { return b.province === p || (!b.province && ids[b.siteId]); });
}

// ========== SIGNATURE COULEUR ==========
function getSignatureColor() { return DB.get('signatureColor', '#0a6e2c'); }
function setSignatureColor(couleur) {
  if (!couleur || !/^#[0-9A-Fa-f]{6}$/.test(couleur)) return;
  DB.set('signatureColor', couleur);
  document.querySelectorAll('.signature-box').forEach(function(b) { b.style.border = '2px solid ' + couleur; });
  document.querySelectorAll('.signature-line').forEach(function(l) { l.style.borderTop = '1px solid ' + couleur; l.style.color = couleur; });
  var mi = document.getElementById('pdfSignatureColor'); if (mi) mi.value = couleur;
  var mit = document.getElementById('pdfSignatureColorText'); if (mit && document.activeElement !== mit) mit.value = couleur;
  var lbl = document.getElementById('pdfSignatureColorValue'); if (lbl) { lbl.textContent = couleur; lbl.style.color = couleur; }
  document.querySelectorAll('.signature-color-picker [data-color]').forEach(function(btn) { var c = btn.getAttribute('data-color'); btn.style.boxShadow = (c.toLowerCase() === couleur.toLowerCase()) ? '0 0 0 2px #333' : '0 0 0 1px #ddd'; });
}
function appliquerCouleurSignature(couleur) {
  if (!couleur) return; couleur = String(couleur).trim(); if (couleur[0] !== '#') couleur = '#' + couleur;
  if (!/^#[0-9A-Fa-f]{6}$/.test(couleur)) return alert('⚠️ Format invalide.\nUtilisez #0a6e2c');
  setSignatureColor(couleur);
}
function getSignatureEncreColor() {
  var c = DB.get('signatureEncreColor', '#111111');
  if (!c || !/^#[0-9A-Fa-f]{6}$/.test(c)) return '#111111';
  return c;
}
function setSignatureEncreColor(c) {
  if (!c || !/^#[0-9A-Fa-f]{6}$/.test(c)) return;
  DB.set('signatureEncreColor', c);
  var fin = document.getElementById('vSignatureEncre'); if (fin && document.activeElement !== fin) fin.value = c;
  document.querySelectorAll('.sig-encre-picker input[type="color"]').forEach(function(inp) { if (document.activeElement !== inp) inp.value = c; });
  document.querySelectorAll('.sig-encre-btn').forEach(function(btn) { var bc = btn.getAttribute('data-encre'); if (bc) btn.style.boxShadow = bc.toLowerCase() === c.toLowerCase() ? '0 0 0 2px #333' : '0 0 0 1px #ddd'; });
  if (signatureCtx) { signatureCtx.strokeStyle = c; signatureCtx.fillStyle = c; }
  document.querySelectorAll('canvas.sig-canvas').forEach(function(canvas) { if (canvas.dataset.init === '1') { var ctx = canvas.getContext('2d'); ctx.strokeStyle = c; ctx.fillStyle = c; } });
}
function appliquerCouleurSignatureEncre(c) {
  if (!c) return; var v = String(c).trim(); if (v[0] !== '#') v = '#' + v;
  if (!/^#[0-9A-Fa-f]{6}$/.test(v)) return; setSignatureEncreColor(v);
}
function syncSignatureEncrePickers() {
  var c = getSignatureEncreColor();
  var fin = document.getElementById('vSignatureEncre'); if (fin && document.activeElement !== fin) fin.value = c;
  document.querySelectorAll('.sig-encre-picker input[type="color"]').forEach(function(inp) { if (document.activeElement !== inp) inp.value = c; });
  document.querySelectorAll('.sig-encre-btn').forEach(function(btn) { var bc = btn.getAttribute('data-encre'); if (bc) btn.style.boxShadow = bc.toLowerCase() === c.toLowerCase() ? '0 0 0 2px #333' : '0 0 0 1px #ddd'; });
}

function initSignatureBlockCanvases() {
  document.querySelectorAll('canvas.sig-canvas').forEach(function(canvas) {
    if (canvas.dataset.init === '1') return;
    var ratio = window.devicePixelRatio || 1; var rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) { setTimeout(initSignatureBlockCanvases, 150); return; }
    canvas.dataset.init = '1'; canvas.width = rect.width * ratio; canvas.height = rect.height * ratio;
    var ctx = canvas.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = getSignatureEncreColor(); ctx.fillStyle = getSignatureEncreColor();
    var drawing = false, lastX = 0, lastY = 0;
    function getPos(e) { var r = canvas.getBoundingClientRect(); var p = (e.touches && e.touches.length) ? e.touches[0] : (e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : e); return { x: p.clientX - r.left, y: p.clientY - r.top }; }
    function start(e) { e.preventDefault(); drawing = true; ctx.strokeStyle = getSignatureEncreColor(); ctx.fillStyle = getSignatureEncreColor(); var p = getPos(e); lastX = p.x; lastY = p.y; ctx.beginPath(); ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2); ctx.fill(); }
    function move(e) { if (!drawing) return; e.preventDefault(); ctx.strokeStyle = getSignatureEncreColor(); var p = getPos(e); ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(p.x, p.y); ctx.stroke(); lastX = p.x; lastY = p.y; }
    function stop() { drawing = false; }
    canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', move); canvas.addEventListener('mouseup', stop); canvas.addEventListener('mouseleave', stop);
    canvas.addEventListener('touchstart', start, { passive: false }); canvas.addEventListener('touchmove', move, { passive: false }); canvas.addEventListener('touchend', stop); canvas.addEventListener('touchcancel', stop);
  });
}
function effacerSignatureBlock(btn) { var box = btn.closest('.signature-box'); if (!box) return; var canvas = box.querySelector('canvas.sig-canvas'); if (!canvas) return; var ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); }
function captureSignaturesFromDOM() {
  var box = document.getElementById('releveFicheBox'); if (!box) return null;
  var card = box.querySelector('.card'); if (!card) return null;
  var clone = card.cloneNode(true);
  clone.querySelectorAll('.btn-primary').forEach(function(b) { var t = b.textContent || ''; if (t.indexOf('Imprimer') !== -1 || t.indexOf('PDF') !== -1) b.remove(); });
  var originaux = card.querySelectorAll('canvas.sig-canvas'); var clones = clone.querySelectorAll('canvas.sig-canvas');
  for (var i = 0; i < originaux.length; i++) { var co = originaux[i]; var cc = clones[i]; if (!cc) continue; var img = document.createElement('img'); img.src = co.toDataURL('image/png'); img.style.cssText = 'display:block;width:100%;height:110px;object-fit:contain;background:white;border:1px dashed #ccc;border-radius:6px;'; cc.parentNode.replaceChild(img, cc); }
  return clone.innerHTML;
}

// ========== SPLASH & UI ==========
function showSplash() {
  showScreen('splashScreen');
  setTimeout(function() {
    var splash = document.getElementById('splashScreen');
    if (splash && splash.classList.contains('active')) {
      showScreen('loginScreen');
    }
  }, 800); // CORRECTION DE VITESSE : 800ms max
}
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); s.style.display = 'none'; });
  var el = document.getElementById(id); if (!el) return; el.classList.add('active');
  el.style.display = (id === 'splashScreen' || id === 'loginScreen') ? 'flex' : 'block';
  window.scrollTo(0, 0);
}
function toggleMainMenu() { var menu = document.getElementById('mainMenu'); if (menu) menu.classList.toggle('open'); }
function fermerMainMenu() { var menu = document.getElementById('mainMenu'); if (menu) menu.classList.remove('open'); }

function switchMainTab(name, btn) {
  fermerMainMenu();
  document.querySelectorAll('.main-tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.main-tab-content').forEach(function(c) { c.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  var tab = document.getElementById('tab-' + name); if (tab) tab.classList.add('active');
  if (name === 'general') afficherDashboard();
  if (name === 'finance') { setTimeout(initSignature, 100); setTimeout(initSignature, 400); setTimeout(syncSignatureEncrePickers, 150); }
  if (name === 'frequence') setTimeout(recalculerTotauxRN, 100);
  if (name === 'depouillement') setTimeout(syncSignatureEncrePickers, 150);
  if (name === 'patrimoine') refreshPatrimoineSites();
  if (name === 'archives') afficherArchives();
  if (name === 'admin') { if (typeof majInterfacePremium === 'function') majInterfacePremium(); }
}

function login() { /* Remplacé par Firebase à la fin */ }
function logout() { /* Remplacé par Firebase à la fin */ }

function appliquerSession() {
  if (!currentUser) return;
  var label = document.getElementById('userRoleLabel');
  if (label) label.textContent = (currentUser.role === 'admin' ? '👑 Admin' : '👤 ' + (currentUser.nom || currentUser.email));
  var wb = document.getElementById('welcomeBox');
  if (wb) wb.innerHTML = '<p style="font-size:14px">Connecté : <strong>' + echapper(currentUser.nom || currentUser.email) + '</strong></p>' +
    '<p style="font-size:12px;color:#666;margin-top:4px">Rôle : ' + (currentUser.role === 'admin' ? '👑 Administrateur' : '👤 Utilisateur') + '</p>';
  refreshAll(); afficherDashboard(); afficherAnnonces(); rafraichirProvinceHeader();
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function fmtDate(d) { if (!d) return ''; return new Date(d).toLocaleDateString('fr-FR'); }
function echapper(s) { if (s === undefined || s === null) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function isAdmin() { return currentUser && currentUser.role === 'admin'; }
function filtrerListe(list, filtre) { if (filtre === 'archive') return list.filter(function(x) { return x.archived === true; }); if (filtre === 'tous') return list; return list.filter(function(x) { return !x.archived; }); }
function scrollToSection(id) { var el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
function getEntiteNom(id) { var e = DB.get('entites', []).find(function(x) { return x.id === id; }); return e ? e.type + ' - ' + e.nom : 'Inconnu'; }

// ========== MODAL PDF OPTIONS ==========
var pdfContexteEnAttente = null;
function ouvrirModalPdf(contexte) {
  pdfContexteEnAttente = contexte; var sigColor = getSignatureColor();
  var input = document.getElementById('pdfSignatureColor'); if (input) input.value = sigColor;
  var itext = document.getElementById('pdfSignatureColorText'); if (itext) itext.value = sigColor;
  var lbl = document.getElementById('pdfSignatureColorValue'); if (lbl) { lbl.textContent = sigColor; lbl.style.color = sigColor; }
  document.getElementById('pdfOptionsModal').style.display = 'flex';
}
function fermerModalPdf() { document.getElementById('pdfOptionsModal').style.display = 'none'; pdfContexteEnAttente = null; }
function lireOptionsPdf() {
  var sigColor = getSignatureColor();
  var input = document.getElementById('pdfSignatureColor'); if (input && input.value) sigColor = input.value;
  var itext = document.getElementById('pdfSignatureColorText'); if (itext && itext.value && /^#[0-9A-Fa-f]{6}$/.test(itext.value)) sigColor = itext.value;
  return { paperSize: document.getElementById('pdfPaperSize').value, fontFamily: document.getElementById('pdfFontFamily').value, fontSize: parseInt(document.getElementById('pdfFontSize').value) || 12, orientation: document.getElementById('pdfOrientation').value, signatureColor: sigColor };
}
function cssImpression(options) {
  var fs = options.fontSize; var sigColor = options.signatureColor || getSignatureColor();
  return '@page { size: ' + options.paperSize + ' ' + options.orientation + '; margin: 12mm; }' +
    ' *, html, body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }' +
    ' body { font-family: ' + options.fontFamily + '; font-size: ' + fs + 'pt; padding: 10px; color: #222; line-height: 1.45; }' +
    ' h1 { text-align: center; color: #0a6e2c; font-size: ' + (fs + 6) + 'pt; margin-bottom: 8px; }' +
    ' h2 { color: #0a6e2c; font-size: ' + (fs + 4) + 'pt; margin: 14px 0 8px; border-left: 4px solid #0a6e2c; padding-left: 8px; }' +
    ' h3 { color: #0a6e2c; font-size: ' + (fs + 3) + 'pt; margin: 12px 0 6px; }' +
    ' h4 { color: #0a6e2c; font-size: ' + (fs + 1) + 'pt; margin: 10px 0 6px; }' +
    ' h5 { color: #0a6e2c; font-size: ' + fs + 'pt; margin: 8px 0 4px; }' +
    ' p { font-size: ' + (fs - 1) + 'pt; }' +
    ' table { width: 100%; border-collapse: collapse; font-size: ' + (fs - 1) + 'pt; margin: 8px 0; }' +
    ' th { background: #0a6e2c !important; color: white !important; padding: 7px; text-align: left; }' +
    ' td { padding: 6px 7px; border-bottom: 1px solid #ddd; }' +
    ' td.num { text-align: right; }' +
    ' tfoot td { font-weight: bold; background: #e8f5e9 !important; color: #0a6e2c !important; border-top: 2px solid #0a6e2c; }' +
    ' .entity-block { background: #f9f9f9 !important; border-radius: 8px; padding: 10px; margin-bottom: 12px; border-left: 4px solid #0a6e2c; page-break-inside: avoid; }' +
    ' .badge { display: inline-block; padding: 2px 6px; border-radius: 8px; font-size: ' + (fs - 3) + 'pt; }' +
    ' .badge-ok { background: #c8e6c9 !important; color: #1b5e20 !important; }' +
    ' .badge-progress { background: #ffe0b2 !important; color: #e65100 !important; }' +
    ' .badge-archive { background: #e0e0e0 !important; color: #424242 !important; }' +
    ' .rapport-header { text-align: center; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 2px solid #0a6e2c; }' +
    ' hr { border: none; border-top: 2px solid #0a6e2c; margin: 10px 0; }' +
    ' .rn-section { margin: 10px 0; }' +
    ' .rn-section-title { background: #0a6e2c !important; color: white !important; padding: 7px 10px; font-size: ' + fs + 'pt; font-weight: 700; border-radius: 4px; margin: 10px 0 6px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }' +
    ' .rn-row { display: flex; justify-content: space-between; padding: 5px 8px; border-bottom: 1px dotted #ccc; font-size: ' + (fs - 1) + 'pt; }' +
    ' .rn-row strong { color: #0a6e2c; }' +
    ' .rn-observation { background: #fffde7 !important; padding: 10px; border-left: 4px solid #f9a825; margin-top: 10px; font-size: ' + (fs - 1) + 'pt; white-space: pre-wrap; }' +
    ' .rn-total { background: #e8f5e9 !important; padding: 8px 10px; border: 2px solid #0a6e2c; border-radius: 6px; text-align: center; font-size: ' + (fs + 1) + 'pt; font-weight: 700; color: #0a6e2c !important; margin: 10px 0; }' +
    ' .total-banque-final { background: #0a6e2c !important; color: white !important; padding: 16px; border-radius: 10px; margin-top: 20px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; page-break-inside: avoid; }' +
    ' .total-banque-final * { color: white !important; }' +
    ' .total-banque-final .banque-title { font-size: ' + (fs + 1) + 'pt; font-weight: 700; margin-bottom: 10px; }' +
    ' .total-banque-final .banque-table { width: 100%; font-size: ' + fs + 'pt; margin-bottom: 8px; }' +
    ' .total-banque-final .banque-table td { padding: 4px 0 !important; border-bottom: none !important; background: transparent !important; font-weight: 700 !important; }' +
    ' .total-banque-final .banque-table td.num, .total-banque-final .banque-table strong { color: white !important; font-weight: 700 !important; }' +
    ' .total-banque-final .banque-montant { font-size: ' + (fs + 4) + 'pt; font-weight: 700; border-top: 2px solid rgba(255,255,255,0.4); padding-top: 10px; margin-top: 6px; text-align: center; }' +
    ' .signature-block { page-break-inside: avoid !important; margin-top: 40px !important; }' +
    ' .signature-block table { width: 100% !important; margin: 0 !important; border-collapse: separate !important; }' +
    ' .signature-block td { border: none !important; padding: 0 !important; background: transparent !important; vertical-align: top !important; }' +
    ' .signature-color-picker, .sig-encre-picker { display: none !important; }' +
    ' .sig-canvas { display: none !important; }' +
    ' .signature-box img { display: block !important; }' +
    ' .signature-box { border: 2px solid ' + sigColor + ' !important; border-radius: 8px !important; padding: 8px !important; background: #f9f9f9 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }' +
    ' .signature-label { font-size: ' + (fs - 1) + 'pt !important; color: #666 !important; font-weight: 600 !important; }' +
    ' .signature-line { border-top: 1px solid ' + sigColor + ' !important; padding-top: 5px !important; font-size: ' + (fs - 1) + 'pt !important; text-align: center !important; font-weight: 700 !important; color: ' + sigColor + ' !important; margin-top: 6px !important; }' +
    ' div[style*="background:#fff3e0"] { font-size: inherit !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }';
}
function confirmerImpressionPdf() {
  if (!pdfContexteEnAttente) return;
  var options = lireOptionsPdf(); setSignatureColor(options.signatureColor);
  var ctx = pdfContexteEnAttente; var contenu = '', titre = 'Rapport';
  
  if (ctx.type === 'box') { 
    var box = document.getElementById(ctx.boxId); 
    if (!box || !box.innerHTML.trim()) { fermerModalPdf(); return alert('Rapport vide'); } 
    contenu = box.innerHTML; titre = ctx.titre || 'Rapport EMM'; 
  } else if (ctx.type === 'html') { 
    contenu = ctx.html; titre = ctx.titre || 'Rapport EMM'; 
  }
  
  if (!contenu) { fermerModalPdf(); return alert('Rapport vide'); }
  
  // TENTATIVE D'OUVERTURE DE LA FENÊTRE
  var w = window.open('', '_blank'); 
  
  // SI LE NAVIGATEUR BLOQUE LA FENÊTRE (Pop-up bloqué)
  if (!w) {
    alert("⚠️ Votre navigateur a bloqué l'ouverture de la fenêtre d'impression.\n\nAllez dans les paramètres de votre navigateur et autorisez les 'Pop-ups' pour ce site.");
    return;
  }
  
  var css = cssImpression(options);
  w.document.write('<html><head><meta charset="UTF-8"><title>' + titre + '</title><style>' + css + '</style></head><body>');
  w.document.write('<h1>EMM MONDIAL</h1><hr>' + contenu);
  w.document.write('<p style="text-align:center;font-size:' + (options.fontSize - 2) + 'pt;color:#888;margin-top:20px">Généré le ' + new Date().toLocaleString('fr-FR') + ' par ' + (currentUser ? (currentUser.email) : '') + '</p>');
  w.document.write('</body></html>'); 
  w.document.close(); 
  fermerModalPdf(); 
  
  setTimeout(function() { 
    w.print(); 
  }, 800);
}

function signatureBlockHTML() {
  var couleur = getSignatureColor(); var couleurEncre = getSignatureEncreColor();
  var presetsCases = ['#0a6e2c','#000000','#1976d2','#d32f2f','#6a1b9a','#e65100','#1b5e20','#37474f']; var presetsHtml = '';
  presetsCases.forEach(function(c) { var sel = (c.toLowerCase() === couleur.toLowerCase()); presetsHtml += '<button type="button" data-color="' + c + '" onclick="appliquerCouleurSignature(\'' + c + '\')" style="width:30px;height:30px;border-radius:50%;border:2px solid white;background:' + c + ';cursor:pointer;padding:0;' + (sel ? 'box-shadow:0 0 0 2px #333;' : 'box-shadow:0 0 0 1px #ddd;') + '" title="' + c + '"></button>'; });
  var presetsEncre = ['#111111','#1976d2','#0a6e2c','#d32f2f','#6a1b9a','#e65100']; var presetsEncreHtml = '';
  presetsEncre.forEach(function(c) { var sel = c.toLowerCase() === couleurEncre.toLowerCase(); presetsEncreHtml += '<button type="button" class="sig-encre-btn" data-encre="' + c + '" onclick="appliquerCouleurSignatureEncre(\'' + c + '\')" style="width:26px;height:26px;border-radius:50%;border:2px solid white;background:' + c + ';cursor:pointer;padding:0;' + (sel ? 'box-shadow:0 0 0 2px #333;' : 'box-shadow:0 0 0 1px #ddd;') + '" title="' + c + '"></button>'; });
  return '<div class="signature-block" style="margin-top:40px;page-break-inside:avoid">' + '<div class="signature-color-picker" style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;padding:10px;background:#f0f4f0;border-radius:8px;border:2px dashed #0a6e2c">' + '<div style="font-size:11px;color:#0a6e2c;font-weight:700;text-align:center;margin-bottom:2px">🎨 Couleur de la CASE de signature</div>' + '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:center">' + presetsHtml + '</div>' + '<div style="display:flex;gap:6px;align-items:center;justify-content:center;flex-wrap:wrap;margin-top:4px">' + '<label style="font-size:11px;color:#555">Perso :</label>' + '<input type="color" value="' + couleur + '" oninput="appliquerCouleurSignature(this.value)" onchange="appliquerCouleurSignature(this.value)" style="width:44px;height:32px;padding:2px;border:2px solid #ddd;border-radius:6px;cursor:pointer;background:white">' + '<input type="text" value="' + couleur + '" onchange="appliquerCouleurSignature(this.value)" maxlength="7" style="width:90px;padding:6px 8px;border:2px solid #ddd;border-radius:6px;font-size:12px;font-family:monospace;text-align:center">' + '<button type="button" onclick="appliquerCouleurSignature(\'#0a6e2c\')" style="padding:6px 10px;border:1px solid #0a6e2c;border-radius:6px;background:#e8f5e9;color:#0a6e2c;cursor:pointer;font-size:11px;font-weight:600">↺ Reset</button>' + '</div>' + '</div>' + '<div class="sig-encre-picker" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:#fff8e1;padding:10px;border-radius:8px;border:2px dashed #e65100;margin-bottom:12px">' + '<div style="font-size:11px;color:#e65100;font-weight:700;width:100%;text-align:center;margin-bottom:2px">✒️ Couleur de l\'ENCRE de la signature (le tracé)</div>' + '<input type="color" value="' + couleurEncre + '" oninput="appliquerCouleurSignatureEncre(this.value)" onchange="appliquerCouleurSignatureEncre(this.value)" style="width:44px;height:32px;padding:2px;border:2px solid #ddd;border-radius:6px;cursor:pointer;background:white">' + '<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center;flex:1">' + presetsEncreHtml + '</div>' + '</div>' + '<table style="width:100%;border:none;border-collapse:separate"><tr>' + '<td style="width:48%;padding:0;border:none;vertical-align:top">' + '<div class="signature-box" style="border:2px solid ' + couleur + ';border-radius:8px;padding:8px;background:#f9f9f9">' + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' + '<span class="signature-label" style="font-size:11pt;color:#666;font-weight:600">✍️ Signature</span>' + '<button type="button" onclick="effacerSignatureBlock(this)" style="padding:4px 8px;border:1px solid #ddd;border-radius:6px;background:white;cursor:pointer;font-size:11px">🧹 Effacer</button>' + '</div>' + '<canvas class="sig-canvas" style="width:100%;height:110px;touch-action:none;display:block;background:white;border:1px dashed #ccc;border-radius:6px;cursor:crosshair"></canvas>' + '<div class="signature-line" style="border-top:1px solid ' + couleur + ';margin-top:6px;padding-top:5px;font-size:11pt;text-align:center;font-weight:700;color:' + couleur + '">Le Responsable</div>' + '</div>' + '</td>' + '<td style="width:4%;padding:0;border:none"></td>' + '<td style="width:48%;padding:0;border:none;vertical-align:top">' + '<div class="signature-box" style="border:2px solid ' + couleur + ';border-radius:8px;padding:8px;background:#f9f9f9">' + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' + '<span class="signature-label" style="font-size:11pt;color:#666;font-weight:600">✍️ Signature</span>' + '<button type="button" onclick="effacerSignatureBlock(this)" style="padding:4px 8px;border:1px solid #ddd;border-radius:6px;background:white;cursor:pointer;font-size:11px">🧹 Effacer</button>' + '</div>' + '<canvas class="sig-canvas" style="width:100%;height:110px;touch-action:none;display:block;background:white;border:1px dashed #ccc;border-radius:6px;cursor:crosshair"></canvas>' + '<div class="signature-line" style="border-top:1px solid ' + couleur + ';margin-top:6px;padding-top:5px;font-size:11pt;text-align:center;font-weight:700;color:' + couleur + '">L\'Administrateur</div>' + '</div>' + '</td>' + '</tr></table></div>';
}
// --- FIN DE LA PARTIE 1 ---

// ========== TABLEAU DE BORD & ANNONCES ==========
var _chartPresenceInstance = null; // Variable globale pour garder le graphique en mémoire

function afficherDashboard() {
  var box = document.getElementById('dashboardBox');
  if (!box) return;
  
  var entites = entitesProvince().filter(function(e) { return !e.archived; }).length;
  var parts = participationsProvince().filter(function(p) { return !p.archived; });
  var totM = 0, totS = 0, totN = 0;
  parts.forEach(function(p) { totM += p.m; totS += p.s; totN += p.n; });
  var totPart = totM + totS + totN;
  
  var fiches = fichesProvince().filter(function(f) { return !f.archived; }).length;
  var cands = candidatsProvince().filter(function(c) { return !c.archived; });
  var totalVerse = cands.reduce(function(a, c) { return a + (c.totalVerse || 0); }, 0);
  var deps = depouillementsProvince().filter(function(d) { return !d.archived; });
  var soldeDepFC = 0, soldeDepUSD = 0;
  deps.forEach(function(d) { d.entites.forEach(function(e) { var s = sumEntiteDep(e); soldeDepFC += s.soldeFC; soldeDepUSD += s.soldeUSD; }); });
  var sitesP = sitesPatrimoineProvince().filter(function(s) { return !s.archived; }).length;
  var biensP = biensPatrimoineProvince().filter(function(b) { return !b.archived; }).length;
  
  var provinceLabel = getProvinceActive() || 'Toutes';
  
  var html = '<p style="text-align:center;font-size:12px;color:#0a6e2c;font-weight:600;margin-bottom:10px">🌍 Province : ' + echapper(provinceLabel === '__non_assignee' ? 'Non assignées' : provinceLabel) + '</p>';
  
  // Bloc pour le graphique
  html += '<div style="background: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 15px;">';
  html += '<h4 style="text-align:center; color:#0a6e2c; margin-bottom:15px;">📊 Répartition des Présences</h4>';
  html += '<div style="position: relative; height: 250px; width: 100%; display: flex; justify-content: center;">';
  html += '<canvas id="chartPresenceCanvas"></canvas>';
  html += '</div></div>';

  html += '<div class="table-wrapper"><table class="data-table"><tbody>';
  html += '<tr><th colspan="2">📈 MODULE I — FRÉQUENCES</th></tr>';
  html += '<tr><td>Entités actives</td><td class="num">' + entites + '</td></tr>';
  html += '<tr><td>Total présences</td><td class="num">' + totPart + '</td></tr>';
  html += '<tr><td>Fiches mensuelles</td><td class="num">' + fiches + '</td></tr>';
  html += '<tr><th colspan="2">💰 MODULE II — FINANCE</th></tr>';
  html += '<tr><td>Candidats actifs</td><td class="num">' + cands.length + '</td></tr>';
  html += '<tr><td>Total versé</td><td class="num">' + totalVerse.toFixed(2) + ' $</td></tr>';
  html += '<tr><th colspan="2">🧾 MODULE III — DÉPOUILLEMENT</th></tr>';
  html += '<tr><td>Séances actives</td><td class="num">' + deps.length + '</td></tr>';
  html += '<tr><td>Solde total FC</td><td class="num">' + soldeDepFC.toLocaleString() + ' FC</td></tr>';
  html += '<tr><td>Solde total USD</td><td class="num">' + soldeDepUSD.toLocaleString() + ' $</td></tr>';
  html += '<tr><th colspan="2">🏛️ MODULE IV — PATRIMOINE</th></tr>';
  html += '<tr><td>Sites enregistrés</td><td class="num">' + sitesP + '</td></tr>';
  html += '<tr><td>Biens enregistrés</td><td class="num">' + biensP + '</td></tr>';
  html += '</tbody></table></div>';
  
  box.innerHTML = html;

  // Dessiner le graphique
  dessinerGraphiquePresence(totM, totS, totN);
}

function dessinerGraphiquePresence(m, s, nv) {
  if (typeof Chart === 'undefined') {
    console.warn("Chart.js n'est pas chargé.");
    return;
  }
  var canvas = document.getElementById('chartPresenceCanvas');
  if (!canvas) return;

  // Détruire l'ancien graphique s'il existe (pour éviter les bugs d'affichage)
  if (_chartPresenceInstance) {
    _chartPresenceInstance.destroy();
  }

  var dataValues = [m, s, nv];
  var labels = ['Membres', 'Sympathisants', 'Nouveaux'];
  var colors = ['#0a6e2c', '#1976d2', '#ff9800'];

  // Si toutes les données sont à 0, on affiche un cercle gris
  if (m === 0 && s === 0 && nv === 0) {
    dataValues = [1];
    labels = ['Aucune donnée'];
    colors = ['#e0e0e0'];
  }

  var ctx = canvas.getContext('2d');
  _chartPresenceInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: dataValues,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          position: 'bottom',
          labels: { font: { size: 13 } }
        }
      }
    }
  });
}

function afficherAnnonces() {
  var list = DB.get('annonces', []); var box = document.getElementById('announcementsBox'); if (!box) return;
  if (!list.length) { box.innerHTML = '<p>Aucune annonce.</p>'; return; }
  var html = '';
  list.slice().reverse().forEach(function(a) {
    html += '<div class="item-list"' + (a.archived ? ' style="opacity:0.7;background:#f0f0f0"' : '') + '>';
    html += '<strong>📢 ' + a.date + '</strong><br>' + echapper(a.texte);
    if (isAdmin()) {
      html += '<div style="margin-top:6px">';
      html += '<button class="btn-mini orange" onclick="modifierAnnonce(\'' + a.id + '\')">✏️</button>';
      html += '<button class="btn-mini ' + (a.archived ? 'blue' : 'gray') + '" onclick="archiverAnnonce(\'' + a.id + '\')">' + (a.archived ? '↩️' : '📦') + '</button>';
      html += '<button class="btn-mini danger" onclick="supprimerAnnonce(\'' + a.id + '\')">🗑️</button></div>';
    }
    html += '</div>';
  });
  box.innerHTML = html;
}

function publierAnnonce() {
  if (!isAdmin()) return alert('Réservé admin');
  var texte = document.getElementById('annonceText').value.trim(); if (!texte) return alert('Écrivez une annonce');
  var list = DB.get('annonces', []); list.push({ id: uid(), texte: texte, date: new Date().toLocaleDateString('fr-FR'), auteur: currentUser ? (currentUser.nom || currentUser.email) : 'Admin', archived: false });
  DB.set('annonces', list); reinitialiserFormAnnonce(); afficherAnnonces(); alert('✅ Annonce publiée');
}
function reinitialiserFormAnnonce() { var el = document.getElementById('annonceText'); if (el) el.value = ''; }
function modifierAnnonce(id) {
  if (!isAdmin()) return alert('Réservé admin'); var list = DB.get('annonces', []); var a = list.find(function(x) { return x.id === id; }); if (!a) return;
  var txt = prompt('Modifier :', a.texte); if (txt === null) return; a.texte = txt.trim(); DB.set('annonces', list); afficherAnnonces(); alert('✅ Modifiée');
}
function archiverAnnonce(id) {
  if (!isAdmin()) return alert('Réservé admin'); var list = DB.get('annonces', []); var a = list.find(function(x) { return x.id === id; }); if (!a) return;
  a.archived = !a.archived; DB.set('annonces', list); afficherAnnonces(); alert(a.archived ? '📦 Archivée' : '↩️ Restaurée');
}
function supprimerAnnonce(id) {
  if (!isAdmin()) return alert('Réservé admin'); if (!confirm('⚠️ Supprimer cette annonce ?')) return;
  DB.set('annonces', DB.get('annonces', []).filter(function(a) { return a.id !== id; })); afficherAnnonces();
}

// ========== MODULE I — ENTITÉS ==========
function ajouterEntite() {
  var prov = exigerProvince(); if (!prov) return;
  var type = document.getElementById('jTypeEntite').value; var nom = document.getElementById('jNomEntite').value.trim().toUpperCase(); var resp = document.getElementById('jResponsable').value.trim();
  if (!nom || !resp) return alert('Remplissez tous les champs');
  var entites = DB.get('entites', []);
  if (entites.find(function(e) { return e.nom === nom && e.province === prov && !e.archived; })) return alert('Cette entité existe déjà dans cette province');
  entites.push({ id: uid(), type: type, nom: nom, responsable: resp, province: prov, archived: false });
  DB.set('entites', entites); reinitialiserFormEntite(); refreshAll(); alert('✅ Entité ajoutée : ' + nom + ' (' + prov + ')');
}
function reinitialiserFormEntite() { var a = document.getElementById('jNomEntite'); if (a) a.value = ''; var b = document.getElementById('jResponsable'); if (b) b.value = ''; var c = document.getElementById('jTypeEntite'); if (c) c.selectedIndex = 0; }

function rafraichirEntites() {
  var entites = entitesProvince().filter(function(e) { return !e.archived; });
  ['jEntiteSelect','mEntite'].forEach(function(id) {
    var sel = document.getElementById(id); if (!sel) return; var val = sel.value; var opts = '';
    entites.forEach(function(e) { opts += '<option value="' + e.id + '">' + e.type + ' - ' + e.nom + (e.province ? ' (' + e.province + ')' : '') + '</option>'; });
    sel.innerHTML = opts; if (val) sel.value = val;
  });
}

function afficherListeEntites() {
  var filtre = document.getElementById('filtreEntites') ? document.getElementById('filtreEntites').value : 'actif';
  var search = (document.getElementById('searchEntiteListe') ? document.getElementById('searchEntiteListe').value : '').toUpperCase();
  var entites = entitesProvince(); entites = filtrerListe(entites, filtre);
  if (search) entites = entites.filter(function(e) { return e.nom.indexOf(search) !== -1; });
  var box = document.getElementById('listeEntites'); if (!box) return;
  if (!entites.length) { box.innerHTML = '<p>Aucune entité.</p>'; return; }
  var html = '';
  entites.forEach(function(e) {
    html += '<div class="item-list" style="padding:12px' + (e.archived ? ';opacity:0.7;background:#f0f0f0' : '') + '">';
    html += '<div style="font-size:14px;color:#0a6e2c;font-weight:600;margin-bottom:4px">🏛️ ' + echapper(e.type) + ' - ' + echapper(e.nom) + (e.archived ? ' <span class="badge badge-archive">📦</span>' : '') + '</div>';
    html += '<div style="font-size:12px;color:#666;margin-bottom:8px">👤 ' + echapper(e.responsable) + (e.province ? ' | 🌍 ' + echapper(e.province) : ' | 📭 Non assignée') + '</div>';
    html += '<button class="btn-mini orange" onclick="modifierEntite(\'' + e.id + '\')">✏️ Modifier</button> ';
    html += '<button class="btn-mini ' + (e.archived ? 'blue' : 'gray') + '" onclick="archiverEntite(\'' + e.id + '\')">' + (e.archived ? '↩️ Désarchiver' : '📦 Archiver') + '</button> ';
    html += '<button class="btn-mini danger" onclick="supprimerEntite(\'' + e.id + '\')">🗑️ Supprimer</button></div>';
  });
  box.innerHTML = html;
}

function modifierEntite(id) {
  var list = DB.get('entites', []); var e = list.find(function(x) { return x.id === id; }); if (!e) return;
  var type = prompt('Type :', e.type); if (type === null) return; var nom = prompt('Nom :', e.nom); if (nom === null) return;
  var resp = prompt('Responsable :', e.responsable); if (resp === null) return; var prov = prompt('Province :', e.province || ''); if (prov === null) return;
  var nn = nom.trim().toUpperCase(); if (!nn) return alert('Nom vide'); var provFinale = prov.trim() || e.province;
  if (list.find(function(x) { return x.id !== id && x.nom === nn && x.province === provFinale && !x.archived; })) return alert('⚠️ Nom déjà utilisé dans cette province');
  e.type = type.trim() || e.type; e.nom = nn; e.responsable = resp.trim(); if (provFinale) e.province = provFinale;
  DB.set('entites', list); refreshAll(); alert('✅ Modifiée');
}

function archiverEntite(id) {
  var list = DB.get('entites', []); var e = list.find(function(x) { return x.id === id; }); if (!e) return;
  if (!e.archived) { if (!confirm('📦 Archiver "' + e.nom + '" ?')) return; e.archived = true; } else { e.archived = false; }
  DB.set('entites', list); refreshAll(); alert(e.archived ? '📦 Archivée' : '↩️ Restaurée');
}

function supprimerEntite(id) {
  var e = DB.get('entites', []).find(function(x) { return x.id === id; }); if (!e) return;
  var parts = DB.get('participations', []).filter(function(p) { return p.entiteId === id; }); var msg = '⚠️ Supprimer "' + e.nom + '" ?';
  if (parts.length) msg += '\n\n' + parts.length + ' participation(s) liée(s) supprimée(s).'; if (!confirm(msg)) return;
  DB.set('entites', DB.get('entites', []).filter(function(x) { return x.id !== id; })); DB.set('participations', DB.get('participations', []).filter(function(p) { return p.entiteId !== id; })); refreshAll(); alert('✅ Supprimée');
}

// ========== MODULE I — JOURNALIÈRE & FICHE MENSUELLE ==========
function enregistrerParticipation() {
  var prov = exigerProvince(); if (!prov) return;
  var entiteId = document.getElementById('jEntiteSelect').value; var date = document.getElementById('jDate').value;
  var m = parseInt(document.getElementById('jMembres').value) || 0; var s = parseInt(document.getElementById('jSympathisants').value) || 0; var n = parseInt(document.getElementById('jNouveaux').value) || 0;
  if (!entiteId) return alert('⚠️ Enregistrez d\'abord une entité'); if (!date) return alert('Choisissez une date');
  var list = DB.get('participations', []); list.push({ id: uid(), entiteId: entiteId, date: date, m: m, s: s, n: n, province: prov, createdAt: new Date().toISOString(), auteur: currentUser ? (currentUser.nom || currentUser.email) : '', archived: false });
  DB.set('participations', list); reinitialiserFormParticipation(); afficherJournaliere(); alert('✅ Enregistrée (' + prov + ')');
}
function reinitialiserFormParticipation() { var a = document.getElementById('jDate'); if (a) a.value = ''; var b = document.getElementById('jMembres'); if (b) b.value = 0; var c = document.getElementById('jSympathisants'); if (c) c.value = 0; var d = document.getElementById('jNouveaux'); if (d) d.value = 0; }
function afficherJournaliere() {
  var filtre = document.getElementById('filtreParticipations') ? document.getElementById('filtreParticipations').value : 'actif'; var parts = filtrerListe(participationsProvince(), filtre); var box = document.getElementById('listeJournaliere'); if (!box) return;
  if (!parts.length) { box.innerHTML = '<p>Aucune donnée.</p>'; return; }
  var parEntite = {}; parts.forEach(function(p) { if (!parEntite[p.entiteId]) parEntite[p.entiteId] = []; parEntite[p.entiteId].push(p); }); var html = '';
  Object.keys(parEntite).forEach(function(eid) {
    var lignes = parEntite[eid].slice().sort(function(a, b) { return new Date(a.date) - new Date(b.date); }); var tm = 0, ts = 0, tn = 0; lignes.forEach(function(p) { tm += p.m; ts += p.s; tn += p.n; });
    html += '<div class="entity-block"><h4>📍 ' + echapper(getEntiteNom(eid)) + '</h4><div class="table-wrapper"><table class="data-table"><thead><tr><th>Date</th><th>M</th><th>S</th><th>NV</th><th>Actions</th></tr></thead><tbody>';
    lignes.forEach(function(p) {
      html += '<tr' + (p.archived ? ' style="opacity:0.6"' : '') + '><td>' + fmtDate(p.date) + '</td><td class="num">' + p.m + '</td><td class="num">' + p.s + '</td><td class="num">' + p.n + '</td><td>';
      html += '<button class="btn-mini orange" onclick="modifierParticipation(\'' + p.id + '\')">✏️</button><button class="btn-mini ' + (p.archived ? 'blue' : 'gray') + '" onclick="archiverParticipation(\'' + p.id + '\')">' + (p.archived ? '↩️' : '📦') + '</button><button class="btn-mini danger" onclick="supprimerParticipation(\'' + p.id + '\')">🗑️</button></td></tr>';
    });
    html += '</tbody><tfoot><tr><td>TOTAL</td><td class="num">' + tm + '</td><td class="num">' + ts + '</td><td class="num">' + tn + '</td><td></td></tr></tfoot></table></div></div>';
  });
  box.innerHTML = html;
}
function modifierParticipation(id) {
  var list = DB.get('participations', []); var p = list.find(function(x) { return x.id === id; }); if (!p) return;
  var date = prompt('Date (AAAA-MM-JJ) :', p.date); if (date === null) return; var m = prompt('Membres :', p.m); if (m === null) return;
  var s = prompt('Sympathisants :', p.s); if (s === null) return; var n = prompt('Nouveaux venus :', p.n); if (n === null) return;
  p.date = date.trim(); p.m = parseInt(m) || 0; p.s = parseInt(s) || 0; p.n = parseInt(n) || 0; DB.set('participations', list); afficherJournaliere(); alert('✅ Modifiée');
}
function archiverParticipation(id) { var list = DB.get('participations', []); var p = list.find(function(x) { return x.id === id; }); if (!p) return; p.archived = !p.archived; DB.set('participations', list); afficherJournaliere(); alert(p.archived ? '📦 Archivée' : '↩️ Restaurée'); }
function supprimerParticipation(id) { if (!confirm('⚠️ Supprimer ?')) return; DB.set('participations', DB.get('participations', []).filter(function(x) { return x.id !== id; })); afficherJournaliere(); }

function enregistrerFicheMensuelle() {
  var prov = exigerProvince(); if (!prov) return;
  var numericIds = ['mEncadreurs','mMembresActifs','mSympathisants','mFMembres','mFSympathisants','mFNouveaux','mFoyersLumiere','mAvecGoshintai','mSansGoshintai','mFoyersSymp','mFleurs','mPotagers','mTotalPotagers','mMaisonsOuvertes','mTemoignages','mCandGoshintai','mConfInit','mConfReinit','mConfShoku','mConfKannon','mConfMitamaya','mAssistMembres','mAssistSymp','mConcessions','mTerrains','mCampagnes','mCoursEns','mCoursFleurs'];
  var f = { id: uid(), province: prov, entiteId: document.getElementById('mEntite').value, mois: document.getElementById('mMois').value, annee: document.getElementById('mAnnee').value, responsable: document.getElementById('mResponsable').value, jourReunion: document.getElementById('mJourReunion').value, themes: document.getElementById('mThemes').value, graces: document.getElementById('mGraces').value, points: document.getElementById('mPoints').value, solutions: document.getElementById('mSolutions').value, objectifs: document.getElementById('mObjectifs').value, actions: document.getElementById('mActions').value, archived: false, dateCreation: new Date().toISOString() };
  numericIds.forEach(function(id) { var el = document.getElementById(id); f[id] = el ? (parseInt(el.value) || 0) : 0; });
  if (!f.entiteId) return alert('⚠️ Enregistrez d\'abord une entité');
  var list = DB.get('fichesMensuelles', []); list.push(f); DB.set('fichesMensuelles', list); alert('✅ Fiche enregistrée (' + prov + ')'); rechercherFreqAvance();
}
function reinitialiserFormFiche() {
  var ids = ['mResponsable','mThemes','mGraces','mPoints','mSolutions','mObjectifs','mActions']; ids.forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; });
  var nums = ['mEncadreurs','mMembresActifs','mSympathisants','mFMembres','mFSympathisants','mFNouveaux','mFoyersLumiere','mAvecGoshintai','mSansGoshintai','mFoyersSymp','mFleurs','mPotagers','mTotalPotagers','mMaisonsOuvertes','mTemoignages','mCandGoshintai','mConfInit','mConfReinit','mConfShoku','mConfKannon','mConfMitamaya','mAssistMembres','mAssistSymp','mConcessions','mTerrains','mCampagnes','mCoursEns','mCoursFleurs'];
  nums.forEach(function(id) { var el = document.getElementById(id); if (el) el.value = 0; });
}
function tableFicheMensuelle(f) {
  var h = '<div class="entity-block"' + (f.archived ? ' style="opacity:0.7;background:#f0f0f0"' : '') + '><h4>📍 ' + echapper(getEntiteNom(f.entiteId)) + ' — ' + echapper(f.mois) + ' ' + echapper(f.annee);
  if (f.province) h += ' <span style="display:inline-block;padding:2px 8px;background:#0d6efd;color:white;border-radius:10px;font-size:11px;font-weight:600;margin-left:6px">🌍 ' + echapper(f.province) + '</span>';
  if (f.archived) h += ' <span class="badge badge-archive">📦</span>'; h += '</h4><div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0;padding:10px;background:#fff;border-radius:8px;border:1px dashed #0a6e2c">';
  h += '<button class="btn-mini orange" onclick="modifierFiche(\'' + f.id + '\')" style="padding:8px 12px;font-size:12px">✏️</button><button class="btn-mini ' + (f.archived ? 'blue' : 'gray') + '" onclick="archiverFiche(\'' + f.id + '\')" style="padding:8px 12px;font-size:12px">' + (f.archived ? '↩️' : '📦') + '</button><button class="btn-mini danger" onclick="supprimerFiche(\'' + f.id + '\')" style="padding:8px 12px;font-size:12px">🗑️</button></div>';
  h += '<div class="table-wrapper"><table class="data-table"><tbody><tr><td>Responsable</td><td>' + echapper(f.responsable) + '</td></tr><tr><td>Encadreurs</td><td class="num">' + (f.mEncadreurs || 0) + '</td></tr><tr><td>Membres actifs</td><td class="num">' + (f.mMembresActifs || 0) + '</td></tr><tr><td>Sympathisants</td><td class="num">' + (f.mSympathisants || 0) + '</td></tr><tr><td>Thèmes</td><td>' + echapper(f.themes) + '</td></tr><tr><td>Grâces</td><td>' + echapper(f.graces) + '</td></tr></tbody></table></div></div>';
  return h;
}
function modifierFiche(id) {
  var list = DB.get('fichesMensuelles', []); var f = list.find(function(x) { return x.id === id; }); if (!f) return;
  var resp = prompt('Responsable :', f.responsable); if (resp === null) return; f.responsable = resp.trim(); var themes = prompt('Thèmes :', f.themes); if (themes === null) return; f.themes = themes;
  var graces = prompt('Grâces :', f.graces); if (graces === null) return; f.graces = graces; DB.set('fichesMensuelles', list); alert('✅ Modifiée'); rechercherFreqAvance();
}
function archiverFiche(id) { var list = DB.get('fichesMensuelles', []); var f = list.find(function(x) { return x.id === id; }); if (!f) return; f.archived = !f.archived; DB.set('fichesMensuelles', list); alert(f.archived ? '📦 Archivée' : '↩️ Restaurée'); rechercherFreqAvance(); }
function supprimerFiche(id) { if (!confirm('⚠️ Supprimer cette fiche ?')) return; DB.set('fichesMensuelles', DB.get('fichesMensuelles', []).filter(function(x) { return x.id !== id; })); alert('✅ Supprimée'); rapportFreqDetaille(); }
function rechercherFreqAvance() {
  var q = (document.getElementById('searchFreq').value || '').toUpperCase().trim(); var annee = (document.getElementById('searchFreqAnnee').value || '').trim(); var mois = document.getElementById('searchFreqMois').value; var statut = document.getElementById('searchFreqStatut').value;
  var fiches = filtrerListe(fichesProvince(), statut); fiches = fiches.filter(function(f) { var nom = getEntiteNom(f.entiteId).toUpperCase(); return (!q || nom.indexOf(q) !== -1) && (!annee || String(f.annee) === annee) && (!mois || f.mois === mois); });
  var provLabel = getProvinceActive() || 'Toutes'; var html = '<h3>Résultats (' + fiches.length + ') — 🌍 ' + echapper(provLabel === '__non_assignee' ? 'Non assignées' : provLabel) + '</h3>';
  if (!fiches.length) html += '<p>Aucun résultat.</p>'; else fiches.forEach(function(f) { html += tableFicheMensuelle(f); }); document.getElementById('rapportFreqBox').innerHTML = html;
}
function reinitialiserRechercheFreq() { var a = document.getElementById('searchFreq'); if (a) a.value = ''; var b = document.getElementById('searchFreqAnnee'); if (b) b.value = ''; var c = document.getElementById('searchFreqMois'); if (c) c.selectedIndex = 0; var d = document.getElementById('searchFreqStatut'); if (d) d.selectedIndex = 0; document.getElementById('rapportFreqBox').innerHTML = ''; }
function rapportFreqGlobal() {
  var fiches = fichesProvince().filter(function(f) { return !f.archived; }); var parts = participationsProvince().filter(function(p) { return !p.archived; }); var tm = 0, ts = 0, tn = 0; parts.forEach(function(p) { tm += p.m; ts += p.s; tn += p.n; });
  var provLabel = getProvinceActive() || 'Toutes'; var html = '<div class="rapport-header"><h3>📊 RAPPORT GLOBAL — FRÉQUENCES</h3><p>🌍 ' + echapper(provLabel === '__non_assignee' ? 'Non assignées' : provLabel) + '</p></div><div class="table-wrapper"><table class="data-table"><tbody>';
  html += '<tr><td>Fiches mensuelles</td><td class="num">' + fiches.length + '</td></tr><tr><td>Participations</td><td class="num">' + parts.length + '</td></tr><tr><td>Total Membres</td><td class="num">' + tm + '</td></tr><tr><td>Total Sympathisants</td><td class="num">' + ts + '</td></tr><tr><td>Total Nouveaux</td><td class="num">' + tn + '</td></tr></tbody></table></div>';
  if (fiches.length) fiches.forEach(function(f) { html += tableFicheMensuelle(f); }); document.getElementById('rapportFreqBox').innerHTML = html;
}
function rapportFreqDetaille() {
  var fiches = fichesProvince().filter(function(f) { return !f.archived; }); var provLabel = getProvinceActive() || 'Toutes';
  if (!fiches.length) { document.getElementById('rapportFreqBox').innerHTML = '<p>Aucune fiche active — 🌍 ' + echapper(provLabel === '__non_assignee' ? 'Non assignées' : provLabel) + '</p>'; return; }
  var html = '<div class="rapport-header"><h3>📋 RAPPORT DÉTAILLÉ — FRÉQUENCES</h3><p>🌍 ' + echapper(provLabel === '__non_assignee' ? 'Non assignées' : provLabel) + '</p></div>';
  fiches.forEach(function(f) { html += tableFicheMensuelle(f); }); document.getElementById('rapportFreqBox').innerHTML = html;
}
function recalculerTotauxRN() { var elM = document.getElementById('rnCulteMembres'); var elS = document.getElementById('rnCulteSymp'); var elN = document.getElementById('rnCulteNV'); var elT = document.getElementById('rnCulteTotal'); if (!elT) return; var cm = elM ? (parseInt(elM.value) || 0) : 0; var cs = elS ? (parseInt(elS.value) || 0) : 0; var cn = elN ? (parseInt(elN.value) || 0) : 0; elT.value = cm + cs + cn; }

// ========== MODULE II — PHOTO & SIGNATURE ==========
function previewPhotoCandidat(ev) {
  var file = ev.target.files[0]; if (!file) { photoCandidatTemp = null; var p = document.getElementById('cPhotoPreview'); if (p) p.innerHTML = ''; return; }
  if (file.size > 5 * 1024 * 1024) return alert('⚠️ Image trop lourde (max 5 Mo)'); var reader = new FileReader();
  reader.onload = function(e) { var img = new Image(); img.onload = function() { var canvas = document.createElement('canvas'); canvas.width = 250; canvas.height = 250; var ctx = canvas.getContext('2d'); var min = Math.min(img.width, img.height); ctx.drawImage(img, (img.width-min)/2, (img.height-min)/2, min, min, 0, 0, 250, 250); photoCandidatTemp = canvas.toDataURL('image/jpeg', 0.65); document.getElementById('cPhotoPreview').innerHTML = '<img src="' + photoCandidatTemp + '" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:3px solid #0a6e2c;box-shadow:0 2px 8px rgba(0,0,0,0.2)">'; }; img.src = e.target.result; }; reader.readAsDataURL(file);
}

function initSignature() {
  var canvas = document.getElementById('vSignatureCanvas'); if (!canvas) return;
  var ratio = window.devicePixelRatio || 1; var rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) { setTimeout(initSignature, 200); return; }
  canvas.width = rect.width * ratio; canvas.height = rect.height * ratio;
  signatureCanvas = canvas; signatureCtx = canvas.getContext('2d');
  signatureCtx.setTransform(1, 0, 0, 1, 0, 0); signatureCtx.scale(ratio, ratio);
  signatureCtx.lineWidth = 3; signatureCtx.lineCap = 'round'; signatureCtx.lineJoin = 'round';
  signatureCtx.strokeStyle = getSignatureEncreColor(); // CORRECTION ICI : On applique la couleur
  signatureCtx.fillStyle = getSignatureEncreColor();
  
  if (canvas.dataset.listeners === '1') return; canvas.dataset.listeners = '1';
  var drawing = false, lastX = 0, lastY = 0;
  function getPos(e) { var r = canvas.getBoundingClientRect(); var p = (e.touches && e.touches.length) ? e.touches[0] : (e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : e); return { x: p.clientX - r.left, y: p.clientY - r.top }; }
  function start(e) { 
    e.preventDefault(); drawing = true; 
    signatureCtx.strokeStyle = getSignatureEncreColor(); 
    signatureCtx.fillStyle = getSignatureEncreColor();
    var p = getPos(e); lastX = p.x; lastY = p.y; 
    signatureCtx.beginPath(); signatureCtx.arc(p.x, p.y, 1.5, 0, Math.PI * 2); signatureCtx.fill(); 
    signatureVide = false; var st = document.getElementById('vSignatureStatus'); if (st) { st.textContent = '✅ Signé'; st.style.color = '#0a6e2c'; } 
  }
  function move(e) { 
    if (!drawing) return; e.preventDefault(); 
    signatureCtx.strokeStyle = getSignatureEncreColor(); 
    var p = getPos(e); 
    signatureCtx.beginPath(); signatureCtx.moveTo(lastX, lastY); signatureCtx.lineTo(p.x, p.y); signatureCtx.stroke(); 
    lastX = p.x; lastY = p.y; signatureVide = false; 
  }
  function stop() { drawing = false; }
  canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', move); canvas.addEventListener('mouseup', stop); canvas.addEventListener('mouseleave', stop); canvas.addEventListener('touchstart', start, { passive: false }); canvas.addEventListener('touchmove', move, { passive: false }); canvas.addEventListener('touchend', stop); canvas.addEventListener('touchcancel', stop);
}
function effacerSignature() { if (!signatureCtx || !signatureCanvas) return; signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height); signatureVide = true; var st = document.getElementById('vSignatureStatus'); if (st) { st.textContent = 'Aucune signature'; st.style.color = '#888'; } }

// ========== MODULE II — CANDIDATS & VERSEMENTS ==========
function ajouterCandidat() {
  var prov = exigerProvince(); if (!prov) return; var nom = document.getElementById('cNom').value.trim(); var typeEntite = document.getElementById('cTypeEntite').value; var nomEntite = document.getElementById('cNomEntite').value.trim().toUpperCase(); var responsable = document.getElementById('cResponsable').value.trim(); var motif = document.getElementById('cMotif').value; var montant = parseFloat(document.getElementById('cMontant').value) || 0; var taux = parseFloat(document.getElementById('cTaux').value) || 2300;
  if (!nom) return alert('Entrez le nom'); if (!nomEntite) return alert('Entrez l\'entité');
  var list = DB.get('candidats', []); if (list.find(function(c) { return c.nom.toLowerCase() === nom.toLowerCase() && c.motif === motif && c.province === prov && c.statut === 'en_cours' && !c.archived; })) return alert('⚠️ Candidat déjà en cours dans cette province');
  list.push({ id: uid(), nom: nom, typeEntite: typeEntite, nomEntite: nomEntite, responsable: responsable, motif: motif, montantPrevu: montant, taux: taux, totalVerse: 0, statut: 'en_cours', dateInscription: new Date().toISOString(), photo: photoCandidatTemp || null, province: prov, archived: false });
  DB.set('candidats', list); reinitialiserFormCandidat(); refreshAll(); alert('✅ Candidat ajouté : ' + nom + ' (' + prov + ')');
}
function reinitialiserFormCandidat() { ['cNom','cNomEntite','cResponsable'].forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; }); var m = document.getElementById('cMontant'); if (m) m.value = 200; var t = document.getElementById('cTaux'); if (t) t.value = 2300; var p = document.getElementById('cPhotoPreview'); if (p) p.innerHTML = ''; var c1 = document.getElementById('cPhotoCamera'); if (c1) c1.value = ''; var c2 = document.getElementById('cPhotoGallery'); if (c2) c2.value = ''; photoCandidatTemp = null; }

function afficherCandidats() {
  var search = (document.getElementById('searchCand') ? document.getElementById('searchCand').value : '').toLowerCase(); var filtre = document.getElementById('filtreCandidats') ? document.getElementById('filtreCandidats').value : 'actif'; var list = candidatsProvince().slice();
  if (filtre === 'en_cours') list = list.filter(function(c) { return c.statut === 'en_cours' && !c.archived; }); else if (filtre === 'termine') list = list.filter(function(c) { return c.statut === 'termine' && !c.archived; }); else if (filtre === 'archive') list = list.filter(function(c) { return c.archived === true; }); else if (filtre === 'actif') list = list.filter(function(c) { return !c.archived && c.statut !== 'archive'; });
  if (search) list = list.filter(function(c) { return c.nom.toLowerCase().indexOf(search) !== -1; }); list.sort(function(a, b) { return a.nom.localeCompare(b.nom); }); var box = document.getElementById('listeCandidats'); if (!box) return;
  if (!list.length) { box.innerHTML = '<p>Aucun candidat.</p>'; return; }
  var html = '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Photo</th><th>Nom</th><th>Entité</th><th>Province</th><th>Motif</th><th>Statut</th><th>Versé</th><th>Actions</th></tr></thead><tbody>';
  list.forEach(function(c) {
    var badge = c.archived ? '<span class="badge badge-archive">📦</span>' : (c.statut === 'termine' ? '<span class="badge badge-ok">✅</span>' : '<span class="badge badge-progress">⏳</span>');
    html += '<tr' + (c.archived ? ' style="opacity:0.6"' : '') + '><td style="text-align:center">'; if (c.photo) html += '<img src="' + c.photo + '" style="width:42px;height:42px;border-radius:50%;object-fit:cover;border:2px solid #0a6e2c;cursor:pointer" onclick="voirPhoto(\'' + c.id + '\')">'; else html += '<div style="width:42px;height:42px;border-radius:50%;background:#e0e0e0;color:#888;display:inline-flex;align-items:center;justify-content:center;font-size:16px">👤</div>';
    html += '</td><td>' + echapper(c.nom) + '</td><td>' + echapper(c.typeEntite) + ' - ' + echapper(c.nomEntite) + '</td><td>' + (c.province ? '🌍 ' + echapper(c.province) : '📭') + '</td><td>' + echapper(c.motif) + '</td><td>' + badge + '</td><td class="num">' + c.totalVerse.toFixed(2) + '$</td><td>';
    html += '<button class="btn-mini" onclick="verserRapide(\'' + c.id + '\')">💵</button><button class="btn-mini blue" onclick="changerPhoto(\'' + c.id + '\')">📷</button><button class="btn-mini orange" onclick="modifierCandidat(\'' + c.id + '\')">✏️</button><button class="btn-mini ' + (c.archived ? 'blue' : 'gray') + '" onclick="archiverCandidat(\'' + c.id + '\')">' + (c.archived ? '↩️' : '📦') + '</button><button class="btn-mini danger" onclick="supprimerCandidat(\'' + c.id + '\')">🗑️</button></td></tr>';
  });
  html += '</tbody></table></div>'; box.innerHTML = html;
}
function voirPhoto(cid) { var c = DB.get('candidats', []).find(function(x) { return x.id === cid; }); if (!c || !c.photo) return; var w = window.open('', '_blank'); w.document.write('<html><body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column"><img src="' + c.photo + '" style="max-width:90vw;max-height:80vh;border:4px solid white;border-radius:8px"><p style="color:white;font-family:Arial;margin-top:20px;font-size:18px">' + echapper(c.nom) + '</p></body></html>'); }
function changerPhoto(cid) { var choix = confirm('📸 OK = Caméra\n❌ Annuler = Galerie'); var input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; if (choix) input.capture = 'user'; input.onchange = function(ev) { var file = ev.target.files[0]; if (!file) return; if (file.size > 5 * 1024 * 1024) return alert('⚠️ Image trop lourde (max 5 Mo)'); var reader = new FileReader(); reader.onload = function(e) { var img = new Image(); img.onload = function() { var canvas = document.createElement('canvas'); canvas.width = 250; canvas.height = 250; var ctx = canvas.getContext('2d'); var min = Math.min(img.width, img.height); ctx.drawImage(img, (img.width-min)/2, (img.height-min)/2, min, min, 0, 0, 250, 250); var data = canvas.toDataURL('image/jpeg', 0.65); var list = DB.get('candidats', []); var c = list.find(function(x) { return x.id === cid; }); if (c) { c.photo = data; DB.set('candidats', list); refreshAll(); alert('✅ Photo mise à jour'); } }; img.src = e.target.result; }; reader.readAsDataURL(file); }; input.click(); }
function modifierCandidat(cid) { var list = DB.get('candidats', []); var c = list.find(function(x) { return x.id === cid; }); if (!c) return; var nom = prompt('Nom :', c.nom); if (nom === null) return; var type = prompt('Type :', c.typeEntite); if (type === null) return; var entite = prompt('Entité :', c.nomEntite); if (entite === null) return; var resp = prompt('Responsable :', c.responsable); if (resp === null) return; var montant = prompt('Montant prévu :', c.montantPrevu); if (montant === null) return; c.nom = nom.trim(); c.typeEntite = type.trim(); c.nomEntite = entite.trim().toUpperCase(); c.responsable = resp.trim(); c.montantPrevu = parseFloat(montant) || c.montantPrevu; c.statut = (c.totalVerse >= c.montantPrevu - 0.01) ? 'termine' : 'en_cours'; DB.set('candidats', list); refreshAll(); alert('✅ Modifié'); }
function archiverCandidat(cid) { var list = DB.get('candidats', []); var c = list.find(function(x) { return x.id === cid; }); if (!c) return; if (!c.archived) { if (!confirm('📦 Archiver "' + c.nom + '" ?\n\nIl n\'apparaîtra plus dans les rapports PDF.')) return; c.archived = true; } else { c.archived = false; } DB.set('candidats', list); refreshAll(); alert(c.archived ? '📦 Archivé' : '↩️ Restauré'); }
function supprimerCandidat(cid) { if (!confirm('⚠️ Supprimer ce candidat et TOUS ses versements ?')) return; DB.set('candidats', DB.get('candidats', []).filter(function(c) { return c.id !== cid; })); DB.set('versements', DB.get('versements', []).filter(function(v) { return v.candId !== cid; })); refreshAll(); alert('✅ Supprimé'); }
function reinitialiserRechercheCand() { var el = document.getElementById('searchCand'); if (el) el.value = ''; var f = document.getElementById('filtreCandidats'); if (f) f.selectedIndex = 0; afficherCandidats(); }
function reinitialiserRechercheEntite() { var a = document.getElementById('searchEntiteFinance'); if (a) a.value = ''; var b = document.getElementById('searchEntiteType'); if (b) b.selectedIndex = 0; var box = document.getElementById('resultatRechercheEntite'); if (box) box.innerHTML = ''; }
function rafraichirCandidatsSelect() { var sel = document.getElementById('vCandidat'); if (!sel) return; var list = candidatsProvince().filter(function(c) { return c.statut === 'en_cours' && !c.archived; }); list.sort(function(a, b) { return a.nom.localeCompare(b.nom); }); var val = sel.value; var opts = ''; list.forEach(function(c) { opts += '<option value="' + c.id + '">' + c.nom + ' - ' + c.motif + ' (' + c.nomEntite + ')</option>'; }); if (!opts) opts = '<option value="">-- Aucun candidat en cours --</option>'; sel.innerHTML = opts; if (val) sel.value = val; }
function verserRapide(cid) { rafraichirCandidatsSelect(); document.getElementById('vCandidat').value = cid; document.getElementById('vDate').value = new Date().toISOString().slice(0, 10); switchMainTab('finance', document.querySelectorAll('.main-tab')[2]); setTimeout(function() { initSignature(); var v = document.getElementById('vMontant'); if (v) v.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 500); }

function enregistrerVersement() {
  var prov = exigerProvince(); if (!prov) return; var candId = document.getElementById('vCandidat').value; var monnaie = document.getElementById('vMonnaie').value; var montant = parseFloat(document.getElementById('vMontant').value) || 0; var taux = parseFloat(document.getElementById('vTaux').value) || 2300; var date = document.getElementById('vDate').value || new Date().toISOString().slice(0, 10);
  if (!candId) return alert('⚠️ Choisissez un candidat'); if (montant <= 0) return alert('Entrez un montant valide'); if (signatureVide || !signatureCanvas) return alert('✍️ Le candidat doit signer');
  var montantUSD = monnaie === 'FC' ? (montant / taux) : montant; var signatureData = signatureCanvas.toDataURL('image/png'); var vers = DB.get('versements', []);
  vers.push({ id: uid(), candId: candId, monnaie: monnaie, montantOrigine: montant, montantUSD: montantUSD, taux: taux, date: date, province: prov, dateCreation: new Date().toISOString(), signature: signatureData, archived: false });
  DB.set('versements', vers); var cands = DB.get('candidats', []); var c = cands.find(function(x) { return x.id === candId; });
  if (c) { c.totalVerse = (c.totalVerse || 0) + montantUSD; if (c.totalVerse >= c.montantPrevu - 0.01) c.statut = 'termine'; }
  DB.set('candidats', cands); reinitialiserFormVersement(); refreshAll(); alert('✅ Versement : ' + montantUSD.toFixed(2) + '$ (' + prov + ')');
}
function reinitialiserFormVersement() { var m = document.getElementById('vMontant'); if (m) m.value = 0; var d = document.getElementById('vDate'); if (d) d.value = new Date().toISOString().slice(0, 10); effacerSignature(); }

function afficherVersements() {
  var filtre = document.getElementById('filtreVersements') ? document.getElementById('filtreVersements').value : 'actif'; var vers = filtrerListe(versementsProvince(), filtre); var box = document.getElementById('historiqueVersements'); if (!box) return;
  if (!vers.length) { box.innerHTML = '<p>Aucun versement.</p>'; return; }
  var parCandidat = {}; vers.forEach(function(v) { if (!parCandidat[v.candId]) parCandidat[v.candId] = []; parCandidat[v.candId].push(v); }); var html = '';
  Object.keys(parCandidat).sort(function(a, b) { var ca = DB.get('candidats', []).find(function(x) { return x.id === a; }); var cb = DB.get('candidats', []).find(function(x) { return x.id === b; }); return (ca ? ca.nom : '').localeCompare(cb ? cb.nom : ''); }).forEach(function(cid) {
    var c = DB.get('candidats', []).find(function(x) { return x.id === cid; }); if (!c) return; var lignes = parCandidat[cid].slice().sort(function(a, b) { return new Date(a.date) - new Date(b.date); }); var totalFC = 0, totalUSD = 0; lignes.forEach(function(v) { totalUSD += v.montantUSD; if (v.monnaie === 'FC') totalFC += v.montantOrigine; });
    html += '<div class="entity-block"><h4 style="display:flex;align-items:center;gap:8px">'; if (c.photo) html += '<img src="' + c.photo + '" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid #0a6e2c">'; html += '👤 ' + echapper(c.nom) + '</h4><div style="font-size:12px;color:#666;margin-bottom:8px">' + echapper(c.typeEntite) + ' - <strong>' + echapper(c.nomEntite) + '</strong> | ' + echapper(c.motif) + '</div>';
    html += '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Date</th><th>FC</th><th>USD</th><th>Signé</th><th>Actions</th></tr></thead><tbody>';
    lignes.forEach(function(v) {
      html += '<tr' + (v.archived ? ' style="opacity:0.6"' : '') + '><td>' + fmtDate(v.date) + '</td><td class="num">' + (v.monnaie === 'FC' ? v.montantOrigine.toLocaleString() : '-') + '</td><td class="num">' + v.montantUSD.toFixed(2) + '$</td><td style="text-align:center">' + (v.signature ? '<img src="' + v.signature + '" style="height:26px;cursor:pointer;border:1px solid #ddd;background:white" onclick="voirSignature(\'' + v.id + '\')">' : '—') + '</td><td>';
      html += '<button class="btn-mini orange" onclick="modifierVersement(\'' + v.id + '\')">✏️</button><button class="btn-mini ' + (v.archived ? 'blue' : 'gray') + '" onclick="archiverVersement(\'' + v.id + '\')">' + (v.archived ? '↩️' : '📦') + '</button><button class="btn-mini danger" onclick="supprimerVersement(\'' + v.id + '\')">🗑️</button><button class="btn-mini blue" onclick="imprimerRecu(\'' + v.id + '\')">🖨️</button></td></tr>';
    });
    html += '</tbody><tfoot><tr><td>TOTAL</td><td class="num">' + totalFC.toLocaleString() + ' FC</td><td class="num">' + totalUSD.toFixed(2) + '$</td><td></td><td></td></tr></tfoot></table></div></div>';
  });
  box.innerHTML = html;
}
function voirSignature(vid) { var v = DB.get('versements', []).find(function(x) { return x.id === vid; }); if (!v || !v.signature) return; var c = DB.get('candidats', []).find(function(x) { return x.id === v.candId; }); var w = window.open('', '_blank'); w.document.write('<html><body style="margin:0;background:#f5f5f5;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;font-family:Arial"><img src="' + v.signature + '" style="max-width:90vw;background:white;border:2px solid #0a6e2c;border-radius:8px;padding:20px"><p style="color:#333;margin-top:20px;font-size:16px;text-align:center"><strong>' + (c ? echapper(c.nom) : '') + '</strong><br>' + fmtDate(v.date) + ' — ' + v.montantUSD.toFixed(2) + ' $</p></body></html>'); }
function modifierVersement(vid) { var list = DB.get('versements', []); var v = list.find(function(x) { return x.id === vid; }); if (!v) return; var montant = prompt('Montant :', v.montantOrigine); if (montant === null) return; var ancienUSD = v.montantUSD; v.montantOrigine = parseFloat(montant) || 0; v.montantUSD = v.monnaie === 'FC' ? (v.montantOrigine / v.taux) : v.montantOrigine; var cands = DB.get('candidats', []); var c = cands.find(function(x) { return x.id === v.candId; }); if (c) { c.totalVerse = c.totalVerse - ancienUSD + v.montantUSD; if (c.totalVerse >= c.montantPrevu - 0.01 && c.statut === 'en_cours') c.statut = 'termine'; if (c.totalVerse < c.montantPrevu - 0.01 && c.statut === 'termine') c.statut = 'en_cours'; } DB.set('candidats', cands); DB.set('versements', list); refreshAll(); alert('✅ Modifié'); }
function archiverVersement(vid) { var list = DB.get('versements', []); var v = list.find(function(x) { return x.id === vid; }); if (!v) return; v.archived = !v.archived; DB.set('versements', list); afficherVersements(); alert(v.archived ? '📦 Archivé' : '↩️ Restauré'); }
function supprimerVersement(vid) { if (!confirm('⚠️ Supprimer ce versement ?')) return; var list = DB.get('versements', []); var v = list.find(function(x) { return x.id === vid; }); if (!v) return; var cands = DB.get('candidats', []); var c = cands.find(function(x) { return x.id === v.candId; }); if (c) c.totalVerse = c.totalVerse - v.montantUSD; DB.set('candidats', cands); DB.set('versements', list.filter(function(x) { return x.id !== vid; })); refreshAll(); alert('✅ Supprimé'); }

function imprimerRecu(vid) {
  var v = DB.get('versements', []).find(function(x) { return x.id === vid; }); if (!v) return; var c = DB.get('candidats', []).find(function(x) { return x.id === v.candId; }); if (!c) return; var sigColor = getSignatureColor(); var w = window.open('', '_blank');
  w.document.write('<html><head><meta charset="UTF-8"><title>Reçu</title><style>body{font-family:Arial;padding:30px;max-width:600px;margin:auto}.header{text-align:center;border-bottom:3px double #0a6e2c;padding-bottom:15px;margin-bottom:20px}h1{color:#0a6e2c;font-size:18px}.logo{width:80px;height:80px;background:#0a6e2c;color:white;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:22px;font-weight:bold;margin-bottom:10px}.photo-box{text-align:center;margin:15px 0}.photo-box img{width:110px;height:110px;border-radius:50%;object-fit:cover;border:3px solid #0a6e2c}table{width:100%;border-collapse:collapse;margin:20px 0}td{padding:8px;border-bottom:1px solid #ddd}td.label{font-weight:bold;color:#0a6e2c}.montant{font-size:22px;color:#0a6e2c;font-weight:bold;text-align:center;padding:20px;background:#e8f5e9;border-radius:8px}.signature{margin-top:40px;display:flex;justify-content:space-between;align-items:flex-end}.sig-line{border-top:1px solid ' + sigColor + ';color:' + sigColor + ';width:45%;padding-top:5px;font-size:12px;text-align:center;font-weight:600}.sig-img{width:45%;text-align:center;padding-bottom:5px}.sig-img img{max-height:70px;max-width:100%;border-bottom:1px solid ' + sigColor + '}</style></head><body>');
  w.document.write('<div class="header"><div class="logo">EMM</div><h1>ÉGLISE MESSIANIQUE MONDIALE</h1><p style="color:#666">EMM MONDIAL - Finance</p><h2 style="color:#0a6e2c">REÇU DE VERSEMENT</h2></div>');
  if (c.photo) w.document.write('<div class="photo-box"><img src="' + c.photo + '"><p style="font-size:14px;font-weight:bold;margin-top:6px">' + echapper(c.nom) + '</p></div>');
  w.document.write('<table><tr><td class="label">Nom</td><td>' + echapper(c.nom) + '</td></tr><tr><td class="label">Entité</td><td>' + echapper(c.typeEntite) + ' - ' + echapper(c.nomEntite) + '</td></tr><tr><td class="label">Province</td><td>' + echapper(c.province || v.province || '-') + '</td></tr><tr><td class="label">Motif</td><td>' + echapper(c.motif) + '</td></tr><tr><td class="label">Date</td><td>' + fmtDate(v.date) + '</td></tr><tr><td class="label">Taux</td><td>1$ = ' + v.taux + ' FC</td></tr></table>');
  w.document.write('<div class="montant">' + v.montantOrigine + ' ' + v.monnaie + '<br><small>= ' + v.montantUSD.toFixed(2) + ' USD</small></div><div class="signature">');
  if (v.signature) w.document.write('<div class="sig-img"><img src="' + v.signature + '"><br><small>Le candidat</small></div>'); else w.document.write('<div class="sig-line">Le candidat</div>');
  w.document.write('<div class="sig-line">Le Responsable</div></div></body></html>'); w.document.close(); setTimeout(function() { w.print(); }, 500);
}
function rechercherParEntite() {
  var q = (document.getElementById('searchEntiteFinance').value || '').trim().toUpperCase(); var type = document.getElementById('searchEntiteType').value; var box = document.getElementById('resultatRechercheEntite'); if (!box) return;
  if (!q && !type) { box.innerHTML = '<p style="color:#888;font-size:13px">Entrez un nom.</p>'; return; }
  var cands = candidatsProvince().filter(function(c) { return !c.archived; }).filter(function(c) { return (!q || (c.nomEntite && c.nomEntite.toUpperCase().indexOf(q) !== -1)) && (!type || c.typeEntite === type); });
  if (!cands.length) { box.innerHTML = '<p style="color:#888;font-size:13px">Aucun candidat.</p>'; return; }
  var parEntite = {}; cands.forEach(function(c) { var key = c.typeEntite + ' - ' + c.nomEntite; if (!parEntite[key]) parEntite[key] = []; parEntite[key].push(c); }); var html = '';
  Object.keys(parEntite).forEach(function(key) {
    var liste = parEntite[key]; var totalPrevu = 0, totalVerse = 0; liste.forEach(function(c) { totalPrevu += c.montantPrevu; totalVerse += (c.totalVerse || 0); });
    html += '<div class="entity-block"><h4>🏛️ ' + echapper(key) + '</h4><div style="font-size:12px;color:#666;margin-bottom:8px">' + liste.length + ' candidat(s) | Prévu : <strong>' + totalPrevu.toFixed(2) + '$</strong> | Versé : <strong>' + totalVerse.toFixed(2) + '$</strong> | Solde : <strong style="color:#c62828">' + (totalPrevu - totalVerse).toFixed(2) + '$</strong></div>';
    html += '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Photo</th><th>Nom</th><th>Motif</th><th>Statut</th><th>Prévu</th><th>Versé</th><th>Solde</th><th>Relevé</th></tr></thead><tbody>';
    liste.sort(function(a, b) { return a.nom.localeCompare(b.nom); });
    liste.forEach(function(c) {
      var solde = c.montantPrevu - (c.totalVerse || 0); var badge = c.statut === 'termine' ? '<span class="badge badge-ok">✅</span>' : '<span class="badge badge-progress">⏳</span>';
      html += '<tr><td style="text-align:center">'; if (c.photo) html += '<img src="' + c.photo + '" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid #0a6e2c;cursor:pointer" onclick="voirPhoto(\'' + c.id + '\')">'; else html += '<div style="width:36px;height:36px;border-radius:50%;background:#e0e0e0;color:#888;display:inline-flex;align-items:center;justify-content:center;font-size:14px">👤</div>';
      html += '</td><td>' + echapper(c.nom) + '</td><td>' + echapper(c.motif) + '</td><td>' + badge + '</td><td class="num">' + c.montantPrevu + '$</td><td class="num">' + (c.totalVerse || 0).toFixed(2) + '$</td><td class="num">' + solde.toFixed(2) + '$</td><td><button class="btn-mini blue" onclick="afficherReleveVersement(\'' + c.id + '\')">📋</button></td></tr>';
    });
    html += '</tbody></table></div></div>';
  });
  box.innerHTML = html;
}
function afficherReleveVersement(candId) {
  var c = DB.get('candidats', []).find(function(x) { return x.id === candId; }); if (!c) return alert('Candidat introuvable');
  var vers = DB.get('versements', []).filter(function(v) { return v.candId === candId && !v.archived; }); vers.sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
  var totalUSD = 0, totalFC = 0; vers.forEach(function(v) { totalUSD += v.montantUSD; if (v.monnaie === 'FC') totalFC += v.montantOrigine; }); var sigColor = getSignatureColor(); var w = window.open('', '_blank');
  w.document.write('<html><head><meta charset="UTF-8"><title>Relevé</title><style>body{font-family:Arial;padding:24px;max-width:800px;margin:auto;color:#222}.header{text-align:center;border-bottom:3px double #0a6e2c;padding-bottom:15px;margin-bottom:20px}.logo{width:70px;height:70px;background:#0a6e2c;color:white;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:bold;margin-bottom:10px}h1{color:#0a6e2c;font-size:18px}h2{color:#333;font-size:14px;margin:15px 0 10px;border-left:4px solid #0a6e2c;padding-left:8px}table{width:100%;border-collapse:collapse;margin:15px 0;font-size:13px}th{background:#0a6e2c;color:white;padding:8px;text-align:left}td{padding:8px;border-bottom:1px solid #ddd}td.num{text-align:right}tfoot td{font-weight:bold;background:#e8f5e9;color:#0a6e2c;border-top:2px solid #0a6e2c}.info{background:#f9f9f9;padding:12px;border-radius:8px;margin:15px 0;border-left:4px solid #0a6e2c}.info p{margin:4px 0;font-size:13px}.solde{font-size:15px;color:#0a6e2c;font-weight:bold;text-align:center;padding:15px;background:#e8f5e9;border-radius:8px;margin-top:15px}.signature{margin-top:60px;display:flex;justify-content:space-between}.sig-line{border-top:1px solid ' + sigColor + ';color:' + sigColor + ';font-weight:600;width:45%;padding-top:5px;font-size:12px;text-align:center}.photo-top{text-align:center;margin:15px 0}.photo-top img{width:120px;height:120px;border-radius:50%;object-fit:cover;border:3px solid #0a6e2c}</style></head><body>');
  w.document.write('<div class="header"><div class="logo">EMM</div><h1>ÉGLISE MESSIANIQUE MONDIALE</h1><p style="color:#666;font-size:12px">EMM MONDIAL — Finance</p><h2 style="border:none;text-align:center">RELEVÉ DE VERSEMENT INDIVIDUEL</h2></div>');
  if (c.photo) w.document.write('<div class="photo-top"><img src="' + c.photo + '"></div>');
  w.document.write('<div class="info"><p><strong>Nom :</strong> ' + echapper(c.nom) + '</p><p><strong>Entité :</strong> ' + echapper(c.typeEntite) + ' - ' + echapper(c.nomEntite) + '</p><p><strong>Province :</strong> ' + echapper(c.province || '-') + '</p><p><strong>Responsable :</strong> ' + echapper(c.responsable || '-') + '</p><p><strong>Motif :</strong> ' + echapper(c.motif) + '</p><p><strong>Statut :</strong> ' + (c.statut === 'termine' ? 'Terminé' : 'En cours') + '</p></div><h2>Détail des versements (' + vers.length + ')</h2>');
  if (vers.length) {
    w.document.write('<table><thead><tr><th>#</th><th>Date</th><th>Monnaie</th><th>Montant</th><th>Taux</th><th>USD</th><th>Signature</th></tr></thead><tbody>');
    vers.forEach(function(v, i) { w.document.write('<tr><td>' + (i + 1) + '</td><td>' + fmtDate(v.date) + '</td><td>' + v.monnaie + '</td><td class="num">' + v.montantOrigine.toLocaleString() + '</td><td class="num">' + v.taux + '</td><td class="num">' + v.montantUSD.toFixed(2) + ' $</td><td style="text-align:center">' + (v.signature ? '<img src="' + v.signature + '" style="max-height:40px;border:1px solid #ddd;background:white">' : '—') + '</td></tr>'); });
    w.document.write('</tbody></table>');
  }
  w.document.write('<div class="solde">Montant prévu : ' + c.montantPrevu + ' $<br>Total versé : ' + totalUSD.toFixed(2) + ' $'); if (totalFC > 0) w.document.write(' (dont ' + totalFC.toLocaleString() + ' FC)'); w.document.write('<br>Solde restant : ' + (c.montantPrevu - totalUSD).toFixed(2) + ' $</div><div class="signature"><div class="sig-line">Le candidat</div><div class="sig-line">Le Responsable</div></div></body></html>');
  w.document.close(); setTimeout(function() { w.print(); }, 500);
}

function relevéCompletEntite() {
  var q = (document.getElementById('searchEntiteFinance').value || '').trim().toUpperCase(); var type = document.getElementById('searchEntiteType').value; if (!q && !type) return alert('Entrez d\'abord un nom');
  var cands = candidatsProvince().filter(function(c) { return !c.archived; }).filter(function(c) { return (!q || (c.nomEntite && c.nomEntite.toUpperCase().indexOf(q) !== -1)) && (!type || c.typeEntite === type); }); if (!cands.length) return alert('Aucun candidat');
  var vers = DB.get('versements', []).filter(function(v) { return !v.archived; }); var parEntite = {}; cands.forEach(function(c) { var key = c.typeEntite + ' - ' + c.nomEntite; if (!parEntite[key]) parEntite[key] = []; parEntite[key].push(c); }); var w = window.open('', '_blank');
  w.document.write('<html><head><meta charset="UTF-8"><title>Relevé entité</title><style>body{font-family:Arial;padding:24px;max-width:900px;margin:auto;color:#222}.header{text-align:center;border-bottom:3px double #0a6e2c;padding-bottom:15px;margin-bottom:20px}h1{color:#0a6e2c;font-size:20px;text-align:center}h2{color:#0a6e2c;font-size:14px;margin:20px 0 8px;border-left:4px solid #0a6e2c;padding-left:8px}table{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px}th{background:#0a6e2c;color:white;padding:6px;text-align:left}td{padding:6px;border-bottom:1px solid #ddd}td.num{text-align:right}tfoot td{font-weight:bold;background:#e8f5e9;color:#0a6e2c;border-top:2px solid #0a6e2c}</style></head><body>');
  w.document.write('<div class="header"><h1>EMM MONDIAL</h1><p style="text-align:center;color:#666;font-size:12px">Relevé global par entité</p></div>');
  Object.keys(parEntite).forEach(function(key) {
    var liste = parEntite[key]; var totalPrevu = 0, totalVerse = 0; liste.forEach(function(c) { totalPrevu += c.montantPrevu; totalVerse += (c.totalVerse || 0); });
    w.document.write('<h2>🏛️ ' + echapper(key) + '</h2><table><thead><tr><th>Nom</th><th>Motif</th><th>Statut</th><th>Prévu</th><th>Versé</th><th>Solde</th><th>Nb vers.</th></tr></thead><tbody>');
    liste.forEach(function(c) { var nb = vers.filter(function(v) { return v.candId === c.id; }).length; var solde = c.montantPrevu - (c.totalVerse || 0); w.document.write('<tr><td>' + echapper(c.nom) + '</td><td>' + echapper(c.motif) + '</td><td>' + (c.statut === 'termine' ? 'Terminé' : 'En cours') + '</td><td class="num">' + c.montantPrevu + '$</td><td class="num">' + (c.totalVerse || 0).toFixed(2) + '$</td><td class="num">' + solde.toFixed(2) + '$</td><td class="num">' + nb + '</td></tr>'); });
    w.document.write('</tbody><tfoot><tr><td colspan="3">TOTAL</td><td class="num">' + totalPrevu.toFixed(2) + '$</td><td class="num">' + totalVerse.toFixed(2) + '$</td><td class="num">' + (totalPrevu - totalVerse).toFixed(2) + '$</td><td></td></tr></tfoot></table>');
  });
  w.document.write('<p style="text-align:center;font-size:11px;color:#888;margin-top:30px">Généré le ' + new Date().toLocaleString('fr-FR') + '</p></body></html>'); w.document.close(); setTimeout(function() { w.print(); }, 600);
}
function rapportFinGlobal() {
  var cands = candidatsProvince().filter(function(c) { return !c.archived; }); var vers = versementsProvince().filter(function(v) { return !v.archived; }); var totalVerse = 0, totalPrevu = 0; cands.forEach(function(c) { totalVerse += (c.totalVerse || 0); totalPrevu += c.montantPrevu; });
  var provLabel = getProvinceActive() || 'Toutes'; var html = '<div class="rapport-header"><h3>📊 RAPPORT GLOBAL — FINANCE</h3><p>🌍 ' + echapper(provLabel === '__non_assignee' ? 'Non assignées' : provLabel) + '</p></div><div class="table-wrapper"><table class="data-table"><tbody>';
  html += '<tr><td>Candidats actifs</td><td class="num">' + cands.length + '</td></tr><tr><td>Terminés</td><td class="num">' + cands.filter(function(c) { return c.statut === 'termine'; }).length + '</td></tr><tr><td>Total prévu</td><td class="num">' + totalPrevu.toFixed(2) + '$</td></tr><tr><td>Total versé</td><td class="num">' + totalVerse.toFixed(2) + '$</td></tr><tr><td>Solde</td><td class="num">' + (totalPrevu - totalVerse).toFixed(2) + '$</td></tr><tr><td>Versements</td><td class="num">' + vers.length + '</td></tr></tbody></table></div>'; document.getElementById('rapportFinBox').innerHTML = html;
}
function rapportFinDetaille() {
  var cands = candidatsProvince().filter(function(c) { return !c.archived; }).slice().sort(function(a, b) { return a.nom.localeCompare(b.nom); }); var provLabel = getProvinceActive() || 'Toutes'; var html = '<div class="rapport-header"><h3>📋 RAPPORT DÉTAILLÉ — FINANCE</h3><p>🌍 ' + echapper(provLabel === '__non_assignee' ? 'Non assignées' : provLabel) + '</p></div>';
  if (!cands.length) html += '<p>Aucun candidat.</p>';
  else { cands.forEach(function(c) {
      html += '<div class="entity-block"><h4>'; if (c.photo) html += '<img src="' + c.photo + '" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid #0a6e2c;cursor:pointer;vertical-align:middle;margin-right:8px" onclick="voirPhoto(\'' + c.id + '\')">'; html += '👤 ' + echapper(c.nom) + (c.province ? ' <span style="display:inline-block;padding:2px 8px;background:#0d6efd;color:white;border-radius:10px;font-size:11px;font-weight:600;margin-left:6px">🌍 ' + echapper(c.province) + '</span>' : '') + '</h4>';
      html += '<div style="font-size:12px;color:#666;margin-bottom:6px">' + echapper(c.typeEntite) + ' - ' + echapper(c.nomEntite) + ' | Motif : ' + echapper(c.motif) + '</div><div class="table-wrapper"><table class="data-table"><tbody>';
      html += '<tr><td>Statut</td><td>' + (c.statut === 'termine' ? '✅ Terminé' : '⏳ En cours') + '</td></tr><tr><td>Montant prévu</td><td class="num">' + c.montantPrevu + ' $</td></tr><tr><td>Total versé</td><td class="num">' + c.totalVerse.toFixed(2) + ' $</td></tr><tr><td>Solde restant</td><td class="num" style="color:#c62828">' + (c.montantPrevu - c.totalVerse).toFixed(2) + ' $</td></tr></tbody></table></div></div>';
    });
  }
  document.getElementById('rapportFinBox').innerHTML = html;
}
// --- FIN DE LA PARTIE 2 ---// ========== TABLEAU DE BORD & ANNONCES ==========
function afficherDashboard() {
  var box = document.getElementById('dashboardBox');
  if (!box) return;
  var entites = entitesProvince().filter(function(e) { return !e.archived; }).length;
  var parts = participationsProvince().filter(function(p) { return !p.archived; });
  var totPart = parts.reduce(function(a, p) { return a + p.m + p.s + p.n; }, 0);
  var fiches = fichesProvince().filter(function(f) { return !f.archived; }).length;
  var cands = candidatsProvince().filter(function(c) { return !c.archived; });
  var totalVerse = cands.reduce(function(a, c) { return a + (c.totalVerse || 0); }, 0);
  var deps = depouillementsProvince().filter(function(d) { return !d.archived; });
  var soldeDepFC = 0, soldeDepUSD = 0;
  deps.forEach(function(d) { d.entites.forEach(function(e) { var s = sumEntiteDep(e); soldeDepFC += s.soldeFC; soldeDepUSD += s.soldeUSD; }); });
  var sitesP = sitesPatrimoineProvince().filter(function(s) { return !s.archived; }).length;
  var biensP = biensPatrimoineProvince().filter(function(b) { return !b.archived; }).length;
  var provinceLabel = getProvinceActive() || 'Toutes';
  var html = '<p style="text-align:center;font-size:12px;color:#0a6e2c;font-weight:600;margin-bottom:10px">🌍 Province : ' + echapper(provinceLabel === '__non_assignee' ? 'Non assignées' : provinceLabel) + '</p>';
  html += '<div class="table-wrapper"><table class="data-table"><tbody>';
  html += '<tr><th colspan="2">📈 MODULE I — FRÉQUENCES</th></tr>';
  html += '<tr><td>Entités actives</td><td class="num">' + entites + '</td></tr>';
  html += '<tr><td>Total présences</td><td class="num">' + totPart + '</td></tr>';
  html += '<tr><td>Fiches mensuelles</td><td class="num">' + fiches + '</td></tr>';
  html += '<tr><th colspan="2">💰 MODULE II — FINANCE</th></tr>';
  html += '<tr><td>Candidats actifs</td><td class="num">' + cands.length + '</td></tr>';
  html += '<tr><td>Total versé</td><td class="num">' + totalVerse.toFixed(2) + ' $</td></tr>';
  html += '<tr><th colspan="2">🧾 MODULE III — DÉPOUILLEMENT</th></tr>';
  html += '<tr><td>Séances actives</td><td class="num">' + deps.length + '</td></tr>';
  html += '<tr><td>Solde total FC</td><td class="num">' + soldeDepFC.toLocaleString() + ' FC</td></tr>';
  html += '<tr><td>Solde total USD</td><td class="num">' + soldeDepUSD.toLocaleString() + ' $</td></tr>';
  html += '<tr><th colspan="2">🏛️ MODULE IV — PATRIMOINE</th></tr>';
  html += '<tr><td>Sites enregistrés</td><td class="num">' + sitesP + '</td></tr>';
  html += '<tr><td>Biens enregistrés</td><td class="num">' + biensP + '</td></tr>';
  html += '</tbody></table></div>';
  box.innerHTML = html;
}

function afficherAnnonces() {
  var list = DB.get('annonces', []); var box = document.getElementById('announcementsBox'); if (!box) return;
  if (!list.length) { box.innerHTML = '<p>Aucune annonce.</p>'; return; }
  var html = '';
  list.slice().reverse().forEach(function(a) {
    html += '<div class="item-list"' + (a.archived ? ' style="opacity:0.7;background:#f0f0f0"' : '') + '>';
    html += '<strong>📢 ' + a.date + '</strong><br>' + echapper(a.texte);
    if (isAdmin()) {
      html += '<div style="margin-top:6px">';
      html += '<button class="btn-mini orange" onclick="modifierAnnonce(\'' + a.id + '\')">✏️</button>';
      html += '<button class="btn-mini ' + (a.archived ? 'blue' : 'gray') + '" onclick="archiverAnnonce(\'' + a.id + '\')">' + (a.archived ? '↩️' : '📦') + '</button>';
      html += '<button class="btn-mini danger" onclick="supprimerAnnonce(\'' + a.id + '\')">🗑️</button></div>';
    }
    html += '</div>';
  });
  box.innerHTML = html;
}

function publierAnnonce() {
  if (!isAdmin()) return alert('Réservé admin');
  var texte = document.getElementById('annonceText').value.trim(); if (!texte) return alert('Écrivez une annonce');
  var list = DB.get('annonces', []); list.push({ id: uid(), texte: texte, date: new Date().toLocaleDateString('fr-FR'), auteur: currentUser ? (currentUser.nom || currentUser.email) : 'Admin', archived: false });
  DB.set('annonces', list); reinitialiserFormAnnonce(); afficherAnnonces(); alert('✅ Annonce publiée');
}
function reinitialiserFormAnnonce() { var el = document.getElementById('annonceText'); if (el) el.value = ''; }
function modifierAnnonce(id) {
  if (!isAdmin()) return alert('Réservé admin'); var list = DB.get('annonces', []); var a = list.find(function(x) { return x.id === id; }); if (!a) return;
  var txt = prompt('Modifier :', a.texte); if (txt === null) return; a.texte = txt.trim(); DB.set('annonces', list); afficherAnnonces(); alert('✅ Modifiée');
}
function archiverAnnonce(id) {
  if (!isAdmin()) return alert('Réservé admin'); var list = DB.get('annonces', []); var a = list.find(function(x) { return x.id === id; }); if (!a) return;
  a.archived = !a.archived; DB.set('annonces', list); afficherAnnonces(); alert(a.archived ? '📦 Archivée' : '↩️ Restaurée');
}
function supprimerAnnonce(id) {
  if (!isAdmin()) return alert('Réservé admin'); if (!confirm('⚠️ Supprimer cette annonce ?')) return;
  DB.set('annonces', DB.get('annonces', []).filter(function(a) { return a.id !== id; })); afficherAnnonces();
}

// ========== MODULE I — ENTITÉS ==========
function ajouterEntite() {
  var prov = exigerProvince(); if (!prov) return;
  var type = document.getElementById('jTypeEntite').value; var nom = document.getElementById('jNomEntite').value.trim().toUpperCase(); var resp = document.getElementById('jResponsable').value.trim();
  if (!nom || !resp) return alert('Remplissez tous les champs');
  var entites = DB.get('entites', []);
  if (entites.find(function(e) { return e.nom === nom && e.province === prov && !e.archived; })) return alert('Cette entité existe déjà dans cette province');
  entites.push({ id: uid(), type: type, nom: nom, responsable: resp, province: prov, archived: false });
  DB.set('entites', entites); reinitialiserFormEntite(); refreshAll(); alert('✅ Entité ajoutée : ' + nom + ' (' + prov + ')');
}
function reinitialiserFormEntite() { var a = document.getElementById('jNomEntite'); if (a) a.value = ''; var b = document.getElementById('jResponsable'); if (b) b.value = ''; var c = document.getElementById('jTypeEntite'); if (c) c.selectedIndex = 0; }

function rafraichirEntites() {
  var entites = entitesProvince().filter(function(e) { return !e.archived; });
  ['jEntiteSelect','mEntite'].forEach(function(id) {
    var sel = document.getElementById(id); if (!sel) return; var val = sel.value; var opts = '';
    entites.forEach(function(e) { opts += '<option value="' + e.id + '">' + e.type + ' - ' + e.nom + (e.province ? ' (' + e.province + ')' : '') + '</option>'; });
    sel.innerHTML = opts; if (val) sel.value = val;
  });
}

function afficherListeEntites() {
  var filtre = document.getElementById('filtreEntites') ? document.getElementById('filtreEntites').value : 'actif';
  var search = (document.getElementById('searchEntiteListe') ? document.getElementById('searchEntiteListe').value : '').toUpperCase();
  var entites = entitesProvince(); entites = filtrerListe(entites, filtre);
  if (search) entites = entites.filter(function(e) { return e.nom.indexOf(search) !== -1; });
  var box = document.getElementById('listeEntites'); if (!box) return;
  if (!entites.length) { box.innerHTML = '<p>Aucune entité.</p>'; return; }
  var html = '';
  entites.forEach(function(e) {
    html += '<div class="item-list" style="padding:12px' + (e.archived ? ';opacity:0.7;background:#f0f0f0' : '') + '">';
    html += '<div style="font-size:14px;color:#0a6e2c;font-weight:600;margin-bottom:4px">🏛️ ' + echapper(e.type) + ' - ' + echapper(e.nom) + (e.archived ? ' <span class="badge badge-archive">📦</span>' : '') + '</div>';
    html += '<div style="font-size:12px;color:#666;margin-bottom:8px">👤 ' + echapper(e.responsable) + (e.province ? ' | 🌍 ' + echapper(e.province) : ' | 📭 Non assignée') + '</div>';
    html += '<button class="btn-mini orange" onclick="modifierEntite(\'' + e.id + '\')">✏️ Modifier</button> ';
    html += '<button class="btn-mini ' + (e.archived ? 'blue' : 'gray') + '" onclick="archiverEntite(\'' + e.id + '\')">' + (e.archived ? '↩️ Désarchiver' : '📦 Archiver') + '</button> ';
    html += '<button class="btn-mini danger" onclick="supprimerEntite(\'' + e.id + '\')">🗑️ Supprimer</button></div>';
  });
  box.innerHTML = html;
}

function modifierEntite(id) {
  var list = DB.get('entites', []); var e = list.find(function(x) { return x.id === id; }); if (!e) return;
  var type = prompt('Type :', e.type); if (type === null) return; var nom = prompt('Nom :', e.nom); if (nom === null) return;
  var resp = prompt('Responsable :', e.responsable); if (resp === null) return; var prov = prompt('Province :', e.province || ''); if (prov === null) return;
  var nn = nom.trim().toUpperCase(); if (!nn) return alert('Nom vide'); var provFinale = prov.trim() || e.province;
  if (list.find(function(x) { return x.id !== id && x.nom === nn && x.province === provFinale && !x.archived; })) return alert('⚠️ Nom déjà utilisé dans cette province');
  e.type = type.trim() || e.type; e.nom = nn; e.responsable = resp.trim(); if (provFinale) e.province = provFinale;
  DB.set('entites', list); refreshAll(); alert('✅ Modifiée');
}

function archiverEntite(id) {
  var list = DB.get('entites', []); var e = list.find(function(x) { return x.id === id; }); if (!e) return;
  if (!e.archived) { if (!confirm('📦 Archiver "' + e.nom + '" ?')) return; e.archived = true; } else { e.archived = false; }
  DB.set('entites', list); refreshAll(); alert(e.archived ? '📦 Archivée' : '↩️ Restaurée');
}

function supprimerEntite(id) {
  var e = DB.get('entites', []).find(function(x) { return x.id === id; }); if (!e) return;
  var parts = DB.get('participations', []).filter(function(p) { return p.entiteId === id; }); var msg = '⚠️ Supprimer "' + e.nom + '" ?';
  if (parts.length) msg += '\n\n' + parts.length + ' participation(s) liée(s) supprimée(s).'; if (!confirm(msg)) return;
  DB.set('entites', DB.get('entites', []).filter(function(x) { return x.id !== id; })); DB.set('participations', DB.get('participations', []).filter(function(p) { return p.entiteId !== id; })); refreshAll(); alert('✅ Supprimée');
}

// ========== MODULE I — JOURNALIÈRE & FICHE MENSUELLE ==========
function enregistrerParticipation() {
  var prov = exigerProvince(); if (!prov) return;
  var entiteId = document.getElementById('jEntiteSelect').value; var date = document.getElementById('jDate').value;
  var m = parseInt(document.getElementById('jMembres').value) || 0; var s = parseInt(document.getElementById('jSympathisants').value) || 0; var n = parseInt(document.getElementById('jNouveaux').value) || 0;
  if (!entiteId) return alert('⚠️ Enregistrez d\'abord une entité'); if (!date) return alert('Choisissez une date');
  var list = DB.get('participations', []); list.push({ id: uid(), entiteId: entiteId, date: date, m: m, s: s, n: n, province: prov, createdAt: new Date().toISOString(), auteur: currentUser ? (currentUser.nom || currentUser.email) : '', archived: false });
  DB.set('participations', list); reinitialiserFormParticipation(); afficherJournaliere(); alert('✅ Enregistrée (' + prov + ')');
}
function reinitialiserFormParticipation() { var a = document.getElementById('jDate'); if (a) a.value = ''; var b = document.getElementById('jMembres'); if (b) b.value = 0; var c = document.getElementById('jSympathisants'); if (c) c.value = 0; var d = document.getElementById('jNouveaux'); if (d) d.value = 0; }
function afficherJournaliere() {
  var filtre = document.getElementById('filtreParticipations') ? document.getElementById('filtreParticipations').value : 'actif'; var parts = filtrerListe(participationsProvince(), filtre); var box = document.getElementById('listeJournaliere'); if (!box) return;
  if (!parts.length) { box.innerHTML = '<p>Aucune donnée.</p>'; return; }
  var parEntite = {}; parts.forEach(function(p) { if (!parEntite[p.entiteId]) parEntite[p.entiteId] = []; parEntite[p.entiteId].push(p); }); var html = '';
  Object.keys(parEntite).forEach(function(eid) {
    var lignes = parEntite[eid].slice().sort(function(a, b) { return new Date(a.date) - new Date(b.date); }); var tm = 0, ts = 0, tn = 0; lignes.forEach(function(p) { tm += p.m; ts += p.s; tn += p.n; });
    html += '<div class="entity-block"><h4>📍 ' + echapper(getEntiteNom(eid)) + '</h4><div class="table-wrapper"><table class="data-table"><thead><tr><th>Date</th><th>M</th><th>S</th><th>NV</th><th>Actions</th></tr></thead><tbody>';
    lignes.forEach(function(p) {
      html += '<tr' + (p.archived ? ' style="opacity:0.6"' : '') + '><td>' + fmtDate(p.date) + '</td><td class="num">' + p.m + '</td><td class="num">' + p.s + '</td><td class="num">' + p.n + '</td><td>';
      html += '<button class="btn-mini orange" onclick="modifierParticipation(\'' + p.id + '\')">✏️</button><button class="btn-mini ' + (p.archived ? 'blue' : 'gray') + '" onclick="archiverParticipation(\'' + p.id + '\')">' + (p.archived ? '↩️' : '📦') + '</button><button class="btn-mini danger" onclick="supprimerParticipation(\'' + p.id + '\')">🗑️</button></td></tr>';
    });
    html += '</tbody><tfoot><tr><td>TOTAL</td><td class="num">' + tm + '</td><td class="num">' + ts + '</td><td class="num">' + tn + '</td><td></td></tr></tfoot></table></div></div>';
  });
  box.innerHTML = html;
}
function modifierParticipation(id) {
  var list = DB.get('participations', []); var p = list.find(function(x) { return x.id === id; }); if (!p) return;
  var date = prompt('Date (AAAA-MM-JJ) :', p.date); if (date === null) return; var m = prompt('Membres :', p.m); if (m === null) return;
  var s = prompt('Sympathisants :', p.s); if (s === null) return; var n = prompt('Nouveaux venus :', p.n); if (n === null) return;
  p.date = date.trim(); p.m = parseInt(m) || 0; p.s = parseInt(s) || 0; p.n = parseInt(n) || 0; DB.set('participations', list); afficherJournaliere(); alert('✅ Modifiée');
}
function archiverParticipation(id) { var list = DB.get('participations', []); var p = list.find(function(x) { return x.id === id; }); if (!p) return; p.archived = !p.archived; DB.set('participations', list); afficherJournaliere(); alert(p.archived ? '📦 Archivée' : '↩️ Restaurée'); }
function supprimerParticipation(id) { if (!confirm('⚠️ Supprimer ?')) return; DB.set('participations', DB.get('participations', []).filter(function(x) { return x.id !== id; })); afficherJournaliere(); }

function enregistrerFicheMensuelle() {
  var prov = exigerProvince(); if (!prov) return;
  var numericIds = ['mEncadreurs','mMembresActifs','mSympathisants','mFMembres','mFSympathisants','mFNouveaux','mFoyersLumiere','mAvecGoshintai','mSansGoshintai','mFoyersSymp','mFleurs','mPotagers','mTotalPotagers','mMaisonsOuvertes','mTemoignages','mCandGoshintai','mConfInit','mConfReinit','mConfShoku','mConfKannon','mConfMitamaya','mAssistMembres','mAssistSymp','mConcessions','mTerrains','mCampagnes','mCoursEns','mCoursFleurs'];
  var f = { id: uid(), province: prov, entiteId: document.getElementById('mEntite').value, mois: document.getElementById('mMois').value, annee: document.getElementById('mAnnee').value, responsable: document.getElementById('mResponsable').value, jourReunion: document.getElementById('mJourReunion').value, themes: document.getElementById('mThemes').value, graces: document.getElementById('mGraces').value, points: document.getElementById('mPoints').value, solutions: document.getElementById('mSolutions').value, objectifs: document.getElementById('mObjectifs').value, actions: document.getElementById('mActions').value, archived: false, dateCreation: new Date().toISOString() };
  numericIds.forEach(function(id) { var el = document.getElementById(id); f[id] = el ? (parseInt(el.value) || 0) : 0; });
  if (!f.entiteId) return alert('⚠️ Enregistrez d\'abord une entité');
  var list = DB.get('fichesMensuelles', []); list.push(f); DB.set('fichesMensuelles', list); alert('✅ Fiche enregistrée (' + prov + ')'); rechercherFreqAvance();
}
function reinitialiserFormFiche() {
  var ids = ['mResponsable','mThemes','mGraces','mPoints','mSolutions','mObjectifs','mActions']; ids.forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; });
  var nums = ['mEncadreurs','mMembresActifs','mSympathisants','mFMembres','mFSympathisants','mFNouveaux','mFoyersLumiere','mAvecGoshintai','mSansGoshintai','mFoyersSymp','mFleurs','mPotagers','mTotalPotagers','mMaisonsOuvertes','mTemoignages','mCandGoshintai','mConfInit','mConfReinit','mConfShoku','mConfKannon','mConfMitamaya','mAssistMembres','mAssistSymp','mConcessions','mTerrains','mCampagnes','mCoursEns','mCoursFleurs'];
  nums.forEach(function(id) { var el = document.getElementById(id); if (el) el.value = 0; });
}
function tableFicheMensuelle(f) {
  var h = '<div class="entity-block"' + (f.archived ? ' style="opacity:0.7;background:#f0f0f0"' : '') + '><h4>📍 ' + echapper(getEntiteNom(f.entiteId)) + ' — ' + echapper(f.mois) + ' ' + echapper(f.annee);
  if (f.province) h += ' <span style="display:inline-block;padding:2px 8px;background:#0d6efd;color:white;border-radius:10px;font-size:11px;font-weight:600;margin-left:6px">🌍 ' + echapper(f.province) + '</span>';
  if (f.archived) h += ' <span class="badge badge-archive">📦</span>'; h += '</h4><div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0;padding:10px;background:#fff;border-radius:8px;border:1px dashed #0a6e2c">';
  h += '<button class="btn-mini orange" onclick="modifierFiche(\'' + f.id + '\')" style="padding:8px 12px;font-size:12px">✏️</button><button class="btn-mini ' + (f.archived ? 'blue' : 'gray') + '" onclick="archiverFiche(\'' + f.id + '\')" style="padding:8px 12px;font-size:12px">' + (f.archived ? '↩️' : '📦') + '</button><button class="btn-mini danger" onclick="supprimerFiche(\'' + f.id + '\')" style="padding:8px 12px;font-size:12px">🗑️</button></div>';
  h += '<div class="table-wrapper"><table class="data-table"><tbody><tr><td>Responsable</td><td>' + echapper(f.responsable) + '</td></tr><tr><td>Encadreurs</td><td class="num">' + (f.mEncadreurs || 0) + '</td></tr><tr><td>Membres actifs</td><td class="num">' + (f.mMembresActifs || 0) + '</td></tr><tr><td>Sympathisants</td><td class="num">' + (f.mSympathisants || 0) + '</td></tr><tr><td>Thèmes</td><td>' + echapper(f.themes) + '</td></tr><tr><td>Grâces</td><td>' + echapper(f.graces) + '</td></tr></tbody></table></div></div>';
  return h;
}
function modifierFiche(id) {
  var list = DB.get('fichesMensuelles', []); var f = list.find(function(x) { return x.id === id; }); if (!f) return;
  var resp = prompt('Responsable :', f.responsable); if (resp === null) return; f.responsable = resp.trim(); var themes = prompt('Thèmes :', f.themes); if (themes === null) return; f.themes = themes;
  var graces = prompt('Grâces :', f.graces); if (graces === null) return; f.graces = graces; DB.set('fichesMensuelles', list); alert('✅ Modifiée'); rechercherFreqAvance();
}
function archiverFiche(id) { var list = DB.get('fichesMensuelles', []); var f = list.find(function(x) { return x.id === id; }); if (!f) return; f.archived = !f.archived; DB.set('fichesMensuelles', list); alert(f.archived ? '📦 Archivée' : '↩️ Restaurée'); rechercherFreqAvance(); }
function supprimerFiche(id) { if (!confirm('⚠️ Supprimer cette fiche ?')) return; DB.set('fichesMensuelles', DB.get('fichesMensuelles', []).filter(function(x) { return x.id !== id; })); alert('✅ Supprimée'); rapportFreqDetaille(); }
function rechercherFreqAvance() {
  var q = (document.getElementById('searchFreq').value || '').toUpperCase().trim(); var annee = (document.getElementById('searchFreqAnnee').value || '').trim(); var mois = document.getElementById('searchFreqMois').value; var statut = document.getElementById('searchFreqStatut').value;
  var fiches = filtrerListe(fichesProvince(), statut); fiches = fiches.filter(function(f) { var nom = getEntiteNom(f.entiteId).toUpperCase(); return (!q || nom.indexOf(q) !== -1) && (!annee || String(f.annee) === annee) && (!mois || f.mois === mois); });
  var provLabel = getProvinceActive() || 'Toutes'; var html = '<h3>Résultats (' + fiches.length + ') — 🌍 ' + echapper(provLabel === '__non_assignee' ? 'Non assignées' : provLabel) + '</h3>';
  if (!fiches.length) html += '<p>Aucun résultat.</p>'; else fiches.forEach(function(f) { html += tableFicheMensuelle(f); }); document.getElementById('rapportFreqBox').innerHTML = html;
}
function reinitialiserRechercheFreq() { var a = document.getElementById('searchFreq'); if (a) a.value = ''; var b = document.getElementById('searchFreqAnnee'); if (b) b.value = ''; var c = document.getElementById('searchFreqMois'); if (c) c.selectedIndex = 0; var d = document.getElementById('searchFreqStatut'); if (d) d.selectedIndex = 0; document.getElementById('rapportFreqBox').innerHTML = ''; }
function rapportFreqGlobal() {
  var fiches = fichesProvince().filter(function(f) { return !f.archived; }); var parts = participationsProvince().filter(function(p) { return !p.archived; }); var tm = 0, ts = 0, tn = 0; parts.forEach(function(p) { tm += p.m; ts += p.s; tn += p.n; });
  var provLabel = getProvinceActive() || 'Toutes'; var html = '<div class="rapport-header"><h3>📊 RAPPORT GLOBAL — FRÉQUENCES</h3><p>🌍 ' + echapper(provLabel === '__non_assignee' ? 'Non assignées' : provLabel) + '</p></div><div class="table-wrapper"><table class="data-table"><tbody>';
  html += '<tr><td>Fiches mensuelles</td><td class="num">' + fiches.length + '</td></tr><tr><td>Participations</td><td class="num">' + parts.length + '</td></tr><tr><td>Total Membres</td><td class="num">' + tm + '</td></tr><tr><td>Total Sympathisants</td><td class="num">' + ts + '</td></tr><tr><td>Total Nouveaux</td><td class="num">' + tn + '</td></tr></tbody></table></div>';
  if (fiches.length) fiches.forEach(function(f) { html += tableFicheMensuelle(f); }); document.getElementById('rapportFreqBox').innerHTML = html;
}
function rapportFreqDetaille() {
  var fiches = fichesProvince().filter(function(f) { return !f.archived; }); var provLabel = getProvinceActive() || 'Toutes';
  if (!fiches.length) { document.getElementById('rapportFreqBox').innerHTML = '<p>Aucune fiche active — 🌍 ' + echapper(provLabel === '__non_assignee' ? 'Non assignées' : provLabel) + '</p>'; return; }
  var html = '<div class="rapport-header"><h3>📋 RAPPORT DÉTAILLÉ — FRÉQUENCES</h3><p>🌍 ' + echapper(provLabel === '__non_assignee' ? 'Non assignées' : provLabel) + '</p></div>';
  fiches.forEach(function(f) { html += tableFicheMensuelle(f); }); document.getElementById('rapportFreqBox').innerHTML = html;
}
function recalculerTotauxRN() { var elM = document.getElementById('rnCulteMembres'); var elS = document.getElementById('rnCulteSymp'); var elN = document.getElementById('rnCulteNV'); var elT = document.getElementById('rnCulteTotal'); if (!elT) return; var cm = elM ? (parseInt(elM.value) || 0) : 0; var cs = elS ? (parseInt(elS.value) || 0) : 0; var cn = elN ? (parseInt(elN.value) || 0) : 0; elT.value = cm + cs + cn; }

// ========== MODULE II — PHOTO & SIGNATURE ==========
function previewPhotoCandidat(ev) {
  var file = ev.target.files[0]; if (!file) { photoCandidatTemp = null; var p = document.getElementById('cPhotoPreview'); if (p) p.innerHTML = ''; return; }
  if (file.size > 5 * 1024 * 1024) return alert('⚠️ Image trop lourde (max 5 Mo)'); var reader = new FileReader();
  reader.onload = function(e) { var img = new Image(); img.onload = function() { var canvas = document.createElement('canvas'); canvas.width = 250; canvas.height = 250; var ctx = canvas.getContext('2d'); var min = Math.min(img.width, img.height); ctx.drawImage(img, (img.width-min)/2, (img.height-min)/2, min, min, 0, 0, 250, 250); photoCandidatTemp = canvas.toDataURL('image/jpeg', 0.65); document.getElementById('cPhotoPreview').innerHTML = '<img src="' + photoCandidatTemp + '" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:3px solid #0a6e2c;box-shadow:0 2px 8px rgba(0,0,0,0.2)">'; }; img.src = e.target.result; }; reader.readAsDataURL(file);
}

function initSignature() {
  var canvas = document.getElementById('vSignatureCanvas'); if (!canvas) return;
  var ratio = window.devicePixelRatio || 1; var rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) { setTimeout(initSignature, 200); return; }
  canvas.width = rect.width * ratio; canvas.height = rect.height * ratio;
  signatureCanvas = canvas; signatureCtx = canvas.getContext('2d');
  signatureCtx.setTransform(1, 0, 0, 1, 0, 0); signatureCtx.scale(ratio, ratio);
  signatureCtx.lineWidth = 3; signatureCtx.lineCap = 'round'; signatureCtx.lineJoin = 'round';
  signatureCtx.strokeStyle = getSignatureEncreColor(); // CORRECTION ICI : On applique la couleur
  signatureCtx.fillStyle = getSignatureEncreColor();
  
  if (canvas.dataset.listeners === '1') return; canvas.dataset.listeners = '1';
  var drawing = false, lastX = 0, lastY = 0;
  function getPos(e) { var r = canvas.getBoundingClientRect(); var p = (e.touches && e.touches.length) ? e.touches[0] : (e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : e); return { x: p.clientX - r.left, y: p.clientY - r.top }; }
  function start(e) { 
    e.preventDefault(); drawing = true; 
    signatureCtx.strokeStyle = getSignatureEncreColor(); 
    signatureCtx.fillStyle = getSignatureEncreColor();
    var p = getPos(e); lastX = p.x; lastY = p.y; 
    signatureCtx.beginPath(); signatureCtx.arc(p.x, p.y, 1.5, 0, Math.PI * 2); signatureCtx.fill(); 
    signatureVide = false; var st = document.getElementById('vSignatureStatus'); if (st) { st.textContent = '✅ Signé'; st.style.color = '#0a6e2c'; } 
  }
  function move(e) { 
    if (!drawing) return; e.preventDefault(); 
    signatureCtx.strokeStyle = getSignatureEncreColor(); 
    var p = getPos(e); 
    signatureCtx.beginPath(); signatureCtx.moveTo(lastX, lastY); signatureCtx.lineTo(p.x, p.y); signatureCtx.stroke(); 
    lastX = p.x; lastY = p.y; signatureVide = false; 
  }
  function stop() { drawing = false; }
  canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', move); canvas.addEventListener('mouseup', stop); canvas.addEventListener('mouseleave', stop); canvas.addEventListener('touchstart', start, { passive: false }); canvas.addEventListener('touchmove', move, { passive: false }); canvas.addEventListener('touchend', stop); canvas.addEventListener('touchcancel', stop);
}
function effacerSignature() { if (!signatureCtx || !signatureCanvas) return; signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height); signatureVide = true; var st = document.getElementById('vSignatureStatus'); if (st) { st.textContent = 'Aucune signature'; st.style.color = '#888'; } }

// ========== MODULE II — CANDIDATS & VERSEMENTS ==========
function ajouterCandidat() {
  var prov = exigerProvince(); if (!prov) return; var nom = document.getElementById('cNom').value.trim(); var typeEntite = document.getElementById('cTypeEntite').value; var nomEntite = document.getElementById('cNomEntite').value.trim().toUpperCase(); var responsable = document.getElementById('cResponsable').value.trim(); var motif = document.getElementById('cMotif').value; var montant = parseFloat(document.getElementById('cMontant').value) || 0; var taux = parseFloat(document.getElementById('cTaux').value) || 2300;
  if (!nom) return alert('Entrez le nom'); if (!nomEntite) return alert('Entrez l\'entité');
  var list = DB.get('candidats', []); if (list.find(function(c) { return c.nom.toLowerCase() === nom.toLowerCase() && c.motif === motif && c.province === prov && c.statut === 'en_cours' && !c.archived; })) return alert('⚠️ Candidat déjà en cours dans cette province');
  list.push({ id: uid(), nom: nom, typeEntite: typeEntite, nomEntite: nomEntite, responsable: responsable, motif: motif, montantPrevu: montant, taux: taux, totalVerse: 0, statut: 'en_cours', dateInscription: new Date().toISOString(), photo: photoCandidatTemp || null, province: prov, archived: false });
  DB.set('candidats', list); reinitialiserFormCandidat(); refreshAll(); alert('✅ Candidat ajouté : ' + nom + ' (' + prov + ')');
}
function reinitialiserFormCandidat() { ['cNom','cNomEntite','cResponsable'].forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; }); var m = document.getElementById('cMontant'); if (m) m.value = 200; var t = document.getElementById('cTaux'); if (t) t.value = 2300; var p = document.getElementById('cPhotoPreview'); if (p) p.innerHTML = ''; var c1 = document.getElementById('cPhotoCamera'); if (c1) c1.value = ''; var c2 = document.getElementById('cPhotoGallery'); if (c2) c2.value = ''; photoCandidatTemp = null; }

function afficherCandidats() {
  var search = (document.getElementById('searchCand') ? document.getElementById('searchCand').value : '').toLowerCase(); var filtre = document.getElementById('filtreCandidats') ? document.getElementById('filtreCandidats').value : 'actif'; var list = candidatsProvince().slice();
  if (filtre === 'en_cours') list = list.filter(function(c) { return c.statut === 'en_cours' && !c.archived; }); else if (filtre === 'termine') list = list.filter(function(c) { return c.statut === 'termine' && !c.archived; }); else if (filtre === 'archive') list = list.filter(function(c) { return c.archived === true; }); else if (filtre === 'actif') list = list.filter(function(c) { return !c.archived && c.statut !== 'archive'; });
  if (search) list = list.filter(function(c) { return c.nom.toLowerCase().indexOf(search) !== -1; }); list.sort(function(a, b) { return a.nom.localeCompare(b.nom); }); var box = document.getElementById('listeCandidats'); if (!box) return;
  if (!list.length) { box.innerHTML = '<p>Aucun candidat.</p>'; return; }
  var html = '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Photo</th><th>Nom</th><th>Entité</th><th>Province</th><th>Motif</th><th>Statut</th><th>Versé</th><th>Actions</th></tr></thead><tbody>';
  list.forEach(function(c) {
    var badge = c.archived ? '<span class="badge badge-archive">📦</span>' : (c.statut === 'termine' ? '<span class="badge badge-ok">✅</span>' : '<span class="badge badge-progress">⏳</span>');
    html += '<tr' + (c.archived ? ' style="opacity:0.6"' : '') + '><td style="text-align:center">'; if (c.photo) html += '<img src="' + c.photo + '" style="width:42px;height:42px;border-radius:50%;object-fit:cover;border:2px solid #0a6e2c;cursor:pointer" onclick="voirPhoto(\'' + c.id + '\')">'; else html += '<div style="width:42px;height:42px;border-radius:50%;background:#e0e0e0;color:#888;display:inline-flex;align-items:center;justify-content:center;font-size:16px">👤</div>';
    html += '</td><td>' + echapper(c.nom) + '</td><td>' + echapper(c.typeEntite) + ' - ' + echapper(c.nomEntite) + '</td><td>' + (c.province ? '🌍 ' + echapper(c.province) : '📭') + '</td><td>' + echapper(c.motif) + '</td><td>' + badge + '</td><td class="num">' + c.totalVerse.toFixed(2) + '$</td><td>';
    html += '<button class="btn-mini" onclick="verserRapide(\'' + c.id + '\')">💵</button><button class="btn-mini blue" onclick="changerPhoto(\'' + c.id + '\')">📷</button><button class="btn-mini orange" onclick="modifierCandidat(\'' + c.id + '\')">✏️</button><button class="btn-mini ' + (c.archived ? 'blue' : 'gray') + '" onclick="archiverCandidat(\'' + c.id + '\')">' + (c.archived ? '↩️' : '📦') + '</button><button class="btn-mini danger" onclick="supprimerCandidat(\'' + c.id + '\')">🗑️</button></td></tr>';
  });
  html += '</tbody></table></div>'; box.innerHTML = html;
}
function voirPhoto(cid) { var c = DB.get('candidats', []).find(function(x) { return x.id === cid; }); if (!c || !c.photo) return; var w = window.open('', '_blank'); w.document.write('<html><body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column"><img src="' + c.photo + '" style="max-width:90vw;max-height:80vh;border:4px solid white;border-radius:8px"><p style="color:white;font-family:Arial;margin-top:20px;font-size:18px">' + echapper(c.nom) + '</p></body></html>'); }
function changerPhoto(cid) { var choix = confirm('📸 OK = Caméra\n❌ Annuler = Galerie'); var input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; if (choix) input.capture = 'user'; input.onchange = function(ev) { var file = ev.target.files[0]; if (!file) return; if (file.size > 5 * 1024 * 1024) return alert('⚠️ Image trop lourde (max 5 Mo)'); var reader = new FileReader(); reader.onload = function(e) { var img = new Image(); img.onload = function() { var canvas = document.createElement('canvas'); canvas.width = 250; canvas.height = 250; var ctx = canvas.getContext('2d'); var min = Math.min(img.width, img.height); ctx.drawImage(img, (img.width-min)/2, (img.height-min)/2, min, min, 0, 0, 250, 250); var data = canvas.toDataURL('image/jpeg', 0.65); var list = DB.get('candidats', []); var c = list.find(function(x) { return x.id === cid; }); if (c) { c.photo = data; DB.set('candidats', list); refreshAll(); alert('✅ Photo mise à jour'); } }; img.src = e.target.result; }; reader.readAsDataURL(file); }; input.click(); }
function modifierCandidat(cid) { var list = DB.get('candidats', []); var c = list.find(function(x) { return x.id === cid; }); if (!c) return; var nom = prompt('Nom :', c.nom); if (nom === null) return; var type = prompt('Type :', c.typeEntite); if (type === null) return; var entite = prompt('Entité :', c.nomEntite); if (entite === null) return; var resp = prompt('Responsable :', c.responsable); if (resp === null) return; var montant = prompt('Montant prévu :', c.montantPrevu); if (montant === null) return; c.nom = nom.trim(); c.typeEntite = type.trim(); c.nomEntite = entite.trim().toUpperCase(); c.responsable = resp.trim(); c.montantPrevu = parseFloat(montant) || c.montantPrevu; c.statut = (c.totalVerse >= c.montantPrevu - 0.01) ? 'termine' : 'en_cours'; DB.set('candidats', list); refreshAll(); alert('✅ Modifié'); }
function archiverCandidat(cid) { var list = DB.get('candidats', []); var c = list.find(function(x) { return x.id === cid; }); if (!c) return; if (!c.archived) { if (!confirm('📦 Archiver "' + c.nom + '" ?\n\nIl n\'apparaîtra plus dans les rapports PDF.')) return; c.archived = true; } else { c.archived = false; } DB.set('candidats', list); refreshAll(); alert(c.archived ? '📦 Archivé' : '↩️ Restauré'); }
function supprimerCandidat(cid) { if (!confirm('⚠️ Supprimer ce candidat et TOUS ses versements ?')) return; DB.set('candidats', DB.get('candidats', []).filter(function(c) { return c.id !== cid; })); DB.set('versements', DB.get('versements', []).filter(function(v) { return v.candId !== cid; })); refreshAll(); alert('✅ Supprimé'); }
function reinitialiserRechercheCand() { var el = document.getElementById('searchCand'); if (el) el.value = ''; var f = document.getElementById('filtreCandidats'); if (f) f.selectedIndex = 0; afficherCandidats(); }
function reinitialiserRechercheEntite() { var a = document.getElementById('searchEntiteFinance'); if (a) a.value = ''; var b = document.getElementById('searchEntiteType'); if (b) b.selectedIndex = 0; var box = document.getElementById('resultatRechercheEntite'); if (box) box.innerHTML = ''; }
function rafraichirCandidatsSelect() { var sel = document.getElementById('vCandidat'); if (!sel) return; var list = candidatsProvince().filter(function(c) { return c.statut === 'en_cours' && !c.archived; }); list.sort(function(a, b) { return a.nom.localeCompare(b.nom); }); var val = sel.value; var opts = ''; list.forEach(function(c) { opts += '<option value="' + c.id + '">' + c.nom + ' - ' + c.motif + ' (' + c.nomEntite + ')</option>'; }); if (!opts) opts = '<option value="">-- Aucun candidat en cours --</option>'; sel.innerHTML = opts; if (val) sel.value = val; }
function verserRapide(cid) { rafraichirCandidatsSelect(); document.getElementById('vCandidat').value = cid; document.getElementById('vDate').value = new Date().toISOString().slice(0, 10); switchMainTab('finance', document.querySelectorAll('.main-tab')[2]); setTimeout(function() { initSignature(); var v = document.getElementById('vMontant'); if (v) v.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 500); }

function enregistrerVersement() {
  var prov = exigerProvince(); if (!prov) return; var candId = document.getElementById('vCandidat').value; var monnaie = document.getElementById('vMonnaie').value; var montant = parseFloat(document.getElementById('vMontant').value) || 0; var taux = parseFloat(document.getElementById('vTaux').value) || 2300; var date = document.getElementById('vDate').value || new Date().toISOString().slice(0, 10);
  if (!candId) return alert('⚠️ Choisissez un candidat'); if (montant <= 0) return alert('Entrez un montant valide'); if (signatureVide || !signatureCanvas) return alert('✍️ Le candidat doit signer');
  var montantUSD = monnaie === 'FC' ? (montant / taux) : montant; var signatureData = signatureCanvas.toDataURL('image/png'); var vers = DB.get('versements', []);
  vers.push({ id: uid(), candId: candId, monnaie: monnaie, montantOrigine: montant, montantUSD: montantUSD, taux: taux, date: date, province: prov, dateCreation: new Date().toISOString(), signature: signatureData, archived: false });
  DB.set('versements', vers); var cands = DB.get('candidats', []); var c = cands.find(function(x) { return x.id === candId; });
  if (c) { c.totalVerse = (c.totalVerse || 0) + montantUSD; if (c.totalVerse >= c.montantPrevu - 0.01) c.statut = 'termine'; }
  DB.set('candidats', cands); reinitialiserFormVersement(); refreshAll(); alert('✅ Versement : ' + montantUSD.toFixed(2) + '$ (' + prov + ')');
}
function reinitialiserFormVersement() { var m = document.getElementById('vMontant'); if (m) m.value = 0; var d = document.getElementById('vDate'); if (d) d.value = new Date().toISOString().slice(0, 10); effacerSignature(); }

function afficherVersements() {
  var filtre = document.getElementById('filtreVersements') ? document.getElementById('filtreVersements').value : 'actif'; var vers = filtrerListe(versementsProvince(), filtre); var box = document.getElementById('historiqueVersements'); if (!box) return;
  if (!vers.length) { box.innerHTML = '<p>Aucun versement.</p>'; return; }
  var parCandidat = {}; vers.forEach(function(v) { if (!parCandidat[v.candId]) parCandidat[v.candId] = []; parCandidat[v.candId].push(v); }); var html = '';
  Object.keys(parCandidat).sort(function(a, b) { var ca = DB.get('candidats', []).find(function(x) { return x.id === a; }); var cb = DB.get('candidats', []).find(function(x) { return x.id === b; }); return (ca ? ca.nom : '').localeCompare(cb ? cb.nom : ''); }).forEach(function(cid) {
    var c = DB.get('candidats', []).find(function(x) { return x.id === cid; }); if (!c) return; var lignes = parCandidat[cid].slice().sort(function(a, b) { return new Date(a.date) - new Date(b.date); }); var totalFC = 0, totalUSD = 0; lignes.forEach(function(v) { totalUSD += v.montantUSD; if (v.monnaie === 'FC') totalFC += v.montantOrigine; });
    html += '<div class="entity-block"><h4 style="display:flex;align-items:center;gap:8px">'; if (c.photo) html += '<img src="' + c.photo + '" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid #0a6e2c">'; html += '👤 ' + echapper(c.nom) + '</h4><div style="font-size:12px;color:#666;margin-bottom:8px">' + echapper(c.typeEntite) + ' - <strong>' + echapper(c.nomEntite) + '</strong> | ' + echapper(c.motif) + '</div>';
    html += '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Date</th><th>FC</th><th>USD</th><th>Signé</th><th>Actions</th></tr></thead><tbody>';
    lignes.forEach(function(v) {
      html += '<tr' + (v.archived ? ' style="opacity:0.6"' : '') + '><td>' + fmtDate(v.date) + '</td><td class="num">' + (v.monnaie === 'FC' ? v.montantOrigine.toLocaleString() : '-') + '</td><td class="num">' + v.montantUSD.toFixed(2) + '$</td><td style="text-align:center">' + (v.signature ? '<img src="' + v.signature + '" style="height:26px;cursor:pointer;border:1px solid #ddd;background:white" onclick="voirSignature(\'' + v.id + '\')">' : '—') + '</td><td>';
      html += '<button class="btn-mini orange" onclick="modifierVersement(\'' + v.id + '\')">✏️</button><button class="btn-mini ' + (v.archived ? 'blue' : 'gray') + '" onclick="archiverVersement(\'' + v.id + '\')">' + (v.archived ? '↩️' : '📦') + '</button><button class="btn-mini danger" onclick="supprimerVersement(\'' + v.id + '\')">🗑️</button><button class="btn-mini blue" onclick="imprimerRecu(\'' + v.id + '\')">🖨️</button></td></tr>';
    });
    html += '</tbody><tfoot><tr><td>TOTAL</td><td class="num">' + totalFC.toLocaleString() + ' FC</td><td class="num">' + totalUSD.toFixed(2) + '$</td><td></td><td></td></tr></tfoot></table></div></div>';
  });
  box.innerHTML = html;
}
function voirSignature(vid) { var v = DB.get('versements', []).find(function(x) { return x.id === vid; }); if (!v || !v.signature) return; var c = DB.get('candidats', []).find(function(x) { return x.id === v.candId; }); var w = window.open('', '_blank'); w.document.write('<html><body style="margin:0;background:#f5f5f5;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;font-family:Arial"><img src="' + v.signature + '" style="max-width:90vw;background:white;border:2px solid #0a6e2c;border-radius:8px;padding:20px"><p style="color:#333;margin-top:20px;font-size:16px;text-align:center"><strong>' + (c ? echapper(c.nom) : '') + '</strong><br>' + fmtDate(v.date) + ' — ' + v.montantUSD.toFixed(2) + ' $</p></body></html>'); }
function modifierVersement(vid) { var list = DB.get('versements', []); var v = list.find(function(x) { return x.id === vid; }); if (!v) return; var montant = prompt('Montant :', v.montantOrigine); if (montant === null) return; var ancienUSD = v.montantUSD; v.montantOrigine = parseFloat(montant) || 0; v.montantUSD = v.monnaie === 'FC' ? (v.montantOrigine / v.taux) : v.montantOrigine; var cands = DB.get('candidats', []); var c = cands.find(function(x) { return x.id === v.candId; }); if (c) { c.totalVerse = c.totalVerse - ancienUSD + v.montantUSD; if (c.totalVerse >= c.montantPrevu - 0.01 && c.statut === 'en_cours') c.statut = 'termine'; if (c.totalVerse < c.montantPrevu - 0.01 && c.statut === 'termine') c.statut = 'en_cours'; } DB.set('candidats', cands); DB.set('versements', list); refreshAll(); alert('✅ Modifié'); }
function archiverVersement(vid) { var list = DB.get('versements', []); var v = list.find(function(x) { return x.id === vid; }); if (!v) return; v.archived = !v.archived; DB.set('versements', list); afficherVersements(); alert(v.archived ? '📦 Archivé' : '↩️ Restauré'); }
function supprimerVersement(vid) { if (!confirm('⚠️ Supprimer ce versement ?')) return; var list = DB.get('versements', []); var v = list.find(function(x) { return x.id === vid; }); if (!v) return; var cands = DB.get('candidats', []); var c = cands.find(function(x) { return x.id === v.candId; }); if (c) c.totalVerse = c.totalVerse - v.montantUSD; DB.set('candidats', cands); DB.set('versements', list.filter(function(x) { return x.id !== vid; })); refreshAll(); alert('✅ Supprimé'); }

function imprimerRecu(vid) {
  var v = DB.get('versements', []).find(function(x) { return x.id === vid; }); if (!v) return; var c = DB.get('candidats', []).find(function(x) { return x.id === v.candId; }); if (!c) return; var sigColor = getSignatureColor(); var w = window.open('', '_blank');
  w.document.write('<html><head><meta charset="UTF-8"><title>Reçu</title><style>body{font-family:Arial;padding:30px;max-width:600px;margin:auto}.header{text-align:center;border-bottom:3px double #0a6e2c;padding-bottom:15px;margin-bottom:20px}h1{color:#0a6e2c;font-size:18px}.logo{width:80px;height:80px;background:#0a6e2c;color:white;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:22px;font-weight:bold;margin-bottom:10px}.photo-box{text-align:center;margin:15px 0}.photo-box img{width:110px;height:110px;border-radius:50%;object-fit:cover;border:3px solid #0a6e2c}table{width:100%;border-collapse:collapse;margin:20px 0}td{padding:8px;border-bottom:1px solid #ddd}td.label{font-weight:bold;color:#0a6e2c}.montant{font-size:22px;color:#0a6e2c;font-weight:bold;text-align:center;padding:20px;background:#e8f5e9;border-radius:8px}.signature{margin-top:40px;display:flex;justify-content:space-between;align-items:flex-end}.sig-line{border-top:1px solid ' + sigColor + ';color:' + sigColor + ';width:45%;padding-top:5px;font-size:12px;text-align:center;font-weight:600}.sig-img{width:45%;text-align:center;padding-bottom:5px}.sig-img img{max-height:70px;max-width:100%;border-bottom:1px solid ' + sigColor + '}</style></head><body>');
  w.document.write('<div class="header"><div class="logo">EMM</div><h1>ÉGLISE MESSIANIQUE MONDIALE</h1><p style="color:#666">EMM MONDIAL - Finance</p><h2 style="color:#0a6e2c">REÇU DE VERSEMENT</h2></div>');
  if (c.photo) w.document.write('<div class="photo-box"><img src="' + c.photo + '"><p style="font-size:14px;font-weight:bold;margin-top:6px">' + echapper(c.nom) + '</p></div>');
  w.document.write('<table><tr><td class="label">Nom</td><td>' + echapper(c.nom) + '</td></tr><tr><td class="label">Entité</td><td>' + echapper(c.typeEntite) + ' - ' + echapper(c.nomEntite) + '</td></tr><tr><td class="label">Province</td><td>' + echapper(c.province || v.province || '-') + '</td></tr><tr><td class="label">Motif</td><td>' + echapper(c.motif) + '</td></tr><tr><td class="label">Date</td><td>' + fmtDate(v.date) + '</td></tr><tr><td class="label">Taux</td><td>1$ = ' + v.taux + ' FC</td></tr></table>');
  w.document.write('<div class="montant">' + v.montantOrigine + ' ' + v.monnaie + '<br><small>= ' + v.montantUSD.toFixed(2) + ' USD</small></div><div class="signature">');
  if (v.signature) w.document.write('<div class="sig-img"><img src="' + v.signature + '"><br><small>Le candidat</small></div>'); else w.document.write('<div class="sig-line">Le candidat</div>');
  w.document.write('<div class="sig-line">Le Responsable</div></div></body></html>'); w.document.close(); setTimeout(function() { w.print(); }, 500);
}
function rechercherParEntite() {
  var q = (document.getElementById('searchEntiteFinance').value || '').trim().toUpperCase(); var type = document.getElementById('searchEntiteType').value; var box = document.getElementById('resultatRechercheEntite'); if (!box) return;
  if (!q && !type) { box.innerHTML = '<p style="color:#888;font-size:13px">Entrez un nom.</p>'; return; }
  var cands = candidatsProvince().filter(function(c) { return !c.archived; }).filter(function(c) { return (!q || (c.nomEntite && c.nomEntite.toUpperCase().indexOf(q) !== -1)) && (!type || c.typeEntite === type); });
  if (!cands.length) { box.innerHTML = '<p style="color:#888;font-size:13px">Aucun candidat.</p>'; return; }
  var parEntite = {}; cands.forEach(function(c) { var key = c.typeEntite + ' - ' + c.nomEntite; if (!parEntite[key]) parEntite[key] = []; parEntite[key].push(c); }); var html = '';
  Object.keys(parEntite).forEach(function(key) {
    var liste = parEntite[key]; var totalPrevu = 0, totalVerse = 0; liste.forEach(function(c) { totalPrevu += c.montantPrevu; totalVerse += (c.totalVerse || 0); });
    html += '<div class="entity-block"><h4>🏛️ ' + echapper(key) + '</h4><div style="font-size:12px;color:#666;margin-bottom:8px">' + liste.length + ' candidat(s) | Prévu : <strong>' + totalPrevu.toFixed(2) + '$</strong> | Versé : <strong>' + totalVerse.toFixed(2) + '$</strong> | Solde : <strong style="color:#c62828">' + (totalPrevu - totalVerse).toFixed(2) + '$</strong></div>';
    html += '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Photo</th><th>Nom</th><th>Motif</th><th>Statut</th><th>Prévu</th><th>Versé</th><th>Solde</th><th>Relevé</th></tr></thead><tbody>';
    liste.sort(function(a, b) { return a.nom.localeCompare(b.nom); });
    liste.forEach(function(c) {
      var solde = c.montantPrevu - (c.totalVerse || 0); var badge = c.statut === 'termine' ? '<span class="badge badge-ok">✅</span>' : '<span class="badge badge-progress">⏳</span>';
      html += '<tr><td style="text-align:center">'; if (c.photo) html += '<img src="' + c.photo + '" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid #0a6e2c;cursor:pointer" onclick="voirPhoto(\'' + c.id + '\')">'; else html += '<div style="width:36px;height:36px;border-radius:50%;background:#e0e0e0;color:#888;display:inline-flex;align-items:center;justify-content:center;font-size:14px">👤</div>';
      html += '</td><td>' + echapper(c.nom) + '</td><td>' + echapper(c.motif) + '</td><td>' + badge + '</td><td class="num">' + c.montantPrevu + '$</td><td class="num">' + (c.totalVerse || 0).toFixed(2) + '$</td><td class="num">' + solde.toFixed(2) + '$</td><td><button class="btn-mini blue" onclick="afficherReleveVersement(\'' + c.id + '\')">📋</button></td></tr>';
    });
    html += '</tbody></table></div></div>';
  });
  box.innerHTML = html;
}
function afficherReleveVersement(candId) {
  var c = DB.get('candidats', []).find(function(x) { return x.id === candId; }); if (!c) return alert('Candidat introuvable');
  var vers = DB.get('versements', []).filter(function(v) { return v.candId === candId && !v.archived; }); vers.sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
  var totalUSD = 0, totalFC = 0; vers.forEach(function(v) { totalUSD += v.montantUSD; if (v.monnaie === 'FC') totalFC += v.montantOrigine; }); var sigColor = getSignatureColor(); var w = window.open('', '_blank');
  w.document.write('<html><head><meta charset="UTF-8"><title>Relevé</title><style>body{font-family:Arial;padding:24px;max-width:800px;margin:auto;color:#222}.header{text-align:center;border-bottom:3px double #0a6e2c;padding-bottom:15px;margin-bottom:20px}.logo{width:70px;height:70px;background:#0a6e2c;color:white;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:bold;margin-bottom:10px}h1{color:#0a6e2c;font-size:18px}h2{color:#333;font-size:14px;margin:15px 0 10px;border-left:4px solid #0a6e2c;padding-left:8px}table{width:100%;border-collapse:collapse;margin:15px 0;font-size:13px}th{background:#0a6e2c;color:white;padding:8px;text-align:left}td{padding:8px;border-bottom:1px solid #ddd}td.num{text-align:right}tfoot td{font-weight:bold;background:#e8f5e9;color:#0a6e2c;border-top:2px solid #0a6e2c}.info{background:#f9f9f9;padding:12px;border-radius:8px;margin:15px 0;border-left:4px solid #0a6e2c}.info p{margin:4px 0;font-size:13px}.solde{font-size:15px;color:#0a6e2c;font-weight:bold;text-align:center;padding:15px;background:#e8f5e9;border-radius:8px;margin-top:15px}.signature{margin-top:60px;display:flex;justify-content:space-between}.sig-line{border-top:1px solid ' + sigColor + ';color:' + sigColor + ';font-weight:600;width:45%;padding-top:5px;font-size:12px;text-align:center}.photo-top{text-align:center;margin:15px 0}.photo-top img{width:120px;height:120px;border-radius:50%;object-fit:cover;border:3px solid #0a6e2c}</style></head><body>');
  w.document.write('<div class="header"><div class="logo">EMM</div><h1>ÉGLISE MESSIANIQUE MONDIALE</h1><p style="color:#666;font-size:12px">EMM MONDIAL — Finance</p><h2 style="border:none;text-align:center">RELEVÉ DE VERSEMENT INDIVIDUEL</h2></div>');
  if (c.photo) w.document.write('<div class="photo-top"><img src="' + c.photo + '"></div>');
  w.document.write('<div class="info"><p><strong>Nom :</strong> ' + echapper(c.nom) + '</p><p><strong>Entité :</strong> ' + echapper(c.typeEntite) + ' - ' + echapper(c.nomEntite) + '</p><p><strong>Province :</strong> ' + echapper(c.province || '-') + '</p><p><strong>Responsable :</strong> ' + echapper(c.responsable || '-') + '</p><p><strong>Motif :</strong> ' + echapper(c.motif) + '</p><p><strong>Statut :</strong> ' + (c.statut === 'termine' ? 'Terminé' : 'En cours') + '</p></div><h2>Détail des versements (' + vers.length + ')</h2>');
  if (vers.length) {
    w.document.write('<table><thead><tr><th>#</th><th>Date</th><th>Monnaie</th><th>Montant</th><th>Taux</th><th>USD</th><th>Signature</th></tr></thead><tbody>');
    vers.forEach(function(v, i) { w.document.write('<tr><td>' + (i + 1) + '</td><td>' + fmtDate(v.date) + '</td><td>' + v.monnaie + '</td><td class="num">' + v.montantOrigine.toLocaleString() + '</td><td class="num">' + v.taux + '</td><td class="num">' + v.montantUSD.toFixed(2) + ' $</td><td style="text-align:center">' + (v.signature ? '<img src="' + v.signature + '" style="max-height:40px;border:1px solid #ddd;background:white">' : '—') + '</td></tr>'); });
    w.document.write('</tbody></table>');
  }
  w.document.write('<div class="solde">Montant prévu : ' + c.montantPrevu + ' $<br>Total versé : ' + totalUSD.toFixed(2) + ' $'); if (totalFC > 0) w.document.write(' (dont ' + totalFC.toLocaleString() + ' FC)'); w.document.write('<br>Solde restant : ' + (c.montantPrevu - totalUSD).toFixed(2) + ' $</div><div class="signature"><div class="sig-line">Le candidat</div><div class="sig-line">Le Responsable</div></div></body></html>');
  w.document.close(); setTimeout(function() { w.print(); }, 500);
}

function relevéCompletEntite() {
  var q = (document.getElementById('searchEntiteFinance').value || '').trim().toUpperCase(); var type = document.getElementById('searchEntiteType').value; if (!q && !type) return alert('Entrez d\'abord un nom');
  var cands = candidatsProvince().filter(function(c) { return !c.archived; }).filter(function(c) { return (!q || (c.nomEntite && c.nomEntite.toUpperCase().indexOf(q) !== -1)) && (!type || c.typeEntite === type); }); if (!cands.length) return alert('Aucun candidat');
  var vers = DB.get('versements', []).filter(function(v) { return !v.archived; }); var parEntite = {}; cands.forEach(function(c) { var key = c.typeEntite + ' - ' + c.nomEntite; if (!parEntite[key]) parEntite[key] = []; parEntite[key].push(c); }); var w = window.open('', '_blank');
  w.document.write('<html><head><meta charset="UTF-8"><title>Relevé entité</title><style>body{font-family:Arial;padding:24px;max-width:900px;margin:auto;color:#222}.header{text-align:center;border-bottom:3px double #0a6e2c;padding-bottom:15px;margin-bottom:20px}h1{color:#0a6e2c;font-size:20px;text-align:center}h2{color:#0a6e2c;font-size:14px;margin:20px 0 8px;border-left:4px solid #0a6e2c;padding-left:8px}table{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px}th{background:#0a6e2c;color:white;padding:6px;text-align:left}td{padding:6px;border-bottom:1px solid #ddd}td.num{text-align:right}tfoot td{font-weight:bold;background:#e8f5e9;color:#0a6e2c;border-top:2px solid #0a6e2c}</style></head><body>');
  w.document.write('<div class="header"><h1>EMM MONDIAL</h1><p style="text-align:center;color:#666;font-size:12px">Relevé global par entité</p></div>');
  Object.keys(parEntite).forEach(function(key) {
    var liste = parEntite[key]; var totalPrevu = 0, totalVerse = 0; liste.forEach(function(c) { totalPrevu += c.montantPrevu; totalVerse += (c.totalVerse || 0); });
    w.document.write('<h2>🏛️ ' + echapper(key) + '</h2><table><thead><tr><th>Nom</th><th>Motif</th><th>Statut</th><th>Prévu</th><th>Versé</th><th>Solde</th><th>Nb vers.</th></tr></thead><tbody>');
    liste.forEach(function(c) { var nb = vers.filter(function(v) { return v.candId === c.id; }).length; var solde = c.montantPrevu - (c.totalVerse || 0); w.document.write('<tr><td>' + echapper(c.nom) + '</td><td>' + echapper(c.motif) + '</td><td>' + (c.statut === 'termine' ? 'Terminé' : 'En cours') + '</td><td class="num">' + c.montantPrevu + '$</td><td class="num">' + (c.totalVerse || 0).toFixed(2) + '$</td><td class="num">' + solde.toFixed(2) + '$</td><td class="num">' + nb + '</td></tr>'); });
    w.document.write('</tbody><tfoot><tr><td colspan="3">TOTAL</td><td class="num">' + totalPrevu.toFixed(2) + '$</td><td class="num">' + totalVerse.toFixed(2) + '$</td><td class="num">' + (totalPrevu - totalVerse).toFixed(2) + '$</td><td></td></tr></tfoot></table>');
  });
  w.document.write('<p style="text-align:center;font-size:11px;color:#888;margin-top:30px">Généré le ' + new Date().toLocaleString('fr-FR') + '</p></body></html>'); w.document.close(); setTimeout(function() { w.print(); }, 600);
}
function rapportFinGlobal() {
  var cands = candidatsProvince().filter(function(c) { return !c.archived; }); var vers = versementsProvince().filter(function(v) { return !v.archived; }); var totalVerse = 0, totalPrevu = 0; cands.forEach(function(c) { totalVerse += (c.totalVerse || 0); totalPrevu += c.montantPrevu; });
  var provLabel = getProvinceActive() || 'Toutes'; var html = '<div class="rapport-header"><h3>📊 RAPPORT GLOBAL — FINANCE</h3><p>🌍 ' + echapper(provLabel === '__non_assignee' ? 'Non assignées' : provLabel) + '</p></div><div class="table-wrapper"><table class="data-table"><tbody>';
  html += '<tr><td>Candidats actifs</td><td class="num">' + cands.length + '</td></tr><tr><td>Terminés</td><td class="num">' + cands.filter(function(c) { return c.statut === 'termine'; }).length + '</td></tr><tr><td>Total prévu</td><td class="num">' + totalPrevu.toFixed(2) + '$</td></tr><tr><td>Total versé</td><td class="num">' + totalVerse.toFixed(2) + '$</td></tr><tr><td>Solde</td><td class="num">' + (totalPrevu - totalVerse).toFixed(2) + '$</td></tr><tr><td>Versements</td><td class="num">' + vers.length + '</td></tr></tbody></table></div>'; document.getElementById('rapportFinBox').innerHTML = html;
}
function rapportFinDetaille() {
  var cands = candidatsProvince().filter(function(c) { return !c.archived; }).slice().sort(function(a, b) { return a.nom.localeCompare(b.nom); });
  var provLabel = getProvinceActive() || 'Toutes';
  var html = '<div class="rapport-header"><h3>📋 RAPPORT DÉTAILLÉ — FINANCE</h3><p>🌍 ' + echapper(provLabel === '__non_assignee' ? 'Non assignées' : provLabel) + '</p></div>';
  if (!cands.length) html += '<p>Aucun candidat.</p>';
  else {
    cands.forEach(function(c) {
      html += '<div class="entity-block"><h4>';
      if (c.photo) html += '<img src="' + c.photo + '" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid #0a6e2c;cursor:pointer;vertical-align:middle;margin-right:8px" onclick="voirPhoto(\'' + c.id + '\')">';
      html += '👤 ' + echapper(c.nom) + (c.province ? ' <span style="display:inline-block;padding:2px 8px;background:#0d6efd;color:white;border-radius:10px;font-size:11px;font-weight:600;margin-left:6px">🌍 ' + echapper(c.province) + '</span>' : '') + '</h4>';
      html += '<div style="font-size:12px;color:#666;margin-bottom:6px">' + echapper(c.typeEntite) + ' - ' + echapper(c.nomEntite) + ' | Motif : ' + echapper(c.motif) + '</div><div class="table-wrapper"><table class="data-table"><tbody>';
      html += '<tr><td>Statut</td><td>' + (c.statut === 'termine' ? '✅ Terminé' : '⏳ En cours') + '</td></tr><tr><td>Montant prévu</td><td class="num">' + c.montantPrevu + ' $</td></tr>';
      html += '<tr><td>Total versé</td><td class="num">' + c.totalVerse.toFixed(2) + ' $</td></tr>';
      html += '<tr><td>Solde restant</td><td class="num" style="color:#c62828">' + (c.montantPrevu - c.totalVerse).toFixed(2) + ' $</td></tr>';
      html += '</tbody></table></div></div>';
    });
  }
  document.getElementById('rapportFinBox').innerHTML = html;
}
function demarrerSeance() {
  var prov = exigerProvince(); if (!prov) return;
  var annee = document.getElementById('dAnnee').value; var mois = document.getElementById('dMois').value;
  var phase = document.getElementById('dPhase').value; var date = document.getElementById('dDate').value;
  if (!annee || !mois || !date) return alert('⚠️ Remplissez tous les champs');
  seanceActive = { id: uid(), annee: annee, mois: mois, phase: phase, date: date, province: prov, entites: [], depensesGenerales: [], archived: false, dateCreation: new Date().toISOString() };
  document.getElementById('seanceStatus').innerHTML = '<p style="color:#0a6e2c;font-weight:600">✅ Séance ' + mois + ' ' + annee + ' — Phase ' + phase + ' — 🌍 ' + prov + '</p>';
  document.getElementById('cardEntiteActive').style.display = 'block';
  document.getElementById('cardEntitesSeance').style.display = 'block';
  document.getElementById('cardDepensesSeance').style.display = 'none';
  afficherEntitesSeance(); alert('✅ Séance démarrée (' + prov + ')');
}

function reinitialiserSeance() {
  if (seanceActive) { if (!confirm('⚠️ Réinitialiser la séance ?')) return; }
  seanceActive = null; document.getElementById('seanceStatus').innerHTML = '';
  document.getElementById('cardEntiteActive').style.display = 'none'; document.getElementById('cardEntitesSeance').style.display = 'none';
  document.getElementById('cardDepensesSeance').style.display = 'none'; reinitialiserFormEntiteSeance(); reinitialiserFormDepenseSeance();
  tempOffrandes = { init: [], sorei: [], kannon: [], photo: [], shinrei: [], gosh: [], mita: [] };
  afficherOffrandes(); document.getElementById('depResultatSeance').innerHTML = ''; alert('✅ Séance réinitialisée');
}

function ajouterOffrandeUnifiee() {
  var cat = document.getElementById('dOffrandeCategorie').value; var nom = document.getElementById('dOffrandeNom').value.trim();
  var fc = parseFloat(document.getElementById('dOffrandeFC').value) || 0; var usd = parseFloat(document.getElementById('dOffrandeUSD').value) || 0;
  if (!nom) return alert('Entrez le nom'); if (fc === 0 && usd === 0) return alert('Entrez un montant');
  tempOffrandes[cat].push({ nom: nom, fc: fc, usd: usd });
  document.getElementById('dOffrandeNom').value = ''; document.getElementById('dOffrandeFC').value = 0; document.getElementById('dOffrandeUSD').value = 0;
  afficherOffrandes();
}

function afficherOffrandes() {
  var box = document.getElementById('affichageOffrandes'); if (!box) return;
  var html = ''; var totalGeneralFC = 0, totalGeneralUSD = 0;
  Object.keys(CATEGORIES_OFFRANDES).forEach(function(cat) {
    var arr = tempOffrandes[cat] || []; if (!arr.length) return;
    var totFC = arr.reduce(function(a, o) { return a + o.fc; }, 0); var totUSD = arr.reduce(function(a, o) { return a + o.usd; }, 0);
    totalGeneralFC += totFC; totalGeneralUSD += totUSD;
    html += '<div style="background:#f9f9f9;border-radius:8px;padding:8px;margin-bottom:8px;border-left:3px solid #0a6e2c">';
    html += '<div style="font-weight:600;color:#0a6e2c;font-size:13px;margin-bottom:4px">' + CATEGORIES_OFFRANDES[cat] + '</div>';
    html += '<div class="table-wrapper"><table class="data-table" style="font-size:12px"><tbody>';
    arr.forEach(function(o, i) {
      html += '<tr><td>' + echapper(o.nom) + '</td><td class="num">' + o.fc.toLocaleString() + ' FC</td><td class="num">' + o.usd.toLocaleString() + ' $</td>';
      html += '<td><button class="btn-mini danger" onclick="retirerOffrande(\'' + cat + '\',' + i + ')">✖</button></td></tr>';
    });
    html += '</tbody><tfoot><tr><td>TOTAL</td><td class="num">' + totFC.toLocaleString() + ' FC</td><td class="num">' + totUSD.toLocaleString() + ' $</td><td></td></tr></tfoot></table></div></div>';
  });
  if (totalGeneralFC > 0 || totalGeneralUSD > 0) {
    html += '<div style="background:#e8f5e9;padding:10px;border-radius:8px;border:2px solid #0a6e2c">';
    html += '<div style="font-weight:700;color:#0a6e2c;font-size:13px">TOTAL GÉNÉRAL</div>';
    html += '<div style="font-size:14px;color:#0a6e2c;font-weight:700;margin-top:4px">' + totalGeneralFC.toLocaleString() + ' FC / ' + totalGeneralUSD.toLocaleString() + ' $</div></div>';
  }
  box.innerHTML = html;
}
function retirerOffrande(cat, idx) { tempOffrandes[cat].splice(idx, 1); afficherOffrandes(); }

function enregistrerEntiteSeance() {
  if (!seanceActive) return alert('⚠️ Démarrez d\'abord une séance');
  var nom = document.getElementById('dNomEntite').value.trim().toUpperCase(); if (!nom) return alert('Entrez le nom');
  seanceActive.entites.push({
    typeEntite: document.getElementById('dTypeEntite').value, nomEntite: nom, responsable: document.getElementById('dResponsable').value.trim(),
    enveloppes: parseInt(document.getElementById('dEnveloppes').value) || 0, constrFC: parseFloat(document.getElementById('dConstrFC').value) || 0, constrUSD: parseFloat(document.getElementById('dConstrUSD').value) || 0,
    normFC: parseFloat(document.getElementById('dNormFC').value) || 0, normUSD: parseFloat(document.getElementById('dNormUSD').value) || 0,
    init: JSON.parse(JSON.stringify(tempOffrandes.init)), sorei: JSON.parse(JSON.stringify(tempOffrandes.sorei)), kannon: JSON.parse(JSON.stringify(tempOffrandes.kannon)),
    photo: JSON.parse(JSON.stringify(tempOffrandes.photo)), shinrei: JSON.parse(JSON.stringify(tempOffrandes.shinrei)), gosh: JSON.parse(JSON.stringify(tempOffrandes.gosh)), mita: JSON.parse(JSON.stringify(tempOffrandes.mita)),
    transFC: parseFloat(document.getElementById('dTransFC').value) || 0, transUSD: parseFloat(document.getElementById('dTransUSD').value) || 0
  });
  tempOffrandes = { init: [], sorei: [], kannon: [], photo: [], shinrei: [], gosh: [], mita: [] };
  afficherOffrandes(); reinitialiserFormEntiteSeance(); afficherEntitesSeance(); alert('✅ Entité enregistrée : ' + nom);
}
function reinitialiserFormEntiteSeance() {
  ['dNomEntite','dResponsable','dOffrandeNom'].forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; });
  ['dEnveloppes','dConstrFC','dConstrUSD','dNormFC','dNormUSD','dTransFC','dTransUSD','dOffrandeFC','dOffrandeUSD'].forEach(function(id) { var el = document.getElementById(id); if (el) el.value = 0; });
  var sel = document.getElementById('dOffrandeCategorie'); if (sel) sel.selectedIndex = 0; afficherOffrandes();
}
function afficherEntitesSeance() {
  var box = document.getElementById('listeEntitesSeance'); if (!box || !seanceActive) return;
  if (!seanceActive.entites.length) { box.innerHTML = '<p style="color:#888">Aucune entité.</p>'; return; }
  var html = '<div class="table-wrapper"><table class="data-table"><thead><tr><th>#</th><th>Entité</th><th>Responsable</th><th>Enveloppes</th><th>Actions</th></tr></thead><tbody>';
  seanceActive.entites.forEach(function(e, i) {
    html += '<tr><td>' + (i + 1) + '</td><td>' + echapper(e.typeEntite) + ' - ' + echapper(e.nomEntite) + '</td><td>' + echapper(e.responsable) + '</td><td class="num">' + (e.enveloppes || 0) + '</td>';
    html += '<td><button class="btn-mini danger" onclick="retirerEntiteSeance(' + i + ')">🗑️</button></td></tr>';
  });
  html += '</tbody></table></div>'; box.innerHTML = html;
}
function retirerEntiteSeance(i) { if (!confirm('⚠️ Retirer ?')) return; seanceActive.entites.splice(i, 1); afficherEntitesSeance(); }
function passerAuxDepenses() { if (!seanceActive || !seanceActive.entites.length) return alert('⚠️ Enregistrez une entité'); document.getElementById('cardDepensesSeance').style.display = 'block'; document.getElementById('cardDepensesSeance').scrollIntoView({ behavior: 'smooth' }); }

function ajouterDepenseSeance() {
  if (!seanceActive) return alert('⚠️ Démarrez une séance');
  var fc = parseFloat(document.getElementById('dgFC').value) || 0; var usd = parseFloat(document.getElementById('dgUSD').value) || 0; var motif = document.getElementById('dgMotif').value.trim();
  if (!motif) return alert('Motif obligatoire'); if (fc === 0 && usd === 0) return alert('Entrez un montant');
  seanceActive.depensesGenerales.push({ fc: fc, usd: usd, motif: motif });
  reinitialiserFormDepenseSeance(); afficherDepensesSeance(); alert('✅ Dépense ajoutée');
}
function reinitialiserFormDepenseSeance() { var a = document.getElementById('dgFC'); if (a) a.value = 0; var b = document.getElementById('dgUSD'); if (b) b.value = 0; var c = document.getElementById('dgMotif'); if (c) c.value = ''; }
function afficherDepensesSeance() {
  var box = document.getElementById('listeDepensesSeance'); if (!box || !seanceActive) return;
  if (!seanceActive.depensesGenerales.length) { box.innerHTML = ''; return; }
  var html = '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Motif</th><th>FC</th><th>USD</th><th></th></tr></thead><tbody>';
  seanceActive.depensesGenerales.forEach(function(d, i) {
    html += '<tr><td>' + echapper(d.motif) + '</td><td class="num">' + d.fc.toLocaleString() + '</td><td class="num">' + d.usd.toLocaleString() + '</td>';
    html += '<td><button class="btn-mini danger" onclick="retirerDepenseSeance(' + i + ')">🗑️</button></td></tr>';
  });
  html += '</tbody></table></div>'; box.innerHTML = html;
}
function retirerDepenseSeance(i) { if (!confirm('⚠️ Retirer ?')) return; seanceActive.depensesGenerales.splice(i, 1); afficherDepensesSeance(); }

function calculerTotauxSeance() {
  if (!seanceActive) return alert('⚠️ Séance non démarrée');
  var totalFC = 0, totalUSD = 0, soldeFC = 0, soldeUSD = 0, totEnv = 0;
  var html = '<h4>📊 Totaux par entité</h4><div class="table-wrapper"><table class="data-table"><thead><tr><th>Entité</th><th>Enveloppes</th><th>Total FC</th><th>Total USD</th><th>Solde FC</th><th>Solde USD</th></tr></thead><tbody>';
  seanceActive.entites.forEach(function(e) {
    var s = sumEntiteDep(e);
    totalFC += s.totFC; totalUSD += s.totUSD; soldeFC += s.soldeFC; soldeUSD += s.soldeUSD; totEnv += (e.enveloppes || 0);
    html += '<tr><td>' + echapper(e.typeEntite) + ' - ' + echapper(e.nomEntite) + '</td><td class="num">' + (e.enveloppes || 0) + '</td><td class="num">' + s.totFC.toLocaleString() + '</td><td class="num">' + s.totUSD.toLocaleString() + '</td><td class="num">' + s.soldeFC.toLocaleString() + '</td><td class="num">' + s.soldeUSD.toLocaleString() + '</td></tr>';
  });
  html += '</tbody><tfoot><tr><td>TOTAL</td><td class="num">' + totEnv + '</td><td class="num">' + totalFC.toLocaleString() + '</td><td class="num">' + totalUSD.toLocaleString() + '</td><td class="num">' + soldeFC.toLocaleString() + '</td><td class="num">' + soldeUSD.toLocaleString() + '</td></tr></tfoot></table></div>';
  var genFC = seanceActive.depensesGenerales.reduce(function(a, x) { return a + x.fc; }, 0);
  var genUSD = seanceActive.depensesGenerales.reduce(function(a, x) { return a + x.usd; }, 0);
  html += '<h4>💸 Dépenses générales</h4><div class="table-wrapper"><table class="data-table"><thead><tr><th>Motif</th><th>FC</th><th>USD</th></tr></thead><tbody>';
  seanceActive.depensesGenerales.forEach(function(x) { html += '<tr><td>' + echapper(x.motif) + '</td><td class="num">' + x.fc.toLocaleString() + '</td><td class="num">' + x.usd.toLocaleString() + '</td></tr>'; });
  html += '</tbody><tfoot><tr><td>TOTAL DÉPENSES</td><td class="num">- ' + genFC.toLocaleString() + ' FC</td><td class="num">- ' + genUSD.toLocaleString() + ' $</td></tr>';
  html += '<tr style="background:#fff3e0"><td>À TRANSFÉRER</td><td class="num">' + (soldeFC - genFC).toLocaleString() + ' FC</td><td class="num">' + (soldeUSD - genUSD).toLocaleString() + ' $</td></tr></tfoot></table></div>';
  document.getElementById('depResultatSeance').innerHTML = html;
}
function sumEntiteDep(e) {
  var sum = function(arr) { return (arr || []).reduce(function(a, o) { return { fc: a.fc + o.fc, usd: a.usd + o.usd }; }, { fc: 0, usd: 0 }); };
  var i = sum(e.init), s = sum(e.sorei), k = sum(e.kannon), p = sum(e.photo), sr = sum(e.shinrei), g = sum(e.gosh), m = sum(e.mita);
  var totFC = (e.constrFC || 0) + (e.normFC || 0) + i.fc + s.fc + k.fc + p.fc + sr.fc + g.fc + m.fc;
  var totUSD = (e.constrUSD || 0) + (e.normUSD || 0) + i.usd + s.usd + k.usd + p.usd + sr.usd + g.usd + m.usd;
  return { totFC: totFC, totUSD: totUSD, soldeFC: totFC - (e.transFC || 0), soldeUSD: totUSD - (e.transUSD || 0), i: i, s: s, k: k, p: p, sr: sr, g: g, m: m };
}
function enregistrerDepouillementSeance() {
  if (!seanceActive) return alert('⚠️ Séance non démarrée'); if (!seanceActive.entites.length) return alert('⚠️ Enregistrez une entité');
  var prov = seanceActive.province || exigerProvince(); if (!prov) return;
  seanceActive.province = prov; seanceActive.entites.forEach(function(e) { if (!e.province) e.province = prov; });
  var deps = DB.get('depouillements', []); deps.push(JSON.parse(JSON.stringify(seanceActive))); DB.set('depouillements', deps);
  seanceActive = null; document.getElementById('seanceStatus').innerHTML = '';
  document.getElementById('cardEntiteActive').style.display = 'none'; document.getElementById('cardEntitesSeance').style.display = 'none';
  document.getElementById('cardDepensesSeance').style.display = 'none'; document.getElementById('depResultatSeance').innerHTML = '';
  tempOffrandes = { init: [], sorei: [], kannon: [], photo: [], shinrei: [], gosh: [], mita: [] };
  afficherOffrandes(); reinitialiserFormEntiteSeance(); reinitialiserFormDepenseSeance(); refreshAll(); alert('✅ Dépouillement enregistré (' + prov + ')\n\nVous pouvez le retrouver dans la recherche.');
}

// ========== RECHERCHE DÉPOUILLEMENT ==========
function rechercherDepouillement() {
  var annee = (document.getElementById('searchDepAnnee').value || '').trim(); var mois = document.getElementById('searchDepMois').value;
  var phase = document.getElementById('searchDepPhase').value; var statut = document.getElementById('searchDepStatut').value;
  var entite = (document.getElementById('searchDepEntite').value || '').trim().toUpperCase();
  var deps = filtrerListe(depouillementsProvince(), statut).filter(function(d) {
    return (!annee || String(d.annee) === annee) && (!mois || d.mois === mois) && (!phase || String(d.phase) === phase) && (!entite || d.entites.some(function(e) { return e.nomEntite.indexOf(entite) !== -1; }));
  });
  var box = document.getElementById('resultatRechercheDep'); var provLabel = getProvinceActive() || 'Toutes';
  if (!deps.length) { box.innerHTML = '<p style="color:#888">Aucun résultat — 🌍 ' + echapper(provLabel === '__non_assignee' ? 'Non assignées' : provLabel) + '</p>'; return; }
  var html = '<h4>Résultats (' + deps.length + ') — 🌍 ' + echapper(provLabel === '__non_assignee' ? 'Non assignées' : provLabel) + '</h4>';
  deps.forEach(function(d) {
    html += '<div class="entity-block"' + (d.archived ? ' style="opacity:0.75;background:#f0f0f0"' : '') + '>';
    html += '<h4>📅 ' + d.mois + ' ' + d.annee + ' — Phase ' + d.phase + ' (' + fmtDate(d.date) + ')';
    if (d.province) html += ' <span style="display:inline-block;padding:2px 8px;background:#0d6efd;color:white;border-radius:10px;font-size:11px;font-weight:600;margin-left:6px">🌍 ' + echapper(d.province) + '</span>';
    if (d.archived) html += ' <span class="badge badge-archive">📦</span>'; html += '</h4>';
    html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0;padding:10px;background:#fff;border-radius:8px;border:1px dashed #0a6e2c">';
    html += '<button class="btn-mini orange" onclick="modifierDepouillement(\'' + d.id + '\')" style="padding:8px 12px;font-size:12px">✏️</button>';
    html += '<button class="btn-mini ' + (d.archived ? 'blue' : 'gray') + '" onclick="archiverDepouillement(\'' + d.id + '\')" style="padding:8px 12px;font-size:12px">' + (d.archived ? '↩️' : '📦') + '</button>';
    html += '<button class="btn-mini danger" onclick="supprimerDepouillement(\'' + d.id + '\')" style="padding:8px 12px;font-size:12px">🗑️</button></div>';
    html += '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Entité</th><th>Enveloppes</th><th>Total FC</th><th>Total USD</th><th>Solde FC</th><th>Solde USD</th><th>Relevé</th></tr></thead><tbody>';
    d.entites.forEach(function(e) {
      var s = sumEntiteDep(e);
      html += '<tr><td>' + echapper(e.typeEntite) + ' - ' + echapper(e.nomEntite) + '</td><td class="num">' + (e.enveloppes || 0) + '</td><td class="num">' + s.totFC.toLocaleString() + '</td><td class="num">' + s.totUSD.toLocaleString() + '</td><td class="num">' + s.soldeFC.toLocaleString() + '</td><td class="num">' + s.soldeUSD.toLocaleString() + '</td>';
      html += '<td><button class="btn-mini blue" onclick="releveEntiteIndividuelle(\'' + e.nomEntite + '\',\'' + d.mois + '\',\'' + d.annee + '\',\'' + d.phase + '\')" style="padding:6px 10px">📄 Envoyer</button></td></tr>';
    });
    html += '</tbody></table></div></div>';
  });
  box.innerHTML = html;
}
function reinitialiserRechercheDep() {
  ['searchDepAnnee','searchDepEntite'].forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; });
  ['searchDepMois','searchDepPhase','searchDepStatut'].forEach(function(id) { var el = document.getElementById(id); if (el) el.selectedIndex = 0; });
  document.getElementById('resultatRechercheDep').innerHTML = ''; var rb = document.getElementById('releveFicheBox'); if (rb) rb.innerHTML = '';
  _releveFicheHTML = ''; _releveGlobalHTML = ''; _releveIndividuelHTML = '';
}
function rechercherDepGeneral() {
  var annee = (document.getElementById('gSearchAnnee').value || '').trim(); var mois = document.getElementById('gSearchMois').value;
  var deps = depouillementsProvince().filter(function(d) { return !d.archived; }).filter(function(d) { return (!annee || String(d.annee) === annee) && (!mois || d.mois === mois); });
  var box = document.getElementById('resultatRechercheGeneral'); var provLabel = getProvinceActive() || 'Toutes';
  if (!deps.length) { box.innerHTML = '<p style="color:#888">Aucun résultat — 🌍 ' + echapper(provLabel === '__non_assignee' ? 'Non assignées' : provLabel) + '</p>'; return; }
  var html = '<h4>Résultats (' + deps.length + ') — 🌍 ' + echapper(provLabel === '__non_assignee' ? 'Non assignées' : provLabel) + '</h4>';
  deps.forEach(function(d) {
    var totalFC = 0, totalUSD = 0; d.entites.forEach(function(e) { var s = sumEntiteDep(e); totalFC += s.totFC; totalUSD += s.totUSD; });
    html += '<div class="entity-block"><h4>📅 ' + d.mois + ' ' + d.annee + ' — Phase ' + d.phase;
    if (d.province) html += ' <span style="display:inline-block;padding:2px 8px;background:#0d6efd;color:white;border-radius:10px;font-size:11px;font-weight:600;margin-left:6px">🌍 ' + echapper(d.province) + '</span>';
    html += '</h4><div style="font-size:12px;color:#666">Date : ' + fmtDate(d.date) + ' | Entités : ' + d.entites.length + '</div>';
    html += '<div style="font-size:13px;margin-top:6px">Total : <strong>' + totalFC.toLocaleString() + ' FC</strong> / <strong>' + totalUSD.toLocaleString() + ' $</strong></div>';
    html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0;padding:10px;background:#fff;border-radius:8px;border:1px dashed #0a6e2c">';
    html += '<button class="btn-mini orange" onclick="modifierDepouillement(\'' + d.id + '\')">✏️</button>';
    html += '<button class="btn-mini gray" onclick="archiverDepouillement(\'' + d.id + '\')">📦</button>';
    html += '<button class="btn-mini danger" onclick="supprimerDepouillement(\'' + d.id + '\')">🗑️</button></div></div>';
  });
  box.innerHTML = html;
}
function reinitialiserRechercheGeneral() { var a = document.getElementById('gSearchAnnee'); if (a) a.value = ''; var b = document.getElementById('gSearchMois'); if (b) b.selectedIndex = 0; document.getElementById('resultatRechercheGeneral').innerHTML = ''; }
function modifierDepouillement(id) {
  var list = DB.get('depouillements', []); var d = list.find(function(x) { return x.id === id; }); if (!d) return;
  var mois = prompt('Mois :', d.mois); if (mois === null) return; var annee = prompt('Année :', d.annee); if (annee === null) return;
  var phase = prompt('Phase (1-4) :', d.phase); if (phase === null) return; var date = prompt('Date (AAAA-MM-JJ) :', d.date); if (date === null) return;
  d.mois = mois.trim(); d.annee = annee.trim(); d.phase = phase.trim(); d.date = date.trim();
  DB.set('depouillements', list); rechercherDepouillement(); alert('✅ Modifié');
}
function archiverDepouillement(id) { var list = DB.get('depouillements', []); var d = list.find(function(x) { return x.id === id; }); if (!d) return; d.archived = !d.archived; DB.set('depouillements', list); rechercherDepouillement(); alert(d.archived ? '📦 Archivé' : '↩️ Restauré'); }
function supprimerDepouillement(id) { if (!confirm('⚠️ Supprimer ce dépouillement ?')) return; DB.set('depouillements', DB.get('depouillements', []).filter(function(d) { return d.id !== id; })); rechercherDepouillement(); alert('✅ Supprimé'); }

// ========== RELEVÉS DÉPOUILLEMENT ==========
function construireReleveIndividuel(entiteNom, mois, annee, phase) {
  var deps = DB.get('depouillements', []); var e = null, d = null;
  deps.forEach(function(dep) { if (dep.mois === mois && String(dep.annee) === String(annee) && String(dep.phase) === String(phase)) { dep.entites.forEach(function(ent) { if (ent.nomEntite === entiteNom) { e = ent; d = dep; } }); } });
  if (!e || !d) return null; var s = sumEntiteDep(e);
  var h = '<div class="rapport-header"><h3>📄 RELEVÉ INDIVIDUEL D\'ENTITÉ</h3>';
  h += '<p style="font-size:16pt;color:#666">' + echapper(e.typeEntite) + ' - ' + echapper(e.nomEntite) + ' — ' + d.mois + ' ' + d.annee + ' — Phase ' + d.phase + (d.province ? ' — 🌍 ' + echapper(d.province) : '') + '</p></div>';
  h += '<div class="entity-block"><h4>🏛️ ' + echapper(e.typeEntite) + ' - ' + echapper(e.nomEntite) + '</h4>';
  h += '<div style="background:#fff3e0;padding:8px 10px;border-radius:6px;margin-bottom:8px;border-left:4px solid #e65100;font-size:16pt"><strong>📩 Enveloppes :</strong> ' + (e.enveloppes || 0) + '</div>';
  h += '<div class="table-wrapper"><table class="data-table"><tbody>';
  h += '<tr><td>Construction</td><td class="num">' + (e.constrFC || 0).toLocaleString() + ' FC</td><td class="num">' + (e.constrUSD || 0).toLocaleString() + ' $</td></tr>';
  h += '<tr><td>Normales</td><td class="num">' + (e.normFC || 0).toLocaleString() + ' FC</td><td class="num">' + (e.normUSD || 0).toLocaleString() + ' $</td></tr>';
  Object.keys(CATEGORIES_OFFRANDES).forEach(function(cat) {
    var arr = e[cat] || []; if (!arr.length) return;
    var totFC = arr.reduce(function(a, o) { return a + o.fc; }, 0); var totUSD = arr.reduce(function(a, o) { return a + o.usd; }, 0);
    h += '<tr><td>' + CATEGORIES_OFFRANDES[cat] + '</td><td class="num">' + totFC.toLocaleString() + ' FC</td><td class="num">' + totUSD.toLocaleString() + ' $</td></tr>';
  });
  h += '</tbody><tfoot>';
  h += '<tr><td>TOTAL</td><td class="num">' + s.totFC.toLocaleString() + ' FC</td><td class="num">' + s.totUSD.toLocaleString() + ' $</td></tr>';
  h += '<tr><td>Transport</td><td class="num">- ' + (e.transFC || 0).toLocaleString() + ' FC</td><td class="num">- ' + (e.transUSD || 0).toLocaleString() + ' $</td></tr>';
  h += '<tr style="background:#e8f5e9"><td>SOLDE</td><td class="num">' + s.soldeFC.toLocaleString() + ' FC</td><td class="num">' + s.soldeUSD.toLocaleString() + ' $</td></tr>';
  h += '</tfoot></table></div></div>'; h += signatureBlockHTML(); return h;
}
function releveEntiteIndividuelle(entiteNom, mois, annee, phase) {
  var html = construireReleveIndividuel(entiteNom, mois, annee, phase); if (!html) return alert('Entité non trouvée');
  _releveIndividuelHTML = html; var box = document.getElementById('releveFicheBox');
  if (!box) { box = document.createElement('div'); box.id = 'releveFicheBox'; document.getElementById('tab-depouillement').appendChild(box); }
  box.innerHTML = '<div class="card">' + html + '<button class="btn-primary" style="margin-top:12px;background:linear-gradient(135deg,#1976d2,#1565c0)" onclick="imprimerReleveIndividuelCourant()">🖨️ Imprimer / PDF</button></div>';
  setTimeout(function() { initSignatureBlockCanvases(); syncSignatureEncrePickers(); }, 50); setTimeout(function() { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
}
function imprimerReleveIndividuelCourant() { if (!_releveIndividuelHTML) return alert('Aucun relevé à imprimer'); var html = captureSignaturesFromDOM() || _releveIndividuelHTML; ouvrirModalPdf({ type: 'html', html: html, titre: 'Relevé Individuel d\'Entité' }); }

function construireReleveFicheEntite(entiteNom, mois, annee) {
  var deps = depouillementsProvince().filter(function(d) { return !d.archived; }); var resultats = [];
  deps.forEach(function(d) { d.entites.forEach(function(e) { var ok = (!entiteNom || e.nomEntite.toUpperCase().indexOf(entiteNom.toUpperCase()) !== -1) && (!mois || d.mois === mois) && (!annee || String(d.annee) === annee); if (ok) resultats.push({ entite: e, seance: d }); }); });
  if (!resultats.length) return null;
  var filtres = []; if (entiteNom) filtres.push('Entité : ' + entiteNom); if (mois) filtres.push('Mois : ' + mois); if (annee) filtres.push('Année : ' + annee);
  var provLabel = getProvinceActive() || 'Toutes'; filtres.unshift('🌍 ' + (provLabel === '__non_assignee' ? 'Non assignées' : provLabel));
  var h = '<div class="rapport-header"><h3>📋 RELEVÉ FICHE PAR ENTITÉ</h3>'; if (filtres.length) h += '<p style="font-size:16pt;color:#666">' + filtres.join(' — ') + '</p>'; h += '</div>';
  var parEntite = {}; resultats.forEach(function(r) { var k = r.entite.typeEntite + ' - ' + r.entite.nomEntite; if (!parEntite[k]) parEntite[k] = []; parEntite[k].push(r); }); var totFC = 0, totUSD = 0;
  Object.keys(parEntite).forEach(function(key) {
    h += '<div class="entity-block"><h4>🏛️ ' + echapper(key) + '</h4>';
    parEntite[key].forEach(function(r) {
      var s = sumEntiteDep(r.entite); totFC += s.soldeFC; totUSD += s.soldeUSD;
      h += '<h5 style="color:#0a6e2c;font-size:16pt;margin:10px 0 4px">📅 ' + r.seance.mois + ' ' + r.seance.annee + ' — Phase ' + r.seance.phase + '</h5>';
      h += '<div style="background:#fff3e0;padding:6px 10px;border-radius:6px;margin-bottom:8px;border-left:4px solid #e65100;font-size:16pt"><strong>📩 Enveloppes :</strong> ' + (r.entite.enveloppes || 0) + '</div>';
      h += '<div class="table-wrapper"><table class="data-table"><tbody>';
      h += '<tr><td>Construction</td><td class="num">' + (r.entite.constrFC || 0).toLocaleString() + ' FC</td><td class="num">' + (r.entite.constrUSD || 0).toLocaleString() + ' $</td></tr>';
      h += '<tr><td>Normales</td><td class="num">' + (r.entite.normFC || 0).toLocaleString() + ' FC</td><td class="num">' + (r.entite.normUSD || 0).toLocaleString() + ' $</td></tr>';
      Object.keys(CATEGORIES_OFFRANDES).forEach(function(cat) {
        var arr = r.entite[cat] || []; if (!arr.length) return;
        var cfFC = arr.reduce(function(a,o){return a+o.fc;},0); var cfUSD = arr.reduce(function(a,o){return a+o.usd;},0);
        h += '<tr><td>' + CATEGORIES_OFFRANDES[cat] + '</td><td class="num">' + cfFC.toLocaleString() + ' FC</td><td class="num">' + cfUSD.toLocaleString() + ' $</td></tr>';
      });
      h += '</tbody><tfoot><tr><td>TOTAL</td><td class="num">' + s.totFC.toLocaleString() + ' FC</td><td class="num">' + s.totUSD.toLocaleString() + ' $</td></tr>';
      h += '<tr><td>Transport</td><td class="num">- ' + (r.entite.transFC || 0).toLocaleString() + ' FC</td><td class="num">- ' + (r.entite.transUSD || 0).toLocaleString() + ' $</td></tr>';
      h += '<tr style="background:#e8f5e9"><td>SOLDE</td><td class="num">' + s.soldeFC.toLocaleString() + ' FC</td><td class="num">' + s.soldeUSD.toLocaleString() + ' $</td></tr></tfoot></table></div>';
    });
    h += '</div>';
  });
  h += '<div class="total-banque-final" style="background:#0a6e2c;color:white;padding:16px;border-radius:10px;margin-top:16px"><div class="banque-title" style="font-weight:700">🌍 TOTAL GÉNÉRAL (toutes entités)</div>';
  h += '<div class="banque-montant" style="font-weight:700;margin-top:8px">' + totFC.toLocaleString() + ' FC / ' + totUSD.toLocaleString() + ' $</div></div>'; h += signatureBlockHTML(); return h;
}
function genererReleveEntiteFiltre() {
  var entite = (document.getElementById('searchDepEntite').value || '').trim(); var annee = (document.getElementById('searchDepAnnee').value || '').trim(); var mois = document.getElementById('searchDepMois').value;
  if (!entite && !annee && !mois) return alert('Entrez au moins un critère');
  var html = construireReleveFicheEntite(entite, mois, annee);
  if (!html) { document.getElementById('releveFicheBox').innerHTML = '<div class="card"><p style="color:#888;text-align:center;padding:20px">Aucune fiche trouvée pour ces critères.</p></div>'; return; }
  _releveFicheHTML = html; var box = document.getElementById('releveFicheBox');
  box.innerHTML = '<div class="card">' + html + '<button class="btn-primary" style="margin-top:12px;background:linear-gradient(135deg,#1976d2,#1565c0)" onclick="imprimerReleveFicheCourant()">🖨️ Imprimer / PDF</button></div>';
  setTimeout(function() { initSignatureBlockCanvases(); syncSignatureEncrePickers(); }, 50); setTimeout(function() { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
}
function imprimerReleveFicheCourant() { if (!_releveFicheHTML) return alert('Aucun relevé à imprimer'); var html = captureSignaturesFromDOM() || _releveFicheHTML; ouvrirModalPdf({ type: 'html', html: html, titre: 'Relevé Fiche par Entité' }); }

function construireReleveGlobalEntites(mois, annee) {
  var deps = depouillementsProvince().filter(function(d) { return !d.archived; });
  if (mois || annee) deps = deps.filter(function(d) { return (!mois || d.mois === mois) && (!annee || String(d.annee) === annee); });
  if (!deps.length) return null;
  var provLabel = getProvinceActive() || 'Toutes'; var filtres = []; filtres.push('🌍 ' + (provLabel === '__non_assignee' ? 'Non assignées' : provLabel));
  if (mois) filtres.push('Mois : ' + mois); if (annee) filtres.push('Année : ' + annee);
  var h = '<div class="rapport-header"><h3>📊 RELEVÉ FICHE GLOBALE DES ENTITÉS</h3>';
  h += '<p style="font-size:16pt;color:#666">' + deps.length + ' séance(s) — ' + filtres.join(' — ') + '</p></div>';
  var totalSoldeFC = 0, totalSoldeUSD = 0; var totalGenFC = 0, totalGenUSD = 0;
  deps.forEach(function(d) {
    h += '<div style="background:#e8f5e9;padding:10px;border-radius:8px;margin:16px 0 8px;border-left:5px solid #0a6e2c">';
    h += '<div style="font-size:16pt;font-weight:700;color:#0a6e2c">📅 ' + d.mois + ' ' + d.annee + ' — Phase ' + d.phase + (d.province ? ' — 🌍 ' + echapper(d.province) : '') + '</div>';
    h += '<div style="font-size:14pt;color:#666">Date : ' + fmtDate(d.date) + '</div></div>';
    var soldeFC = 0, soldeUSD = 0; d.entites.forEach(function(e) { var s = sumEntiteDep(e); soldeFC += s.soldeFC; soldeUSD += s.soldeUSD; });
    totalSoldeFC += soldeFC; totalSoldeUSD += soldeUSD;
    h += '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Entité</th><th>Responsable</th><th>Enveloppes</th><th>Solde FC</th><th>Solde USD</th></tr></thead><tbody>';
    d.entites.forEach(function(e) { var s = sumEntiteDep(e); h += '<tr><td>' + echapper(e.typeEntite) + ' - ' + echapper(e.nomEntite) + '</td><td>' + echapper(e.responsable || '-') + '</td><td class="num">' + (e.enveloppes || 0) + '</td><td class="num">' + s.soldeFC.toLocaleString() + '</td><td class="num">' + s.soldeUSD.toLocaleString() + '</td></tr>'; });
    h += '</tbody><tfoot><tr><td colspan="2">TOTAL SOLDES ENTITÉS</td><td class="num"></td><td class="num">' + soldeFC.toLocaleString() + ' FC</td><td class="num">' + soldeUSD.toLocaleString() + ' $</td></tr></tfoot></table></div>';
    var genFC = 0, genUSD = 0;
    if (d.depensesGenerales && d.depensesGenerales.length) {
      h += '<h5 style="color:#c62828;font-size:16pt;margin:12px 0 6px">💸 Dépenses générales</h5>';
      h += '<div class="table-wrapper"><table class="data-table"><thead><tr><th>#</th><th>Motif</th><th>FC</th><th>USD</th></tr></thead><tbody>';
      d.depensesGenerales.forEach(function(x, i) { genFC += x.fc; genUSD += x.usd; h += '<tr><td>' + (i+1) + '</td><td>' + echapper(x.motif) + '</td><td class="num">' + x.fc.toLocaleString() + '</td><td class="num">' + x.usd.toLocaleString() + '</td></tr>'; });
      h += '</tbody><tfoot><tr><td colspan="2">TOTAL DÉPENSES</td><td class="num">- ' + genFC.toLocaleString() + ' FC</td><td class="num">- ' + genUSD.toLocaleString() + ' $</td></tr></tfoot></table></div>';
    } else { h += '<p style="font-size:14pt;color:#888;margin:8px 0">Aucune dépense générale pour cette séance.</p>'; }
    totalGenFC += genFC; totalGenUSD += genUSD;
    h += '<div style="background:#fff3e0;padding:12px;border-radius:8px;margin:10px 0;border:2px solid #e65100"><div style="font-size:16pt;color:#e65100;font-weight:700">💰 SOLDE À TRANSFÉRER (cette séance)</div>';
    h += '<div style="font-size:16pt;color:#0a6e2c;font-weight:700;margin-top:4px">' + (soldeFC - genFC).toLocaleString() + ' FC / ' + (soldeUSD - genUSD).toLocaleString() + ' $</div></div>';
  });
  h += '<div class="total-banque-final" style="background:#0a6e2c;color:white;padding:16px;border-radius:10px;margin-top:20px"><div class="banque-title" style="font-weight:700;margin-bottom:10px">🌍 TOTAL GÉNÉRAL À LA BANQUE</div>';
  h += '<table class="banque-table" style="width:100%;color:white;margin-bottom:8px"><tr><td style="padding:4px 0">Total soldes entités</td><td style="text-align:right;padding:4px 0"><strong>' + totalSoldeFC.toLocaleString() + ' FC / ' + totalSoldeUSD.toLocaleString() + ' $</strong></td></tr>';
  h += '<tr><td style="padding:4px 0">Total dépenses générales</td><td style="text-align:right;padding:4px 0"><strong>- ' + totalGenFC.toLocaleString() + ' FC / - ' + totalGenUSD.toLocaleString() + ' $</strong></td></tr></table>';
  h += '<div class="banque-montant" style="font-weight:700;border-top:2px solid rgba(255,255,255,0.4);padding-top:10px;margin-top:6px;text-align:center">💰 À LA BANQUE : ' + (totalSoldeFC - totalGenFC).toLocaleString() + ' FC / ' + (totalSoldeUSD - totalGenUSD).toLocaleString() + ' $</div></div>';
  h += signatureBlockHTML(); return h;
}
function genererReleveGlobalEntites() {
  var mois = document.getElementById('searchDepMois').value; var annee = (document.getElementById('searchDepAnnee').value || '').trim();
  var html = construireReleveGlobalEntites(mois, annee);
  if (!html) { document.getElementById('releveFicheBox').innerHTML = '<div class="card"><p style="color:#888;text-align:center;padding:20px">Aucune séance trouvée pour ces critères.</p></div>'; return; }
  _releveGlobalHTML = html; var box = document.getElementById('releveFicheBox');
  box.innerHTML = '<div class="card">' + html + '<button class="btn-primary" style="margin-top:12px;background:linear-gradient(135deg,#6a1b9a,#8e24aa)" onclick="imprimerReleveGlobalCourant()">🖨️ Imprimer / PDF</button></div>';
  setTimeout(function() { initSignatureBlockCanvases(); syncSignatureEncrePickers(); }, 50); setTimeout(function() { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
}
function imprimerReleveGlobalCourant() { if (!_releveGlobalHTML) return alert('Aucun relevé à imprimer'); var html = captureSignaturesFromDOM() || _releveGlobalHTML; ouvrirModalPdf({ type: 'html', html: html, titre: 'Relevé Fiche Globale des Entités' }); }

function rapportDepGlobal() {
  var deps = depouillementsProvince().filter(function(d) { return !d.archived; }); var totalFC = 0, totalUSD = 0, soldeFC = 0, soldeUSD = 0, genFC = 0, genUSD = 0, totEnv = 0;
  deps.forEach(function(d) { d.entites.forEach(function(e) { var s = sumEntiteDep(e); totalFC += s.totFC; totalUSD += s.totUSD; soldeFC += s.soldeFC; soldeUSD += s.soldeUSD; totEnv += (e.enveloppes || 0); }); d.depensesGenerales.forEach(function(x) { genFC += x.fc; genUSD += x.usd; }); });
  var provLabel = getProvinceActive() || 'Toutes'; var html = '<div class="rapport-header"><h3>📊 RAPPORT GLOBAL — DÉPOUILLEMENT</h3><p>🌍 ' + echapper(provLabel === '__non_assignee' ? 'Non assignées' : provLabel) + '</p></div>';
  html += '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Rubrique</th><th>FC</th><th>USD</th></tr></thead><tbody>';
  html += '<tr><td>Séances</td><td colspan="2" class="num">' + deps.length + '</td></tr>'; html += '<tr><td>Enveloppes totales</td><td colspan="2" class="num">' + totEnv + '</td></tr>';
  html += '<tr><td>Total offrandes</td><td class="num">' + totalFC.toLocaleString() + '</td><td class="num">' + totalUSD.toLocaleString() + '</td></tr>';
  html += '<tr><td>Solde entités</td><td class="num">' + soldeFC.toLocaleString() + '</td><td class="num">' + soldeUSD.toLocaleString() + '</td></tr>';
  html += '<tr><td>Dépenses générales</td><td class="num">- ' + genFC.toLocaleString() + '</td><td class="num">- ' + genUSD.toLocaleString() + '</td></tr>';
  html += '</tbody><tfoot><tr><td>À TRANSFÉRER</td><td class="num">' + (soldeFC - genFC).toLocaleString() + ' FC</td><td class="num">' + (soldeUSD - genUSD).toLocaleString() + ' $</td></tr></tfoot></table></div>';
  document.getElementById('rapportDepBox').innerHTML = html;
}
function rapportDepDetaille() {
  var deps = depouillementsProvince().filter(function(d) { return !d.archived; }); var provLabel = getProvinceActive() || 'Toutes';
  if (!deps.length) { document.getElementById('rapportDepBox').innerHTML = '<p>Aucun dépouillement actif — 🌍 ' + echapper(provLabel === '__non_assignee' ? 'Non assignées' : provLabel) + '</p>'; return; }
  var html = '<div class="rapport-header"><h3>📋 RAPPORT DÉTAILLÉ — DÉPOUILLEMENT</h3><p>🌍 ' + echapper(provLabel === '__non_assignee' ? 'Non assignées' : provLabel) + '</p></div>';
  deps.forEach(function(d) {
    html += '<div style="background:#e8f5e9;padding:10px;border-radius:8px;margin:16px 0 10px;border-left:5px solid #0a6e2c"><div style="font-size:16pt;font-weight:700;color:#0a6e2c">📅 ' + d.mois + ' ' + d.annee + ' — Phase ' + d.phase + (d.province ? ' — 🌍 ' + echapper(d.province) : '') + '</div>';
    html += '<div style="font-size:14pt;color:#666">Date : ' + fmtDate(d.date) + ' | Entités : ' + d.entites.length + '</div></div>';
    d.entites.forEach(function(e) {
      var s = sumEntiteDep(e); html += '<div class="entity-block"><h4>🏛️ ' + echapper(e.typeEntite) + ' - ' + echapper(e.nomEntite) + '</h4>';
      html += '<div style="font-size:12px;color:#666;margin-bottom:6px">👤 ' + echapper(e.responsable) + ' | 📅 ' + d.mois + ' ' + d.annee + '</div>';
      html += '<div style="background:#fff3e0;padding:8px 10px;border-radius:6px;margin-bottom:8px;border-left:4px solid #e65100;font-size:16pt"><strong>📩 Enveloppes :</strong> ' + (e.enveloppes || 0) + '</div>';
      html += '<div class="table-wrapper"><table class="data-table"><tfoot><tr><td>TOTAL</td><td class="num">' + s.totFC.toLocaleString() + ' FC</td><td class="num">' + s.totUSD.toLocaleString() + ' $</td></tr>';
      html += '<tr><td>Transport</td><td class="num">- ' + (e.transFC || 0).toLocaleString() + ' FC</td><td class="num">- ' + (e.transUSD || 0).toLocaleString() + ' $</td></tr>';
      html += '<tr style="background:#e8f5e9"><td>SOLDE</td><td class="num">' + s.soldeFC.toLocaleString() + ' FC</td><td class="num">' + s.soldeUSD.toLocaleString() + ' $</td></tr></tfoot></table></div></div>';
    });
  });
  document.getElementById('rapportDepBox').innerHTML = html;
}
function soldeTransferer() {
  var deps = depouillementsProvince().filter(function(d) { return !d.archived; }); var provLabel = getProvinceActive() || 'Toutes';
  if (!deps.length) { document.getElementById('rapportDepBox').innerHTML = '<p>Aucun — 🌍 ' + echapper(provLabel === '__non_assignee' ? 'Non assignées' : provLabel) + '</p>'; return; }
  var html = '<div class="rapport-header"><h3>🏦 SOLDE À TRANSFÉRER</h3><p style="font-size:16pt;color:#666">🌍 ' + echapper(provLabel === '__non_assignee' ? 'Non assignées' : provLabel) + ' — Détail complet par séance</p></div>';
  var totalSoldeFC = 0, totalSoldeUSD = 0, totalGenFC = 0, totalGenUSD = 0;
  deps.forEach(function(d) {
    var soldeFC = 0, soldeUSD = 0; d.entites.forEach(function(e) { var s = sumEntiteDep(e); soldeFC += s.soldeFC; soldeUSD += s.soldeUSD; });
    var genFC = (d.depensesGenerales || []).reduce(function(a, x) { return a + x.fc; }, 0); var genUSD = (d.depensesGenerales || []).reduce(function(a, x) { return a + x.usd; }, 0);
    totalSoldeFC += soldeFC; totalSoldeUSD += soldeUSD; totalGenFC += genFC; totalGenUSD += genUSD;
    html += '<div style="background:#e8f5e9;padding:10px;border-radius:8px;margin:14px 0 8px;border-left:5px solid #0a6e2c"><div style="font-size:16pt;font-weight:700;color:#0a6e2c">📅 ' + d.mois + ' ' + d.annee + ' — Phase ' + d.phase + (d.province ? ' — 🌍 ' + echapper(d.province) : '') + '</div>';
    html += '<div style="font-size:14pt;color:#666">Date : ' + fmtDate(d.date) + '</div></div>';
    html += '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Entité</th><th>Solde FC</th><th>Solde USD</th></tr></thead><tbody>';
    d.entites.forEach(function(e) { var s = sumEntiteDep(e); html += '<tr><td>' + echapper(e.typeEntite) + ' - ' + echapper(e.nomEntite) + '</td><td class="num">' + s.soldeFC.toLocaleString() + '</td><td class="num">' + s.soldeUSD.toLocaleString() + '</td></tr>'; });
    html += '</tbody><tfoot><tr><td>TOTAL SOLDES ENTITÉS</td><td class="num">' + soldeFC.toLocaleString() + ' FC</td><td class="num">' + soldeUSD.toLocaleString() + ' $</td></tr></tfoot></table></div>';
    if (d.depensesGenerales && d.depensesGenerales.length) {
      html += '<h5 style="color:#c62828;font-size:16pt;margin:14px 0 6px">💸 Dépenses générales (' + d.depensesGenerales.length + ')</h5>';
      html += '<div class="table-wrapper"><table class="data-table"><thead><tr><th>#</th><th>Motif</th><th>FC</th><th>USD</th></tr></thead><tbody>';
      d.depensesGenerales.forEach(function(x, i) { html += '<tr><td>' + (i+1) + '</td><td>' + echapper(x.motif) + '</td><td class="num">' + x.fc.toLocaleString() + '</td><td class="num">' + x.usd.toLocaleString() + '</td></tr>'; });
      html += '</tbody><tfoot><tr><td colspan="2">TOTAL DÉPENSES</td><td class="num">- ' + genFC.toLocaleString() + ' FC</td><td class="num">- ' + genUSD.toLocaleString() + ' $</td></tr></tfoot></table></div>';
    } else { html += '<p style="font-size:14pt;color:#888;margin:8px 0">Aucune dépense générale pour cette séance.</p>'; }
    html += '<div style="background:#fff3e0;padding:12px;border-radius:8px;margin:10px 0;border:2px solid #e65100"><div style="font-size:16pt;color:#e65100;font-weight:700">💰 SOLDE À TRANSFÉRER (cette séance)</div>';
    html += '<div style="font-size:16pt;color:#0a6e2c;font-weight:700;margin-top:6px">' + (soldeFC - genFC).toLocaleString() + ' FC / ' + (soldeUSD - genUSD).toLocaleString() + ' $</div></div>';
  });
  html += '<div class="total-banque-final" style="background:#0a6e2c;color:white;padding:16px;border-radius:10px;margin-top:20px"><div class="banque-title" style="font-weight:700">🌍 TOTAL GÉNÉRAL (toutes séances actives)</div>';
  html += '<table class="banque-table" style="width:100%;color:white;margin-bottom:8px;margin-top:8px"><tr><td style="padding:4px 0">Total soldes entités</td><td style="text-align:right;padding:4px 0"><strong>' + totalSoldeFC.toLocaleString() + ' FC / ' + totalSoldeUSD.toLocaleString() + ' $</strong></td></tr>';
  html += '<tr><td style="padding:4px 0">Total dépenses générales</td><td style="text-align:right;padding:4px 0"><strong>- ' + totalGenFC.toLocaleString() + ' FC / - ' + totalGenUSD.toLocaleString() + ' $</strong></td></tr></table>';
  html += '<div class="banque-montant" style="font-weight:700;border-top:1px solid rgba(255,255,255,0.3);padding-top:10px;margin-top:10px;text-align:center">💰 À LA BANQUE : ' + (totalSoldeFC - totalGenFC).toLocaleString() + ' FC / ' + (totalSoldeUSD - totalGenUSD).toLocaleString() + ' $</div></div>';
  document.getElementById('rapportDepBox').innerHTML = html;
}

// ========== MODULE IV — PATRIMOINE ==========
var photoBienTemp = null;
var CATEGORIES_PATRIMOINE = { LIT: 'Liturgie', SAL: 'Salle de culte', BUR: 'Bureau administratif', IMM: 'Immobilier', AUT: 'Autres biens' };

function ajouterSitePatrimoine() {
  var prov = exigerProvince(); if (!prov) return;
  var type = document.getElementById('pTypeSite').value; var nom = document.getElementById('pNomSite').value.trim(); var resp = document.getElementById('pRespSite').value.trim();
  if (!nom) return alert('Entrez le nom'); var list = DB.get('patrimoineSites', []);
  if (list.find(function(s) { return s.nom.toLowerCase() === nom.toLowerCase() && s.province === prov && !s.archived; })) return alert('Ce site existe déjà dans cette province');
  list.push({ id: uid(), type: type, nom: nom, responsable: resp, province: prov, archived: false, dateCreation: new Date().toISOString() });
  DB.set('patrimoineSites', list); reinitialiserFormSitePatrimoine(); refreshPatrimoineSites(); alert('✅ Site ajouté : ' + nom + ' (' + prov + ')');
}
function reinitialiserFormSitePatrimoine() { document.getElementById('pNomSite').value = ''; document.getElementById('pRespSite').value = ''; document.getElementById('pTypeSite').selectedIndex = 0; }

function refreshPatrimoineSites() {
  var sites = sitesPatrimoineProvince().filter(function(s) { return !s.archived; }); var sel = document.getElementById('pBienSite');
  if (sel) sel.innerHTML = sites.map(function(s) { return '<option value="' + s.id + '">' + s.type + ' - ' + s.nom + '</option>'; }).join('');
  var selRep = document.getElementById('pRepBien');
  if (selRep) { var biens = biensPatrimoineProvince().filter(function(b) { return !b.archived; }); selRep.innerHTML = biens.map(function(b) { return '<option value="' + b.id + '">' + b.code + ' - ' + b.nom + '</option>'; }).join(''); }
  afficherSitesPatrimoine(); afficherBiensPatrimoine(); afficherReparations();
}

function afficherSitesPatrimoine() {
  var filtre = document.getElementById('pFiltreSites') ? document.getElementById('pFiltreSites').value : 'actif'; var sites = filtrerListe(sitesPatrimoineProvince(), filtre);
  var box = document.getElementById('pListeSites'); if (!box) return; if (!sites.length) { box.innerHTML = '<p>Aucun site.</p>'; return; }
  var html = '';
  sites.forEach(function(s) {
    html += '<div class="item-list" style="padding:12px' + (s.archived ? ';opacity:0.7;background:#f0f0f0' : '') + '">';
    html += '<div style="font-size:14px;color:#0a6e2c;font-weight:600">🏛️ ' + echapper(s.type) + ' - ' + echapper(s.nom) + (s.archived ? ' <span class="badge badge-archive">📦</span>' : '') + '</div>';
    html += '<div style="font-size:12px;color:#666;margin-bottom:8px">👤 ' + echapper(s.responsable || '-') + (s.province ? ' | 🌍 ' + echapper(s.province) : ' | 📭') + '</div>';
    html += '<button class="btn-mini orange" onclick="modifierSitePatrimoine(\'' + s.id + '\')">✏️</button> ';
    html += '<button class="btn-mini ' + (s.archived ? 'blue' : 'gray') + '" onclick="archiverSitePatrimoine(\'' + s.id + '\')">' + (s.archived ? '↩️' : '📦') + '</button> ';
    html += '<button class="btn-mini blue" onclick="relevePatrimoineSite(\'' + s.id + '\')">📄</button> ';
    html += '<button class="btn-mini danger" onclick="supprimerSitePatrimoine(\'' + s.id + '\')">🗑️</button></div>';
  });
  box.innerHTML = html;
}
function modifierSitePatrimoine(id) {
  var list = DB.get('patrimoineSites', []); var s = list.find(function(x) { return x.id === id; }); if (!s) return;
  var type = prompt('Type :', s.type); if (type === null) return; var nom = prompt('Nom :', s.nom); if (nom === null) return; var resp = prompt('Responsable :', s.responsable); if (resp === null) return;
  s.type = type; s.nom = nom.trim(); s.responsable = resp.trim(); DB.set('patrimoineSites', list); refreshPatrimoineSites(); alert('✅ Modifié');
}
function archiverSitePatrimoine(id) { var list = DB.get('patrimoineSites', []); var s = list.find(function(x) { return x.id === id; }); if (!s) return; s.archived = !s.archived; DB.set('patrimoineSites', list); refreshPatrimoineSites(); alert(s.archived ? '📦 Archivé' : '↩️ Restauré'); }
function supprimerSitePatrimoine(id) { if (!confirm('⚠️ Supprimer ce site et ses biens ?')) return; DB.set('patrimoineSites', DB.get('patrimoineSites', []).filter(function(s) { return s.id !== id; })); DB.set('patrimoineBiens', DB.get('patrimoineBiens', []).filter(function(b) { return b.siteId !== id; })); refreshPatrimoineSites(); }
function previewPhotoBien(ev) {
  var file = ev.target.files[0]; if (!file) return; var reader = new FileReader();
  reader.onload = function(e) { var img = new Image(); img.onload = function() { var canvas = document.createElement('canvas'); canvas.width = 250; canvas.height = 250; var ctx = canvas.getContext('2d'); var min = Math.min(img.width, img.height); ctx.drawImage(img, (img.width-min)/2, (img.height-min)/2, min, min, 0, 0, 250, 250); photoBienTemp = canvas.toDataURL('image/jpeg', 0.65); document.getElementById('pPhotoPreview').innerHTML = '<img src="' + photoBienTemp + '" style="width:120px;height:120px;border-radius:8px;object-fit:cover;border:2px solid #0a6e2c">'; }; img.src = e.target.result; }; reader.readAsDataURL(file);
}
function genererCodeBien(siteId, cat) {
  var site = DB.get('patrimoineSites', []).find(function(s) { return s.id === siteId; }); var prefixSite = site ? (site.type.substring(0,2).toUpperCase() + '-' + site.nom.substring(0,3).toUpperCase()) : 'GEN';
  var biens = DB.get('patrimoineBiens', []).filter(function(b) { return b.siteId === siteId && b.categorie === cat; }); return prefixSite + '-' + cat + '-' + (biens.length + 1).toString().padStart(3, '0');
}
function ajouterBienPatrimoine() {
  var prov = exigerProvince(); if (!prov) return; var siteId = document.getElementById('pBienSite').value; var cat = document.getElementById('pBienCategorie').value;
  var nom = document.getElementById('pBienNom').value.trim(); var qte = parseInt(document.getElementById('pBienQte').value) || 1; var etat = document.getElementById('pBienEtat').value;
  if (!siteId) return alert('Sélectionnez un site'); if (!nom) return alert('Entrez la désignation');
  var list = DB.get('patrimoineBiens', []); var code = genererCodeBien(siteId, cat);
  list.push({ id: uid(), siteId: siteId, categorie: cat, code: code, nom: nom, qte: qte, etat: etat, photo: photoBienTemp || null, province: prov, archived: false });
  DB.set('patrimoineBiens', list); reinitialiserFormBienPatrimoine(); refreshPatrimoineSites(); alert('✅ Bien ajouté : ' + code + ' (' + prov + ')');
}
function reinitialiserFormBienPatrimoine() { document.getElementById('pBienNom').value = ''; document.getElementById('pBienQte').value = 1; document.getElementById('pBienEtat').selectedIndex = 0; document.getElementById('pPhotoPreview').innerHTML = ''; photoBienTemp = null; }

function afficherBiensPatrimoine() {
  var filtre = document.getElementById('pFiltreBiens') ? document.getElementById('pFiltreBiens').value : 'actif'; var search = (document.getElementById('pSearchBien') ? document.getElementById('pSearchBien').value : '').toLowerCase();
  var biens = filtrerListe(biensPatrimoineProvince(), filtre); if (search) biens = biens.filter(function(b) { return b.nom.toLowerCase().indexOf(search) !== -1 || b.code.toLowerCase().indexOf(search) !== -1; });
  var box = document.getElementById('pListeBiens'); if (!box) return; if (!biens.length) { box.innerHTML = '<p>Aucun bien.</p>'; return; }
  var html = '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Photo</th><th>Code</th><th>Désignation</th><th>Site</th><th>Qté</th><th>État</th><th>Actions</th></tr></thead><tbody>';
  biens.forEach(function(b) {
    var site = DB.get('patrimoineSites', []).find(function(s) { return s.id === b.siteId; });
    html += '<tr' + (b.archived ? ' style="opacity:0.6"' : '') + '><td style="text-align:center">' + (b.photo ? '<img src="' + b.photo + '" style="width:36px;height:36px;border-radius:6px;object-fit:cover">' : '📦') + '</td>';
    html += '<td>' + echapper(b.code) + '</td><td>' + echapper(b.nom) + '</td><td>' + echapper(site ? site.nom : '-') + '</td><td class="num">' + b.qte + '</td><td>' + echapper(b.etat) + '</td>';
    html += '<td><button class="btn-mini orange" onclick="modifierBienPatrimoine(\'' + b.id + '\')">✏️</button><button class="btn-mini ' + (b.archived ? 'blue' : 'gray') + '" onclick="archiverBienPatrimoine(\'' + b.id + '\')">' + (b.archived ? '↩️' : '📦') + '</button><button class="btn-mini danger" onclick="supprimerBienPatrimoine(\'' + b.id + '\')">🗑️</button></td></tr>';
  });
  html += '</tbody></table></div>'; box.innerHTML = html;
}
function modifierBienPatrimoine(id) { var list = DB.get('patrimoineBiens', []); var b = list.find(function(x) { return x.id === id; }); if (!b) return; var nom = prompt('Désignation :', b.nom); if (nom === null) return; var qte = prompt('Quantité :', b.qte); if (qte === null) return; b.nom = nom.trim(); b.qte = parseInt(qte) || b.qte; DB.set('patrimoineBiens', list); refreshPatrimoineSites(); alert('✅ Modifié'); }
function archiverBienPatrimoine(id) { var list = DB.get('patrimoineBiens', []); var b = list.find(function(x) { return x.id === id; }); if (!b) return; b.archived = !b.archived; DB.set('patrimoineBiens', list); refreshPatrimoineSites(); alert(b.archived ? '📦 Archivé' : '↩️ Restauré'); }
function supprimerBienPatrimoine(id) { if (!confirm('⚠️ Supprimer ce bien ?')) return; DB.set('patrimoineBiens', DB.get('patrimoineBiens', []).filter(function(b) { return b.id !== id; })); refreshPatrimoineSites(); }
function ajouterReparation() { var bienId = document.getElementById('pRepBien').value; var desc = document.getElementById('pRepDesc').value.trim(); var cout = parseFloat(document.getElementById('pRepCout').value) || 0; var date = document.getElementById('pRepDate').value || new Date().toISOString().slice(0, 10); if (!bienId || !desc) return alert('Remplissez le bien et la description'); var list = DB.get('patrimoineReparations', []); list.push({ id: uid(), bienId: bienId, desc: desc, cout: cout, date: date }); DB.set('patrimoineReparations', list); document.getElementById('pRepDesc').value = ''; document.getElementById('pRepCout').value = 0; afficherReparations(); alert('✅ Réparation enregistrée'); }
function afficherReparations() { var list = DB.get('patrimoineReparations', []); var box = document.getElementById('pListeReparations'); if (!box) return; if (!list.length) { box.innerHTML = '<p style="font-size:12px;color:#888">Aucune réparation.</p>'; return; } var html = '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Date</th><th>Bien</th><th>Description</th><th>Coût</th></tr></thead><tbody>'; list.slice().reverse().forEach(function(r) { var bien = DB.get('patrimoineBiens', []).find(function(b) { return b.id === r.bienId; }); html += '<tr><td>' + fmtDate(r.date) + '</td><td>' + (bien ? bien.code : '-') + '</td><td>' + echapper(r.desc) + '</td><td class="num">' + r.cout.toLocaleString() + '</td></tr>'; }); html += '</tbody></table></div>'; box.innerHTML = html; }
function rapportPatrimoineGlobal() { var sites = sitesPatrimoineProvince().filter(function(s) { return !s.archived; }); var biens = biensPatrimoineProvince().filter(function(b) { return !b.archived; }); var provLabel = getProvinceActive() || 'Toutes'; var html = '<div class="rapport-header"><h3>📊 RAPPORT PATRIMOINE</h3><p>🌍 ' + echapper(provLabel === '__non_assignee' ? 'Non assignées' : provLabel) + '</p></div>'; html += '<div class="table-wrapper"><table class="data-table"><tbody><tr><td>Total Sites</td><td class="num">' + sites.length + '</td></tr><tr><td>Total Biens</td><td class="num">' + biens.length + '</td></tr></tbody></table></div>'; document.getElementById('pRapportBox').innerHTML = html; }
function relevePatrimoineSite(siteId) { var site = DB.get('patrimoineSites', []).find(function(s) { return s.id === siteId; }); var biens = DB.get('patrimoineBiens', []).filter(function(b) { return b.siteId === siteId && !b.archived; }); var w = window.open('', '_blank'); w.document.write('<html><head><meta charset="UTF-8"><title>Relevé Patrimoine</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#0a6e2c;color:white;padding:8px}td{padding:6px;border-bottom:1px solid #ddd}h1{text-align:center;color:#0a6e2c}</style></head><body>'); w.document.write('<h1>ÉGLISE MESSIANIQUE MONDIALE</h1><h2>Relevé Patrimoine : ' + echapper(site.nom) + ' (' + echapper(site.province || 'Non assignée') + ')</h2>'); w.document.write('<table><thead><tr><th>Code</th><th>Désignation</th><th>Qté</th><th>État</th></tr></thead><tbody>'); biens.forEach(function(b) { w.document.write('<tr><td>' + b.code + '</td><td>' + b.nom + '</td><td>' + b.qte + '</td><td>' + b.etat + '</td></tr>'); }); w.document.write('</tbody></table></body></html>'); w.document.close(); setTimeout(function() { w.print(); }, 500); }

// ========== ARCHIVES CENTRALISÉES ==========
function _typesArchives() {
  return [
    { key: 'entites', label: 'Entités', icon: '🏛️', nom: function(x) { return (x.type || '') + ' - ' + (x.nom || '') + ' | Resp : ' + (x.responsable || '-') + (x.province ? ' | 🌍 ' + x.province : ''); } },
    { key: 'participations', label: 'Participations', icon: '📝', nom: function(x) { return getEntiteNom(x.entiteId) + ' — ' + fmtDate(x.date) + ' (M:' + (x.m||0) + ' S:' + (x.s||0) + ' NV:' + (x.n||0) + ')' + (x.province ? ' | 🌍 ' + x.province : ''); } },
    { key: 'fichesMensuelles', label: 'Fiches mensuelles', icon: '📆', nom: function(x) { return getEntiteNom(x.entiteId) + ' — ' + (x.mois||'') + ' ' + (x.annee||'') + ' | Resp : ' + (x.responsable||'-') + (x.province ? ' | 🌍 ' + x.province : ''); } },
    { key: 'candidats', label: 'Candidats', icon: '👤', nom: function(x) { return (x.nom||'') + ' — ' + (x.motif||'') + ' (' + (x.typeEntite||'') + ' ' + (x.nomEntite||'') + ')' + (x.province ? ' | 🌍 ' + x.province : '') + ' | Versé : ' + (x.totalVerse||0).toFixed(2) + '$'; } },
    { key: 'versements', label: 'Versements', icon: '💵', nom: function(x) { var c = DB.get('candidats', []).find(function(z) { return z.id === x.candId; }); return (c ? c.nom : 'Candidat supprimé') + ' — ' + fmtDate(x.date) + ' — ' + (x.montantUSD||0).toFixed(2) + '$ (' + (x.montantOrigine||0) + ' ' + (x.monnaie||'') + ')' + (x.province ? ' | 🌍 ' + x.province : ''); } },
    { key: 'depouillements', label: 'Dépouillements', icon: '🧾', nom: function(x) { return (x.mois||'') + ' ' + (x.annee||'') + ' — Phase ' + (x.phase||'') + ' (' + (x.entites ? x.entites.length : 0) + ' entités)' + (x.province ? ' | 🌍 ' + x.province : ''); } },
    { key: 'annonces', label: 'Annonces', icon: '📢', nom: function(x) { return fmtDate(x.date) + ' — ' + (x.texte || '').substring(0, 80) + ((x.texte||'').length > 80 ? '...' : ''); } },
    { key: 'patrimoineSites', label: 'Sites patrimoine', icon: '🏛️', nom: function(x) { return (x.type||'') + ' - ' + (x.nom||'') + ' | Resp : ' + (x.responsable||'-') + (x.province ? ' | 🌍 ' + x.province : ''); } },
    { key: 'patrimoineBiens', label: 'Biens patrimoine', icon: '📦', nom: function(x) { return (x.code||'') + ' — ' + (x.nom||'') + ' (' + (x.qte||1) + 'x, ' + (x.etat||'') + ')' + (x.province ? ' | 🌍 ' + x.province : ''); } }
  ];
}
function afficherArchives() {
  var box = document.getElementById('archivesBox'); if (!box) return;
  var recherche = (document.getElementById('archiveSearch').value || '').toLowerCase().trim();
  
  // Structure de données : data[Entite][Module][Annee][Mois] = [items]
  var archiveData = {};

  var addToArchive = function(entiteName, module, dateStr, item, typeLabel, description) {
    if (!entiteName || entiteName === 'Inconnu') entiteName = "Entité non assignée";
    var d = new Date(dateStr || Date.now());
    var annee = d.getFullYear() || 'Année inconnue';
    var mois = d.toLocaleString('fr-FR', { month: 'long' });
    
    if (!archiveData[entiteName]) archiveData[entiteName] = {};
    if (!archiveData[entiteName][module]) archiveData[entiteName][module] = {};
    if (!archiveData[entiteName][module][annee]) archiveData[entiteName][module][annee] = {};
    if (!archiveData[entiteName][module][annee][mois]) archiveData[entiteName][module][annee][mois] = [];
    
    archiveData[entiteName][module][annee][mois].push({ item: item, typeLabel: typeLabel, desc: description });
  };

  // Préparation des données
  var entitesMap = {}; DB.get('entites', []).forEach(e => entitesMap[e.id] = e.nom);
  var candsMap = {}; DB.get('candidats', []).forEach(c => candsMap[c.id] = c);
  var sitesMap = {}; DB.get('patrimoineSites', []).forEach(s => sitesMap[s.id] = s);

  // 1. Fréquences
  DB.get('participations', []).filter(x => x.archived).forEach(p => {
    addToArchive(entitesMap[p.entiteId], 'Fréquence', p.date, p, '📝 Participation', 'Date: ' + fmtDate(p.date));
  });
  DB.get('fichesMensuelles', []).filter(x => x.archived).forEach(f => {
    addToArchive(entitesMap[f.entiteId], 'Fréquence', f.dateCreation, f, '📆 Fiche Mensuelle', f.mois + ' ' + f.annee);
  });

  // 2. Finance
  DB.get('candidats', []).filter(x => x.archived).forEach(c => {
    addToArchive(c.nomEntite, 'Finance', c.dateInscription, c, '👤 Candidat', c.nom + ' (' + c.motif + ')');
  });
  DB.get('versements', []).filter(x => x.archived).forEach(v => {
    var c = candsMap[v.candId];
    addToArchive(c ? c.nomEntite : null, 'Finance', v.dateCreation || v.date, v, '💵 Versement', (c ? c.nom : 'Inconnu') + ' - ' + v.montantUSD.toFixed(2) + '$');
  });

  // 3. Dépouillement
  DB.get('depouillements', []).filter(x => x.archived).forEach(d => {
    var ents = d.entites || [];
    ents.forEach(e => {
      addToArchive(e.nomEntite, 'Dépouillement', d.dateCreation || d.date, d, '🧾 Séance Dépouillement', 'Phase ' + d.phase + ' (' + d.mois + ' ' + d.annee + ')');
    });
  });

  // 4. Patrimoine
  DB.get('patrimoineSites', []).filter(x => x.archived).forEach(s => {
    addToArchive(s.nom, 'Patrimoine', s.dateCreation, s, '🏛️ Site', s.type);
  });
  DB.get('patrimoineBiens', []).filter(x => x.archived).forEach(b => {
    var s = sitesMap[b.siteId];
    addToArchive(s ? s.nom : null, 'Patrimoine', b.dateCreation || Date.now(), b, '📦 Bien', (b.code || '') + ' - ' + b.nom);
  });

  // Filtrage par recherche
  var totalGeneral = 0;
  var html = '';

  var filterAndRender = function(dataObj) {
    Object.keys(dataObj).forEach(function(entiteName) {
      if (recherche && entiteName.toLowerCase().indexOf(recherche) === -1) {
        // Si la recherche ne correspond pas au nom de l'entité, on regarde si un élément à l'intérieur correspond
        var hasMatch = false;
        Object.keys(dataObj[entiteName]).forEach(mod => {
          Object.keys(dataObj[entiteName][mod]).forEach(an => {
            Object.keys(dataObj[entiteName][mod][an]).forEach(mo => {
              dataObj[entiteName][mod][an][mo].forEach(x => {
                if (x.desc.toLowerCase().indexOf(recherche) !== -1 || x.typeLabel.toLowerCase().indexOf(recherche) !== -1) hasMatch = true;
              });
            });
          });
        });
        if (!hasMatch) return;
      }

      var entiteTotal = 0;
      var htmlEntite = '<details style="margin-bottom:15px; background:#f9f9f9; border:1px solid #ddd; border-radius:8px; padding:10px;">';
      htmlEntite += '<summary style="font-size:16px; font-weight:bold; color:#0a6e2c; cursor:pointer; padding:5px;">🏛️ Entité : ' + echapper(entiteName) + '</summary>';

      Object.keys(dataObj[entiteName]).forEach(function(module) {
        var htmlModule = '<details style="margin-left:15px; margin-top:10px; background:#fff; border:1px solid #eee; border-radius:6px; padding:8px;">';
        htmlModule += '<summary style="font-size:14px; font-weight:bold; color:#1976d2; cursor:pointer;">📁 Module : ' + module + '</summary>';

        Object.keys(dataObj[entiteName][module]).sort((a,b) => b - a).forEach(function(annee) {
          var htmlAnnee = '<details style="margin-left:15px; margin-top:8px; background:#f4f4f4; border-radius:6px; padding:6px;">';
          htmlAnnee += '<summary style="font-size:13px; font-weight:bold; color:#555; cursor:pointer;">📅 Année : ' + annee + '</summary>';

          Object.keys(dataObj[entiteName][module][annee]).forEach(function(mois) {
            var htmlMois = '<details style="margin-left:15px; margin-top:6px; background:#fafafa; border-left:3px solid #f9a825; padding:5px;">';
            htmlMois += '<summary style="font-size:12px; font-weight:bold; color:#e65100; cursor:pointer;">🗓️ Mois : ' + mois + '</summary>';
            
            htmlMois += '<div style="margin-left:10px; margin-top:5px; font-size:12px;">';
            dataObj[entiteName][module][annee][mois].forEach(function(obj) {
              if (recherche && obj.desc.toLowerCase().indexOf(recherche) === -1 && obj.typeLabel.toLowerCase().indexOf(recherche) === -1 && entiteName.toLowerCase().indexOf(recherche) === -1) return;
              
              entiteTotal++; totalGeneral++;
              htmlMois += '<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dotted #ccc; padding:5px 0;">';
              htmlMois += '<div><strong>' + obj.typeLabel + '</strong> : ' + echapper(obj.desc) + '</div>';
              htmlMois += '<div style="white-space:nowrap;">';
              htmlMois += '<button class="btn-mini blue" onclick="restaurerArchive(\'' + getTypeKey(obj.typeLabel) + '\', \'' + obj.item.id + '\')">↩️</button> ';
              htmlMois += '<button class="btn-mini danger" onclick="supprimerDefinitifArchive(\'' + getTypeKey(obj.typeLabel) + '\', \'' + obj.item.id + '\')">🗑️</button>';
              htmlMois += '</div></div>';
            });
            htmlMois += '</div></details>';
            htmlAnnee += htmlMois;
          });
          htmlAnnee += '</details>';
          htmlModule += htmlAnnee;
        });
        htmlModule += '</details>';
        htmlEntite += htmlModule;
      });
      
      if (entiteTotal > 0) {
        htmlEntite += '</details>';
        html += htmlEntite;
      }
    });
  };

  // Fonction utilitaire pour retrouver la clé de la table
  function getTypeKey(label) {
    if (label.includes('Participation')) return 'participations';
    if (label.includes('Fiche')) return 'fichesMensuelles';
    if (label.includes('Candidat')) return 'candidats';
    if (label.includes('Versement')) return 'versements';
    if (label.includes('Dépouillement')) return 'depouillements';
    if (label.includes('Site')) return 'patrimoineSites';
    if (label.includes('Bien')) return 'patrimoineBiens';
    return '';
  }

  filterAndRender(archiveData);

  if (totalGeneral === 0) {
    box.innerHTML = '<div class="card"><p style="text-align:center;padding:24px;color:#888;font-size:14px">📭 Aucun document trouvé dans les archives.</p></div>';
    return;
  }

  var intro = '<div class="card" style="background:#fffde7;border-left:4px solid #f9a825"><h3 style="color:#e65100">📦 Bibliothèque d\'Archives — ' + totalGeneral + ' document(s)</h3>';
  intro += '<p style="font-size:12px;color:#666;margin-top:6px">Cliquez sur les dossiers pour les ouvrir. Les éléments sont classés par Entité, Module, Année et Mois.</p></div>';
  
  box.innerHTML = intro + html;
  }
function restaurerArchive(type, id) { var list = DB.get(type, []); var item = list.find(function(x) { return x.id === id; }); if (!item) return alert('❌ Élément introuvable'); item.archived = false; DB.set(type, list); afficherArchives(); refreshAll(); alert('✅ Élément restauré'); }
function restaurerTouteCategorie(type) { var list = DB.get(type, []); var n = 0; list.forEach(function(x) { if (x.archived === true) { x.archived = false; n++; } }); if (!n) return alert('Aucun élément à restaurer'); if (!confirm('↩️ Restaurer ' + n + ' élément(s) de cette catégorie ?')) return; DB.set(type, list); afficherArchives(); refreshAll(); alert('✅ ' + n + ' élément(s) restauré(s)'); }
function supprimerDefinitifArchive(type, id) { if (!confirm('⚠️ Supprimer DÉFINITIVEMENT cet élément ?\n\nCette action est irréversible.')) return; var list = DB.get(type, []).filter(function(x) { return x.id !== id; }); DB.set(type, list); if (type === 'candidats') DB.set('versements', DB.get('versements', []).filter(function(v) { return v.candId !== id; })); if (type === 'entites') { DB.set('participations', DB.get('participations', []).filter(function(p) { return p.entiteId !== id; })); DB.set('fichesMensuelles', DB.get('fichesMensuelles', []).filter(function(f) { return f.entiteId !== id; })); } if (type === 'patrimoineSites') DB.set('patrimoineBiens', DB.get('patrimoineBiens', []).filter(function(b) { return b.siteId !== id; })); afficherArchives(); refreshAll(); alert('✅ Supprimé définitivement'); }
function purgerTouteCategorie(type) { var list = DB.get(type, []); var archives = list.filter(function(x) { return x.archived === true; }); if (!archives.length) return alert('Aucune archive dans cette catégorie'); if (!confirm('⚠️ Supprimer DÉFINITIVEMENT ' + archives.length + ' élément(s) archivé(s) de cette catégorie ?\n\nAction irréversible.')) return; DB.set(type, list.filter(function(x) { return x.archived !== true; })); if (type === 'candidats') { var idsCands = archives.map(function(x) { return x.id; }); DB.set('versements', DB.get('versements', []).filter(function(v) { return idsCands.indexOf(v.candId) === -1; })); } if (type === 'entites') { var idsEnt = archives.map(function(x) { return x.id; }); DB.set('participations', DB.get('participations', []).filter(function(p) { return idsEnt.indexOf(p.entiteId) === -1; })); DB.set('fichesMensuelles', DB.get('fichesMensuelles', []).filter(function(f) { return idsEnt.indexOf(f.entiteId) === -1; })); } if (type === 'patrimoineSites') { var idsSites = archives.map(function(x) { return x.id; }); DB.set('patrimoineBiens', DB.get('patrimoineBiens', []).filter(function(b) { return idsSites.indexOf(b.siteId) === -1; })); } afficherArchives(); refreshAll(); alert('✅ Purge effectuée'); }

// ========== ADMIN & UTILISATEURS ==========
function ajouterUtilisateur() { if (!isAdmin()) return alert('Réservé admin'); var nom = document.getElementById('uNom').value.trim().toLowerCase(); var pass = document.getElementById('uPass').value.trim(); var role = document.getElementById('uRole').value; if (!nom || !pass) return alert('Remplissez tous les champs'); var users = DB.get('users', []); if (users.find(function(u) { return u.nom === nom; })) return alert('Ce nom existe déjà'); users.push({ id: uid(), nom: nom, pass: pass, role: role }); DB.set('users', users); reinitialiserFormUtilisateur(); afficherUtilisateurs(); alert('✅ Utilisateur ajouté'); }
function reinitialiserFormUtilisateur() { ['uNom','uPass'].forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; }); var c = document.getElementById('uRole'); if (c) c.selectedIndex = 0; }
function afficherUtilisateurs() { var users = DB.get('users', []); var box = document.getElementById('listeUtilisateurs'); if (!box) return; var html = '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Nom</th><th>Rôle</th><th>Actions</th></tr></thead><tbody>'; users.forEach(function(u) { html += '<tr><td>' + echapper(u.nom) + '</td><td>' + (u.role === 'admin' ? '👑 Admin' : '👤 Utilisateur') + '</td><td>' + (u.nom !== 'admin' ? '<button class="btn-mini danger" onclick="supprimerUtilisateur(\'' + u.id + '\')">🗑️</button>' : '') + '</td></tr>'; }); html += '</tbody></table></div>'; box.innerHTML = html; }
function supprimerUtilisateur(id) { if (!isAdmin()) return alert('Réservé admin'); if (!confirm('⚠️ Supprimer cet utilisateur ?')) return; DB.set('users', DB.get('users', []).filter(function(u) { return u.id !== id; })); afficherUtilisateurs(); }

// ========== EXPORT / IMPORT GLOBAL ==========
function exporterDonnees() { var data = {}; ['users','entites','participations','fichesMensuelles','candidats','versements','depouillements','depensesGenerales','annonces','patrimoineSites','patrimoineBiens','patrimoineMouvements','patrimoineReparations','rapportsNumeriques'].forEach(function(k) { data[k] = DB.get(k, []); }); try { var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); var url = URL.createObjectURL(blob); var a = document.createElement('a'); a.href = url; a.download = 'emm_mondial_' + Date.now() + '.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function() { URL.revokeObjectURL(url); }, 1000); alert('✅ Fichier téléchargé'); } catch(e) { alert('Erreur export'); } }
function restaurerTexte() { var txt = document.getElementById('importText').value.trim(); if (!txt) return alert('Collez un JSON'); try { var data = JSON.parse(txt); Object.keys(data).forEach(function(k) { DB.set(k, data[k]); }); alert('✅ Données restaurées'); refreshAll(); afficherDashboard(); document.getElementById('importText').value = ''; } catch(e) { alert('❌ JSON invalide'); } }
function importerDonnees(ev) { var file = ev.target.files[0]; if (!file) return; var reader = new FileReader(); reader.onload = function(e) { try { var data = JSON.parse(e.target.result); Object.keys(data).forEach(function(k) { DB.set(k, data[k]); }); alert('✅ Données restaurées'); refreshAll(); afficherDashboard(); } catch(err) { alert('❌ Fichier invalide'); } }; reader.readAsText(file); }
async function toutEffacer() { if (!isAdmin()) return alert('Réservé admin'); if (!confirm('⚠️ Effacer TOUTES les données (sauf utilisateurs) ?')) return; var users = DB.get('users', []); try { await DB.clearAll(); } catch(e) { console.warn('clearAll:', e); } DB.set('users', users); initDB(); alert('✅ Toutes les données effacées'); location.reload(); }
async function afficherDiagnosticStockage() { var box = document.getElementById('diagnosticStockage'); if (!box) return; box.innerHTML = '<p>⏳ Analyse…</p>'; var info = await DB.diagnostique(); var html = '<div class="table-wrapper"><table class="data-table"><tbody>'; html += '<tr><td>IndexedDB</td><td>' + info.indexedDB + '</td></tr><tr><td>Clés en cache</td><td class="num">' + info.clesCache + '</td></tr><tr><td>localStorage utilisé</td><td class="num">' + info.localStorageUtilise + '</td></tr><tr><td>localStorage limite</td><td class="num">' + info.localStorageMax + '</td></tr></tbody></table></div>'; box.innerHTML = html; }

// ========== PWA & REFRESH ==========
var deferredPrompt = null;
window.addEventListener('beforeinstallprompt', function(e) { e.preventDefault(); deferredPrompt = e; var btn = document.getElementById('installBtn'); if (btn) btn.style.display = 'block'; });
function installApp() { if (!deferredPrompt) return alert('Menu navigateur → "Ajouter à l\'écran d\'accueil"'); deferredPrompt.prompt(); deferredPrompt.userChoice.then(function() { deferredPrompt = null; var btn = document.getElementById('installBtn'); if (btn) btn.style.display = 'none'; }); }

function refreshAll() { rafraichirProvinceHeader(); peuplerProvinceSelects(); rafraichirEntites(); rafraichirEntitesRN(); afficherListeEntites(); afficherJournaliere(); rafraichirCandidatsSelect(); afficherCandidats(); afficherVersements(); afficherUtilisateurs(); refreshPatrimoineSites(); recalculerTotauxRN(); syncSignatureEncrePickers(); if (typeof rechercherParEntite === 'function') rechercherParEntite(); }

// ========== NOUVELLES RECHERCHES GLOBALES (TABLEAU DE BORD) ==========
function rechercherFreqGeneral() {
  var annee = (document.getElementById('gSearchFreqAnnee').value || '').trim(); var mois = document.getElementById('gSearchFreqMois').value;
  var fiches = fichesProvince().filter(function(f) { return !f.archived; }).filter(function(f) { return (!annee || String(f.annee) === annee) && (!mois || f.mois === mois); });
  var box = document.getElementById('resultatRechercheFreqGeneral'); if (!fiches.length) { box.innerHTML = '<p style="color:#888">Aucune fiche trouvée.</p>'; return; }
  var html = '<h4>Résultats (' + fiches.length + ')</h4>';
  fiches.forEach(function(f) { html += '<div class="entity-block" style="margin-bottom:8px; padding:8px;"><strong>📍 ' + echapper(getEntiteNom(f.entiteId)) + '</strong> — ' + f.mois + ' ' + f.annee + '<div style="font-size:12px;color:#666;margin-top:4px">Membres actifs : ' + (f.mMembresActifs || 0) + ' | Sympathisants : ' + (f.mSympathisants || 0) + '</div></div>'; });
  box.innerHTML = html;
}
function reinitialiserRechercheFreqGeneral() { document.getElementById('gSearchFreqAnnee').value = ''; document.getElementById('gSearchFreqMois').selectedIndex = 0; document.getElementById('resultatRechercheFreqGeneral').innerHTML = ''; }
function rechercherFinGeneral() {
  var q = (document.getElementById('gSearchFinTexte').value || '').trim().toUpperCase();
  var cands = candidatsProvince().filter(function(c) { return !c.archived; }).filter(function(c) { return (!q || c.nom.toUpperCase().indexOf(q) !== -1 || (c.nomEntite && c.nomEntite.toUpperCase().indexOf(q) !== -1)); });
  var box = document.getElementById('resultatRechercheFinGeneral'); if (!cands.length) { box.innerHTML = '<p style="color:#888">Aucun candidat trouvé.</p>'; return; }
  var html = '<h4>Résultats (' + cands.length + ')</h4><div class="table-wrapper"><table class="data-table"><thead><tr><th>Nom</th><th>Entité</th><th>Versé</th></tr></thead><tbody>';
  cands.forEach(function(c) { html += '<tr><td>' + echapper(c.nom) + '</td><td>' + echapper(c.nomEntite) + '</td><td class="num">' + c.totalVerse.toFixed(2) + '$</td></tr>'; });
  html += '</tbody></table></div>'; box.innerHTML = html;
}
function reinitialiserRechercheFinGeneral() { document.getElementById('gSearchFinTexte').value = ''; document.getElementById('resultatRechercheFinGeneral').innerHTML = ''; }
function rechercherPatGeneral() {
  var q = (document.getElementById('gSearchPatTexte').value || '').trim().toUpperCase();
  var sites = sitesPatrimoineProvince().filter(function(s) { return !s.archived; }).filter(function(s) { return (!q || s.nom.toUpperCase().indexOf(q) !== -1); });
  var biens = biensPatrimoineProvince().filter(function(b) { return !b.archived; }).filter(function(b) { return (!q || b.nom.toUpperCase().indexOf(q) !== -1 || b.code.toUpperCase().indexOf(q) !== -1); });
  var box = document.getElementById('resultatRecherchePatGeneral'); if (!sites.length && !biens.length) { box.innerHTML = '<p style="color:#888">Aucun site ou bien trouvé.</p>'; return; }
  var html = ''; if (sites.length) { html += '<h4>Sites (' + sites.length + ')</h4><ul>'; sites.forEach(function(s) { html += '<li>🏛️ <strong>' + echapper(s.nom) + '</strong> (' + echapper(s.type) + ') - Resp : ' + echapper(s.responsable) + '</li>'; }); html += '</ul>'; }
  if (biens.length) { html += '<h4>Biens (' + biens.length + ')</h4><ul>'; biens.forEach(function(b) { html += '<li>📦 <strong>' + echapper(b.code) + '</strong> - ' + echapper(b.nom) + ' (Qté : ' + b.qte + ')</li>'; }); html += '</ul>'; }
  box.innerHTML = html;
}
function reinitialiserRecherchePatGeneral() { document.getElementById('gSearchPatTexte').value = ''; document.getElementById('resultatRecherchePatGeneral').innerHTML = ''; }

// ========== INITIALISATION GENERALE (ULTRA RAPIDE) ==========
document.addEventListener('DOMContentLoaded', function() {
  // 1. On affiche le splash screen instantanément
  showScreen('splashScreen');
  
  // 2. On initialise l'interface immédiatement
  rafraichirProvinceHeader(); 
  peuplerProvinceSelects(); 
  syncSignatureEncrePickers(); 
  
  // 3. On force le passage au login après 800ms MAX, sans attendre Firebase
  setTimeout(function() {
    var splash = document.getElementById('splashScreen');
    if (splash && splash.classList.contains('active')) {
      showScreen('loginScreen');
    }
  }, 800);

  // 4. En arrière-plan, on initialise la base de données locale
  setTimeout(function() {
    DB.init().then(function() {
      try { initDB(); } catch(e) {}
      console.log('✅ Base locale prête');
    }).catch(function(e) { console.error('❌ DB:', e); });
  }, 100);
  
  setTimeout(initSignature, 800); 
});

document.addEventListener('click', function(e) { var menu = document.getElementById('mainMenu'); var btn = document.querySelector('.btn-hamburger'); if (menu && menu.classList.contains('open') && !menu.contains(e.target) && btn && !btn.contains(e.target)) { fermerMainMenu(); } });
window._signalerSauvegarde = function() { var el = document.getElementById('saveIndicator'); if (!el) return; el.style.opacity = '1'; el.textContent = '💾 Sauvegardé'; clearTimeout(window._saveTimeout); window._saveTimeout = setTimeout(function() { el.style.opacity = '0.35'; el.textContent = '💾'; }, 1200); };
function majBandeauOffline() { var banner = document.getElementById('offlineBanner'); if (!banner) return; banner.style.display = navigator.onLine ? 'none' : 'block'; }
window.addEventListener('online', majBandeauOffline); window.addEventListener('offline', majBandeauOffline); window.addEventListener('load', majBandeauOffline);

// =========================================================
// 🔥 INTÉGRATION FIREBASE & PREMIUM (SUPER ADMIN)
// =========================================================
var userPremiumStatus = false;
var userPremiumExpire = 0;
var SUPER_ADMIN_EMAILS = [
  "dedickmpiana@gmail.com"
  // Pour ajouter un développeur, mettez une virgule et son email : "ami@gmail.com"
];

function isSuperAdmin() {
  return currentUser && SUPER_ADMIN_EMAILS.includes(currentUser.email);
}

function login() {
  var errBox = document.getElementById('loginError');
  if (typeof auth === 'undefined' || typeof dbFS === 'undefined' || !firebase.apps || !firebase.apps.length) {
    if (errBox) errBox.textContent = '⏳ Chargement en cours, patientez 2 secondes...';
    return;
  }
  var email = document.getElementById('loginEmail').value.trim();
  var pass = document.getElementById('loginPassword').value.trim();
  if (!email || !pass) { errBox.textContent = '❌ Entrez l\'email et le mot de passe'; return; }
  errBox.textContent = '⏳ Connexion...';
  auth.signInWithEmailAndPassword(email, pass).then(function() { errBox.textContent = ''; document.getElementById('loginPassword').value = ''; }).catch(function(error) { errBox.textContent = '❌ ' + error.message; });
}

function creerCompte() {
  var errBox = document.getElementById('loginError');
  if (typeof auth === 'undefined' || typeof dbFS === 'undefined' || !firebase.apps || !firebase.apps.length) {
    if (errBox) errBox.textContent = '⏳ Chargement en cours, patientez 2 secondes...';
    return;
  }
  var email = document.getElementById('loginEmail').value.trim();
  var pass = document.getElementById('loginPassword').value.trim();
  var phone = document.getElementById('loginPhone') ? document.getElementById('loginPhone').value.trim() : "";
  
  if (!email || !pass) { errBox.textContent = '❌ Entrez un email et un mot de passe (min 6 car.)'; return; }
  if (!phone) { errBox.textContent = '❌ Entrez votre numéro WhatsApp'; return; }
  
  errBox.textContent = '⏳ Création...';
  
  auth.createUserWithEmailAndPassword(email, pass).then(function(userCredential) {
    return dbFS.collection('users').doc(userCredential.user.uid).set({
      email: email, 
      phone: phone,
      premium: false, 
      premiumExpire: 0, 
      createdAt: new Date()
    });
  }).then(function() {
    errBox.textContent = '✅ Compte créé et enregistré ! Vous pouvez vous connecter.';
  }).catch(function(error) { 
    errBox.textContent = '❌ Erreur : ' + error.message; 
  });
}

function logout() {
  if (!confirm('Voulez-vous vraiment vous déconnecter ?')) return;
  if (typeof auth === 'undefined') { currentUser = null; showScreen('loginScreen'); return; }
  auth.signOut().then(function() { currentUser = null; userPremiumStatus = false; userPremiumExpire = 0; showScreen('loginScreen'); });
}

auth.onAuthStateChanged(function(user) {
  if (user) {
    currentUser = user;
    var label = document.getElementById('userRoleLabel');
    if (label) label.textContent = '👤 ' + user.email;
    showScreen('mainScreen');
    ecouterStatutPremium(user.uid);
    if (typeof refreshAll === 'function') refreshAll();
    if (typeof afficherDashboard === 'function') afficherDashboard();
  } else { 
    currentUser = null; 
    var loginScreen = document.getElementById('loginScreen');
    if (loginScreen && !loginScreen.classList.contains('active')) { showScreen('loginScreen'); }
  }
});
function ecouterStatutPremium(uid) {
  dbFS.collection('users').doc(uid).onSnapshot(function(doc) {
    var btnPrem = document.getElementById('btnPremium');
    var now = Date.now();
    
    if (doc.exists) {
      var data = doc.data(); 
      var expire = data.premiumExpire || 0;
      
      if (isSuperAdmin()) {
        userPremiumStatus = true; 
        userPremiumExpire = now + (365 * 24 * 60 * 60 * 1000); 
      } else if (data.premium === true && expire > now) { 
        userPremiumStatus = true; 
        userPremiumExpire = expire; 
      } else { 
        userPremiumStatus = false; 
        userPremiumExpire = 0; 
      }
    } else {
      // Si le document n'existe pas, on considère que c'est gratuit et on affiche le bouton
      userPremiumStatus = false; 
      userPremiumExpire = 0;
    }
    
    if (btnPrem) {
      if (userPremiumStatus) {
        btnPrem.style.display = 'none'; // Cacher si Premium
      } else {
        btnPrem.style.display = 'block'; // Afficher si Gratuit
      }
    }
    
    if (typeof majInterfacePremium === 'function') majInterfacePremium();
  }, function(error) {
    // En cas d'erreur (règles Firebase), on affiche le bouton par défaut
    var btnPrem = document.getElementById('btnPremium');
    if (btnPrem) btnPrem.style.display = 'block';
    if (typeof majInterfacePremium === 'function') majInterfacePremium();
  });
}
// --- DEBUT VERIFICATION PREMIUM PDF & WORD ---
var _ancien_ouvrirModalPdf = ouvrirModalPdf;
ouvrirModalPdf = function(contexte) {
  // Si c'est le Super Admin, on le laisse passer direct
  if (isSuperAdmin()) { _ancien_ouvrirModalPdf(contexte); return; }
  
  // Si c'est un client, on vérifie son statut Premium
  if (!userPremiumStatus) { 
    alert("🔒 Cette fonctionnalité (Rapport PDF) est réservée aux églises abonnées Premium.\n\nCliquez sur le bouton ⭐ Premium en haut pour vous abonner."); 
    return; 
  }
  _ancien_ouvrirModalPdf(contexte);
};

var _ancien_exporterWordBox = exporterWordBox;
exporterWordBox = function(boxId, nom) {
  if (isSuperAdmin()) { _ancien_exporterWordBox(boxId, nom); return; }
  
  if (!userPremiumStatus) { 
    alert("🔒 Cette fonctionnalité (Export Word) est réservée aux églises abonnées Premium."); 
    return; 
  }
  _ancien_exporterWordBox(boxId, nom);
};
// --- FIN VERIFICATION PREMIUM PDF & WORD ---
function ouvrirModalPremium() { if (userPremiumStatus) { alert("✅ Vous êtes Premium actif."); return; } document.getElementById('premiumModal').style.display = 'flex'; }
function fermerModalPremium() { document.getElementById('premiumModal').style.display = 'none'; }

function majInterfacePremium() {
  var box = document.getElementById('monCompteBox');
  if (box && currentUser) {
    var isDev = currentUser.email === SUPER_ADMIN_EMAIL;
    var statut = isDev ? "<span style='color:green'>✅ Développeur (Illimité)</span>" : (userPremiumStatus ? "<span style='color:green'>✅ Premium</span>" : "<span style='color:red'>❌ Gratuit</span>");
    var expire = (userPremiumStatus && !isDev) ? new Date(userPremiumExpire).toLocaleDateString() : "-";
    box.innerHTML = "<p><strong>Email :</strong> " + currentUser.email + "</p><p><strong>Statut :</strong> " + statut + "</p>" + (isDev ? "" : "<p><strong>Valide jusqu'au :</strong> " + expire + "</p>");
    
    // Afficher et charger la liste des clients pour le Super Admin
    var card = document.getElementById('cardActivationRapide');
    if (card) {
      if (isDev) {
        card.style.display = 'block';
        if (typeof chargerListeClients === 'function') chargerListeClients();
      } else {
        card.style.display = 'none';
      }
    }
  }
}

// =========================================================
// 🔥 GESTION DES CLIENTS PREMIUM (SUPER ADMIN)
// =========================================================
function chargerListeClients() {
  if (!isSuperAdmin()) return;
  
  var box = document.getElementById('listeClientsAdmin');
  if(!box) return;
  box.innerHTML = "⏳ Chargement des clients...";
  
  dbFS.collection('users').get().then(function(querySnapshot) {
    if (querySnapshot.empty) {
      box.innerHTML = "<p>Aucun client trouvé.</p>"; return;
    }
    
    var html = '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Email / Tel</th><th>Statut</th><th>Jours restants</th><th>Forfaits</th><th>Outils</th></tr></thead><tbody>';
    
    querySnapshot.forEach(function(doc) {
      var data = doc.data();
      var docId = doc.id;
      var email = data.email || 'Inconnu';
      var phone = data.phone || ''; 
      
      if (SUPER_ADMIN_EMAILS.includes(email)) return; 
      
      var isPrem = data.premium === true && (data.premiumExpire || 0) > Date.now();
      var isIllimite = data.premiumExpire > 32503680000000; 
      
      var joursRestants = 0;
      if (isPrem && !isIllimite) {
        joursRestants = Math.ceil((data.premiumExpire - Date.now()) / (1000 * 60 * 60 * 24));
      }
      
      var badgeStatut = isIllimite ? '<span class="badge" style="background:#ffd700;color:#000;font-weight:bold;">♾️ Illimité</span>' : (isPrem ? '<span class="badge badge-ok">✅ Premium</span>' : '<span class="badge badge-archive">❌ Gratuit</span>');
      var txtJours = isIllimite ? 'À vie' : (isPrem ? joursRestants + ' j' : '-');
      
      html += '<tr>';
      html += '<td style="font-size:11px;">' + email + '<br><span style="color:#666;">' + phone + '</span></td>';
      html += '<td>' + badgeStatut + '</td>';
      html += '<td style="text-align:center; font-weight:bold; color:' + (isPrem ? '#0a6e2c' : '#c62828') + '">' + txtJours + '</td>';
      
      html += '<td style="white-space:nowrap;">';
      html += '<button class="btn-mini" style="background:#4caf50;" onclick="modifierAbonnement(\'' + docId + '\', 30)">+30j</button> ';
      html += '<button class="btn-mini" style="background:#2196f3;" onclick="modifierAbonnement(\'' + docId + '\', 60)">+60j</button> ';
      html += '<button class="btn-mini" style="background:#ff9800;" onclick="modifierAbonnement(\'' + docId + '\', 90)">+90j</button> ';
      html += '<button class="btn-mini" style="background:#9c27b0;" onclick="modifierAbonnement(\'' + docId + '\', 9999)">♾️</button>';
      html += '</td>';
      
      html += '<td style="white-space:nowrap;">';
      if (isPrem && phone) {
        var dateExp = isIllimite ? 'À vie' : new Date(data.premiumExpire).toLocaleDateString('fr-FR');
        html += '<button class="btn-mini" style="background:#25D366;" onclick="envoyerWhatsApp(\'' + phone + '\', \'' + email + '\', \'' + dateExp + '\')">📱 WA</button> ';
      }
      html += '<button class="btn-mini danger" onclick="supprimerClient(\'' + docId + '\')">🗑️</button>';
      html += '</td></tr>';
    });
    
    html += '</tbody></table></div>';
    box.innerHTML = html;
    
  }).catch(function(error) {
    box.innerHTML = "<p style='color:red;'>Erreur : " + error.message + "</p>";
  });
}

function modifierAbonnement(docId, jours) {
  if (!isSuperAdmin()) return;
  
  dbFS.collection('users').doc(docId).get().then(function(doc) {
    if (!doc.exists) return;
    var data = doc.data();
    var nouvelleExpiration;
    
    if (jours === 9999) {
      nouvelleExpiration = 32503680000000; 
    } else {
      var baseDate = (data.premiumExpire && data.premiumExpire > Date.now()) ? data.premiumExpire : Date.now();
      nouvelleExpiration = baseDate + (jours * 24 * 60 * 60 * 1000);
    }
    
    return dbFS.collection('users').doc(docId).update({
      premium: true,
      premiumExpire: nouvelleExpiration
    });
  }).then(function() {
    chargerListeClients(); 
    alert('✅ Abonnement mis à jour !');
  }).catch(function(err) { alert("Erreur : " + err.message); });
}

function envoyerWhatsApp(phone, email, dateExp) {
  var cleanPhone = phone.replace(/\s+/g, '').replace('+', '');
  var message = "Bonjour ! Votre compte EMM Mondial (" + email + ") a bien été activé. Il est valide jusqu'au : " + dateExp + ". Que Dieu vous bénisse !";
  window.open("https://wa.me/" + cleanPhone + "?text=" + encodeURIComponent(message), '_blank');
}

function supprimerClient(docId) {
  if (!isSuperAdmin()) return;
  if (!confirm("⚠️ Supprimer définitivement ce client ?")) return;
  
  dbFS.collection('users').doc(docId).delete().then(function() {
    chargerListeClients(); 
    alert("✅ Client supprimé.");
  }).catch(function(error) {
    alert("Erreur : " + error.message);
  });
        }

// --- DEBUT FONCTIONS PREMIUM ET VERIFICATIONS ---
var _ancien_ouvrirModalPdf = ouvrirModalPdf;
ouvrirModalPdf = function(contexte) {
  if (isSuperAdmin()) { _ancien_ouvrirModalPdf(contexte); return; }
  if (!userPremiumStatus) { alert("🔒 Cette fonctionnalité (Rapport PDF) est réservée aux églises abonnées Premium.\n\nCliquez sur le bouton ⭐ Premium en haut pour vous abonner."); return; }
  _ancien_ouvrirModalPdf(contexte);
};

var _ancien_exporterWordBox = exporterWordBox;
exporterWordBox = function(boxId, nom) {
  if (isSuperAdmin()) { _ancien_exporterWordBox(boxId, nom); return; }
  if (!userPremiumStatus) { alert("🔒 Cette fonctionnalité (Export Word) est réservée aux églises abonnées Premium."); return; }
  _ancien_exporterWordBox(boxId, nom);
};

function ouvrirModalPremium() { 
  if (userPremiumStatus) { alert("✅ Vous êtes Premium actif."); return; } 
  document.getElementById('premiumModal').style.display = 'flex'; 
}

function fermerModalPremium() { 
  document.getElementById('premiumModal').style.display = 'none'; 
}

function majInterfacePremium() {
  var box = document.getElementById('monCompteBox');
  if (box && currentUser) {
    var isDev = isSuperAdmin(); // LIGNE MODIFIÉE ICI
    var statut = isDev ? "<span style='color:green'>✅ Développeur (Illimité)</span>" : (userPremiumStatus ? "<span style='color:green'>✅ Premium</span>" : "<span style='color:red'>❌ Gratuit</span>");
    var expire = (userPremiumStatus && !isDev) ? new Date(userPremiumExpire).toLocaleDateString() : "-";
    box.innerHTML = "<p><strong>Email :</strong> " + currentUser.email + "</p><p><strong>Statut :</strong> " + statut + "</p>" + (isDev ? "" : "<p><strong>Valide jusqu'au :</strong> " + expire + "</p>");
    
    var card = document.getElementById('cardActivationRapide');
    if (card) {
      if (isDev) {
        card.style.display = 'block';
        if (typeof chargerListeClients === 'function') chargerListeClients();
      } else {
        card.style.display = 'none';
      }
    }
  }
}



