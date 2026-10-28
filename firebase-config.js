// firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyCaKevH6Qam2z_5fkYSHb2SfSq88iQ_OnQ",
  authDomain: "emm-rd-congo.firebaseapp.com",
  projectId: "emm-rd-congo",
  storageBucket: "emm-rd-congo.firebasestorage.app",
  messagingSenderId: "490342609884",
  appId: "1:490342609884:web:13af4f8e6c987a209a1519"
};

// Initialisation Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const dbFS = firebase.firestore();
