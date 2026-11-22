let P, chats = [], annDoc = null;

requireAuth(async () => {
  tabbar("index.html");
  P = await loadPeople();
  db.collection("chats").where("members", "array-contains", me.uid).onSnapshot(s => {
    chats = s.docs.map(d => ({ id: d.id, ...d.data() }));
    render();
  });
  db.collection("chats").doc(ANN).onSnapshot(s => { annDoc = s.exists ? s.data() : null; render(); });
});

function preview(c) {
  if (!c) return "";
  const t = c.lastType === "voice" ? "🎤 Message vocal" : (c.last || "");
  return (c.lastFrom === me.uid ? "Vous : " : "") + t;
}

function render() {
  if (!P) return;
  const q = $("#search").value.toLowerCase(), l = $("#list");
  l.innerHTML = "";
  const add = (href, title, sub, time, photo, ann) => {
    const a = document.createElement("a");
    a.className = "item"; a.href = href;
    a.innerHTML = '<div class="av"></div><div><span></span><small></small></div><time></time>';
    paintAv(a.querySelector(".av"), title, photo, ann);
    a.querySelector("span").textContent = title;
    a.querySelector("small").textContent = sub;
    a.querySelector("time").textContent = time;
    l.appendChild(a);
  };
  if (!q || "annonces galsenapp".includes(q)) {
    const a = annDoc ? (annDoc.last || "Informations officielles") : "Informations officielles";
    add("chat.html?c=" + ANN, "Annonces GalsenApp", annDoc && annDoc.lastType === "voice" ? "🎤 Message vocal" : a, annDoc && annDoc.lastAt ? when(annDoc.lastAt.toDate()) : "", null, true);
  }
  const rows = chats.filter(c => c.id !== ANN).map(c => {
    const other = c.members.find(m => m !== me.uid);
    return { c, other, u: P.byId[other], name: P.nameOf(other) };
  }).filter(r => r.u && r.name.toLowerCase().includes(q))
    .sort((a, b) => (b.c.lastAt ? b.c.lastAt.toMillis() : 0) - (a.c.lastAt ? a.c.lastAt.toMillis() : 0));
  rows.forEach(r => add("chat.html?u=" + r.other, r.name, preview(r.c), r.c.lastAt ? when(r.c.lastAt.toDate()) : "", r.u.photo));
  if (!rows.length && !q) {
    const d = document.createElement("div"); d.className = "none";
    d.innerHTML = "Aucune discussion pour l’instant.<br>Appuie sur ✏️ pour écrire à un contact.";
    l.appendChild(d);
  }
}
$("#search").oninput = render;
