const qs = new URLSearchParams(location.search);
const ann = qs.get("c") === ANN;
let other = qs.get("u"), chatId, iBlocked = false;
let mr, chunks = [], cancelled = false, tick, t0;

requireAuth(async () => {
  if (!ann && !other) return location.replace("index.html");
  chatId = ann ? ANN : cid(other);
  if (ann) { paintAv($("#cav"), "", null, true); $("#ctitle").textContent = "Annonces GalsenApp"; }
  else {
    const P = await loadPeople();
    const u = P.byId[other];
    if (!u) return location.replace("index.html");
    const name = P.nameOf(other);
    $("#ctitle").textContent = name; paintAv($("#cav"), name, u.photo);
    $("#more").classList.remove("hide");
    mine("blocked").doc(other).onSnapshot(s => { iBlocked = s.exists; paintBlock(); });
  }
  paintBlock();
  db.collection("chats").doc(chatId).collection("messages").orderBy("at").limitToLast(100).onSnapshot(s => {
    const box = $("#msgs"); box.innerHTML = "";
    s.docs.forEach(d => {
      const m = d.data(), el = document.createElement("div");
      el.className = "m" + (m.from === me.uid ? " me" : "");
      if (ann) { const n = document.createElement("div"); n.className = "n"; n.textContent = m.name || "GalsenApp"; el.appendChild(n); }
      if (m.type === "voice") { const a = document.createElement("audio"); a.controls = true; a.src = m.audio; el.appendChild(a); }
      else { const p = document.createElement("div"); p.textContent = m.text; el.appendChild(p); }
      const t = document.createElement("div"); t.className = "t";
      t.textContent = hhmm(m.at ? m.at.toDate() : new Date());
      el.appendChild(t); box.appendChild(el);
    });
    box.scrollTop = box.scrollHeight;
  });
});

// ---- blocage ----
function paintBlock() {
  const canWrite = ann ? isOwner() : !iBlocked;
  $("#comp").classList.toggle("hide", !canWrite);
  const n = $("#note");
  n.classList.toggle("hide", canWrite);
  if (ann) n.textContent = "Seul le propriétaire de GalsenApp peut écrire ici.";
  else { n.innerHTML = "Vous avez bloqué ce contact.<button id='unb'>Débloquer</button>"; $("#unb").onclick = toggleBlock; }
  $("#blk").textContent = iBlocked ? "Débloquer ce contact" : "Bloquer ce contact";
}
async function toggleBlock() {
  $("#menu").classList.add("hide");
  if (iBlocked) await mine("blocked").doc(other).delete();
  else if (confirm("Bloquer ce contact ? Il ne pourra plus t’envoyer de messages.")) await mine("blocked").doc(other).set({ at: firebase.firestore.FieldValue.serverTimestamp() });
}
$("#blk").onclick = toggleBlock;
$("#more").onclick = e => { e.stopPropagation(); $("#menu").classList.toggle("hide"); };
document.addEventListener("click", () => $("#menu").classList.add("hide"));

// ---- envoi (message + aperçu de la discussion en une seule opération) ----
async function send(data) {
  const ts = firebase.firestore.FieldValue.serverTimestamp();
  const ref = db.collection("chats").doc(chatId), batch = db.batch();
  batch.set(ref.collection("messages").doc(), { from: me.uid, name: me.displayName || me.email, at: ts, ...data });
  batch.set(ref, {
    members: ann ? [] : chatId.split("_"), lastAt: ts, lastFrom: me.uid, lastType: data.type,
    last: data.type === "voice" ? "" : data.text.slice(0, 80)
  }, { merge: true });
  try { await batch.commit(); } catch (e) { alert("Message non envoyé. Vérifiez votre connexion ou ce contact ne peut pas le recevoir."); }
}
const sendText = () => { const v = $("#txt").value.trim(); if (v) { send({ type: "text", text: v }); $("#txt").value = ""; sync(); } };
$("#txt").onkeydown = e => { if (e.key === "Enter") sendText(); };
const sync = () => { $("#act").textContent = $("#txt").value.trim() ? "➤" : "🎤"; };
$("#txt").oninput = sync;

// ---- vocal (stocké dans le message, 60 s maximum) ----
const stopUI = () => {
  clearInterval(tick); mr = null;
  ["#rec", "#cancel"].forEach(s => $(s).classList.add("hide"));
  $("#txt").classList.remove("hide"); sync();
};
$("#act").onclick = async () => {
  if ($("#txt").value.trim()) return sendText();
  if (mr) { mr.stop(); return; }
  try {
    const st = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks = []; cancelled = false;
    mr = new MediaRecorder(st, { audioBitsPerSecond: 24000 });
    mr.ondataavailable = e => chunks.push(e.data);
    mr.onstop = () => {
      st.getTracks().forEach(t => t.stop());
      const type = mr ? mr.mimeType : chunks[0].type, keep = !cancelled; stopUI();
      if (!keep) return;
      const r = new FileReader();
      r.onload = () => send({ type: "voice", audio: r.result });
      r.readAsDataURL(new Blob(chunks, { type }));
    };
    mr.start(); t0 = Date.now();
    $("#txt").classList.add("hide"); $("#rec").classList.remove("hide"); $("#cancel").classList.remove("hide");
    $("#act").textContent = "➤";
    tick = setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000);
      $("#rt").textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
      if (s >= 60 && mr) mr.stop();
    }, 500);
  } catch (e) { alert("Autorisez l’accès au micro pour envoyer un vocal."); }
};
$("#cancel").onclick = () => { cancelled = true; if (mr) mr.stop(); };
