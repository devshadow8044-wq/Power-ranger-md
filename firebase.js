// ====== À REMPLIR ======
const OWNER_EMAIL = "devshadow8044@gmail.com"; // le seul compte qui peut écrire dans les annonces
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
const ANN = "annonces";
const TS = () => firebase.firestore.FieldValue.serverTimestamp();
const ini = s => (s || "?").trim().slice(0, 1).toUpperCase();
const digits = s => (s || "").replace(/\D/g, "");
const msgsOf = id => db.collection("chats").doc(id).collection("messages");
const cidOf = (a, b) => [a, b].sort().join("_");
const online = u => !!(u && u.lastSeen && Date.now() - u.lastSeen.toMillis() < 70000);
function fmt(d) {
  const n = new Date(), y = new Date(n); y.setDate(n.getDate() - 1);
  if (d.toDateString() === n.toDateString()) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === y.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR");
}
function setAv(el, u, ann) {
  el.classList.toggle("ann", !!ann);
  if (ann) { el.style.backgroundImage = ""; el.textContent = "📢"; return; }
  if (u && u.photo) { el.style.backgroundImage = 'url("' + u.photo + '")'; el.textContent = ""; }
  else { el.style.backgroundImage = ""; el.textContent = ini(u && (u.name || u.email)); }
}
function requireUser(cb) {
  auth.onAuthStateChanged(u => {
    if (!u || !u.emailVerified) { if (u) auth.signOut(); location.replace("index.html"); return; }
    const ping = () => db.collection("users").doc(u.uid).set({ lastSeen: TS() }, { merge: true }).catch(() => {});
    db.collection("users").doc(u.uid).set({ name: u.displayName || u.email, email: u.email.toLowerCase(), lastSeen: TS() }, { merge: true }).catch(() => {});
    setInterval(ping, 30000);
    cb(u);
  });
}
function mountTabs(active) {
  const T = [["chats", "Discussions", '<path d="M5 5h14v10H10l-5 4z"/>'], ["appels", "Appels", '<path d="M6 4l3 1 1 4-2 1.5a11 11 0 0 0 5.5 5.5L15 14l4 1 1 3-2 2C10 20 4 13 4 6z"/>'], ["actus", "Actus", '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/>']];
  const n = document.createElement("nav"); n.id = "tabs";
  n.innerHTML = T.map(t => '<button data-h="' + t[0] + '.html" class="' + (t[0] === active ? "on" : "") + '"><span class="pill"><svg class="i" viewBox="0 0 24 24">' + t[2] + '</svg>' + (t[0] === "chats" ? '<span class="bd pb hide" id="tbd"></span>' : "") + '</span>' + t[1] + '</button>').join("");
  n.querySelectorAll("button").forEach(b => b.onclick = () => { if (!b.classList.contains("on")) location.href = b.dataset.h; });
  document.querySelector(".pg").appendChild(n);
}
// sons (créés par le navigateur, sans fichier)
let AC;
function beep(a, b) {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
    o.connect(g); g.connect(AC.destination);
    o.frequency.setValueAtTime(a, t); o.frequency.setValueAtTime(b, t + .08);
    g.gain.setValueAtTime(.18, t); g.gain.exponentialRampToValueAtTime(.001, t + .22);
    o.start(t); o.stop(t + .22);
  } catch (e) {}
}
const sndSend = () => beep(520, 780), sndRecv = () => beep(780, 520);
// photo réduite en JPEG
function toData(file, max, q) {
  return new Promise((ok, ko) => {
    const r = new FileReader();
    r.onload = () => {
      const i = new Image();
      i.onload = () => {
        const k = Math.min(1, max / Math.max(i.width, i.height)), c = document.createElement("canvas");
        c.width = Math.round(i.width * k); c.height = Math.round(i.height * k);
        c.getContext("2d").drawImage(i, 0, 0, c.width, c.height);
        ok(c.toDataURL("image/jpeg", q));
      };
      i.onerror = ko; i.src = r.result;
    };
    r.onerror = ko; r.readAsDataURL(file);
  });
}
