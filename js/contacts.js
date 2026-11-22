let P;
requireAuth(async () => {
  tabbar("contacts.html");
  if ("contacts" in navigator && "ContactsManager" in window) $("#pick").classList.remove("hide"); // Android / Chrome
  await refresh();
});
async function refresh() { P = await loadPeople(); render(); }

function render() {
  const q = $("#search").value.toLowerCase(), l = $("#list");
  l.innerHTML = "";
  const title = t => { const d = document.createElement("div"); d.className = "sec-t"; d.textContent = t; l.appendChild(d); };
  const row = (o) => {
    const el = document.createElement(o.href ? "a" : "div");
    el.className = "item"; if (o.href) el.href = o.href;
    el.innerHTML = '<div class="av"></div><div><span></span><small></small></div>';
    paintAv(el.querySelector(".av"), o.name, o.photo);
    el.querySelector("span").textContent = o.name;
    el.querySelector("small").textContent = o.sub;
    (o.btns || []).forEach(b => {
      const x = document.createElement("button"); x.className = "act" + (b.sec ? " sec" : ""); if (b.ic) x.innerHTML = ic(b.ic); else x.textContent = b.t;
      x.onclick = e => { e.preventDefault(); e.stopPropagation(); b.fn(); };
      el.appendChild(x);
    });
    l.appendChild(el);
  };
  const mineList = P.contacts.filter(c => (c.name + c.phone).toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name));
  const on = mineList.filter(c => c.user), off = mineList.filter(c => !c.user);
  if (on.length) title("Sur GalsenApp");
  on.forEach(c => row({ name: c.name, sub: c.user.about || c.phone, photo: c.user.photo, href: "chat.html?u=" + c.user.id, btns: [{ ic: "trash", sec: 1, fn: () => del(c) }] }));
  if (off.length) title("Inviter sur GalsenApp");
  off.forEach(c => row({ name: c.name, sub: c.phone + " · pas encore sur l’app", btns: [{ t: "Inviter", fn: () => inviteSms(c.phone, c.name) }, { ic: "trash", sec: 1, fn: () => del(c) }] }));
  const known = new Set(P.contacts.filter(c => c.user).map(c => c.user.id));
  const others = P.users.filter(u => !known.has(u.id) && (u.name || "").toLowerCase().includes(q));
  if (others.length) title("Autres personnes sur GalsenApp");
  others.forEach(u => row({ name: u.name, sub: u.about || "Disponible sur GalsenApp", photo: u.photo, href: "chat.html?u=" + u.id }));
  if (!l.children.length) {
    const d = document.createElement("div"); d.className = "none";
    d.innerHTML = "Aucun contact.<br>Appuie sur le bouton + pour en ajouter un.";
    l.appendChild(d);
  }
}
$("#search").oninput = render;

async function del(c) {
  if (!confirm("Supprimer " + c.name + " de tes contacts ?")) return;
  await mine("contacts").doc(c.id).delete(); refresh();
}

// ---- ajouter un contact ----
const open = v => { $("#modal").classList.toggle("hide", !v); $("#err").textContent = ""; if (v) { $("#cn").value = ""; $("#cp").value = ""; $("#cn").focus(); } };
$("#add").onclick = () => open(true);
$("#cc").onclick = () => open(false);
$("#modal").onclick = e => { if (e.target.id === "modal") open(false); };
$("#cf").onsubmit = async e => {
  e.preventDefault();
  const name = $("#cn").value.trim(), phone = $("#cp").value.replace(/[^\d+]/g, "");
  if (!name) return $("#err").textContent = "Entre un nom.";
  if (phone.replace(/\D/g, "").length < 8) return $("#err").textContent = "Entre un numéro valide.";
  if (P.contacts.some(c => phoneKey(c.phone) === phoneKey(phone))) return $("#err").textContent = "Ce numéro est déjà dans tes contacts.";
  await mine("contacts").add({ name, phone });
  open(false); await refresh();
  const c = P.contacts.find(c => phoneKey(c.phone) === phoneKey(phone));
  if (c && !c.user && confirm(name + " n’utilise pas encore GalsenApp. Lui envoyer le lien par SMS ?")) inviteSms(phone, name);
};

// ---- importer depuis le téléphone (si le navigateur le permet) ----
$("#pick").onclick = async () => {
  try {
    const sel = await navigator.contacts.select(["name", "tel"], { multiple: true });
    const have = new Set(P.contacts.map(c => phoneKey(c.phone)));
    for (const s of sel) {
      const tel = (s.tel || [])[0]; if (!tel) continue;
      const phone = tel.replace(/[^\d+]/g, "");
      if (have.has(phoneKey(phone))) continue;
      have.add(phoneKey(phone));
      await mine("contacts").add({ name: (s.name || [])[0] || phone, phone });
    }
    refresh();
  } catch (e) { /* annulé */ }
};
