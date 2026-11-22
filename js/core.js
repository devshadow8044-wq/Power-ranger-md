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
const $ = s => document.querySelector(s);
const ANN = "annonces";
let me = null;
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// ---------- utilitaires ----------
const ini = s => (s || "?").trim().slice(0, 1).toUpperCase();
const isOwner = () => me && me.email.toLowerCase() === OWNER_EMAIL.toLowerCase();
const cid = o => [me.uid, o].sort().join("_");
const phoneKey = s => (s || "").replace(/\D/g, "").slice(-9); // compare les numéros avec ou sans indicatif
const mine = c => db.collection("users").doc(me.uid).collection(c);
const hhmm = d => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
function when(d) {
  if (!d) return "";
  const t = new Date(), y = new Date(Date.now() - 864e5);
  if (d.toDateString() === t.toDateString()) return hhmm(d);
  if (d.toDateString() === y.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}
function paintAv(el, name, photo, ann) {
  el.className = el.className.replace(/\bann\b/, "").trim() + (ann ? " ann" : "");
  el.style.backgroundImage = photo ? "url(" + photo + ")" : "";
  el.textContent = photo ? "" : (ann ? "📢" : ini(name));
}
// photo carrée réduite (≈ 8 Ko) pour tenir dans Firestore
function imgToData(file, size = 192) {
  return new Promise((ok, ko) => {
    const i = new Image();
    i.onload = () => {
      const c = document.createElement("canvas"); c.width = c.height = size;
      const s = Math.min(i.width, i.height);
      c.getContext("2d").drawImage(i, (i.width - s) / 2, (i.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(i.src); ok(c.toDataURL("image/jpeg", 0.7));
    };
    i.onerror = ko; i.src = URL.createObjectURL(file);
  });
}
// lien d'invitation par SMS (s'ouvre dans l'application SMS du téléphone)
function inviteSms(phone, name) {
  const msg = (name ? "Salut " + name + " ! " : "Salut ! ") + "Retrouve-moi sur GalsenApp pour discuter : " + location.origin + "/login.html";
  const sep = /iPhone|iPad|iPod/i.test(navigator.userAgent) ? "&" : "?";
  location.href = "sms:" + (phone || "") + sep + "body=" + encodeURIComponent(msg);
}
// barre du bas
function tabbar(active) {
  const t = [["index.html", "💬", "Discussions"], ["contacts.html", "👥", "Contacts"], ["settings.html", "⚙️", "Paramètres"]];
  const n = document.createElement("nav"); n.className = "tabbar";
  n.innerHTML = t.map(x => '<a href="' + x[0] + '" class="' + (x[0] === active ? "on" : "") + '"><span>' + x[1] + "</span>" + x[2] + "</a>").join("");
  document.querySelector(".page").appendChild(n);
}
// charge utilisateurs, contacts et bloqués
async function loadPeople() {
  const [us, cs, bs] = await Promise.all([db.collection("users").get(), mine("contacts").get(), mine("blocked").get()]);
  const users = us.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.id !== me.uid);
  const contacts = cs.docs.map(d => ({ id: d.id, ...d.data() }));
  const blocked = new Set(bs.docs.map(d => d.id));
  const byId = {}; users.forEach(u => byId[u.id] = u);
  contacts.forEach(c => { c.user = users.find(u => phoneKey(u.phone) && phoneKey(u.phone) === phoneKey(c.phone)) || null; });
  const nameOf = id => { const c = contacts.find(c => c.user && c.user.id === id); return c ? c.name : (byId[id] ? byId[id].name : "Utilisateur"); };
  return { users, contacts, blocked, byId, nameOf };
}

// ---------- garde : page réservée aux comptes connectés ----------
function requireAuth(cb) {
  auth.onAuthStateChanged(async u => {
    if (!u || !u.emailVerified) { if (u) await auth.signOut(); location.replace("login.html"); return; }
    me = u;
    const r = mine("x").parent; // users/{uid}
    const s = await r.get();
    if (!s.exists) await r.set({ name: u.displayName || u.email, email: u.email.toLowerCase() });
    document.body.classList.remove("hide");
    cb(u);
  });
}
