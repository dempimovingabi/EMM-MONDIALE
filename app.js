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

// ========== NAVIGATION ==========
function showSplash() {
  showScreen('splashScreen');
  setTimeout(function() {
    var splash = document.getElementById('splashScreen');
    if (splash && splash.classList.contains('active')) {
      showScreen('loginScreen');
    }
  }, 800);
}

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
  
  var w = window.open('', '_blank'); 
  
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

// ========== TABLEAU DE BORD & ANNONCES ==========
function exporterCSVFinance() {
  var cands = candidatsProvince().filter(function(c) { return !c.archived; });
  if (!cands.length) return alert("⚠️ Aucune donnée financière à exporter pour cette province.");
  var csvContent = "\uFEFF"; 
  csvContent += "Nom,Entite,Type,Motif,Montant Prevu,Total Verse,Solde,Statut\n";
  cands.forEach(function(c) {
    var nom = (c.nom || '').replace(/,/g, " ");
    var entite = (c.nomEntite || '').replace(/,/g, " ");
    var type = (c.typeEntite || '').replace(/,/g, " ");
    var motif = (c.motif || '').replace(/,/g, " ");
    var prevu = c.montantPrevu || 0;
    var verse = c.totalVerse || 0;
    var solde = prevu - verse;
    var statut = c.statut === 'termine' ? 'Termine' : 'En cours';
    csvContent += nom + "," + entite + "," + type + "," + motif + "," + prevu + "," + verse.toFixed(2) + "," + solde.toFixed(2) + "," + statut + "\n";
  });
  var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "EMM_Finance_" + getProvinceActive() + "_" + new Date().toISOString().slice(0,10) + ".csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  alert("✅ Fichier Excel téléchargé avec succès !");
}
var _chartPresenceInstance = null; 

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
  dessinerGraphiquePresence(totM, totS, totN);
}

function dessinerGraphiquePresence(m, s, nv) {
  if (typeof Chart === 'undefined') return;
  var canvas = document.getElementById('chartPresenceCanvas');
  if (!canvas) return;
  if (_chartPresenceInstance) _chartPresenceInstance.destroy();
  var dataValues = [m, s, nv];
  var labels = ['Membres', 'Sympathisants', 'Nouveaux'];
  var colors = ['#0a6e2c', '#1976d2', '#ff9800'];
  if (m === 0 && s === 0 && nv === 0) { dataValues = [1]; labels = ['Aucune donnée']; colors = ['#e0e0e0']; }
  var ctx = canvas.getContext('2d');
  _chartPresenceInstance = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: labels, datasets: [{ data: dataValues, backgroundColor: colors, borderWidth: 2, borderColor: '#ffffff' }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 13 } } } } }
  });
}

// ========== ANNONCES ==========
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
  if (!isAdmin() && !isSuperAdmin()) return alert('Réservé admin');
  var texte = document.getElementById('annonceText').value.trim(); 
  if (!texte) return alert('Écrivez une annonce');
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

function appliquerSession() {
  if (!currentUser) return;
  var label = document.getElementById('userRoleLabel');
  if (label) label.textContent = (currentUser.role === 'admin' ? '👑 Admin' : '👤 ' + (currentUser.nom || currentUser.email));
  refreshAll(); afficherDashboard(); afficherAnnonces(); rafraichirProvinceHeader();
}// ========== TABLEAU DE BORD & ANNONCES ==========
function exporterCSVFinance() {
  var cands = candidatsProvince().filter(function(c) { return !c.archived; });
  if (!cands.length) return alert("⚠️ Aucune donnée financière à exporter pour cette province.");
  var csvContent = "\uFEFF"; 
  csvContent += "Nom,Entite,Type,Motif,Montant Prevu,Total Verse,Solde,Statut\n";
  cands.forEach(function(c) {
    var nom = (c.nom || '').replace(/,/g, " ");
    var entite = (c.nomEntite || '').replace(/,/g, " ");
    var type = (c.typeEntite || '').replace(/,/g, " ");
    var motif = (c.motif || '').replace(/,/g, " ");
    var prevu = c.montantPrevu || 0;
    var verse = c.totalVerse || 0;
    var solde = prevu - verse;
    var statut = c.statut === 'termine' ? 'Termine' : 'En cours';
    csvContent += nom + "," + entite + "," + type + "," + motif + "," + prevu + "," + verse.toFixed(2) + "," + solde.toFixed(2) + "," + statut + "\n";
  });
  var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "EMM_Finance_" + getProvinceActive() + "_" + new Date().toISOString().slice(0,10) + ".csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  alert("✅ Fichier Excel téléchargé avec succès !");
}
var _chartPresenceInstance = null; 

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
  dessinerGraphiquePresence(totM, totS, totN);
}

