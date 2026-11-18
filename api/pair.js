// Relais Vercel -> panel du bot
const TARGET = process.env.PANEL_URL || "http://145.239.65.118:20010"; // METS TON VRAI LIEN KATABUMP ICI

module.exports = async (req, res) => {
  // Autoriser CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  try {
    console.log(`[VERCEL] Appel vers le bot : ${TARGET}/api/pair`);
    
    const response = await fetch(`${TARGET}/api/pair`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(req.body || {}),
      signal: AbortSignal.timeout(20000),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || `Erreur HTTP ${response.status} du bot.`);
    }

    return res.status(200).json(data);

  } catch (e) {
    console.error("[VERCEL] Erreur de connexion :", e.message);
    return res.status(502).json({ error: "Le bot ne répond pas. Vérifie l'adresse PANEL_URL sur Vercel. (" + e.message + ")" });
  }
};