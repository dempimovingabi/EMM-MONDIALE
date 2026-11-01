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
// ========== SIGNATURE COULEUR ==========
function getSignatureColor() { return DB.get('signatureColor', '#0a6e2c'); }
function setSignatureColor(couleur) {
  if (!couleur || !/^#[0-9A-Fa-f]{6}$/.test(couleur)) return;
  DB.set('signatureColor', couleur);
  document.querySelectorAll('.signature-box').forEach(function(b) { b.style.border = '2px solid ' + couleur; });
  document.querySelectorAll('.signature-line').forEach(function(l) { l.style.borderTop = '1px solid ' + couleur; l.style.color = couleur; });
  var mi = document.getElementById('pdfSignatureColor'); if (mi) mi.value = couleur;
  var mit = document.getElementById('pdfSignatureColorText'); if (mit && document.activeElement !== mit) mit.value = couleur;
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
  if (signatureCtx) { signatureCtx.strokeStyle = c; signatureCtx.fillStyle = c; }
}
function appliquerCouleurSignatureEncre(c) {
  if (!c) return; var v = String(c).trim(); if (v[0] !== '#') v = '#' + v;
  if (!/^#[0-9A-Fa-f]{6}$/.test(v)) return; setSignatureEncreColor(v);
}
function syncSignatureEncrePickers() { }

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
function captureSignaturesFromDOM() { return null; }

// ========== MODAL PDF OPTIONS ==========
var pdfContexteEnAttente = null;
function ouvrirModalPdf(contexte) {
  pdfContexteEnAttente = contexte; var sigColor = getSignatureColor();
  var input = document.getElementById('pdfSignatureColor'); if (input) input.value = sigColor;
  var itext = document.getElementById('pdfSignatureColorText'); if (itext) itext.value = sigColor;
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
    ' body { font-family: ' + options.fontFamily + '; font-size: ' + fs + 'pt; padding: 10px; color: #222; line-height: 1.45; }' +
    ' h1 { text-align: center; color: #0a6e2c; font-size: ' + (fs + 6) + 'pt; margin-bottom: 8px; }' +
    ' h2 { color: #0a6e2c; font-size: ' + (fs + 4) + 'pt; margin: 14px 0 8px; border-left: 4px solid #0a6e2c; padding-left: 8px; }' +
    ' h3 { color: #0a6e2c; font-size: ' + (fs + 3) + 'pt; margin: 12px 0 6px; }' +
    ' table { width: 100%; border-collapse: collapse; font-size: ' + (fs - 1) + 'pt; margin: 8px 0; }' +
    ' th { background: #0a6e2c !important; color: white !important; padding: 7px; text-align: left; }' +
    ' td { padding: 6px 7px; border-bottom: 1px solid #ddd; }' +
    ' td.num { text-align: right; }' +
    ' tfoot td { font-weight: bold; background: #e8f5e9 !important; color: #0a6e2c !important; border-top: 2px solid #0a6e2c; }' +
    ' .entity-block { background: #f9f9f9 !important; border-radius: 8px; padding: 10px; margin-bottom: 12px; border-left: 4px solid #0a6e2c; page-break-inside: avoid; }' +
    ' .signature-block { page-break-inside: avoid !important; margin-top: 40px !important; }' +
    ' .signature-block table { width: 100% !important; margin: 0 !important; border-collapse: separate !important; }' +
    ' .signature-block td { border: none !important; padding: 0 !important; background: transparent !important; vertical-align: top !important; }' +
    ' .sig-canvas { display: none !important; }' +
    ' .signature-box { border: 2px solid ' + sigColor + ' !important; border-radius: 8px !important; padding: 8px !important; background: #f9f9f9 !important; }' +
    ' .signature-line { border-top: 1px solid ' + sigColor + ' !important; padding-top: 5px !important; text-align: center !important; font-weight: 700 !important; color: ' + sigColor + ' !important; margin-top: 6px !important; }';
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
  w.document.write('</body></html>'); 
  w.document.close(); 
  fermerModalPdf(); 
  
  setTimeout(function() { w.print(); }, 800);
}
function signatureBlockHTML() {
  var couleur = getSignatureColor(); var couleurEncre = getSignatureEncreColor();
  var presetsCases = ['#0a6e2c','#000000','#1976d2','#d32f2f','#6a1b9a','#e65100','#1b5e20','#37474f']; var presetsHtml = '';
  presetsCases.forEach(function(c) { var sel = (c.toLowerCase() === couleur.toLowerCase()); presetsHtml += '<button type="button" data-color="' + c + '" onclick="appliquerCouleurSignature(\'' + c + '\')" style="width:30px;height:30px;border-radius:50%;border:2px solid white;background:' + c + ';cursor:pointer;padding:0;' + (sel ? 'box-shadow:0 0 0 2px #333;' : 'box-shadow:0 0 0 1px #ddd;') + '" title="' + c + '"></button>'; });
  
  return '<div class="signature-block" style="margin-top:40px;page-break-inside:avoid">' + 
         '<div class="signature-color-picker" style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;padding:10px;background:#f0f4f0;border-radius:8px;border:2px dashed #0a6e2c">' + 
         '<div style="font-size:11px;color:#0a6e2c;font-weight:700;text-align:center;margin-bottom:2px">🎨 Couleur de la CASE de signature</div>' + 
         '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:center">' + presetsHtml + '</div>' + 
         '<div style="display:flex;gap:6px;align-items:center;justify-content:center;flex-wrap:wrap;margin-top:4px">' + 
         '<label style="font-size:11px;color:#555">Perso :</label>' + 
         '<input type="color" value="' + couleur + '" oninput="appliquerCouleurSignature(this.value)" onchange="appliquerCouleurSignature(this.value)" style="width:44px;height:32px;padding:2px;border:2px solid #ddd;border-radius:6px;cursor:pointer;background:white">' + 
         '<input type="text" value="' + couleur + '" onchange="appliquerCouleurSignature(this.value)" maxlength="7" style="width:90px;padding:6px 8px;border:2px solid #ddd;border-radius:6px;font-size:12px;font-family:monospace;text-align:center">' + 
         '<button type="button" onclick="appliquerCouleurSignature(\'#0a6e2c\')" style="padding:6px 10px;border:1px solid #0a6e2c;border-radius:6px;background:#e8f5e9;color:#0a6e2c;cursor:pointer;font-size:11px;font-weight:600">↺ Reset</button>' + 
         '</div>' + 
         '</div>' + 
         '<table style="width:100%;border:none;border-collapse:separate"><tr>' + 
         '<td style="width:48%;padding:0;border:none;vertical-align:top">' + 
         '<div class="signature-box" style="border:2px solid ' + couleur + ';border-radius:8px;padding:8px;background:#f9f9f9">' + 
         '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' + 
         '<span class="signature-label" style="font-size:11pt;color:#666;font-weight:600">✍️ Signature</span>' + 
         '<button type="button" onclick="effacerSignatureBlock(this)" style="padding:4px 8px;border:1px solid #ddd;border-radius:6px;background:white;cursor:pointer;font-size:11px">🧹 Effacer</button>' + 
         '</div>' + 
         '<canvas class="sig-canvas" style="width:100%;height:110px;touch-action:none;display:block;background:white;border:1px dashed #ccc;border-radius:6px;cursor:crosshair"></canvas>' + 
         '<div class="signature-line" style="border-top:1px solid ' + couleur + ';margin-top:6px;padding-top:5px;font-size:11pt;text-align:center;font-weight:700;color:' + couleur + '">Le Responsable</div>' + 
         '</div>' + 
         '</td>' + 
         '<td style="width:4%;padding:0;border:none"></td>' + 
         '<td style="width:48%;padding:0;border:none;vertical-align:top">' + 
         '<div class="signature-box" style="border:2px solid ' + couleur + ';border-radius:8px;padding:8px;background:#f9f9f9">' + 
         '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' + 
         '<span class="signature-label" style="font-size:11pt;color:#666;font-weight:600">✍️ Signature</span>' + 
         '<button type="button" onclick="effacerSignatureBlock(this)" style="padding:4px 8px;border:1px solid #ddd;border-radius:6px;background:white;cursor:pointer;font-size:11px">🧹 Effacer</button>' + 
         '</div>' + 
         '<canvas class="sig-canvas" style="width:100%;height:110px;touch-action:none;display:block;background:white;border:1px dashed #ccc;border-radius:6px;cursor:crosshair"></canvas>' + 
         '<div class="signature-line" style="border-top:1px solid ' + couleur + ';margin-top:6px;padding-top:5px;font-size:11pt;text-align:center;font-weight:700;color:' + couleur + '">L\'Administrateur</div>' + 
         '</div>' + 
         '</td>' + 
         '</tr></table></div>';
}
// ========== TABLEAU DE BORD ==========
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
  var box = document.getElementById('dashboardBox'); if (!box) return;
  var entites = entitesProvince().filter(function(e) { return !e.archived; }).length;
  var parts = participationsProvince().filter(function(p) { return !p.archived; });
  var totM = 0, totS = 0, totN = 0; parts.forEach(function(p) { totM += p.m; totS += p.s; totN += p.n; });
  var totPart = totM + totS + totN;
  var fiches = fichesProvince().filter(function(f) { return !f.archived; }).length;
  var cands = candidatsProvince().filter(function(c) { return !c.archived; });
  var totalVerse = cands.reduce(function(a, c) { return a + (c.totalVerse || 0); }, 0);
  var deps = depouillementsProvince().filter(function(d) { return !d.archived; });
  var soldeDepFC = 0, soldeDepUSD = 0; deps.forEach(function(d) { d.entites.forEach(function(e) { var s = sumEntiteDep(e); soldeDepFC += s.soldeFC; soldeDepUSD += s.soldeUSD; }); });
  var sitesP = sitesPatrimoineProvince().filter(function(s) { return !s.archived; }).length;
  var biensP = biensPatrimoineProvince().filter(function(b) { return !b.archived; }).length;
  var provinceLabel = getProvinceActive() || 'Toutes';
  var html = '<p style="text-align:center;font-size:12px;color:#0a6e2c;font-weight:600;margin-bottom:10px">🌍 Province : ' + echapper(provinceLabel === '__non_assignee' ? 'Non assignées' : provinceLabel) + '</p>';
  html += '<div style="background: #fff; padding: 15px; border-radius: 8px; margin-bottom: 15px;"><h4 style="text-align:center; color:#0a6e2c;">📊 Présences</h4><div style="position: relative; height: 250px;"><canvas id="chartPresenceCanvas"></canvas></div></div>';
  html += '<div class="table-wrapper"><table class="data-table"><tbody>';
  html += '<tr><th colspan="2">📈 FRÉQUENCES</th></tr><tr><td>Entités</td><td class="num">' + entites + '</td></tr><tr><td>Présences</td><td class="num">' + totPart + '</td></tr><tr><td>Fiches</td><td class="num">' + fiches + '</td></tr>';
  html += '<tr><th colspan="2">💰 FINANCE</th></tr><tr><td>Candidats</td><td class="num">' + cands.length + '</td></tr><tr><td>Versé</td><td class="num">' + totalVerse.toFixed(2) + ' $</td></tr>';
  html += '<tr><th colspan="2">🧾 DÉPOUILLEMENT</th></tr><tr><td>Séances</td><td class="num">' + deps.length + '</td></tr><tr><td>Solde FC</td><td class="num">' + soldeDepFC.toLocaleString() + ' FC</td></tr><tr><td>Solde USD</td><td class="num">' + soldeDepUSD.toLocaleString() + ' $</td></tr>';
  html += '<tr><th colspan="2">🏛️ PATRIMOINE</th></tr><tr><td>Sites</td><td class="num">' + sitesP + '</td></tr><tr><td>Biens</td><td class="num">' + biensP + '</td></tr></tbody></table></div>';
  box.innerHTML = html;
  if (typeof Chart !== 'undefined') { var c = document.getElementById('chartPresenceCanvas'); if (c) { if (_chartPresenceInstance) _chartPresenceInstance.destroy(); _chartPresenceInstance = new Chart(c, { type: 'doughnut', data: { labels: ['Membres', 'Symp', 'NV'], datasets: [{ data: [totM, totS, totN], backgroundColor: ['#0a6e2c', '#1976d2', '#ff9800'] }] } }); } }
}

// ========== ANNONCES ==========
function afficherAnnonces() {
  var list = DB.get('annonces', []); var box = document.getElementById('announcementsBox'); if (!box) return;
  if (!list.length) { box.innerHTML = '<p>Aucune annonce.</p>'; return; }
  var html = ''; list.slice().reverse().forEach(function(a) {
    html += '<div class="item-list"' + (a.archived ? ' style="opacity:0.7;background:#f0f0f0"' : '') + '>';
    html += '<strong>📢 ' + a.date + '</strong><br>' + echapper(a.texte);
    if (isAdmin()) {
      html += '<div style="margin-top:6px"><button class="btn-mini orange" onclick="modifierAnnonce(\'' + a.id + '\')">✏️</button><button class="btn-mini ' + (a.archived ? 'blue' : 'gray') + '" onclick="archiverAnnonce(\'' + a.id + '\')">' + (a.archived ? '↩️' : '📦') + '</button><button class="btn-mini danger" onclick="supprimerAnnonce(\'' + a.id + '\')">🗑️</button></div>';
    }
    html += '</div>';
  });
  box.innerHTML = html;
}
function publierAnnonce() {
  if (!isAdmin() && !isSuperAdmin()) return alert('Réservé admin');
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

// ========== ENTITÉS ==========
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

// ========== PARTICIPATIONS ==========
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

function recalculerTotauxRN() { var elM = document.getElementById('rnCulteMembres'); var elS = document.getElementById('rnCulteSymp'); var elN = document.getElementById('rnCulteNV'); var elT = document.getElementById('rnCulteTotal'); if (!elT) return; var cm = elM ? (parseInt(elM.value) || 0) : 0; var cs = elS ? (parseInt(elS.value) || 0) : 0; var cn = elN ? (parseInt(elN.value) || 0) : 0; elT.value = cm + cs + cn; }
// ========== FICHE MENSUELLE ==========
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
  h += '<div class="table-wrapper"><table class="data-table"><tbody><tr><td>Responsable</td><td>' + echapper(f.responsable) + '</td></tr><tr><td>Encadreurs</td><td class="num">' + (f.mEncadreurs || 0) + '</td></tr><tr><td>Membres actifs</td><td class="num">' + (f.mMembresActifs || 0) + '</td></tr><tr>// ========== PHOTO & SIGNATURE CANDIDAT ==========
function previewPhotoCandidat(ev) {
  var file = ev.target.files[0]; if (!file) { photoCandidatTemp = null; var p = document.getElementById('cPhotoPreview'); if (p) p.innerHTML = ''; return; }
  if (file.size > 5 * 1024 * 1024) return alert('⚠️ Image trop lourde (max 5 Mo)'); var reader = new FileReader();
  reader.onload = function(e) { var img = new Image(); img.onload = function() { var canvas = document.createElement('canvas'); canvas.width = 250; canvas.height = 250; var ctx = canvas.getContext('2d'); var min = Math.min(img.width, img.height); ctx.drawImage(img, (img.width-min)/2, (img.height-min)/2, min, min, 0, 0, 250, 250); photoCandidatTemp = canvas.toDataURL('image/jpeg', 0.65); document.getElementById('cPhotoPreview').innerHTML = '<img src="' + photoCandidatTemp + '" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:3px solid #0a6e2c;">'; }; img.src = e.target.result; }; reader.readAsDataURL(file);
}
function initSignature() {
  var canvas = document.getElementById('vSignatureCanvas'); if (!canvas) return;
  var ratio = window.devicePixelRatio || 1; var rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) { setTimeout(initSignature, 200); return; }
  canvas.width = rect.width * ratio; canvas.height = rect.height * ratio;
  signatureCanvas = canvas; signatureCtx = canvas.getContext('2d');
  signatureCtx.setTransform(1, 0, 0, 1, 0, 0); signatureCtx.scale(ratio, ratio);
  signatureCtx.lineWidth = 3; signatureCtx.lineCap = 'round'; signatureCtx.lineJoin = 'round'; signatureCtx.strokeStyle = getSignatureEncreColor();
  if (canvas.dataset.listeners === '1') return; canvas.dataset.listeners = '1';
  var drawing = false, lastX = 0, lastY = 0;
  function getPos(e) { var r = canvas.getBoundingClientRect(); var p = (e.touches && e.touches.length) ? e.touches[0] : (e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : e); return { x: p.clientX - r.left, y: p.clientY - r.top }; }
  function start(e) { e.preventDefault(); drawing = true; signatureCtx.strokeStyle = getSignatureEncreColor(); var p = getPos(e); lastX = p.x; lastY = p.y; signatureCtx.beginPath(); signatureCtx.arc(p.x, p.y, 1.5, 0, Math.PI * 2); signatureCtx.fill(); signatureVide = false; }
  function move(e) { if (!drawing) return; e.preventDefault(); signatureCtx.strokeStyle = getSignatureEncreColor(); var p = getPos(e); signatureCtx.beginPath(); signatureCtx.moveTo(lastX, lastY); signatureCtx.lineTo(p.x, p.y); signatureCtx.stroke(); lastX = p.x; lastY = p.y; signatureVide = false; }
  function stop() { drawing = false; }
  canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', move); canvas.addEventListener('mouseup', stop); canvas.addEventListener('mouseleave', stop); canvas.addEventListener('touchstart', start, { passive: false }); canvas.addEventListener('touchmove', move, { passive: false }); canvas.addEventListener('touchend', stop);
}
function effacerSignature() { if (!signatureCtx || !signatureCanvas) return; signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height); signatureVide = true; }

