const TARGET = process.env.PANEL_URL || 'http://145.239.65.118:20010';
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée.' });
  try {
    const response = await fetch(`${TARGET}/api/pair`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(req.body || {}), signal: AbortSignal.timeout(20000)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) return res.status(response.status).json({ error: data?.error || `Erreur HTTP ${response.status}` });
    return res.status(200).json(data);
  } catch (e) { return res.status(502).json({ error: 'Le bot ne répond pas. Vérifiez la configuration du serveur.' }); }
};
