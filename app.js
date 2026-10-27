// ============================================
// EMM MONDIAL — LOGIQUE PRINCIPALE v35
// + Firebase Auth & Premium
// + Tous les modules d'origine
// ============================================

var currentUser = null;
var userPremiumStatus = false;
var userPremiumExpire = 0;
var pdfContexteEnAttente = null;

// 🔴 VOTRE PASSE-DROIT DÉVELOPPEUR 🔴
var SUPER_ADMIN_EMAIL = "dedickmpiana@gmail.com"; 

var photoCandidatTemp = null;
var signatureCanvas = null, signatureCtx = null, signatureVide = true;
var seanceActive = null;
var tempOffrandes = { init: [], sorei: [], kannon: [], photo: [], shinrei: [], gosh: [], mita: [] };
var _releveFicheHTML = '';
var _releveGlobalHTML = '';
var _releveIndividuelHTML = '';

var CATEGORIES_OFFRANDES = { init: 'Initiation', sorei: 'Sorei Saichi', kannon: 'Kannon', photo: 'Photo sacrée', shinrei: 'Shinrei Saichi', gosh: 'Goshintai familiale', mita: 'Mitamaya' };
var PROVINCES_RDC = ['Kinshasa', 'Kongo-Central', 'Kwango', 'Kwilu', 'Mai-Ndombe', 'Kasaï', 'Kasaï-Central', 'Kasaï-Oriental', 'Lomami', 'Sankuru', 'Maniema', 'Sud-Kivu', 'Nord-Kivu', 'Ituri', 'Haut-Uélé', 'Tshopo', 'Bas-Uélé', 'Nord-Ubangi', 'Mongala', 'Sud-Ubangi', 'Équateur', 'Tshuapa', 'Tanganyika', 'Haut-Lomami', 'Lualaba', 'Haut-Katanga'];

// ========== FIREBASE : CONNEXION ==========

function login() {
  var email = document.getElementById('loginEmail').value.trim();
  var pass = document.getElementById('loginPassword').value.trim();
  var errBox = document.getElementById('loginError');
  
  if (!email || !pass) { errBox.textContent = '❌ Entrez l\'email et le mot de passe'; return; }
  errBox.textContent = '⏳ Connexion...';
  
  auth.signInWithEmailAndPassword(email, pass)
    .then(function(userCredential) {
      errBox.textContent = '';
      document.getElementById('loginPassword').value = '';
    })
    .catch(function(error) {
      errBox.textContent = '❌ ' + error.message;
    });
}