// ========== CANDIDATS ==========
function ajouterCandidat() {
  var prov = exigerProvince(); if (!prov) return; var nom = document.getElementById('cNom').value.trim(); var typeEntite = document.getElementById('cTypeEntite').value; var nomEntite = document.getElementById('cNomEntite').value.trim().toUpperCase(); var responsable = document.getElementById('cResponsable').value.trim(); var motif = document.getElementById('cMotif').value; var montant = parseFloat(document.getElementById('cMontant').value) || 0; var taux = parseFloat(document.getElementById('cTaux').value) || 2300;
  if (!nom) return alert('Entrez le nom'); if (!nomEntite) return alert('Entrez l\'entité');
  var list = DB.get('candidats', []); if (list.find(function(c) { return c.nom.toLowerCase() === nom.toLowerCase() && c.motif === motif && c.province === prov && c.statut === 'en_cours' && !c.archived; })) return alert('⚠️ Candidat déjà en cours');
  list.push({ id: uid(), nom: nom, typeEntite: typeEntite, nomEntite: nomEntite, responsable: responsable, motif: motif, montantPrevu: montant, taux: taux, totalVerse: 0, statut: 'en_cours', dateInscription: new Date().toISOString(), photo: photoCandidatTemp || null, province: prov, archived: false });
  DB.set('candidats', list); reinitialiserFormCandidat(); refreshAll(); alert('✅ Candidat ajouté');
}
function reinitialiserFormCandidat() { ['cNom','cNomEntite','cResponsable'].forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; }); var m = document.getElementById('cMontant'); if (m) m.value = 200; var t = document.getElementById('cTaux'); if (t) t.value = 2300; var p = document.getElementById('cPhotoPreview'); if (p) p.innerHTML = ''; photoCandidatTemp = null; }
function afficherCandidats() {
  var search = (document.getElementById('searchCand') ? document.getElementById('searchCand').value : '').toLowerCase(); var filtre = document.getElementById('filtreCandidats') ? document.getElementById('filtreCandidats').value : 'actif'; var list = candidatsProvince().slice();
  if (filtre === 'en_cours') list = list.filter(function(c) { return c.statut === 'en_cours' && !c.archived; }); else if (filtre === 'termine') list = list.filter(function(c) { return c.statut === 'termine' && !c.archived; }); else if (filtre === 'archive') list = list.filter(function(c) { return c.archived === true; });
  if (search) list = list.filter(function(c) { return c.nom.toLowerCase().indexOf(search) !== -1; }); list.sort(function(a, b) { return a.nom.localeCompare(b.nom); }); var box = document.getElementById('listeCandidats'); if (!box) return;
  if (!list.length) { box.innerHTML = '<p>Aucun candidat.</p>'; return; }
  var html = '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Photo</th><th>Nom</th><th>Statut</th><th>Versé</th><th>Actions</th></tr></thead><tbody>';
  list.forEach(function(c) {
    var badge = c.archived ? '📦' : (c.statut === 'termine' ? '✅' : '⏳');
    html += '<tr><td>'; if (c.photo) html += '<img src="' + c.photo + '" style="width:36px;height:36px;border-radius:50%;">'; else html += '👤'; html += '</td><td>' + echapper(c.nom) + '</td><td>' + badge + '</td><td class="num">' + c.totalVerse.toFixed(2) + '$</td><td>';
    html += '<button class="btn-mini" onclick="verserRapide(\'' + c.id + '\')">💵</button><button class="btn-mini orange" onclick="modifierCandidat(\'' + c.id + '\')">✏️</button><button class="btn-mini danger" onclick="supprimerCandidat(\'' + c.id + '\')">🗑️</button></td></tr>';
  });
  html += '</tbody></table></div>'; box.innerHTML = html;
}
function modifierCandidat(cid) { var list = DB.get('candidats', []); var c = list.find(function(x) { return x.id === cid; }); if (!c) return; var nom = prompt('Nom :', c.nom); if (nom === null) return; c.nom = nom.trim(); DB.set('candidats', list); refreshAll(); alert('✅ Modifié'); }
function supprimerCandidat(cid) { if (!confirm('⚠️ Supprimer ce candidat et TOUS ses versements ?')) return; DB.set('candidats', DB.get('candidats', []).filter(function(c) { return c.id !== cid; })); DB.set('versements', DB.get('versements', []).filter(function(v) { return v.candId !== cid; })); refreshAll(); alert('✅ Supprimé'); }
function reinitialiserRechercheCand() { var el = document.getElementById('searchCand'); if (el) el.value = ''; afficherCandidats(); }
function rafraichirCandidatsSelect() { var sel = document.getElementById('vCandidat'); if (!sel) return; var list = candidatsProvince().filter(function(c) { return c.statut === 'en_cours' && !c.archived; }); list.sort(function(a, b) { return a.nom.localeCompare(b.nom); }); var opts = ''; list.forEach(function(c) { opts += '<option value="' + c.id + '">' + c.nom + ' - ' + c.motif + '</option>'; }); sel.innerHTML = opts; }

