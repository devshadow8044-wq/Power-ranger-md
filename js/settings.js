let photo = null; // null = inchangée, "" = supprimée
let cur = {};

requireAuth(async () => {
  tabbar("settings.html");
  const s = await db.collection("users").doc(me.uid).get();
  cur = s.data() || {};
  $("#nm").value = cur.name || me.displayName || "";
  $("#ab").value = cur.about || "";
  $("#ph").value = cur.phone || "";
  $("#em").value = me.email;
  showPic(cur.photo);
  mine("blocked").onSnapshot(b => { $("#bc").textContent = b.size ? b.size + " contact" + (b.size > 1 ? "s" : "") : "Aucun"; });
});

function showPic(p) {
  paintAv($("#pav"), $("#nm").value || me.email, p);
  $("#rmpic").classList.toggle("hide", !p);
}
$("#file").onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try { photo = await imgToData(f); showPic(photo); $("#ok").textContent = "Photo prête : appuie sur Enregistrer."; }
  catch (x) { alert("Image illisible."); }
};
$("#rmpic").onclick = () => { photo = ""; showPic(""); $("#ok").textContent = "Photo supprimée : appuie sur Enregistrer."; };
$("#nm").oninput = () => { if (!(photo || (photo === null && cur.photo))) showPic(""); };

$("#save").onclick = async () => {
  const name = $("#nm").value.trim();
  if (!name) return $("#ok").textContent = "Le nom ne peut pas être vide.";
  const d = { name, about: $("#ab").value.trim(), phone: $("#ph").value.replace(/[^\d+]/g, "") };
  if (photo !== null) d.photo = photo;
  try {
    await me.updateProfile({ displayName: name });
    await db.collection("users").doc(me.uid).set(d, { merge: true });
    cur = { ...cur, ...d }; photo = null;
    $("#ok").textContent = "✓ Profil enregistré";
  } catch (e) { $("#ok").textContent = "Erreur : impossible d’enregistrer."; }
};

$("#inv").onclick = () => {
  const msg = "Rejoins-moi sur GalsenApp : " + location.origin + "/login.html";
  if (navigator.share) navigator.share({ title: "GalsenApp", text: msg }).catch(() => {});
  else inviteSms("", "");
};
$("#out").onclick = async () => { await auth.signOut(); location.replace("login.html"); };
