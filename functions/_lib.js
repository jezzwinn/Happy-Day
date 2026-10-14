const COOKIE_NAME = "lm_admin_session";
const SESSION_SECONDS = 60 * 60 * 8;

function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function fromBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}
async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), {name:"HMAC",hash:"SHA-256"}, false, ["sign","verify"]);
}
export async function createSession(secret) {
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify({exp:Math.floor(Date.now()/1000)+SESSION_SECONDS,nonce:toBase64Url(crypto.getRandomValues(new Uint8Array(18)))})));
  const key = await hmacKey(secret);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
  return payload + "." + toBase64Url(signature);
}
export async function isAuthenticated(request, secret) {
  if (!secret) return false;
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.split(";").map(x=>x.trim()).find(x=>x.startsWith(COOKIE_NAME+"="));
  if (!match) return false;
  const token = match.slice(COOKIE_NAME.length+1);
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  try {
    const key = await hmacKey(secret);
    const valid = await crypto.subtle.verify("HMAC", key, fromBase64Url(parts[1]), new TextEncoder().encode(parts[0]));
    if (!valid) return false;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(parts[0])));
    return Number.isInteger(payload.exp) && payload.exp > Math.floor(Date.now()/1000);
  } catch (_) { return false; }
}
export function cookieHeader(value, maxAge) {
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}
export function json(data, status=200, headers={}) {
  return new Response(JSON.stringify(data), {status, headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",...headers}});
}
export async function requireAdmin(context) {
  if (!await isAuthenticated(context.request, context.env.SESSION_SECRET)) return json({error:"Please sign in again."},401);
  return null;
}
export function validOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; } catch (_) { return false; }
}
export async function readEvents(env) {
  const raw = await env.EVENTS_KV.get("events");
  if (!raw) return [];
  try { const data=JSON.parse(raw); return Array.isArray(data)?data:[]; } catch (_) { return []; }
}
export async function writeEvents(env, events) {
  await env.EVENTS_KV.put("events", JSON.stringify(events));
}
