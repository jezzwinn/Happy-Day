import { createSession, cookieHeader, json, validOrigin } from "../_lib.js";
export async function onRequestPost(context) {
  const {request,env}=context;
  if (!validOrigin(request)) return json({error:"Request origin rejected."},403);
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) return json({error:"Admin secrets are not configured in Cloudflare yet."},500);
  let body;
  try { body=await request.json(); } catch (_) { return json({error:"Invalid request."},400); }
  const supplied=typeof body.password==="string"?body.password:"";
  // Password comparison is server-side. Never place ADMIN_PASSWORD in client code.
  if (supplied.length>256 || supplied !== env.ADMIN_PASSWORD) {
    return json({error:"Incorrect password. Please try again."},401);
  }
  const token=await createSession(env.SESSION_SECRET);
  return new Response(JSON.stringify({ok:true}), {status:200, headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Set-Cookie":cookieHeader(token,8*60*60)}});
}
