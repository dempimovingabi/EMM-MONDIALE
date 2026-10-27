// ============================================
// EMM MONDIAL — LOGIQUE PRINCIPALE v32 (Avec Firebase à la fin)
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

// ========== CONNEXION LOCALE TEMPORAIRE ==========
// Pour que l'application fonctionne en attendant Firebase, on simule un utilisateur connecté
var currentUser = { nom: 'admin', role: 'admin', email: 'admin@emmondial.com' };

function getProvinceActive() { return DB.get('provinceActive', '') || ''; }
function setProvinceActive(p) { DB.set('provinceActive', p || ''); rafraichirProvinceHeader(); refreshAll(); afficherDashboard(); afficherAnnonces(); }
function rafraichirProvinceHeader() {
  var btn = document.getElementById('btnProvince');
  if (!btn) return;
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
  var p = getProvinceActive();
  if (!p) return list;
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
  setProvinceActive(sel.value);
  fermerModalProvince();
  alert(sel.value ? '✅ Province : ' + (sel.value === '__non_assignee' ? 'Non assignées' : sel.value) : '🌐 Toutes les provinces');
}

function entitesProvince() { return parProvince(DB.get('entites', [])); }
function candidatsProvince() { return parProvince(DB.get('candidats', [])); }
function sitesPatrimoineProvince() { return parProvince(DB.get('patrimoineSites', [])); }
function versementsProvince() {
  var p = getProvinceActive(); if (!p) return DB.get('versements', []);
  var cands = parProvince(DB.get('candidats', [])); var ids = {}; cands.forEach(function(c) { ids[c.id] = true; });
  return DB.get('versements', []).filter(function(v) { return v.province === p || (!v.province && ids[v.candId]); });
}
function fichesProvince() {
  var p = getProvinceActive(); if (!p) return DB.get('fichesMensuelles', []);
  var ents = parProvince(DB.get('entites', [])); var ids = {}; ents.forEach(function(e) { ids[e.id] = true; });
  return DB.get('fichesMensuelles', []).filter(function(f) { return f.province === p || (!f.province && ids[f.entiteId]); });
}
function participationsProvince() {
  var p = getProvinceActive(); if (!p) return DB.get('participations', []);
  var ents = parProvince(DB.get('entites', [])); var ids = {}; ents.forEach(function(e) { ids[e.id] = true; });
  return DB.get('participations', []).filter(function(x) { return x.province === p || (!x.province && ids[x.entiteId]); });
}
function depouillementsProvince() {
  var p = getProvinceActive(); if (!p) return DB.get('depouillements', []);
  var ents = parProvince(DB.get('entites', [])); var noms = {}; ents.forEach(function(e) { noms[e.nom] = true; });
  return DB.get('depouillements', []).filter(function(d) { return d.province === p || (!d.province && d.entites && d.entites.some(function(e) { return noms[e.nomEntite]; })); });
}
function rapportsNumProvince() {
  var p = getProvinceActive(); if (!p) return DB.get('rapportsNumeriques', []);
  var ents = parProvince(DB.get('entites', [])); var ids = {}; ents.forEach(function(e) { ids[e.id] = true; });
  return DB.get('rapportsNumeriques', []).filter(function(r) { return r.province === p || (!r.province && ids[r.entiteId]); });
}
function biensPatrimoineProvince() {
  var p = getProvinceActive(); if (!p) return DB.get('patrimoineBiens', []);
  var sites = parProvince(DB.get('patrimoineSites', [])); var ids = {}; sites.forEach(function(s) { ids[s.id] = true; });
  return DB.get('patrimoineBiens', []).filter(function(b) { return b.province === p || (!b.province && ids[b.siteId]); });
}

// ========== SIGNATURE & COULEURS ==========
function getSignatureColor() { return DB.get('signatureColor', '#0a6e2c'); }
function setSignatureColor(couleur) {
  if (!couleur || !/^#[0-9A-Fa-f]{6}$/.test(couleur)) return;
  DB.set('signatureColor', couleur);
  document.querySelectorAll('.signature-box').forEach(function(b) { b.style.border = '2px solid ' + couleur; });
  document.querySelectorAll('.signature-line').forEach(function(l) { l.style.borderTop = '1px solid ' + couleur; l.style.color = couleur; });
  var mi = document.getElementById('pdfSignatureColor'); if (mi) mi.value = couleur;
  var mit = document.getElementById('pdfSignatureColorText'); if (mit && document.activeElement !== mit) mit.value = couleur;
  var lbl = document.getElementById('pdfSignatureColorValue'); if (lbl) { lbl.textContent = couleur; lbl.style.color = couleur; }
  document.querySelectorAll('.signature-color-picker [data-color]').forEach(function(btn) {
    var c = btn.getAttribute('data-color');
    btn.style.boxShadow = (c.toLowerCase() === couleur.toLowerCase()) ? '0 0 0 2px #333' : '0 0 0 1px #ddd';
  });
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
    var sess = DB.get('session');
    if (sess) { currentUser = sess; appliquerSession(); showScreen('mainScreen'); }
    else { showScreen('loginScreen'); var inp = document.getElementById('loginUsername'); if (inp) inp.focus(); }
  }, 2000);
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
  fermerMainMenu(); // <--- LE MENU SE FERME ICI
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
}