// ========== VERSEMENTS ==========
function verserRapide(cid) { rafraichirCandidatsSelect(); document.getElementById('vCandidat').value = cid; switchMainTab('finance', document.querySelectorAll('.main-tab')[2]); setTimeout(function() { initSignature(); }, 500); }
function enregistrerVersement() {
  var prov = exigerProvince(); if (!prov) return; var candId = document.getElementById('vCandidat').value; var monnaie = document.getElementById('vMonnaie').value; var montant = parseFloat(document.getElementById('vMontant').value) || 0; var taux = parseFloat(document.getElementById('vTaux').value) || 2300; var date = document.getElementById('vDate').value || new Date().toISOString().slice(0, 10);
  if (!candId) return alert('⚠️ Choisissez un candidat'); if (montant <= 0) return alert('Entrez un montant valide'); if (signatureVide || !signatureCanvas) return alert('✍️ Le candidat doit signer');
  var montantUSD = monnaie === 'FC' ? (montant / taux) : montant; var signatureData = signatureCanvas.toDataURL('image/png'); var vers = DB.get('versements', []);
  vers.push({ id: uid(), candId: candId, monnaie: monnaie, montantOrigine: montant, montantUSD: montantUSD, taux: taux, date: date, province: prov, signature: signatureData, archived: false });
  DB.set('versements', vers); var cands = DB.get('candidats', []); var c = cands.find(function(x) { return x.id === candId; }); if (c) { c.totalVerse = (c.totalVerse || 0) + montantUSD; if (c.totalVerse >= c.montantPrevu - 0.01) c.statut = 'termine'; } DB.set('candidats', cands); reinitialiserFormVersement(); refreshAll(); alert('✅ Versement enregistré');
}
function reinitialiserFormVersement() { var m = document.getElementById('vMontant'); if (m) m.value = 0; effacerSignature(); }
function afficherVersements() { }<td>Sympathisants</td><td class="num">' + (f.mSympathisants || 0) + '</td></tr><tr><td>Thèmes</td><td>' + echapper(f.themes) + '</td></tr><tr><td>Grâces</td><td>' + echapper(f.graces) + '</td></tr></tbody></table></div></div>';
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
  var q = (document.getElementById('searchEntiteFinance').value || '').trim().toUpperCase(); var box = document.getElementById('resultatRechercheEntite'); if (!box) return;
  if (!q) { box.innerHTML = '<p style="color:#888;font-size:13px">Entrez un nom.</p>'; return; }
  var cands = candidatsProvince().filter(function(c) { return !c.archived; }).filter(function(c) { return (c.nomEntite && c.nomEntite.toUpperCase().indexOf(q) !== -1); });
  if (!cands.length) { box.innerHTML = '<p style="color:#888;font-size:13px">Aucun candidat.</p>'; return; }
  var parEntite = {}; cands.forEach(function(c) { var key = c.typeEntite + ' - ' + c.nomEntite; if (!parEntite[key]) parEntite[key] = []; parEntite[key].push(c); }); var html = '';
  Object.keys(parEntite).forEach(function(key) {
    var liste = parEntite[key]; var totalPrevu = 0, totalVerse = 0; liste.forEach(function(c) { totalPrevu += c.montantPrevu; totalVerse += (c.totalVerse || 0); });
    html += '<div class="entity-block"><h4>🏛️ ' + echapper(key) + '</h4><div style="font-size:12px;color:#666;margin-bottom:8px">' + liste.length + ' candidat(s) | Prévu : <strong>' + totalPrevu.toFixed(2) + '$</strong> | Versé : <strong>' + totalVerse.toFixed(2) + '$</strong></div>';
    html += '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Nom</th><th>Motif</th><th>Statut</th><th>Prévu</th><th>Versé</th></tr></thead><tbody>';
    liste.sort(function(a, b) { return a.nom.localeCompare(b.nom); });
    liste.forEach(function(c) {
      html += '<tr><td>' + echapper(c.nom) + '</td><td>' + echapper(c.motif) + '</td><td>' + (c.statut === 'termine' ? '✅' : '⏳') + '</td><td class="num">' + c.montantPrevu + '$</td><td class="num">' + (c.totalVerse || 0).toFixed(2) + '$</td></tr>';
    });
    html += '</tbody></table></div></div>';
  });
  box.innerHTML = html;
}
function afficherReleveVersement(candId) {
  var c = DB.get('candidats', []).find(function(x) { return x.id === candId; }); if (!c) return alert('Candidat introuvable');
  var vers = DB.get('versements', []).filter(function(v) { return v.candId === candId && !v.archived; }); vers.sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
  var totalUSD = 0, totalFC = 0; vers.forEach(function(v) { totalUSD += v.montantUSD; if (v.monnaie === 'FC') totalFC += v.montantOrigine; }); var sigColor = getSignatureColor(); var w = window.open('', '_blank');
  w.document.write('<html><head><meta charset="UTF-8"><title>Relevé</title><style>body{font-family:Arial;padding:24px;max-width:800px;margin:auto;color:#222}.header{text-align:center;border-bottom:3px double #0a6e2c;padding-bottom:15px;margin-bottom:20px}.logo{width:70px;height:70px;background:#0a6e2c;color:white;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:bold;margin-bottom:10px}h1{color:#0a6e2c;font-size:18px}h2{color:#333;font-size:14px;margin:15px 0 10px;border-left:4px solid #0a6e2c;padding-left:8px}table{width:100%;border-collapse:collapse;margin:15px 0;font-size:13px}th{background:#0a6e2c;color:white;padding:8px;text-align:left}td{padding:8px;border-bottom:1px solid #ddd}td.num{text-align:right}tfoot td{font-weight:bold;background:#e8f5e9;color:#0a6e2c;border-top:2px solid #0a6e2c}.info{background:#f9f9f9;padding:12px;border-radius:8px;margin:15px 0;border-left:4px solid #0a6e2c}.info p{margin:4px 0;font-size:13px}.solde{font-size:15px;color:#0a6e2c;font-weight:bold;text-align:center;padding:15px;background:#e8f5e9;border-radius:8px;margin-top:15px}</style></head><body>');
  w.document.write('<div class="header"><div class="logo">EMM</div><h1>ÉGLISE MESSIANIQUE MONDIALE</h1><p style="color:#666;font-size:12px">EMM MONDIAL — Finance</p><h2 style="border:none;text-align:center">RELEVÉ DE VERSEMENT INDIVIDUEL</h2></div>');
  w.document.write('<div class="info"><p><strong>Nom :</strong> ' + echapper(c.nom) + '</p><p><strong>Entité :</strong> ' + echapper(c.typeEntite) + ' - ' + echapper(c.nomEntite) + '</p><p><strong>Motif :</strong> ' + echapper(c.motif) + '</p></div><h2>Détail des versements (' + vers.length + ')</h2>');
  if (vers.length) {
    w.document.write('<table><thead><tr><th>#</th><th>Date</th><th>Monnaie</th><th>Montant</th><th>USD</th></tr></thead><tbody>');
    vers.forEach(function(v, i) { w.document.write('<tr><td>' + (i + 1) + '</td><td>' + fmtDate(v.date) + '</td><td>' + v.monnaie + '</td><td class="num">' + v.montantOrigine.toLocaleString() + '</td><td class="num">' + v.montantUSD.toFixed(2) + ' $</td></tr>'); });
    w.document.write('</tbody></table>');
  }
  w.document.write('<div class="solde">Montant prévu : ' + c.montantPrevu + ' $<br>Total versé : ' + totalUSD.toFixed(2) + ' $<br>Solde restant : ' + (c.montantPrevu - totalUSD).toFixed(2) + ' $</div></body></html>');
  w.document.close(); setTimeout(function() { w.print(); }, 500);
}
function rapportFinGlobal() {
  var cands = candidatsProvince().filter(function(c) { return !c.archived; }); var totalVerse = 0, totalPrevu = 0; cands.forEach(function(c) { totalVerse += (c.totalVerse || 0); totalPrevu += c.montantPrevu; });
  var provLabel = getProvinceActive() || 'Toutes'; var html = '<div class="rapport-header"><h3>📊 RAPPORT GLOBAL — FINANCE</h3><p>🌍 ' + echapper(provLabel) + '</p></div><div class="table-wrapper"><table class="data-table"><tbody>';
  html += '<tr><td>Candidats</td><td class="num">' + cands.length + '</td></tr><tr><td>Total prévu</td><td class="num">' + totalPrevu.toFixed(2) + '$</td></tr><tr><td>Total versé</td><td class="num">' + totalVerse.toFixed(2) + '$</td></tr></tbody></table></div>'; document.getElementById('rapportFinBox').innerHTML = html;
    }
