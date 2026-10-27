// ============================================
// EMM MONDIAL — LOGIQUE v34 (Firebase + Premium)
// ============================================

var currentUser = null;
var userPremiumStatus = false;
var userPremiumExpire = 0;
var pdfContexteEnAttente = null;

// 🔴 VOTRE PASSE-DROIT DÉVELOPPEUR ICI 🔴
var SUPER_ADMIN_EMAIL = "dedickmpiana@gmail.com"; 

// Configuration Provinces
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
      // Initialiser l'utilisateur dans la base de données Firestore
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

// Écouteur d'état (connexion / déconnexion)
auth.onAuthStateChanged(function(user) {
  if (user) {
    currentUser = user;
    var label = document.getElementById('userRoleLabel');
    if (label) label.textContent = '👤 ' + user.email;
    
    showScreen('mainScreen');
    ecouterStatutPremium(user.uid);
    // synchroniserDonnees(); // (Optionnel pour l'instant, on garde le stockage local DB.js)
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
      
      // Vérification du passe-droit Super Admin
      if (currentUser.email === SUPER_ADMIN_EMAIL) {
        userPremiumStatus = true;
        userPremiumExpire = now + (365 * 24 * 60 * 60 * 1000); // Illimité
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

// ========== GESTION PREMIUM ==========

function verifierPremium() {
  // Si c'est le développeur, on laisse passer
  if (currentUser && currentUser.email === SUPER_ADMIN_EMAIL) return true;

  if (!userPremiumStatus) {
    alert("🔒 Cette fonctionnalité (PDF / Exportation) est réservée aux églises abonnées Premium.\n\nCliquez sur le bouton ⭐ Premium en haut pour vous abonner.");
    return false;
  }
  return true;
}

function ouvrirModalPremium() {
  if (userPremiumStatus) {
    alert("✅ Vous êtes Premium actif jusqu'au " + new Date(userPremiumExpire).toLocaleDateString());
    return;
  }
  document.getElementById('premiumModal').style.display = 'flex';
}

function fermerModalPremium() {
  document.getElementById('premiumModal').style.display = 'none';
}

function activerPremium() {
  var code = document.getElementById('premiumCode').value.trim().toUpperCase();
  if (!code) return alert("Entrez un code.");
  
  // Code d'activation universel pour le moment
  if (code === 'EMM-PREM-OK') {
    var expiration = Date.now() + (30 * 24 * 60 * 60 * 1000); // +30 jours
    dbFS.collection('users').doc(currentUser.uid).update({
      premium: true,
      premiumExpire: expiration
    }).then(function() {
      alert("✅ Félicitations ! Votre compte est maintenant Premium pour 30 jours.");
      fermerModalPremium();
    }).catch(function(e) {
      alert("Erreur d'activation.");
    });
  } else {
    alert("❌ Code invalide. Contactez l'administrateur.");
  }
}

function majInterfacePremium() {
  var box = document.getElementById('monCompteBox');
  if (box && currentUser) {
    var isDev = currentUser.email === SUPER_ADMIN_EMAIL;
    var statut = isDev ? "<span style='color:green'>✅ Développeur (Illimité)</span>" : 
                 (userPremiumStatus ? "<span style='color:green'>✅ Premium</span>" : "<span style='color:red'>❌ Gratuit</span>");
    var expire = (userPremiumStatus && !isDev) ? new Date(userPremiumExpire).toLocaleDateString() : "-";
    
    box.innerHTML = "<p><strong>Email :</strong> " + currentUser.email + "</p>" +
                    "<p><strong>Statut :</strong> " + statut + "</p>" +
                    (isDev ? "" : "<p><strong>Valide jusqu'au :</strong> " + expire + "</p>");
  }
}

// ========== OUTILS ET LOGIQUE UI ==========

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); s.style.display = 'none'; });
  var el = document.getElementById(id);
  if (el) { el.classList.add('active'); el.style.display = (id === 'splashScreen' || id === 'loginScreen') ? 'flex' : 'block'; }
  window.scrollTo(0, 0);
}

