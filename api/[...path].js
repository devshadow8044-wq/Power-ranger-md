// Relais Vercel -> panel du bot (le site garde son code tel quel : il appelle /api/pair)
const TARGET = process.env.PANEL_URL || "http://145.239.65.118:20010";

module.exports = async (req, res) => {
  try {
    const u = new URL(req.url, "http://x");
    u.searchParams.delete("path");
    const qs = u.searchParams.toString();
    const r = await fetch(TARGET + u.pathname + (qs ? "?" + qs : ""), {
      method: req.method,
      headers: { "Content-Type": "application/json" },
      body: req.method === "POST" ? JSON.stringify(req.body || {}) : undefined,
      signal: AbortSignal.timeout(25000),
    });
    const txt = await r.text();
    res.status(r.status);
    res.setHeader("Content-Type", r.headers.get("content-type") || "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.send(txt);
  } catch (e) {
    res.status(502).json({ error: "Le serveur du bot ne répond pas (" + ((e.cause && e.cause.code) || e.name) + ")." });
  }
};