// ========== DÉPOUILLEMENT ==========
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
    html += '<div style="background:#f9f9f9;border-radius:8px;padding:8px;margin-bottom:8px;border-left:3px solid #0a6e2c"><div style="font-weight:600;color:#0a6e2c;font-size:13px;margin-bottom:4px">' + CATEGORIES_OFFRANDES[cat] + '</div>';
    html += '<div class="table-wrapper"><table class="data-table" style="font-size:12px"><tbody>';
    arr.forEach(function(o, i) { html += '<tr><td>' + echapper(o.nom) + '</td><td class="num">' + o.fc.toLocaleString() + ' FC</td><td class="num">' + o.usd.toLocaleString() + ' $</td><td><button class="btn-mini danger" onclick="retirerOffrande(\'' + cat + '\',' + i + ')">✖</button></td></tr>'; });
    html += '</tbody><tfoot><tr><td>TOTAL</td><td class="num">' + totFC.toLocaleString() + ' FC</td><td class="num">' + totUSD.toLocaleString() + ' $</td><td></td></tr></tfoot></table></div></div>';
  });
  if (totalGeneralFC > 0 || totalGeneralUSD > 0) {
    html += '<div style="background:#e8f5e9;padding:10px;border-radius:8px;border:2px solid #0a6e2c"><div style="font-weight:700;color:#0a6e2c;font-size:13px">TOTAL GÉNÉRAL</div><div style="font-size:14px;color:#0a6e2c;font-weight:700;margin-top:4px">' + totalGeneralFC.toLocaleString() + ' FC / ' + totalGeneralUSD.toLocaleString() + ' $</div></div>';
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
  afficherOffrandes(); reinitialiserFormEntiteSeance(); afficherEntitesSeance(); alert('✅ Entité enregistrée');
}
function reinitialiserFormEntiteSeance() {
  ['dNomEntite','dResponsable','dOffrandeNom'].forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; });
  ['dEnveloppes','dConstrFC','dConstrUSD','dNormFC','dNormUSD','dTransFC','dTransUSD','dOffrandeFC','dOffrandeUSD'].forEach(function(id) { var el = document.getElementById(id); if (el) el.value = 0; });
  afficherOffrandes();
}
function afficherEntitesSeance() {
  var box = document.getElementById('listeEntitesSeance'); if (!box || !seanceActive) return;
  if (!seanceActive.entites.length) { box.innerHTML = '<p style="color:#888">Aucune entité.</p>'; return; }
  var html = '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Entité</th><th>Enveloppes</th><th>Actions</th></tr></thead><tbody>';
  seanceActive.entites.forEach(function(e, i) { html += '<tr><td>' + echapper(e.typeEntite) + ' - ' + echapper(e.nomEntite) + '</td><td class="num">' + (e.enveloppes || 0) + '</td><td><button class="btn-mini danger" onclick="retirerEntiteSeance(' + i + ')">🗑️</button></td></tr>'; });
  html += '</tbody></table></div>'; box.innerHTML = html;
}
function retirerEntiteSeance(i) { if (!confirm('⚠️ Retirer ?')) return; seanceActive.entites.splice(i, 1); afficherEntitesSeance(); }
function passerAuxDepenses() { if (!seanceActive || !seanceActive.entites.length) return alert('⚠️ Enregistrez une entité'); document.getElementById('cardDepensesSeance').style.display = 'block'; }
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
  seanceActive.depensesGenerales.forEach(function(d, i) { html += '<tr><td>' + echapper(d.motif) + '</td><td class="num">' + d.fc.toLocaleString() + '</td><td class="num">' + d.usd.toLocaleString() + '</td><td><button class="btn-mini danger" onclick="retirerDepenseSeance(' + i + ')">🗑️</button></td></tr>'; });
  html += '</tbody></table></div>'; box.innerHTML = html;
}
function retirerDepenseSeance(i) { if (!confirm('⚠️ Retirer ?')) return; seanceActive.depensesGenerales.splice(i, 1); afficherDepensesSeance(); }
function calculerTotauxSeance() {
  if (!seanceActive) return alert('⚠️ Séance non démarrée');
  var totalFC = 0, totalUSD = 0, soldeFC = 0, soldeUSD = 0, totEnv = 0;
  var html = '<h4>📊 Totaux par entité</h4><div class="table-wrapper"><table class="data-table"><thead><tr><th>Entité</th><th>Enveloppes</th><th>Total FC</th><th>Total USD</th><th>Solde FC</th><th>Solde USD</th></tr></thead><tbody>';
  seanceActive.entites.forEach(function(e) { var s = sumEntiteDep(e); totalFC += s.totFC; totalUSD += s.totUSD; soldeFC += s.soldeFC; soldeUSD += s.soldeUSD; totEnv += (e.enveloppes || 0); html += '<tr><td>' + echapper(e.typeEntite) + ' - ' + echapper(e.nomEntite) + '</td><td class="num">' + (e.enveloppes || 0) + '</td><td class="num">' + s.totFC.toLocaleString() + '</td><td class="num">' + s.totUSD.toLocaleString() + '</td><td class="num">' + s.soldeFC.toLocaleString() + '</td><td class="num">' + s.soldeUSD.toLocaleString() + '</td></tr>'; });
  html += '</tbody><tfoot><tr><td>TOTAL</td><td class="num">' + totEnv + '</td><td class="num">' + totalFC.toLocaleString() + '</td><td class="num">' + totalUSD.toLocaleString() + '</td><td class="num">' + soldeFC.toLocaleString() + '</td><td class="num">' + soldeUSD.toLocaleString() + '</td></tr></tfoot></table></div>';
  var genFC = seanceActive.depensesGenerales.reduce(function(a, x) { return a + x.fc; }, 0); var genUSD = seanceActive.depensesGenerales.reduce(function(a, x) { return a + x.usd; }, 0);
  html += '<h4>💸 Dépenses générales</h4><div class="table-wrapper"><table class="data-table"><thead><tr><th>Motif</th><th>FC</th><th>USD</th></tr></thead><tbody>';
  seanceActive.depensesGenerales.forEach(function(x) { html += '<tr><td>' + echapper(x.motif) + '</td><td class="num">' + x.fc.toLocaleString() + '</td><td class="num">' + x.usd.toLocaleString() + '</td></tr>'; });
  html += '</tbody><tfoot><tr><td>TOTAL DÉPENSES</td><td class="num">- ' + genFC.toLocaleString() + ' FC</td><td class="num">- ' + genUSD.toLocaleString() + ' $</td></tr><tr style="background:#fff3e0"><td>À TRANSFÉRER</td><td class="num">' + (soldeFC - genFC).toLocaleString() + ' FC</td><td class="num">' + (soldeUSD - genUSD).toLocaleString() + ' $</td></tr></tfoot></table></div>';
  document.getElementById('depResultatSeance').innerHTML = html;
}
function sumEntiteDep(e) {
  var sum = function(arr) { return (arr || []).reduce(function(a, o) { return { fc: a.fc + o.fc, usd: a.usd + o.usd }; }, { fc: 0, usd: 0 }); };
  var i = sum(e.init), s = sum(e.sorei), k = sum(e.kannon), p = sum(e.photo), sr = sum(e.shinrei), g = sum(e.gosh), m = sum(e.mita);
  var totFC = (e.constrFC || 0) + (e.normFC || 0) + i.fc + s.fc + k.fc + p.fc + sr.fc + g.fc + m.fc;
  var totUSD = (e.constrUSD || 0) + (e.normUSD || 0) + i.usd + s.usd + k.usd + p.usd + sr.usd + g.usd + m.usd;
  return { totFC: totFC, totUSD: totUSD, soldeFC: totFC - (e.transFC || 0), soldeUSD: totUSD - (e.transUSD || 0) };
}
function enregistrerDepouillementSeance() {
  if (!seanceActive) return alert('⚠️ Séance non démarrée'); if (!seanceActive.entites.length) return alert('⚠️ Enregistrez une entité');
  var prov = seanceActive.province || exigerProvince(); if (!prov) return;
  seanceActive.province = prov; seanceActive.entites.forEach(function(e) { if (!e.province) e.province = prov; });
  var deps = DB.get('depouillements', []); deps.push(JSON.parse(JSON.stringify(seanceActive))); DB.set('depouillements', deps);
  seanceActive = null; document.getElementById('seanceStatus').innerHTML = ''; document.getElementById('cardEntiteActive').style.display = 'none';
  document.getElementById('cardEntitesSeance').style.display = 'none'; document.getElementById('cardDepensesSeance').style.display = 'none';
  tempOffrandes = { init: [], sorei: [], kannon: [], photo: [], shinrei: [], gosh: [], mita: [] }; afficherOffrandes(); refreshAll(); alert('✅ Dépouillement enregistré');
    }

