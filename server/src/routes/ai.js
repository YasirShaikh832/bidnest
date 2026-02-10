import { Router } from 'express';

export const aiRouter = Router();
const OLLAMA_URL = (process.env.OLLAMA_URL || '').replace(/\/$/, '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama2';

aiRouter.get('/status', async (_req, res) => {
  if (!OLLAMA_URL) {
    return res.json({ connected: false, error: 'OLLAMA_URL is not set on the server.' });
  }
  try {
    const r = await fetch(`${OLLAMA_URL}/api/tags`, { method: 'GET' });
    if (r.ok) {
      return res.json({ connected: true });
    }
    return res.json({ connected: false, error: `Ollama returned ${r.status}. Check OLLAMA_URL (e.g. http://host:11434).` });
  } catch (err) {
    return res.json({
      connected: false,
      error: err?.message || 'Cannot reach Ollama. Check OLLAMA_URL and that the server can access it (e.g. from Docker use host.docker.internal or the host IP).',
    });
  }
});

aiRouter.post('/chat', async (req, res) => {
  if (!OLLAMA_URL) {
    return res.status(503).json({ error: 'AI (Ollama) not configured. Set OLLAMA_URL.' });
  }
  try {
    const { message, model } = req.body || {};
    const useModel = model || OLLAMA_MODEL;
    const body = JSON.stringify({
      model: useModel,
      stream: false,
      messages: [{ role: 'user', content: message || 'Hello' }],
    });
    const r = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    if (!r.ok) {
      const t = await r.text();
      return res.status(r.status).json({ error: t || 'Ollama request failed' });
    }
    const data = await r.json();
    res.json({ reply: data.message?.content ?? '' });
  } catch (err) {
    console.error('Ollama proxy error:', err);
    res.status(502).json({ error: 'Failed to reach Ollama' });
  }
});