function toggleMainMenu() {
  var menu = document.getElementById('mainMenu');
  if (menu) menu.classList.toggle('open');
}

function switchMainTab(name, btn) {
  document.querySelectorAll('.main-tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.main-tab-content').forEach(function(c) { c.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  var tab = document.getElementById('tab-' + name);
  if (tab) tab.classList.add('active');
  if (name === 'general') afficherDashboard();
  if (name === 'admin') majInterfacePremium();
}

function getProvinceActive() { return DB.get('provinceActive', '') || ''; }
function setProvinceActive(p) { DB.set('provinceActive', p || ''); rafraichirProvinceHeader(); refreshAll(); }
function rafraichirProvinceHeader() {
  var btn = document.getElementById('btnProvince');
  if (btn) btn.textContent = getProvinceActive() ? '🌍 ' + getProvinceActive() : '🌍 Toutes';
}

function peuplerProvinceSelects() {
  var html = '<option value="">-- Toutes --</option>';
  PROVINCES_RDC.forEach(function(p) { html += '<option value="' + p + '">' + p + '</option>'; });
  ['jProvinceEntite', 'cProvince'].forEach(function(id) {
    var sel = document.getElementById(id); if (!sel) return;
    var cur = sel.value; sel.innerHTML = html; if (cur) sel.value = cur;
  });
}

function ouvrirModalProvince() {
  peuplerProvinceSelects();
  var sel = document.getElementById('provinceSelect'); if (sel) sel.value = getProvinceActive();
  document.getElementById('provinceModal').style.display = 'flex';
}
function fermerModalProvince() { document.getElementById('provinceModal').style.display = 'none'; }
function confirmerProvince() {
  var sel = document.getElementById('provinceSelect'); if (sel) setProvinceActive(sel.value);
  fermerModalProvince();
}

function echapper(s) { return s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : ''; }

// ========== IMPRESSION PDF (AVEC VERIFICATION PREMIUM) ==========

function ouvrirModalPdf(contexte) {
  if (!verifierPremium()) return; // BLOQUAGE ICI
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
  w.document.write('<p style="text-align:center;font-size:10px;color:#888;">Généré par ' + (currentUser ? currentUser.email : '') + ' le ' + new Date().toLocaleString() + '</p></body></html>');
  w.document.close();
  fermerModalPdf();
  setTimeout(function() { w.print(); }, 800);
}

function exporterWordBox(boxId, nom) {
  if (!verifierPremium()) return; // BLOQUAGE ICI
  var contenu = document.getElementById(boxId).innerHTML;
  if (!contenu) return alert('Rapport vide');
  var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="UTF-8"></head><body>' + contenu + '</body></html>';
  var blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a'); a.href = url; a.download = 'Rapport_' + nom + '.doc'; a.click();
}

// ========== FONCTIONS BASIQUES UI ==========
function imprimerGeneral() { ouvrirModalPdf({ type: 'box', boxId: 'rapportGeneralBox', titre: 'Rapport Général' }); }
function exporterWordGeneral() { exporterWordBox('rapportGeneralBox','General'); }
function imprimerRapportFreq() { ouvrirModalPdf({ type: 'box', boxId: 'rapportFreqBox', titre: 'Fréquence' }); }
function exporterWordFreq() { exporterWordBox('rapportFreqBox','Frequence'); }
function imprimerRapportFin() { ouvrirModalPdf({ type: 'box', boxId: 'rapportFinBox', titre: 'Finance' }); }
function imprimerRapportDep() { ouvrirModalPdf({ type: 'box', boxId: 'rapportDepBox', titre: 'Dépouillement' }); }
function genererRapportNumerique() { if(verifierPremium()) { ouvrirModalPdf({ type: 'html', html: '<p>Rapport généré</p>', titre: 'Rapport Numérique' }); } }

// Initialisation
window.addEventListener('load', function() {
  showScreen('splashScreen');
  setTimeout(function() {
    rafraichirProvinceHeader();
    peuplerProvinceSelects();
    var sess = DB.get('session');
    if (!currentUser) showScreen('loginScreen');
  }, 2000);
});