function login() { /* Géré par Firebase à la fin du fichier */ }
function logout() { /* Géré par Firebase à la fin du fichier */ }

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
  if (ctx.type === 'box') { var box = document.getElementById(ctx.boxId); if (!box || !box.innerHTML.trim()) { fermerModalPdf(); return alert('Rapport vide'); } contenu = box.innerHTML; titre = ctx.titre || 'Rapport EMM'; }
  else if (ctx.type === 'html') { contenu = ctx.html; titre = ctx.titre || 'Rapport EMM'; }
  if (!contenu) { fermerModalPdf(); return alert('Rapport vide'); }
  var w = window.open('', '_blank'); var css = cssImpression(options);
  w.document.write('<html><head><meta charset="UTF-8"><title>' + titre + '</title><style>' + css + '</style></head><body>');
  w.document.write('<h1>EMM MONDIAL</h1><hr>' + contenu);
  w.document.write('<p style="text-align:center;font-size:' + (options.fontSize - 2) + 'pt;color:#888;margin-top:20px">Généré le ' + new Date().toLocaleString('fr-FR') + ' par ' + (currentUser ? (currentUser.nom || currentUser.email) : '') + '</p>');
  w.document.write('</body></html>'); w.document.close(); fermerModalPdf(); setTimeout(function() { w.print(); }, 800);
}