// ========== PATRIMOINE ==========
var photoBienTemp = null;
function ajouterSitePatrimoine() {
  var prov = exigerProvince(); if (!prov) return;
  var nom = document.getElementById('pNomSite').value.trim(); var resp = document.getElementById('pRespSite').value.trim();
  if (!nom) return alert('Entrez le nom');
  var list = DB.get('patrimoineSites', []); list.push({ id: uid(), type: document.getElementById('pTypeSite').value, nom: nom, responsable: resp, province: prov, archived: false, dateCreation: new Date().toISOString() });
  DB.set('patrimoineSites', list); refreshPatrimoineSites(); alert('✅ Site ajouté');
}
function reinitialiserFormSitePatrimoine() { document.getElementById('pNomSite').value = ''; document.getElementById('pRespSite').value = ''; }
function refreshPatrimoineSites() {
  var sites = sitesPatrimoineProvince().filter(function(s) { return !s.archived; }); var sel = document.getElementById('pBienSite');
  if (sel) sel.innerHTML = sites.map(function(s) { return '<option value="' + s.id + '">' + s.type + ' - ' + s.nom + '</option>'; }).join('');
  var selRep = document.getElementById('pRepBien');
  if (selRep) { var biens = biensPatrimoineProvince().filter(function(b) { return !b.archived; }); selRep.innerHTML = biens.map(function(b) { return '<option value="' + b.id + '">' + b.nom + '</option>'; }).join(''); }
  afficherSitesPatrimoine(); afficherBiensPatrimoine(); afficherReparations();
}
function afficherSitesPatrimoine() {
  var sites = sitesPatrimoineProvince(); var box = document.getElementById('pListeSites'); if (!box) return;
  if (!sites.length) { box.innerHTML = '<p>Aucun site.</p>'; return; }
  box.innerHTML = sites.map(function(s) { return '<div class="item-list"><strong>🏛️ ' + echapper(s.type) + ' - ' + echapper(s.nom) + '</strong><br>👤 ' + echapper(s.responsable || '-') + '</div>'; }).join('');
}
function previewPhotoBien(ev) {
  var file = ev.target.files[0]; if (!file) return; var reader = new FileReader();
  reader.onload = function(e) { photoBienTemp = e.target.result; document.getElementById('pPhotoPreview').innerHTML = '<img src="' + photoBienTemp + '" style="width:100px;height:100px;border-radius:8px;">'; }; reader.readAsDataURL(file);
}
function genererCodeBien(siteId, cat) { return 'BIEN-' + Date.now().toString().slice(-4); }
function ajouterBienPatrimoine() {
  var prov = exigerProvince(); if (!prov) return; var siteId = document.getElementById('pBienSite').value; var nom = document.getElementById('pBienNom').value.trim();
  if (!siteId || !nom) return alert('Remplissez les champs');
  var list = DB.get('patrimoineBiens', []); list.push({ id: uid(), siteId: siteId, categorie: document.getElementById('pBienCategorie').value, nom: nom, qte: parseInt(document.getElementById('pBienQte').value) || 1, etat: document.getElementById('pBienEtat').value, photo: photoBienTemp || null, province: prov, archived: false });
  DB.set('patrimoineBiens', list); refreshPatrimoineSites(); alert('✅ Bien ajouté');
}
function reinitialiserFormBienPatrimoine() { document.getElementById('pBienNom').value = ''; document.getElementById('pPhotoPreview').innerHTML = ''; photoBienTemp = null; }
function afficherBiensPatrimoine() {
  var biens = biensPatrimoineProvince(); var box = document.getElementById('pListeBiens'); if (!box) return;
  if (!biens.length) { box.innerHTML = '<p>Aucun bien.</p>'; return; }
  box.innerHTML = biens.map(function(b) { return '<div class="item-list"><strong>📦 ' + echapper(b.nom) + '</strong> - Qté: ' + b.qte + ' - ' + b.etat + '</div>'; }).join('');
}
function ajouterReparation() {
  var bienId = document.getElementById('pRepBien').value; var desc = document.getElementById('pRepDesc').value.trim(); if (!bienId || !desc) return alert('Remplissez');
  var list = DB.get('patrimoineReparations', []); list.push({ id: uid(), bienId: bienId, desc: desc, cout: parseFloat(document.getElementById('pRepCout').value) || 0, date: document.getElementById('pRepDate').value || new Date().toISOString().slice(0, 10) });
  DB.set('patrimoineReparations', list); afficherReparations(); alert('✅ Réparation enregistrée');
}
function afficherReparations() {
  var list = DB.get('patrimoineReparations', []); var box = document.getElementById('pListeReparations'); if (!box) return;
  if (!list.length) { box.innerHTML = '<p style="font-size:12px;color:#888">Aucune réparation.</p>'; return; }
  box.innerHTML = list.map(function(r) { return '<div class="item-list">' + fmtDate(r.date) + ' - ' + echapper(r.desc) + ' (' + r.cout + ' FC)</div>'; }).join('');
}
function rapportPatrimoineGlobal() {
  var sites = sitesPatrimoineProvince().length; var biens = biensPatrimoineProvince().length;
  document.getElementById('pRapportBox').innerHTML = '<div class="rapport-header"><h3>📊 PATRIMOINE</h3></div><table class="data-table"><tbody><tr><td>Sites</td><td class="num">' + sites + '</td></tr><tr><td>Biens</td><td class="num">' + biens + '</td></tr></tbody></table>';
}
function rapportPatrimoineDetaille() { rapportPatrimoineGlobal(); }
function imprimerRapportPatrimoine() { ouvrirModalPdf({ type: 'box', boxId: 'pRapportBox', titre: 'Rapport Patrimoine' }); }
function relevePatrimoineSite(siteId) { alert('Relevé en cours de développement'); }