function dessinerGraphiquePresence(m, s, nv) {
  if (typeof Chart === 'undefined') return;
  var canvas = document.getElementById('chartPresenceCanvas');
  if (!canvas) return;
  if (_chartPresenceInstance) _chartPresenceInstance.destroy();
  var dataValues = [m, s, nv];
  var labels = ['Membres', 'Sympathisants', 'Nouveaux'];
  var colors = ['#0a6e2c', '#1976d2', '#ff9800'];
  if (m === 0 && s === 0 && nv === 0) { dataValues = [1]; labels = ['Aucune donnée']; colors = ['#e0e0e0']; }
  var ctx = canvas.getContext('2d');
  _chartPresenceInstance = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: labels, datasets: [{ data: dataValues, backgroundColor: colors, borderWidth: 2, borderColor: '#ffffff' }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 13 } } } } }
  });
}

// ========== ANNONCES ==========
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
  if (!isAdmin() && !isSuperAdmin()) return alert('Réservé admin');
  var texte = document.getElementById('annonceText').value.trim(); 
  if (!texte) return alert('Écrivez une annonce');
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

// ========== MODULE I — JOURNALIÈRE ==========
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

// ========== MODULE I — FICHE MENSUELLE ==========
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
  signatureCtx.strokeStyle = getSignatureEncreColor(); 
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
function rafraichirCandidatsSelect() { var sel = document.getElementById('vCandidat'); if (!sel) return; var list = candidatsProvince().filter(function(c) { return c.statut === 'en_cours' && !c.archived; }); list.sort(function(a, b) { return a.nom.localeCompare(b.nom); }); var val = sel.value; var opts = ''; list.forEach(function(c) { opts += '<option value="' + c.id + '">' + c.nom + ' - ' + c.motif + ' (' + c.nomEntite + ')</option>'; }); if (!opts) opts = '<option value="">-- Aucun candidat en cours --</option>'; sel.innerHTML = opts; if (val// ========== MODULE I — JOURNALIÈRE ==========
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

// ========== MODULE I — FICHE MENSUELLE ==========
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
  signatureCtx.strokeStyle = getSignatureEncreColor(); 
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
function rafraichirCandidatsSelect() { var sel = document.getElementById('vCandidat'); if (!sel) return; var list = candidatsProvince().filter(function(c) { return c.statut === 'en_cours' && !c.archived; }); list.sort(function(a, b) { return a.nom.localeCompare(b.nom); }); var val = sel.value; var opts = ''; list.forEach(function(c) { opts += '<option value="' + c.id + '">' + c.nom + ' - ' + c.motif + ' (' + c.nomEntite + ')</option>'; }); if (!opts) opts = '<option value="">-- Aucun candidat en cours --</option>'; sel.innerHTML = opts; if (val
 = val; }
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

// =========================================================
// 🔥 INTÉGRATION FIREBASE & PREMIUM
// =========================================================
function login() {
  var errBox = document.getElementById('loginError');
  if (typeof auth === 'undefined' || typeof dbFS === 'undefined' || !firebase.apps || !firebase.apps.length) {
    if (errBox) errBox.textContent = '⏳ Chargement en cours...';
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
    if (errBox) errBox.textContent = '⏳ Chargement en cours...';
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
      email: email, phone: phone, premium: false, premiumExpire: 0, createdAt: new Date()
    });
  }).then(function() {
    errBox.textContent = '✅ Compte créé et enregistré !';
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
    verifierNouvellesAnnonces(); 
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
      var data = doc.data(); var expire = data.premiumExpire || 0;
      if (isSuperAdmin()) { userPremiumStatus = true; userPremiumExpire = now + (365 * 24 * 60 * 60 * 1000); } 
      else if (data.premium === true && expire > now) { userPremiumStatus = true; userPremiumExpire = expire; } 
      else { userPremiumStatus = false; userPremiumExpire = 0; }
    } else { userPremiumStatus = false; userPremiumExpire = 0; }
    if (btnPrem) { btnPrem.style.display = userPremiumStatus ? 'none' : 'block'; }
    if (typeof majInterfacePremium === 'function') majInterfacePremium();
    if (typeof afficherBanniereAbonnement === 'function') afficherBanniereAbonnement();
  }, function(error) {
    var btnPrem = document.getElementById('btnPremium'); if (btnPrem) btnPrem.style.display = 'block';
    if (typeof majInterfacePremium === 'function') majInterfacePremium();
  });
}