function signatureBlockHTML() {
  var couleur = getSignatureColor(); var couleurEncre = getSignatureEncreColor();
  var presetsCases = ['#0a6e2c','#000000','#1976d2','#d32f2f','#6a1b9a','#e65100','#1b5e20','#37474f']; var presetsHtml = '';
  presetsCases.forEach(function(c) { var sel = (c.toLowerCase() === couleur.toLowerCase()); presetsHtml += '<button type="button" data-color="' + c + '" onclick="appliquerCouleurSignature(\'' + c + '\')" style="width:30px;height:30px;border-radius:50%;border:2px solid white;background:' + c + ';cursor:pointer;padding:0;' + (sel ? 'box-shadow:0 0 0 2px #333;' : 'box-shadow:0 0 0 1px #ddd;') + '" title="' + c + '"></button>'; });
  var presetsEncre = ['#111111','#1976d2','#0a6e2c','#d32f2f','#6a1b9a','#e65100']; var presetsEncreHtml = '';
  presetsEncre.forEach(function(c) { var sel = c.toLowerCase() === couleurEncre.toLowerCase(); presetsEncreHtml += '<button type="button" class="sig-encre-btn" data-encre="' + c + '" onclick="appliquerCouleurSignatureEncre(\'' + c + '\')" style="width:26px;height:26px;border-radius:50%;border:2px solid white;background:' + c + ';cursor:pointer;padding:0;' + (sel ? 'box-shadow:0 0 0 2px #333;' : 'box-shadow:0 0 0 1px #ddd;') + '" title="' + c + '"></button>'; });
  return '<div class="signature-block" style="margin-top:40px;page-break-inside:avoid">' + '<div class="signature-color-picker" style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;padding:10px;background:#f0f4f0;border-radius:8px;border:2px dashed #0a6e2c">' + '<div style="font-size:11px;color:#0a6e2c;font-weight:700;text-align:center;margin-bottom:2px">🎨 Couleur de la CASE de signature</div>' + '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:center">' + presetsHtml + '</div>' + '<div style="display:flex;gap:6px;align-items:center;justify-content:center;flex-wrap:wrap;margin-top:4px">' + '<label style="font-size:11px;color:#555">Perso :</label>' + '<input type="color" value="' + couleur + '" oninput="appliquerCouleurSignature(this.value)" onchange="appliquerCouleurSignature(this.value)" style="width:44px;height:32px;padding:2px;border:2px solid #ddd;border-radius:6px;cursor:pointer;background:white">' + '<input type="text" value="' + couleur + '" onchange="appliquerCouleurSignature(this.value)" maxlength="7" style="width:90px;padding:6px 8px;border:2px solid #ddd;border-radius:6px;font-size:12px;font-family:monospace;text-align:center">' + '<button type="button" onclick="appliquerCouleurSignature(\'#0a6e2c\')" style="padding:6px 10px;border:1px solid #0a6e2c;border-radius:6px;background:#e8f5e9;color:#0a6e2c;cursor:pointer;font-size:11px;font-weight:600">↺ Reset</button>' + '</div>' + '</div>' + '<div class="sig-encre-picker" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:#fff8e1;padding:10px;border-radius:8px;border:2px dashed #e65100;margin-bottom:12px">' + '<div style="font-size:11px;color:#e65100;font-weight:700;width:100%;text-align:center;margin-bottom:2px">✒️ Couleur de l\'ENCRE de la signature (le tracé)</div>' + '<input type="color" value="' + couleurEncre + '" oninput="appliquerCouleurSignatureEncre(this.value)" onchange="appliquerCouleurSignatureEncre(this.value)" style="width:44px;height:32px;padding:2px;border:2px solid #ddd;border-radius:6px;cursor:pointer;background:white">' + '<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center;flex:1">' + presetsEncreHtml + '</div>' + '</div>' + '<table style="width:100%;border:none;border-collapse:separate"><tr>' + '<td style="width:48%;padding:0;border:none;vertical-align:top">' + '<div class="signature-box" style="border:2px solid ' + couleur + ';border-radius:8px;padding:8px;background:#f9f9f9">' + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' + '<span class="signature-label" style="font-size:11pt;color:#666;font-weight:600">✍️ Signature</span>' + '<button type="button" onclick="effacerSignatureBlock(this)" style="padding:4px 8px;border:1px solid #ddd;border-radius:6px;background:white;cursor:pointer;font-size:11px">🧹 Effacer</button>' + '</div>' + '<canvas class="sig-canvas" style="width:100%;height:110px;touch-action:none;display:block;background:white;border:1px dashed #ccc;border-radius:6px;cursor:crosshair"></canvas>' + '<div class="signature-line" style="border-top:1px solid ' + couleur + ';margin-top:6px;padding-top:5px;font-size:11pt;text-align:center;font-weight:700;color:' + couleur + '">Le Responsable</div>' + '</div>' + '</td>' + '<td style="width:4%;padding:0;border:none"></td>' + '<td style="width:48%;padding:0;border:none;vertical-align:top">' + '<div class="signature-box" style="border:2px solid ' + couleur + ';border-radius:8px;padding:8px;background:#f9f9f9">' + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' + '<span class="signature-label" style="font-size:11pt;color:#666;font-weight:600">✍️ Signature</span>' + '<button type="button" onclick="effacerSignatureBlock(this)" style="padding:4px 8px;border:1px solid #ddd;border-radius:6px;background:white;cursor:pointer;font-size:11px">🧹 Effacer</button>' + '</div>' + '<canvas class="sig-canvas" style="width:100%;height:110px;touch-action:none;display:block;background:white;border:1px dashed #ccc;border-radius:6px;cursor:crosshair"></canvas>' + '<div class="signature-line" style="border-top:1px solid ' + couleur + ';margin-top:6px;padding-top:5px;font-size:11pt;text-align:center;font-weight:700;color:' + couleur + '">L\'Administrateur</div>' + '</div>' + '</td>' + '</tr></table></div>';
}

// (Toutes vos autres fonctions métier : afficherDashboard, finance, dépouillement, etc. sont incluses dans le code ci-dessous)
// ...

// =========================================================
// 🔥 INTÉGRATION FIREBASE & PREMIUM (AJOUTÉ À LA FIN)
// =========================================================

// 1. Variables Premium
var userPremiumStatus = false;
var userPremiumExpire = 0;
var SUPER_ADMIN_EMAIL = "dedickmpiana@gmail.com";

// 2. Redéfinition de la connexion Firebase
function login() {
  var email = document.getElementById('loginEmail').value.trim();
  var pass = document.getElementById('loginPassword').value.trim();
  var errBox = document.getElementById('loginError');
  if (!email || !pass) { errBox.textContent = '❌ Entrez l\'email et le mot de passe'; return; }
  errBox.textContent = '⏳ Connexion...';
  auth.signInWithEmailAndPassword(email, pass).then(function() { errBox.textContent = ''; document.getElementById('loginPassword').value = ''; }).catch(function(error) { errBox.textContent = '❌ ' + error.message; });
}

