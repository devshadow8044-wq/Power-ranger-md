requireAuth(render);

async function render() {
  const P = await loadPeople(), l = $("#list");
  l.innerHTML = "";
  [...P.blocked].forEach(id => {
    const u = P.byId[id], name = u ? P.nameOf(id) : "Utilisateur";
    const el = document.createElement("div"); el.className = "item";
    el.innerHTML = '<div class="av"></div><div><span></span><small>Bloqué</small></div><button class="act">Débloquer</button>';
    paintAv(el.querySelector(".av"), name, u && u.photo);
    el.querySelector("span").textContent = name;
    el.querySelector("button").onclick = async () => { await mine("blocked").doc(id).delete(); render(); };
    l.appendChild(el);
  });
  if (!P.blocked.size) { const d = document.createElement("div"); d.className = "none"; d.textContent = "Aucun contact bloqué."; l.appendChild(d); }
}
