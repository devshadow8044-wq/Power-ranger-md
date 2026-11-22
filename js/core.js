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


// ---------- icônes (SVG, pas d'emoji) ----------
const ICONS = {
  back: '<path d="M15 5l-7 7 7 7"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  send: '<path d="M3 11l18-8-8 18-2-8z" fill="currentColor"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>',
  pencil: '<path d="M4 20l4-1 11-11-3-3L5 16z"/>',
  camera: '<path d="M4 8h4l2-2h4l2 2h4v11H4z"/><circle cx="12" cy="13.5" r="3.2"/>',
  block: '<circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  logout: '<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.5 0 4 2 4 5"/>',
  settings: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  trash: '<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/>',
  megaphone: '<path d="M4 10v4h3l8 4V6L7 10zM18 9a4 4 0 010 6"/>',
  download: '<path d="M12 4v10M8 10l4 4 4-4M5 20h14"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  newchat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M12 8v5M9.5 10.5h5"/>',
  dots: '<circle cx="12" cy="5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="19" r="1.6" fill="currentColor"/>'
};
const ic = n => '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[n] + "</svg>";
document.querySelectorAll("[data-ic]").forEach(e => e.insertAdjacentHTML("afterbegin", ic(e.dataset.ic)));

// ---------- utilitaires ----------
const ini = s => (s || "?").trim().slice(0, 1).toUpperCase();
const isOwner = () => me && me.email.toLowerCase() === OWNER_EMAIL.toLowerCase();
const cid = o => [me.uid, o].sort().join("_");
const phoneKey = s => (s || "").replace(/\D/g, "").slice(-9); // compare les numéros avec ou sans indicatif
const mine = c => db.collection("users").doc(me.uid).collection(c);
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
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
  if (photo) el.textContent = ""; else if (ann) el.innerHTML = ic("megaphone"); else el.textContent = ini(name);
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
  const t = [["index.html", "chat", "Discussions"], ["contacts.html", "users", "Contacts"], ["settings.html", "settings", "Paramètres"]];
  const n = document.createElement("nav"); n.className = "tabbar";
  n.innerHTML = t.map(x => '<a href="' + x[0] + '" class="' + (x[0] === active ? "on" : "") + '"><span>' + ic(x[1]) + "</span>" + x[2] + "</a>").join("");
  document.querySelector(".page").appendChild(n);
}
// charge utilisateurs, contacts et bloqués
async function loadPeople() {
  const [us, cs, bs, fs] = await Promise.all([db.collection("users").get(), mine("contacts").get(), mine("blocked").get(), mine("favorites").get()]);
  const users = us.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.id !== me.uid);
  const contacts = cs.docs.map(d => ({ id: d.id, ...d.data() }));
  const blocked = new Set(bs.docs.map(d => d.id)), favs = new Set(fs.docs.map(d => d.id));
  const byId = {}; users.forEach(u => byId[u.id] = u);
  contacts.forEach(c => { c.user = users.find(u => phoneKey(u.phone) && phoneKey(u.phone) === phoneKey(c.phone)) || null; });
  const nameOf = id => { const c = contacts.find(c => c.user && c.user.id === id); return c ? c.name : (byId[id] ? byId[id].name : "Utilisateur"); };
  return { users, contacts, blocked, favs, byId, nameOf };
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
