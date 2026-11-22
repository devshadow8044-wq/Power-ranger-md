let step = 1, signup = true;
const T = { 1: ["Créons ton compte", "Commence par ton prénom et ton nom.", "Suivant →"], 2: ["Tes contacts", "Ajoute ton numéro et ton email.", "Suivant →"], 3: ["Dernière étape", "Choisis un mot de passe sûr.", "Créer mon compte"], L: ["Content de te revoir", "Connecte-toi à ton compte.", "Se connecter"] };
const V = {
  fn: v => v.trim() ? "" : "Ton prénom est requis",
  ln: v => v.trim() ? "" : "Ton nom est requis",
  ph: v => v.replace(/\D/g, "").length >= 8 ? "" : "Entre un numéro valide",
  em: v => /^\S+@\S+\.\S+$/.test(v.trim()) ? "" : "Entre un email valide",
  pw: v => v.length >= 6 ? "" : "6 caractères minimum"
};
function paint() {
  const k = signup ? step : "L";
  $("#tt").textContent = T[k][0]; $("#st").textContent = T[k][1]; $("#ab").textContent = T[k][2];
  document.querySelectorAll(".f").forEach(f => {
    f.classList.toggle("hide", !(signup ? f.dataset.s == step : f.dataset.l));
    f.querySelector(".e").textContent = ""; f.querySelector("input").classList.remove("bad");
  });
  document.querySelectorAll(".dot").forEach((d, i) => d.classList.toggle("on", i < step));
  $("#dots").classList.toggle("hide", !signup);
  $("#bk").classList.toggle("hide", !(signup && step > 1));
  $("#tabS").classList.toggle("on", signup); $("#tabL").classList.toggle("on", !signup);
  $("#err").textContent = "";
}
function check() {
  let ok = true;
  document.querySelectorAll(".f:not(.hide)").forEach(f => {
    const i = f.querySelector("input"), m = V[i.id](i.value);
    f.querySelector(".e").textContent = m; i.classList.toggle("bad", !!m);
    if (m) ok = false;
  });
  return ok;
}
$("#tabS").onclick = () => { signup = true; step = 1; paint(); };
$("#tabL").onclick = () => { signup = false; paint(); };
$("#bk").onclick = () => { step--; paint(); };
$("#af").onsubmit = async e => {
  e.preventDefault(); $("#err").style.color = ""; $("#err").textContent = "";
  if (!check()) return;
  if (signup && step < 3) { step++; paint(); return; }
  const em = $("#em").value.trim(), pw = $("#pw").value;
  try {
    if (signup) {
      const nm = $("#fn").value.trim() + " " + $("#ln").value.trim(), ph = $("#ph").value.replace(/[^\d+]/g, "");
      const c = await auth.createUserWithEmailAndPassword(em, pw);
      await c.user.updateProfile({ displayName: nm });
      await db.collection("users").doc(c.user.uid).set({ name: nm, email: em.toLowerCase(), phone: ph, about: "Disponible sur GalsenApp" });
      await c.user.sendEmailVerification();
      await auth.signOut(); signup = false; step = 1; paint();
      $("#err").style.color = "#c4b5fd";
      $("#err").textContent = "Compte créé ! Clique sur le lien reçu par email, puis connecte-toi.";
    } else {
      const c = await auth.signInWithEmailAndPassword(em, pw);
      if (!c.user.emailVerified) { await auth.signOut(); $("#err").textContent = "Confirme d’abord ton email (regarde aussi les spams)."; }
    }
  } catch (x) {
    const m = { "auth/email-already-in-use": "Cet email est déjà utilisé.", "auth/weak-password": "Mot de passe trop court.", "auth/invalid-credential": "Email ou mot de passe incorrect.", "auth/invalid-email": "Email invalide.", "auth/too-many-requests": "Trop d’essais. Réessaie plus tard." };
    $("#err").textContent = m[x.code] || "Erreur : " + x.code;
  }
};
paint();

// déjà connecté → on va directement aux discussions
auth.onAuthStateChanged(u => { if (u && u.emailVerified) location.replace("index.html"); });