// --- VERIFICATION PREMIUM PDF & WORD ---
var _ancien_ouvrirModalPdf = ouvrirModalPdf;
ouvrirModalPdf = function(contexte) {
  if (isSuperAdmin()) { _ancien_ouvrirModalPdf(contexte); return; }
  if (!userPremiumStatus) { alert("🔒 Cette fonctionnalité est réservée aux églises Premium."); return; }
  _ancien_ouvrirModalPdf(contexte);
};
var _ancien_exporterWordBox = exporterWordBox;
exporterWordBox = function(boxId, nom) {
  if (isSuperAdmin()) { _ancien_exporterWordBox(boxId, nom); return; }
  if (!userPremiumStatus) { alert("🔒 Cette fonctionnalité est réservée aux églises Premium."); return; }
  _ancien_exporterWordBox(boxId, nom);
};

function ouvrirModalPremium() { if (userPremiumStatus) { alert("✅ Vous êtes Premium actif."); return; } document.getElementById('premiumModal').style.display = 'flex'; }
function fermerModalPremium() { document.getElementById('premiumModal').style.display = 'none'; }

function majInterfacePremium() {
  var box = document.getElementById('monCompteBox');
  if (box && currentUser) {
    var isDev = isSuperAdmin();
    var statut = isDev ? "<span style='color:green'>✅ Développeur (Illimité)</span>" : (userPremiumStatus ? "<span style='color:green'>✅ Premium</span>" : "<span style='color:red'>❌ Gratuit</span>");
    var expire = (userPremiumStatus && !isDev) ? new Date(userPremiumExpire).toLocaleDateString() : "-";
    box.innerHTML = "<p><strong>Email :</strong> " + currentUser.email + "</p><p><strong>Statut :</strong> " + statut + "</p>" + (isDev ? "" : "<p><strong>Valide jusqu'au :</strong> " + expire + "</p>");
    var card = document.getElementById('cardActivationRapide');
    if (card) { if (isDev) { card.style.display = 'block'; if (typeof chargerListeClients === 'function') chargerListeClients(); } else { card.style.display = 'none'; } }
  }
  if (typeof afficherBanniereAbonnement === 'function') afficherBanniereAbonnement();
}

function afficherBanniereAbonnement() {
  var banner = document.getElementById('premiumAlertBanner'); if (!banner) return;
  if (isSuperAdmin()) { banner.style.display = 'none'; return; }
  var now = Date.now(); var joursRestants = Math.ceil((userPremiumExpire - now) / (1000 * 60 * 60 * 24));
  if (!userPremiumStatus || userPremiumExpire < now) {
    banner.style.display = 'block'; banner.style.backgroundColor = '#ffebee'; banner.style.color = '#c62828';
    banner.innerHTML = '🔒 Votre abonnement a expiré. <u>Cliquez ici pour renouveler.</u>';
  } else if (joursRestants <= 7) {
    banner.style.display = 'block'; banner.style.backgroundColor = '#fff3e0'; banner.style.color = '#e65100';
    banner.innerHTML = '⚠️ Votre abonnement expire dans ' + joursRestants + ' jour(s). <u>Renouveler maintenant.</u>';
  } else { banner.style.display = 'none'; }
}

