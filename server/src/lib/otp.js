// In-memory OTP store by email (use Redis in production for multi-instance). TTL 10 min.
const store = new Map();
const TTL_MS = 10 * 60 * 1000;

function prune() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt < now) store.delete(key);
  }
}

function key(email) {
  return String(email).trim().toLowerCase();
}

export function setOtp(email, otp) {
  const k = key(email);
  store.set(k, { otp: String(otp), expiresAt: Date.now() + TTL_MS });
  setTimeout(prune, TTL_MS + 1000);
}

export function checkOtp(email, otp) {
  const k = key(email);
  const entry = store.get(k);
  if (!entry || entry.expiresAt < Date.now()) return false;
  const ok = entry.otp === String(otp);
  if (ok) store.delete(k);
  return ok;
}