// ========== ARCHIVES ==========
function afficherArchives() {
  var box = document.getElementById('archivesBox'); if (!box) return;
  var recherche = (document.getElementById('archiveSearch').value || '').toLowerCase().trim();
  var archiveData = {};
  var addToArchive = function(entiteName, module, dateStr, item, typeLabel, description) {
    if (!entiteName || entiteName === 'Inconnu') entiteName = "Entité non assignée";
    var d = new Date(dateStr || Date.now()); var annee = d.getFullYear() || 'Année inconnue'; var mois = d.toLocaleString('fr-FR', { month: 'long' });
    if (!archiveData[entiteName]) archiveData[entiteName] = {};
    if (!archiveData[entiteName][module]) archiveData[entiteName][module] = {};
    if (!archiveData[entiteName][module][annee]) archiveData[entiteName][module][annee] = {};
    if (!archiveData[entiteName][module][annee][mois]) archiveData[entiteName][module][annee][mois] = [];
    archiveData[entiteName][module][annee][mois].push({ item: item, typeLabel: typeLabel, desc: description });
  };
  var entitesMap = {}; DB.get('entites', []).forEach(function(e) { entitesMap[e.id] = e.nom; });
  DB.get('participations', []).filter(function(x) { return x.archived; }).forEach(function(p) { addToArchive(entitesMap[p.entiteId], 'Fréquence', p.date, p, '📝 Participation', 'Date: ' + fmtDate(p.date)); });
  DB.get('candidats', []).filter(function(x) { return x.archived; }).forEach(function(c) { addToArchive(c.nomEntite, 'Finance', c.dateInscription, c, '👤 Candidat', c.nom); });
  
  var totalGeneral = 0; var html = '';
  Object.keys(archiveData).forEach(function(entiteName) {
    var htmlEntite = '<details style="margin-bottom:15px; background:#f9f9f9; border:1px solid #ddd; border-radius:8px; padding:10px;"><summary style="font-size:16px; font-weight:bold; color:#0a6e2c; cursor:pointer; padding:5px;">🏛️ ' + echapper(entiteName) + '</summary>';
    Object.keys(archiveData[entiteName]).forEach(function(module) {
      var htmlModule = '<details style="margin-left:15px; margin-top:10px; background:#fff; border:1px solid #eee; border-radius:6px; padding:8px;"><summary style="font-size:14px; font-weight:bold; color:#1976d2; cursor:pointer;">📁 ' + module + '</summary>';
      Object.keys(archiveData[entiteName][module]).forEach(function(annee) {
        var htmlAnnee = '<details style="margin-left:15px; margin-top:8px; background:#f4f4f4; border-radius:6px; padding:6px;"><summary style="font-size:13px; font-weight:bold; color:#555; cursor:pointer;">📅 ' + annee + '</summary>';
        Object.keys(archiveData[entiteName][module][annee]).forEach(function(mois) {
          var htmlMois = '<details style="margin-left:15px; margin-top:6px; background:#fafafa; border-left:3px solid #f9a825; padding:5px;"><summary style="font-size:12px; font-weight:bold; color:#e65100; cursor:pointer;">🗓️ ' + mois + '</summary><div style="margin-left:10px; margin-top:5px; font-size:12px;">';
          archiveData[entiteName][module][annee][mois].forEach(function(obj) { totalGeneral++; htmlMois += '<div><strong>' + obj.typeLabel + '</strong> : ' + echapper(obj.desc) + '</div>'; });
          htmlMois += '</div></details>'; htmlAnnee += htmlMois;
        });
        htmlAnnee += '</details>'; htmlModule += htmlAnnee;
      });
      htmlModule += '</details>'; htmlEntite += htmlModule;
    });
    htmlEntite += '</details>'; html += htmlEntite;
  });
  if (totalGeneral === 0) { box.innerHTML = '<div class="card"><p style="text-align:center;padding:24px;color:#888;font-size:14px">📭 Aucun document dans les archives.</p></div>'; return; }
  box.innerHTML = '<div class="card" style="background:#fffde7;border-left:4px solid #f9a825"><h3 style="color:#e65100">📦 Archives — ' + totalGeneral + ' document(s)</h3></div>' + html;
    }// ========== PATRIMOINE ==========
var photoBienTemp = null;
function ajouterSitePatrimoine() {
  var prov = exigerProvince(); if (!prov) return;
  var nom = document.getElementById('pNomSite').value.trim(); var resp = document.getElementById('pRespSite').value.trim();
  if (!nom) return alert('Entrez le nom');
  var list = DB.get('patrimoineSites', []); list.push({ id: uid(), type: document.getElementById('pTypeSite').value, nom: nom, responsable: resp, province: prov, archived: false, dateCreation: new Date().toISOString() });
  DB.set('patrimoineSites', list); refreshPatrimoineSites(); alert('✅ Site ajouté');
}
function reinitialiserFormSitePatrimoine() { document.getElementById('pNomSite').value = ''; document.getElementById('pRespSite').value = ''; }
function refreshPatrimoineSites() {
  var sites = sitesPatrimoineProvince().filter(function(s) { return !s.archived; }); var sel = document.getElementById('pBienSite');
  if (sel) sel.innerHTML = sites.map(function(s) { return '<option value="' + s.id + '">' + s.type + ' - ' + s.nom + '</option>'; }).join('');
  var selRep = document.getElementById('pRepBien');
  if (selRep) { var biens = biensPatrimoineProvince().filter(function(b) { return !b.archived; }); selRep.innerHTML = biens.map(function(b) { return '<option value="' + b.id + '">' + b.nom + '</option>'; }).join(''); }
  afficherSitesPatrimoine(); afficherBiensPatrimoine(); afficherReparations();
}
function afficherSitesPatrimoine() {
  var sites = sitesPatrimoineProvince(); var box = document.getElementById('pListeSites'); if (!box) return;
  if (!sites.length) { box.innerHTML = '<p>Aucun site.</p>'; return; }
  box.innerHTML = sites.map(function(s) { return '<div class="item-list"><strong>🏛️ ' + echapper(s.type) + ' - ' + echapper(s.nom) + '</strong><br>👤 ' + echapper(s.responsable || '-') + '</div>'; }).join('');
}
function previewPhotoBien(ev) {
  var file = ev.target.files[0]; if (!file) return; var reader = new FileReader();
  reader.onload = function(e) { photoBienTemp = e.target.result; document.getElementById('pPhotoPreview').innerHTML = '<img src="' + photoBienTemp + '" style="width:100px;height:100px;border-radius:8px;">'; }; reader.readAsDataURL(file);
}
function genererCodeBien(siteId, cat) { return 'BIEN-' + Date.now().toString().slice(-4); }
function ajouterBienPatrimoine() {
  var prov = exigerProvince(); if (!prov) return; var siteId = document.getElementById('pBienSite').value; var nom = document.getElementById('pBienNom').value.trim();
  if (!siteId || !nom) return alert('Remplissez les champs');
  var list = DB.get('patrimoineBiens', []); list.push({ id: uid(), siteId: siteId, categorie: document.getElementById('pBienCategorie').value, nom: nom, qte: parseInt(document.getElementById('pBienQte').value) || 1, etat: document.getElementById('pBienEtat').value, photo: photoBienTemp || null, province: prov, archived: false });
  DB.set('patrimoineBiens', list); refreshPatrimoineSites(); alert('✅ Bien ajouté');
}
function reinitialiserFormBienPatrimoine() { document.getElementById('pBienNom').value = ''; document.getElementById('pPhotoPreview').innerHTML = ''; photoBienTemp = null; }
function afficherBiensPatrimoine() {
  var biens = biensPatrimoineProvince(); var box = document.getElementById('pListeBiens'); if (!box) return;
  if (!biens.length) { box.innerHTML = '<p>Aucun bien.</p>'; return; }
  box.innerHTML = biens.map(function(b) { return '<div class="item-list"><strong>📦 ' + echapper(b.nom) + '</strong> - Qté: ' + b.qte + ' - ' + b.etat + '</div>'; }).join('');
}
function ajouterReparation() {
  var bienId = document.getElementById('pRepBien').value; var desc = document.getElementById('pRepDesc').value.trim(); if (!bienId || !desc) return alert('Remplissez');
  var list = DB.get('patrimoineReparations', []); list.push({ id: uid(), bienId: bienId, desc: desc, cout: parseFloat(document.getElementById('pRepCout').value) || 0, date: document.getElementById('pRepDate').value || new Date().toISOString().slice(0, 10) });
  DB.set('patrimoineReparations', list); afficherReparations(); alert('✅ Réparation enregistrée');
}
function afficherReparations() {
  var list = DB.get('patrimoineReparations', []); var box = document.getElementById('pListeReparations'); if (!box) return;
  if (!list.length) { box.innerHTML = '<p style="font-size:12px;color:#888">Aucune réparation.</p>'; return; }
  box.innerHTML = list.map(function(r) { return '<div class="item-list">' + fmtDate(r.date) + ' - ' + echapper(r.desc) + ' (' + r.cout + ' FC)</div>'; }).join('');
}
function rapportPatrimoineGlobal() {
  var sites = sitesPatrimoineProvince().length; var biens = biensPatrimoineProvince().length;
  document.getElementById('pRapportBox').innerHTML = '<div class="rapport-header"><h3>📊 PATRIMOINE</h3></div><table class="data-table"><tbody><tr><td>Sites</td><td class="num">' + sites + '</td></tr><tr><td>Biens</td><td class="num">' + biens + '</td></tr></tbody></table>';
}
function rapportPatrimoineDetaille() { rapportPatrimoineGlobal(); }
function imprimerRapportPatrimoine() { ouvrirModalPdf({ type: 'box', boxId: 'pRapportBox', titre: 'Rapport Patrimoine' }); }
function relevePatrimoineSite(siteId) { alert('Relevé en cours de développement'); }

