// ====== À REMPLIR ======
const OWNER_EMAIL = "papegning2008@gmail.com"; // le seul compte qui peut écrire dans les annonces
const RECAPTCHA_SITE_KEY = "VOTRE_CLE_RECAPTCHA_V3"; // anti-robot (App Check + reCAPTCHA v3)
firebase.initializeApp({
  apiKey: "AIzaSyCm-fwQCxNyLBMDzWrVKK53C8Sr8gk2y5Y",
  authDomain: "galsenapp-ec10e.firebaseapp.com",
  projectId: "galsenapp-ec10e",
  appId: "1:445125146195:web:88cd4a367661709a1cb8a6"
});
if (!RECAPTCHA_SITE_KEY.startsWith("VOTRE")) firebase.appCheck().activate(RECAPTCHA_SITE_KEY, true);
// =======================

const auth = firebase.auth(), db = firebase.firestore();
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); // reste connecté
const $ = s => document.querySelector(s);