// --- GESTION DES CLIENTS (TABLEAU ADMIN) ---
function chargerListeClients() {
  if (!isSuperAdmin()) return;
  var box = document.getElementById('listeClientsAdmin'); if(!box) return;
  box.innerHTML = "⏳ Chargement des clients...";
  
  dbFS.collection('users').get().then(function(querySnapshot) {
    if (querySnapshot.empty) { box.innerHTML = "<p>Aucun client trouvé.</p>"; return; }
    var html = '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Email / Tel</th><th>Statut</th><th>Jours restants</th><th>Forfaits</th><th>Outils</th></tr></thead><tbody>';
    querySnapshot.forEach(function(doc) {
      var data = doc.data(); var docId = doc.id; var email = data.email || 'Inconnu'; var phone = data.phone || ''; 
      if (SUPER_ADMIN_EMAILS.includes(email)) return; 
      var isPrem = data.premium === true && (data.premiumExpire || 0) > Date.now();
      var isIllimite = data.premiumExpire > 32503680000000; 
      var joursRestants = 0; if (isPrem && !isIllimite) { joursRestants = Math.ceil((data.premiumExpire - Date.now()) / (1000 * 60 * 60 * 24)); }
      var badgeStatut = isIllimite ? '<span class="badge" style="background:#ffd700;color:#000;font-weight:bold;">♾️ Illimité</span>' : (isPrem ? '<span class="badge badge-ok">✅ Premium</span>' : '<span class="badge badge-archive">❌ Gratuit</span>');
      var txtJours = isIllimite ? 'À vie' : (isPrem ? joursRestants + ' j' : '-');
      html += '<tr><td style="font-size:11px;">' + email + '<br><span style="color:#666;">' + phone + '</span></td><td>' + badgeStatut + '</td><td style="text-align:center; font-weight:bold; color:' + (isPrem ? '#0a6e2c' : '#c62828') + '">' + txtJours + '</td>';
      html += '<td style="white-space:nowrap;">';
      html += '<button class="btn-mini" style="background:#4caf50;" onclick="modifierAbonnement(\'' + docId + '\', 30)">+30j</button> ';
      html += '<button class="btn-mini" style="background:#2196f3;" onclick="modifierAbonnement(\'' + docId + '\', 60)">+60j</button> ';
      html += '<button class="btn-mini" style="background:#ff9800;" onclick="modifierAbonnement(\'' + docId + '\', 90)">+90j</button> ';
      html += '<button class="btn-mini" style="background:#9c27b0;" onclick="modifierAbonnement(\'' + docId + '\', 9999)">♾️</button>';
      html += '</td><td style="white-space:nowrap;">';
      if (isPrem && phone) {
        var dateExp = isIllimite ? 'À vie' : new Date(data.premiumExpire).toLocaleDateString('fr-FR');
        html += '<button class="btn-mini" style="background:#25D366;" onclick="envoyerWhatsApp(\'' + phone + '\', \'' + email + '\', \'' + dateExp + '\')">📱 WA</button> ';
      }
      html += '<button class="btn-mini danger" onclick="supprimerClient(\'' + docId + '\')">🗑️</button></td></tr>';
    });
    html += '</tbody></table></div>'; box.innerHTML = html;
  }).catch(function(error) { box.innerHTML = "<p style='color:red;'>Erreur : " + error.message + "</p>"; });
}

function modifierAbonnement(docId, jours) {
  if (!isSuperAdmin()) return;
  dbFS.collection('users').doc(docId).get().then(function(doc) {
    if (!doc.exists) return;
    var data = doc.data(); var nouvelleExpiration;
    if (jours === 9999) { nouvelleExpiration = 32503680000000; } 
    else { var baseDate = (data.premiumExpire && data.premiumExpire > Date.now()) ? data.premiumExpire : Date.now(); nouvelleExpiration = baseDate + (jours * 24 * 60 * 60 * 1000); }
    return dbFS.collection('users').doc(docId).update({ premium: true, premiumExpire: nouvelleExpiration });
  }).then(function() { chargerListeClients(); alert('✅ Abonnement mis à jour !'); }).catch(function(err) { alert("Erreur : " + err.message); });
}

function envoyerWhatsApp(phone, email, dateExp) {
  var cleanPhone = phone.replace(/\s+/g, '').replace('+', '');
  var message = "Bonjour ! Votre compte EMM Mondial (" + email + ") a bien été activé. Il est valide jusqu'au : " + dateExp + ". Que Dieu vous bénisse !";
  window.open("https://wa.me/" + cleanPhone + "?text=" + encodeURIComponent(message), '_blank');
}

function supprimerClient(docId) {
  if (!isSuperAdmin()) return;
  if (!confirm("⚠️ Supprimer définitivement ce client ?")) return;
  dbFS.collection('users').doc(docId).delete().then(function() { chargerListeClients(); alert("✅ Client supprimé."); }).catch(function(error) { alert("Erreur : " + error.message); });
}

// --- NOTIFICATIONS (CLOCHE) ---
var _derniereAnnonceVueId = localStorage.getItem('derniereAnnonceVue') || null;

function verifierNouvellesAnnonces() {
  if (!currentUser) return;
  dbFS.collection('annonces').orderBy('dateCreation', 'desc').limit(1).onSnapshot(function(querySnapshot) {
    if (querySnapshot.empty) return;
    var derniereAnnonce = querySnapshot.docs[0]; var annonceId = derniereAnnonce.id;
    var badge = document.getElementById('notifBadge');
    if (badge) { badge.style.display = (_derniereAnnonceVueId !== annonceId) ? 'block' : 'none'; }
  });
}