// ========== ARCHIVES ==========
function afficherArchives() {
  var box = document.getElementById('archivesBox'); if (!box) return;
  var recherche = (document.getElementById('archiveSearch').value || '').toLowerCase().trim();
  var archiveData = {};
  var addToArchive = function(entiteName, module, dateStr, item, typeLabel, description) {
    if (!entiteName || entiteName === 'Inconnu') entiteName = "Entité non assignée";
    var d = new Date(dateStr || Date.now()); var annee = d.getFullYear() || 'Année inconnue'; var mois = d.toLocaleString('fr-FR', { month: 'long' });
    if (!archiveData[entiteName]) archiveData[entiteName] = {};
    if (!archiveData[entiteName][module]) archiveData[entiteName][module] = {};
    if (!archiveData[entiteName][module][annee]) archiveData[entiteName][module][annee] = {};
    if (!archiveData[entiteName][module][annee][mois]) archiveData[entiteName][module][annee][mois] = [];
    archiveData[entiteName][module][annee][mois].push({ item: item, typeLabel: typeLabel, desc: description });
  };
  var entitesMap = {}; DB.get('entites', []).forEach(function(e) { entitesMap[e.id] = e.nom; });
  DB.get('participations', []).filter(function(x) { return x.archived; }).forEach(function(p) { addToArchive(entitesMap[p.entiteId], 'Fréquence', p.date, p, '📝 Participation', 'Date: ' + fmtDate(p.date)); });
  DB.get('candidats', []).filter(function(x) { return x.archived; }).forEach(function(c) { addToArchive(c.nomEntite, 'Finance', c.dateInscription, c, '👤 Candidat', c.nom); });
  
  var totalGeneral = 0; var html = '';
  Object.keys(archiveData).forEach(function(entiteName) {
    var htmlEntite = '<details style="margin-bottom:15px; background:#f9f9f9; border:1px solid #ddd; border-radius:8px; padding:10px;"><summary style="font-size:16px; font-weight:bold; color:#0a6e2c; cursor:pointer; padding:5px;">🏛️ ' + echapper(entiteName) + '</summary>';
    Object.keys(archiveData[entiteName]).forEach(function(module) {
      var htmlModule = '<details style="margin-left:15px; margin-top:10px; background:#fff; border:1px solid #eee; border-radius:6px; padding:8px;"><summary style="font-size:14px; font-weight:bold; color:#1976d2; cursor:pointer;">📁 ' + module + '</summary>';
      Object.keys(archiveData[entiteName][module]).forEach(function(annee) {
        var htmlAnnee = '<details style="margin-left:15px; margin-top:8px; background:#f4f4f4; border-radius:6px; padding:6px;"><summary style="font-size:13px; font-weight:bold; color:#555; cursor:pointer;">📅 ' + annee + '</summary>';
        Object.keys(archiveData[entiteName][module][annee]).forEach(function(mois) {
          var htmlMois = '<details style="margin-left:15px; margin-top:6px; background:#fafafa; border-left:3px solid #f9a825; padding:5px;"><summary style="font-size:12px; font-weight:bold; color:#e65100; cursor:pointer;">🗓️ ' + mois + '</summary><div style="margin-left:10px; margin-top:5px; font-size:12px;">';
          archiveData[entiteName][module][annee][mois].forEach(function(obj) { totalGeneral++; htmlMois += '<div><strong>' + obj.typeLabel + '</strong> : ' + echapper(obj.desc) + '</div>'; });
          htmlMois += '</div></details>'; htmlAnnee += htmlMois;
        });
        htmlAnnee += '</details>'; htmlModule += htmlAnnee;
      });
      htmlModule += '</details>'; htmlEntite += htmlModule;
    });
    htmlEntite += '</details>'; html += htmlEntite;
  });
  if (totalGeneral === 0) { box.innerHTML = '<div class="card"><p style="text-align:center;padding:24px;color:#888;font-size:14px">📭 Aucun document dans les archives.</p></div>'; return; }
  box.innerHTML = '<div class="card" style="background:#fffde7;border-left:4px solid #f9a825"><h3 style="color:#e65100">📦 Archives — ' + totalGeneral + ' document(s)</h3></div>' + html;
}
// ========== FIREBASE & AUTHENTIFICATION ==========
function login() {
  var errBox = document.getElementById('loginError');
  if (typeof auth === 'undefined' || !firebase.apps || !firebase.apps.length) { if (errBox) errBox.textContent = '⏳ Chargement en cours...'; return; }
  var email = document.getElementById('loginEmail').value.trim(); var pass = document.getElementById('loginPassword').value.trim();
  if (!email || !pass) { errBox.textContent = '❌ Entrez l\'email et le mot de passe'; return; }
  errBox.textContent = '⏳ Connexion...';
  auth.signInWithEmailAndPassword(email, pass).then(function() { errBox.textContent = ''; document.getElementById('loginPassword').value = ''; }).catch(function(error) { errBox.textContent = '❌ ' + error.message; });
}
function creerCompte() {
  var errBox = document.getElementById('loginError');
  if (typeof auth === 'undefined' || !firebase.apps || !firebase.apps.length) { if (errBox) errBox.textContent = '⏳ Chargement en cours...'; return; }
  var email = document.getElementById('loginEmail').value.trim(); var pass = document.getElementById('loginPassword').value.trim(); var phone = document.getElementById('loginPhone') ? document.getElementById('loginPhone').value.trim() : "";
  if (!email || !pass) { errBox.textContent = '❌ Entrez un email et un mot de passe'; return; }
  if (!phone) { errBox.textContent = '❌ Entrez votre numéro WhatsApp'; return; }
  errBox.textContent = '⏳ Création...';
  auth.createUserWithEmailAndPassword(email, pass).then(function(userCredential) {
    return dbFS.collection('users').doc(userCredential.user.uid).set({ email: email, phone: phone, premium: false, premiumExpire: 0, createdAt: new Date() });
  }).then(function() { errBox.textContent = '✅ Compte créé ! Vous pouvez vous connecter.'; }).catch(function(error) { errBox.textContent = '❌ Erreur : ' + error.message; });
}
function logout() {
  if (!confirm('Voulez-vous vraiment vous déconnecter ?')) return;
  if (typeof auth === 'undefined') { currentUser = null; showScreen('loginScreen'); return; }
  auth.signOut().then(function() { currentUser = null; userPremiumStatus = false; userPremiumExpire = 0; showScreen('loginScreen'); });
}
auth.onAuthStateChanged(function(user) {
  if (user) { currentUser = user; var label = document.getElementById('userRoleLabel'); if (label) label.textContent = '👤 ' + user.email; showScreen('mainScreen'); verifierNouvellesAnnonces(); ecouterStatutPremium(user.uid); if (typeof refreshAll === 'function') refreshAll(); if (typeof afficherDashboard === 'function') afficherDashboard(); }
  else { currentUser = null; var loginScreen = document.getElementById('loginScreen'); if (loginScreen && !loginScreen.classList.contains('active')) { showScreen('loginScreen'); } }
});