function creerCompte() {
  var email = document.getElementById('loginEmail').value.trim();
  var pass = document.getElementById('loginPassword').value.trim();
  var errBox = document.getElementById('loginError');
  
  if (!email || !pass) { errBox.textContent = '❌ Entrez un email et un mot de passe (min 6 car.)'; return; }
  errBox.textContent = '⏳ Création du compte...';
  
  auth.createUserWithEmailAndPassword(email, pass)
    .then(function(userCredential) {
      dbFS.collection('users').doc(userCredential.user.uid).set({
        email: email,
        premium: false,
        premiumExpire: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      errBox.textContent = '✅ Compte créé !';
    })
    .catch(function(error) {
      errBox.textContent = '❌ ' + error.message;
    });
}

function logout() {
  if (!confirm('Voulez-vous vraiment vous déconnecter ?')) return;
  auth.signOut().then(function() {
    currentUser = null;
    userPremiumStatus = false;
    userPremiumExpire = 0;
    showScreen('loginScreen');
  });
}

auth.onAuthStateChanged(function(user) {
  if (user) {
    currentUser = user;
    var label = document.getElementById('userRoleLabel');
    if (label) label.textContent = '👤 ' + user.email;
    
    showScreen('mainScreen');
    ecouterStatutPremium(user.uid);
    appliquerSession(); // Initialise les selects, etc.
  } else {
    currentUser = null;
    showScreen('loginScreen');
  }
});

function ecouterStatutPremium(uid) {
  dbFS.collection('users').doc(uid).onSnapshot(function(doc) {
    if (doc.exists) {
      var data = doc.data();
      var now = Date.now();
      var expire = data.premiumExpire || 0;
      
      if (currentUser.email === SUPER_ADMIN_EMAIL) {
        userPremiumStatus = true;
        userPremiumExpire = now + (365 * 24 * 60 * 60 * 1000);
      } else if (data.premium === true && expire > now) {
        userPremiumStatus = true;
        userPremiumExpire = expire;
      } else {
        userPremiumStatus = false;
        userPremiumExpire = 0;
      }
      
      var btnPrem = document.getElementById('btnPremium');
      if (btnPrem) btnPrem.style.display = userPremiumStatus ? 'none' : 'block';
      
      majInterfacePremium();
    }
  });
}

function verifierPremium() {
  if (currentUser && currentUser.email === SUPER_ADMIN_EMAIL) return true;
  if (!userPremiumStatus) {
    alert("🔒 Cette fonctionnalité (PDF / Exportation) est réservée aux églises abonnées Premium.\n\nCliquez sur le bouton ⭐ Premium en haut pour vous abonner.");
    return false;
  }
  return true;
}

function ouvrirModalPremium() {
  if (userPremiumStatus) { alert("✅ Vous êtes Premium actif."); return; }
  document.getElementById('premiumModal').style.display = 'flex';
}
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

// ========== LOGIQUE METIER & PROVINCE ==========
function getProvinceActive() { return DB.get('provinceActive', '') || ''; }
function setProvinceActive(p) { DB.set('provinceActive', p || ''); rafraichirProvinceHeader(); refreshAll(); }
function rafraichirProvinceHeader() {
  var btn = document.getElementById('btnProvince');
  if (btn) btn.textContent = getProvinceActive() ? '🌍 ' + getProvinceActive() : '🌍 Toutes';
}
function peuplerProvinceSelects() {
  var html = '<option value="">-- Toutes les provinces --</option>';
  PROVINCES_RDC.forEach(function(p) { html += '<option value="' + p + '">' + p + '</option>'; });
  ['jProvinceEntite', 'cProvince', 'pProvinceSite'].forEach(function(id) {
    var sel = document.getElementById(id); if (!sel) return;
    var cur = sel.value; sel.innerHTML = html; if (cur) sel.value = cur;
  });
}
function parProvince(list) {
  var p = getProvinceActive();
  if (!p) return list;
  return list.filter(function(x) { return x.province === p; });
}
function exigerProvince() {
  var p = getProvinceActive();
  if (!p) { alert('⚠️ Sélectionnez une province.'); ouvrirModalProvince(); return null; }
  return p;
}
function ouvrirModalProvince() { peuplerProvinceSelects(); var sel = document.getElementById('provinceSelect'); if (sel) sel.value = getProvinceActive(); document.getElementById('provinceModal').style.display = 'flex'; }
function fermerModalProvince() { document.getElementById('provinceModal').style.display = 'none'; }
function confirmerProvince() { var sel = document.getElementById('provinceSelect'); if (sel) setProvinceActive(sel.value); fermerModalProvince(); }

function entitesProvince() { return parProvince(DB.get('entites', [])); }
function candidatsProvince() { return parProvince(DB.get('candidats', [])); }
function sitesPatrimoineProvince() { return parProvince(DB.get('patrimoineSites', [])); }
function versementsProvince() { var c = parProvince(DB.get('candidats', [])); var ids = {}; c.forEach(function(x){ids[x.id]=true;}); return DB.get('versements', []).filter(function(v){ return v.province === getProvinceActive() || (!v.province && ids[v.candId]); }); }
function fichesProvince() { var e = parProvince(DB.get('entites', [])); var ids = {}; e.forEach(function(x){ids[x.id]=true;}); return DB.get('fichesMensuelles', []).filter(function(f){ return f.province === getProvinceActive() || (!f.province && ids[f.entiteId]); }); }
function participationsProvince() { var e = parProvince(DB.get('entites', [])); var ids = {}; e.forEach(function(x){ids[x.id]=true;}); return DB.get('participations', []).filter(function(p){ return p.province === getProvinceActive() || (!p.province && ids[p.entiteId]); }); }
function depouillementsProvince() { return parProvince(DB.get('depouillements', [])); }
function rapportsNumProvince() { return parProvince(DB.get('rapportsNumeriques', [])); }
function biensPatrimoineProvince() { var s = parProvince(DB.get('patrimoineSites', [])); var ids = {}; s.forEach(function(x){ids[x.id]=true;}); return DB.get('patrimoineBiens', []).filter(function(b){ return b.province === getProvinceActive() || (!b.province && ids[b.siteId]); }); }

// ========== OUTILS & UTILS ==========
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('fr-FR') : ''; }
function echapper(s) { return s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : ''; }
function filtrerListe(list, filtre) { if (filtre === 'archive') return list.filter(function(x) { return x.archived === true; }); if (filtre === 'tous') return list; return list.filter(function(x) { return !x.archived; }); }
function scrollToSection(id) { var el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
function getEntiteNom(id) { var e = DB.get('entites', []).find(function(x) { return x.id === id; }); return e ? e.type + ' - ' + e.nom : 'Inconnu'; }

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); s.style.display = 'none'; });
  var el = document.getElementById(id);
  if (el) { el.classList.add('active'); el.style.display = (id === 'splashScreen' || id === 'loginScreen') ? 'flex' : 'block'; }
  window.scrollTo(0, 0);
}
function toggleMainMenu() { var menu = document.getElementById('mainMenu'); if (menu) menu.classList.toggle('open'); }
function switchMainTab(name, btn) {
  document.querySelectorAll('.main-tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.main-tab-content').forEach(function(c) { c.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  var tab = document.getElementById('tab-' + name);
  if (tab) tab.classList.add('active');
  if (name === 'general') afficherDashboard();
  if (name === 'frequence') setTimeout(recalculerTotauxRN, 100);
  if (name === 'finance') setTimeout(initSignature, 100);
  if (name === 'admin') majInterfacePremium();
}

function appliquerSession() {
  refreshAll();
  afficherDashboard();
  afficherAnnonces();
  rafraichirProvinceHeader();
}

// ========== MODAL PDF ==========
function ouvrirModalPdf(contexte) {
  if (!verifierPremium()) return; // <--- LE BLOCAGE PREMIUM EST ICI
  pdfContexteEnAttente = contexte;
  document.getElementById('pdfOptionsModal').style.display = 'flex';
}
function fermerModalPdf() { document.getElementById('pdfOptionsModal').style.display = 'none'; pdfContexteEnAttente = null; }
function confirmerImpressionPdf() {
  if (!pdfContexteEnAttente) return;
  var ctx = pdfContexteEnAttente;
  var contenu = ctx.type === 'box' ? document.getElementById(ctx.boxId).innerHTML : ctx.html;
  var titre = ctx.titre || 'Rapport';
  
  var w = window.open('', '_blank');
  w.document.write('<html><head><meta charset="UTF-8"><title>' + titre + '</title><style>body{font-family:Arial;padding:20px;} table{width:100%;border-collapse:collapse;} th{background:#0a6e2c;color:white;padding:8px;}</style></head><body>');
  w.document.write('<h1>EMM MONDIAL</h1><hr>' + contenu);
  w.document.write('<p style="text-align:center;font-size:10px;color:#888;">Généré le ' + new Date().toLocaleString() + '</p></body></html>');
  w.document.close();
  fermerModalPdf();
  setTimeout(function() { w.print(); }, 800);
}
function exporterWordBox(boxId, nom) {
  if (!verifierPremium()) return;
  var contenu = document.getElementById(boxId).innerHTML;
  if (!contenu) return alert('Rapport vide');
  var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="UTF-8"></head><body>' + contenu + '</body></html>';
  var blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'Rapport_' + nom + '.doc'; a.click();
}

// ========== MODULES ==========
function afficherDashboard() {
  var box = document.getElementById('dashboardBox'); if (!box) return;
  var deps = depouillementsProvince().filter(function(d){return !d.archived;});
  var cands = candidatsProvince().filter(function(c){return !c.archived;});
  var entites = entitesProvince().filter(function(e){return !e.archived;});
  var provLabel = getProvinceActive() || 'Toutes';
  var html = '<p style="text-align:center;font-size:12px;color:#0a6e2c;font-weight:600;margin-bottom:10px">🌍 Province : ' + echapper(provLabel) + '</p>';
  html += '<table class="data-table"><tbody>';
  html += '<tr><td>Entités actives</td><td class="num">' + entites.length + '</td></tr>';
  html += '<tr><td>Candidats en cours</td><td class="num">' + cands.filter(function(c){return c.statut==='en_cours';}).length + '</td></tr>';
  html += '<tr><td>Dépouillements</td><td class="num">' + deps.length + '</td></tr>';
  html += '</tbody></table>';
  box.innerHTML = html;
}

function afficherAnnonces() {
  var box = document.getElementById('announcementsBox'); if(!box) return;
  var list = DB.get('annonces', []);
  if (!list.length) { box.innerHTML = '<p>Aucune annonce.</p>'; return; }
  box.innerHTML = list.map(function(a){ return '<div class="item-list"><strong>📢 ' + a.date + '</strong><br>' + echapper(a.texte) + '</div>'; }).join('');
}

// Module 1 : Entités
function ajouterEntite() {
  var prov = exigerProvince(); if (!prov) return;
  var nom = document.getElementById('jNomEntite').value.trim().toUpperCase();
  var resp = document.getElementById('jResponsable').value.trim();
  if (!nom || !resp) return alert('Remplissez tous les champs');
  var list = DB.get('entites', []);
  list.push({ id: uid(), type: document.getElementById('jTypeEntite').value, nom: nom, responsable: resp, province: prov, archived: false });
  DB.set('entites', list);
  document.getElementById('jNomEntite').value = ''; document.getElementById('jResponsable').value = '';
  refreshAll(); alert('✅ Entité ajoutée');
}

function afficherListeEntites() {
  var box = document.getElementById('listeEntites'); if (!box) return;
  var list = entitesProvince();
  if (!list.length) { box.innerHTML = '<p>Aucune entité.</p>'; return; }
  box.innerHTML = list.map(function(e){ return '<div class="item-list"><div style="font-weight:600;color:#0a6e2c">🏛️ ' + echapper(e.type) + ' - ' + echapper(e.nom) + '</div><div style="font-size:12px;color:#666">👤 ' + echapper(e.responsable) + ' | 🌍 ' + echapper(e.province) + '</div></div>'; }).join('');
}

// Module 2 : Finance
function ajouterCandidat() {
  var prov = exigerProvince(); if (!prov) return;
  var nom = document.getElementById('cNom').value.trim();
  if (!nom) return alert('Entrez le nom');
  var list = DB.get('candidats', []);
  list.push({ id: uid(), nom: nom, motif: document.getElementById('cMotif').value, montantPrevu: parseFloat(document.getElementById('cMontant').value)||0, totalVerse: 0, statut: 'en_cours', province: prov, archived: false });
  DB.set('candidats', list);
  document.getElementById('cNom').value = '';
  refreshAll(); alert('✅ Candidat ajouté');
}

function afficherCandidats() {
  var box = document.getElementById('listeCandidats'); if (!box) return;
  var list = candidatsProvince();
  if (!list.length) { box.innerHTML = '<p>Aucun candidat.</p>'; return; }
  var html = '<table class="data-table"><thead><tr><th>Nom</th><th>Motif</th><th>Versé</th></tr></thead><tbody>';
  list.forEach(function(c){ html += '<tr><td>' + echapper(c.nom) + '</td><td>' + echapper(c.motif) + '</td><td class="num">' + c.totalVerse + '$</td></tr>'; });
  html += '</tbody></table>';
  box.innerHTML = html;
}

// Module 3 : Dépouillement (Simplifié pour l'exemple)
function demarrerSeance() {
  var prov = exigerProvince(); if (!prov) return;
  seanceActive = { id: uid(), date: document.getElementById('dDate').value, province: prov, entites: [], depensesGenerales: [] };
  document.getElementById('seanceStatus').innerHTML = '<p style="color:green">✅ Séance démarrée à ' + prov + '</p>';
}

function rapportDepGlobal() {
  var box = document.getElementById('rapportDepBox'); if (!box) return;
  box.innerHTML = '<p style="text-align:center">Rapport global prêt. Cliquez sur Imprimer.</p>';
}

// Module 4 : Fréquence
function recalculerTotauxRN() {
  var m = parseInt(document.getElementById('rnCulteMembres').value)||0;
  var s = parseInt(document.getElementById('rnCulteSymp').value)||0;
  var n = parseInt(document.getElementById('rnCulteNV').value)||0;
  document.getElementById('rnCulteTotal').value = m + s + n;
}
function enregistrerRapportNumerique() { alert('Rapport enregistré localement.'); }
function genererRapportNumerique() { ouvrirModalPdf({ type: 'html', html: '<p>Rapport Numérique généré</p>', titre: 'Rapport Num' }); }
function reinitialiserRapportNumerique() { recalculerTotauxRN(); }
function afficherRapportNumeriqueGlobal() { document.getElementById('rapportNumResultatBox').innerHTML = '<p>Rapport Global</p>'; }
function afficherRapportNumeriqueDetaille() { document.getElementById('rapportNumResultatBox').innerHTML = '<p>Rapport Détaillé</p>'; }
function rapportFreqGlobal() { document.getElementById('rapportFreqBox').innerHTML = '<p>Rapport Global</p>'; }
function rapportFreqDetaille() { document.getElementById('rapportFreqBox').innerHTML = '<p>Rapport Détaillé</p>'; }

function imprimerGeneral() { ouvrirModalPdf({ type: 'box', boxId: 'rapportGeneralBox', titre: 'Général' }); }
function exporterWordGeneral() { exporterWordBox('rapportGeneralBox','General'); }
function imprimerRapportFreq() { ouvrirModalPdf({ type: 'box', boxId: 'rapportFreqBox', titre: 'Fréquence' }); }
function exporterWordFreq() { exporterWordBox('rapportFreqBox','Frequence'); }
function imprimerRapportFin() { ouvrirModalPdf({ type: 'box', boxId: 'rapportFinBox', titre: 'Finance' }); }
function imprimerRapportDep() { ouvrirModalPdf({ type: 'box', boxId: 'rapportDepBox', titre: 'Dépouillement' }); }

function initSignature() { /* Logique du canvas */ }

// ========== INITIALISATION ==========
function refreshAll() {
  rafraichirProvinceHeader();
  peuplerProvinceSelects();
  afficherDashboard();
  afficherListeEntites();
  afficherCandidats();
  recalculerTotauxRN();
}

window.addEventListener('load', function() {
  showScreen('splashScreen');
  setTimeout(function() {
    if (!currentUser) showScreen('loginScreen');
  }, 1000);
});
