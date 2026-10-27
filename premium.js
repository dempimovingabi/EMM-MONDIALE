// ============================================
// PREMIUM.JS - Module externe Firebase
// Ne touche pas à app.js, se greffe par-dessus
// ============================================

// 🔴 VOTRE PASSE-DROIT DÉVELOPPEUR 🔴
var SUPER_ADMIN_EMAIL = "dedickmpiana@gmail.com"; 
var userPremiumStatus = false;
var userPremiumExpire = 0;

// Redéfinition de la fonction login (qui existe dans app.js)
window.login = function() {
  var email = document.getElementById('loginEmail').value.trim();
  var pass = document.getElementById('loginPassword').value.trim();
  var errBox = document.getElementById('loginError');
  
  if (!email || !pass) { errBox.textContent = '❌ Entrez l\'email et le mot de passe'; return; }
  errBox.textContent = '⏳ Connexion...';
  
  auth.signInWithEmailAndPassword(email, pass)
    .then(function() {
      errBox.textContent = '';
      document.getElementById('loginPassword').value = '';
    })
    .catch(function(error) {
      errBox.textContent = '❌ ' + error.message;
    });
};

window.creerCompte = function() {
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
};

window.logout = function() {
  if (!confirm('Voulez-vous vraiment vous déconnecter ?')) return;
  auth.signOut().then(function() {
    window.currentUser = null;
    userPremiumStatus = false;
    userPremiumExpire = 0;
    showScreen('loginScreen');
  });
};

auth.onAuthStateChanged(function(user) {
  if (user) {
    window.currentUser = user;
    var label = document.getElementById('userRoleLabel');
    if (label) label.textContent = '👤 ' + user.email;
    
    showScreen('mainScreen');
    ecouterStatutPremium(user.uid);
    
    // Si la fonction d'initialisation de app.js existe, on l'appelle
    if (typeof appliquerSession === 'function') appliquerSession();
  } else {
    window.currentUser = null;
    showScreen('loginScreen');
  }
});

function ecouterStatutPremium(uid) {
  dbFS.collection('users').doc(uid).onSnapshot(function(doc) {
    if (doc.exists) {
      var data = doc.data();
      var now = Date.now();
      var expire = data.premiumExpire || 0;
      
      if (window.currentUser.email === SUPER_ADMIN_EMAIL) {
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

// ============================================
// LE "BOUCLIER" PREMIUM
// On enveloppe les fonctions d'impression de app.js
// ============================================

// Sauvegarde de la fonction d'origine
var originalOuvrirModalPdf = window.ouvrirModalPdf;
window.ouvrirModalPdf = function(contexte) {
  if (window.currentUser && window.currentUser.email === SUPER_ADMIN_EMAIL) {
    return originalOuvrirModalPdf(contexte); // Laisse passer le développeur
  }
  if (!userPremiumStatus) {
    alert("🔒 Cette fonctionnalité (Rapport PDF) est réservée aux églises abonnées Premium.\n\nCliquez sur le bouton ⭐ Premium en haut pour vous abonner.");
    return;
  }
  return originalOuvrirModalPdf(contexte);
};

var originalExporterWordBox = window.exporterWordBox;
if (originalExporterWordBox) {
  window.exporterWordBox = function(boxId, nom) {
    if (window.currentUser && window.currentUser.email === SUPER_ADMIN_EMAIL) {
      return originalExporterWordBox(boxId, nom);
    }
    if (!userPremiumStatus) {
      alert("🔒 Cette fonctionnalité (Export Word) est réservée aux églises abonnées Premium.");
      return;
    }
    return originalExporterWordBox(boxId, nom);
  };
}

// ============================================
// GESTION DE LA FENÊTRE PREMIUM
// ============================================
window.ouvrirModalPremium = function() { 
  if (userPremiumStatus) { alert("✅ Vous êtes Premium actif."); return; }
  document.getElementById('premiumModal').style.display = 'flex'; 
};
window.fermerModalPremium = function() { 
  document.getElementById('premiumModal').style.display = 'none'; 
};

window.activerPremium = function() {
  var code = document.getElementById('premiumCode').value.trim().toUpperCase();
  if (!code) return alert("Entrez un code.");
  if (code === 'EMM-PREM-OK') {
    var expiration = Date.now() + (30 * 24 * 60 * 60 * 1000);
    dbFS.collection('users').doc(window.currentUser.uid).update({ premium: true, premiumExpire: expiration })
    .then(function() { alert("✅ Compte Premium activé pour 30 jours !"); fermerModalPremium(); })
    .catch(function() { alert("Erreur d'activation."); });
  } else { alert("❌ Code invalide."); }
};

function majInterfacePremium() {
  var box = document.getElementById('monCompteBox');
  if (box && window.currentUser) {
    var isDev = window.currentUser.email === SUPER_ADMIN_EMAIL;
    var statut = isDev ? "<span style='color:green'>✅ Développeur (Illimité)</span>" : (userPremiumStatus ? "<span style='color:green'>✅ Premium</span>" : "<span style='color:red'>❌ Gratuit</span>");
    var expire = (userPremiumStatus && !isDev) ? new Date(userPremiumExpire).toLocaleDateString() : "-";
    box.innerHTML = "<p><strong>Email :</strong> " + window.currentUser.email + "</p><p><strong>Statut :</strong> " + statut + "</p>" + (isDev ? "" : "<p><strong>Valide jusqu'au :</strong> " + expire + "</p>");
  }
}

// On attend que la page soit chargée pour démarrer
window.addEventListener('load', function() {
  setTimeout(function() {
    if (!window.currentUser) showScreen('loginScreen');
  }, 1000);
});