// ========== PREMIUM ==========
function ecouterStatutPremium(uid) {
  dbFS.collection('users').doc(uid).onSnapshot(function(doc) {
    var btnPrem = document.getElementById('btnPremium'); var now = Date.now();
    if (doc.exists) { var data = doc.data(); var expire = data.premiumExpire || 0; if (isSuperAdmin()) { userPremiumStatus = true; userPremiumExpire = now + (365 * 24 * 60 * 60 * 1000); } else if (data.premium === true && expire > now) { userPremiumStatus = true; userPremiumExpire = expire; } else { userPremiumStatus = false; userPremiumExpire = 0; } } else { userPremiumStatus = false; userPremiumExpire = 0; }
    if (btnPrem) { if (userPremiumStatus) { btnPrem.style.display = 'none'; } else { btnPrem.style.display = 'block'; } }
    if (typeof majInterfacePremium === 'function') majInterfacePremium();
  }, function(error) { var btnPrem = document.getElementById('btnPremium'); if (btnPrem) btnPrem.style.display = 'block'; if (typeof majInterfacePremium === 'function') majInterfacePremium(); });
}
function ouvrirModalPremium() { if (userPremiumStatus) { alert("✅ Vous êtes Premium actif."); return; } document.getElementById('premiumModal').style.display = 'flex'; }
function fermerModalPremium() { document.getElementById('premiumModal').style.display = 'none'; }
function majInterfacePremium() {
  var box = document.getElementById('monCompteBox');
  if (box && currentUser) {
    var isDev = isSuperAdmin(); var statut = isDev ? "<span style='color:green'>✅ Développeur (Illimité)</span>" : (userPremiumStatus ? "<span style='color:green'>✅ Premium</span>" : "<span style='color:red'>❌ Gratuit</span>"); var expire = (userPremiumStatus && !isDev) ? new Date(userPremiumExpire).toLocaleDateString() : "-";
    box.innerHTML = "<p><strong>Email :</strong> " + currentUser.email + "</p><p><strong>Statut :</strong> " + statut + "</p>" + (isDev ? "" : "<p><strong>Valide jusqu'au :</strong> " + expire + "</p>");
    var card = document.getElementById('cardActivationRapide'); if (card) { if (isDev) { card.style.display = 'block'; if (typeof chargerListeClients === 'function') chargerListeClients(); } else { card.style.display = 'none'; } }
  }
}
function chargerListeClients() {
  if (!isSuperAdmin()) return; var box = document.getElementById('listeClientsAdmin'); if(!box) return; box.innerHTML = "⏳ Chargement des clients...";
  dbFS.collection('users').get().then(function(querySnapshot) {
    if (querySnapshot.empty) { box.innerHTML = "<p>Aucun client trouvé.</p>"; return; }
    var html = '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Email / Tel</th><th>Statut</th><th>Jours</th><th>Forfaits</th><th>Outils</th></tr></thead><tbody>';
    querySnapshot.forEach(function(doc) {
      var data = doc.data(); var docId = doc.id; var email = data.email || 'Inconnu'; var phone = data.phone || ''; if (SUPER_ADMIN_EMAILS.includes(email)) return; var isPrem = data.premium === true && (data.premiumExpire || 0) > Date.now(); var isIllimite = data.premiumExpire > 32503680000000; var joursRestants = 0; if (isPrem && !isIllimite) { joursRestants = Math.ceil((data.premiumExpire - Date.now()) / (1000 * 60 * 60 * 24)); }
      var badgeStatut = isIllimite ? '<span class="badge" style="background:#ffd700;color:#000;font-weight:bold;">♾️ Illimité</span>' : (isPrem ? '<span class="badge badge-ok">✅ Premium</span>' : '<span class="badge badge-archive">❌ Gratuit</span>'); var txtJours = isIllimite ? 'À vie' : (isPrem ? joursRestants + ' j' : '-');
      html += '<tr><td style="font-size:11px;">' + email + '<br><span style="color:#666;">' + phone + '</span></td><td>' + badgeStatut + '</td><td style="text-align:center;">' + txtJours + '</td><td>';
      html += '<button class="btn-mini" style="background:#4caf50;" onclick="modifierAbonnement(\'' + docId + '\', 30)">+30j</button> <button class="btn-mini" style="background:#2196f3;" onclick="modifierAbonnement(\'' + docId + '\', 60)">+60j</button> <button class="btn-mini" style="background:#ff9800;" onclick="modifierAbonnement(\'' + docId + '\', 90)">+90j</button> <button class="btn-mini" style="background:#9c27b0;" onclick="modifierAbonnement(\'' + docId + '\', 9999)">♾️</button></td>';
      html += '<td>'; if (isPrem && phone) { var dateExp = isIllimite ? 'À vie' : new Date(data.premiumExpire).toLocaleDateString('fr-FR'); html += '<button class="btn-mini" style="background:#25D366;" onclick="envoyerWhatsApp(\'' + phone + '\', \'' + email + '\', \'' + dateExp + '\')">📱 WA</button> '; } html += '<button class="btn-mini danger" onclick="supprimerClient(\'' + docId + '\')">🗑️</button></td></tr>';
    });
    html += '</tbody></table></div>'; box.innerHTML = html;
  }).catch(function(error) { box.innerHTML = "<p style='color:red;'>Erreur : " + error.message + "</p>"; });
}
function modifierAbonnement(docId, jours) {
  if (!isSuperAdmin()) return; dbFS.collection('users').doc(docId).get().then(function(doc) { if (!doc.exists) return; var data = doc.data(); var nouvelleExpiration; if (jours === 9999) { nouvelleExpiration = 32503680000000; } else { var baseDate = (data.premiumExpire && data.premiumExpire > Date.now()) ? data.premiumExpire : Date.now(); nouvelleExpiration = baseDate + (jours * 24 * 60 * 60 * 1000); } return dbFS.collection('users').doc(docId).update({ premium: true, premiumExpire: nouvelleExpiration }); }).then(function() { chargerListeClients(); alert('✅ Abonnement mis à jour !'); }).catch(function(err) { alert("Erreur : " + err.message); });
}
function envoyerWhatsApp(phone, email, dateExp) { var cleanPhone = phone.replace(/\s+/g, '').replace('+', ''); var message = "Bonjour ! Votre compte EMM Mondial (" + email + ") a bien été activé. Il est valide jusqu'au : " + dateExp + ". Que Dieu vous bénisse !"; window.open("https://wa.me/" + cleanPhone + "?text=" + encodeURIComponent(message), '_blank'); }
function supprimerClient(docId) { if (!isSuperAdmin()) return; if (!confirm("⚠️ Supprimer définitivement ce client ?")) return; dbFS.collection('users').doc(docId).delete().then(function() { chargerListeClients(); alert("✅ Client supprimé."); }).catch(function(error) { alert("Erreur : " + error.message); }); }

// ========== NOTIFICATIONS ==========
var _derniereAnnonceVueId = localStorage.getItem('derniereAnnonceVue') || null;
function verifierNouvellesAnnonces() { if (!currentUser) return; dbFS.collection('annonces').orderBy('dateCreation', 'desc').limit(1).onSnapshot(function(querySnapshot) { if (querySnapshot.empty) return; var derniereAnnonce = querySnapshot.docs[0]; var annonceId = derniereAnnonce.id; var badge = document.getElementById('notifBadge'); if (badge) { if (_derniereAnnonceVueId !== annonceId) { badge.style.display = 'block'; } else { badge.style.display = 'none'; } } }); }
function ouvrirNotifications() { var badge = document.getElementById('notifBadge'); if (badge) badge.style.display = 'none'; dbFS.collection('annonces').orderBy('dateCreation', 'desc').limit(1).get().then(function(snap) { if (!snap.empty) { localStorage.setItem('derniereAnnonceVue', snap.docs[0].id); _derniereAnnonceVueId = snap.docs[0].id; } }); var modal = document.getElementById('annoncesModal'); var listeBox = document.getElementById('listeAnnoncesModal'); if (modal && listeBox) { modal.style.display = 'flex'; listeBox.innerHTML = '<p style="text-align:center;color:#888;">Chargement...</p>'; dbFS.collection('annonces').orderBy('dateCreation', 'desc').get().then(function(querySnapshot) { if (querySnapshot.empty) { listeBox.innerHTML = '<p style="text-align:center;color:#888;">Aucune annonce.</p>'; return; } var html = ''; querySnapshot.forEach(function(doc) { var a = doc.data(); if (a.archived) return; html += '<div class="item-list"><strong style="color:#0a6e2c;">📢 ' + a.date + '</strong> — <span style="font-size:11px;color:#666;">' + (a.auteur||'Admin') + '</span><br><p style="margin-top:5px; font-size:14px;">' + echapper(a.texte) + '</p></div>'; }); listeBox.innerHTML = html; }); } }

// ========== REFRESH GLOBAL ET DEMARRAGE ==========
function refreshAll() { try { rafraichirProvinceHeader(); } catch(e) {} try { peuplerProvinceSelects(); } catch(e) {} try { rafraichirEntites(); } catch(e) {} try { afficherListeEntites(); } catch(e) {} try { afficherJournaliere(); } catch(e) {} try { rafraichirCandidatsSelect(); } catch(e) {} try { afficherCandidats(); } catch(e) {} try { afficherVersements(); } catch(e) {} try { refreshPatrimoineSites(); } catch(e) {} try { recalculerTotauxRN(); } catch(e) {} try { syncSignatureEncrePickers(); } catch(e) {} }

document.addEventListener('DOMContentLoaded', function() { showScreen('splashScreen'); rafraichirProvinceHeader(); peuplerProvinceSelects(); syncSignatureEncrePickers(); setTimeout(function() { var splash = document.getElementById('splashScreen'); if (splash && splash.classList.contains('active')) { showScreen('loginScreen'); } }, 800); setTimeout(function() { DB.init().then(function() { try { initDB(); } catch(e) {} }).catch(function(e) { console.error('❌ DB:', e); }); }, 100); });
document.addEventListener('click', function(e) { var menu = document.getElementById('mainMenu'); var btn = document.querySelector('.btn-hamburger'); if (menu && menu.classList.contains('open') && !menu.contains(e.target) && btn && !btn.contains(e.target)) { fermerMainMenu(); } });
window._signalerSauvegarde = function() { var el = document.getElementById('saveIndicator'); if (!el) return; el.style.opacity = '1'; el.textContent = '💾 Sauvegardé'; clearTimeout(window._saveTimeout); window._saveTimeout = setTimeout(function() { el.style.opacity = '0.35'; el.textContent = '💾'; }, 1200); };
function majBandeauOffline() { var banner = document.getElementById('offlineBanner'); if (!banner) return; banner.style.display = navigator.onLine ? 'none' : 'block'; }
window.addEventListener('online', majBandeauOffline); window.addEventListener('offline', majBandeauOffline); window.addEventListener('load', majBandeauOffline);