function ouvrirNotifications() {
  var badge = document.getElementById('notifBadge'); if (badge) badge.style.display = 'none';
  dbFS.collection('annonces').orderBy('dateCreation', 'desc').limit(1).get().then(function(snap) {
    if (!snap.empty) { localStorage.setItem('derniereAnnonceVue', snap.docs[0].id); _derniereAnnonceVueId = snap.docs[0].id; }
  });
  var modal = document.getElementById('annoncesModal'); var listeBox = document.getElementById('listeAnnoncesModal');
  if (modal && listeBox) {
    modal.style.display = 'flex'; listeBox.innerHTML = '<p style="text-align:center;color:#888;">Chargement...</p>';
    dbFS.collection('annonces').orderBy('dateCreation', 'desc').get().then(function(querySnapshot) {
      if (querySnapshot.empty) { listeBox.innerHTML = '<p style="text-align:center;color:#888;">Aucune annonce pour le moment.</p>'; return; }
      var html = '';
      querySnapshot.forEach(function(doc) {
        var a = doc.data(); if (a.archived) return;
        html += '<div class="item-list" style="margin-bottom:10px; padding:10px; border:1px solid #eee; border-radius:8px; background:#f9f9f9;">';
        html += '<strong style="color:#0a6e2c;">📢 ' + a.date + '</strong> — <span style="font-size:11px;color:#666;">' + (a.auteur||'Admin') + '</span><br><p style="margin-top:5px; font-size:14px;">' + echapper(a.texte) + '</p>';
        if (isAdmin() || isSuperAdmin()) { html += '<button class="btn-mini danger" style="margin-top:8px;" onclick="supprimerAnnonceCloud(\'' + doc.id + '\')">🗑️ Supprimer</button>'; }
        html += '</div>';
      });
      listeBox.innerHTML = html;
    });
  }
}

function supprimerAnnonceCloud(id) {
  if (!isAdmin() && !isSuperAdmin()) return;
  if (!confirm('Supprimer cette annonce ?')) return;
  dbFS.collection('annonces').doc(id).delete().then(function() { ouvrirNotifications(); afficherAnnonces(); });
}

// ========== REFRESH GLOBAL ET DEMARRAGE ==========
function refreshAll() { 
  try { rafraichirProvinceHeader(); } catch(e) {}
  try { peuplerProvinceSelects(); } catch(e) {}
  try { rafraichirEntites(); } catch(e) {}
  try { afficherListeEntites(); } catch(e) {}
  try { afficherJournaliere(); } catch(e) {}
  try { rafraichirCandidatsSelect(); } catch(e) {}
  try { afficherCandidats(); } catch(e) {}
  try { afficherVersements(); } catch(e) {}
  try { refreshPatrimoineSites(); } catch(e) {}
  try { recalculerTotauxRN(); } catch(e) {}
  try { syncSignatureEncrePickers(); } catch(e) {}
}

document.addEventListener('DOMContentLoaded', function() {
  showScreen('splashScreen');
  rafraichirProvinceHeader(); peuplerProvinceSelects(); syncSignatureEncrePickers(); 
  setTimeout(function() {
    var splash = document.getElementById('splashScreen');
    if (splash && splash.classList.contains('active')) { showScreen('loginScreen'); }
  }, 800);
  setTimeout(function() {
    DB.init().then(function() { try { initDB(); } catch(e) {} }).catch(function(e) { console.error('❌ DB:', e); });
  }, 100);
});

document.addEventListener('click', function(e) { var menu = document.getElementById('mainMenu'); var btn = document.querySelector('.btn-hamburger'); if (menu && menu.classList.contains('open') && !menu.contains(e.target) && btn && !btn.contains(e.target)) { fermerMainMenu(); } });
window._signalerSauvegarde = function() { var el = document.getElementById('saveIndicator'); if (!el) return; el.style.opacity = '1'; el.textContent = '💾 Sauvegardé'; clearTimeout(window._saveTimeout); window._saveTimeout = setTimeout(function() { el.style.opacity = '0.35'; el.textContent = '💾'; }, 1200); };
function majBandeauOffline() { var banner = document.getElementById('offlineBanner'); if (!banner) return; banner.style.display = navigator.onLine ? 'none' : 'block'; }
window.addEventListener('online', majBandeauOffline); window.addEventListener('offline', majBandeauOffline); window.addEventListener('load', majBandeauOffline);