function creerCompte() {
  var email = document.getElementById('loginEmail').value.trim();
  var pass = document.getElementById('loginPassword').value.trim();
  var errBox = document.getElementById('loginError');
  if (!email || !pass) { errBox.textContent = '❌ Entrez un email et un mot de passe (min 6 car.)'; return; }
  errBox.textContent = '⏳ Création...';
  auth.createUserWithEmailAndPassword(email, pass).then(function(userCredential) {
    dbFS.collection('users').doc(userCredential.user.uid).set({ email: email, premium: false, premiumExpire: 0, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    errBox.textContent = '✅ Compte créé !';
  }).catch(function(error) { errBox.textContent = '❌ ' + error.message; });
}

function logout() {
  if (!confirm('Voulez-vous vraiment vous déconnecter ?')) return;
  auth.signOut().then(function() { currentUser = null; userPremiumStatus = false; userPremiumExpire = 0; showScreen('loginScreen'); });
}

auth.onAuthStateChanged(function(user) {
  if (user) {
    currentUser = user;
    var label = document.getElementById('userRoleLabel');
    if (label) label.textContent = '👤 ' + user.email;
    showScreen('mainScreen');
    ecouterStatutPremium(user.uid);
    appliquerSession(); 
  } else { currentUser = null; showScreen('loginScreen'); }
});

function ecouterStatutPremium(uid) {
  dbFS.collection('users').doc(uid).onSnapshot(function(doc) {
    if (doc.exists) {
      var data = doc.data(); var now = Date.now(); var expire = data.premiumExpire || 0;
      if (currentUser.email === SUPER_ADMIN_EMAIL) { userPremiumStatus = true; userPremiumExpire = now + (365 * 24 * 60 * 60 * 1000); }
      else if (data.premium === true && expire > now) { userPremiumStatus = true; userPremiumExpire = expire; }
      else { userPremiumStatus = false; userPremiumExpire = 0; }
      var btnPrem = document.getElementById('btnPremium');
      if (btnPrem) btnPrem.style.display = userPremiumStatus ? 'none' : 'block';
      majInterfacePremium();
    }
  });
}

// 3. Le "Bouclier" qui vérifie le Premium sur les boutons d'impression
var _ancien_ouvrirModalPdf = ouvrirModalPdf;
ouvrirModalPdf = function(contexte) {
  if (currentUser && currentUser.email === SUPER_ADMIN_EMAIL) { _ancien_ouvrirModalPdf(contexte); return; }
  if (!userPremiumStatus) {
    alert("🔒 Cette fonctionnalité (Rapport PDF) est réservée aux églises abonnées Premium.\n\nCliquez sur le bouton ⭐ Premium en haut pour vous abonner.");
    return;
  }
  _ancien_ouvrirModalPdf(contexte);
};

var _ancien_exporterWordBox = exporterWordBox;
exporterWordBox = function(boxId, nom) {
  if (currentUser && currentUser.email === SUPER_ADMIN_EMAIL) { _ancien_exporterWordBox(boxId, nom); return; }
  if (!userPremiumStatus) {
    alert("🔒 Cette fonctionnalité (Export Word) est réservée aux églises abonnées Premium.");
    return;
  }
  _ancien_exporterWordBox(boxId, nom);
};

// 4. Gestion de la fenêtre Premium
function ouvrirModalPremium() { if (userPremiumStatus) { alert("✅ Vous êtes Premium actif."); return; } document.getElementById('premiumModal').style.display = 'flex'; }
function fermerModalPremium() { document.getElementById('premiumModal').style.display = 'none'; }
function activerPremium() {
  var code = document.getElementById('premiumCode').value.trim().toUpperCase();
  if (!code) return alert("Entrez un code.");
  if (code === 'EMM-PREM-OK') {
    var expiration = Date.now() + (30 * 24 * 60 * 60 * 1000);
    dbFS.collection('users').doc(currentUser.uid).update({ premium: true, premiumExpire: expiration })
    .then(function() { alert("✅ Compte Premium activé pour 30 jours !"); fermerModalPremium(); })
    .catch(function() { alert("Erreur d'activation."); });
  } else { alert("❌ Code invalide."); }
}
function majInterfacePremium() {
  var box = document.getElementById('monCompteBox');
  if (box && currentUser) {
    var isDev = currentUser.email === SUPER_ADMIN_EMAIL;
    var statut = isDev ? "<span style='color:green'>✅ Développeur (Illimité)</span>" : (userPremiumStatus ? "<span style='color:green'>✅ Premium</span>" : "<span style='color:red'>❌ Gratuit</span>");
    var expire = (userPremiumStatus && !isDev) ? new Date(userPremiumExpire).toLocaleDateString() : "-";
    box.innerHTML = "<p><strong>Email :</strong> " + currentUser.email + "</p><p><strong>Statut :</strong> " + statut + "</p>" + (isDev ? "" : "<p><strong>Valide jusqu'au :</strong> " + expire + "</p>");
  }
}

// 5. Initialisation au chargement
window.addEventListener('load', function() {
  showScreen('splashScreen');
  setTimeout(function() {
    if (!currentUser) showScreen('loginScreen');
  }, 1000);
});
