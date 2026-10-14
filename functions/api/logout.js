import { cookieHeader, json, validOrigin } from "../_lib.js";
export async function onRequestPost(context) {
  if (!validOrigin(context.request)) return json({error:"Request origin rejected."},403);
  return new Response(JSON.stringify({ok:true}), {status:200, headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Set-Cookie":cookieHeader("",0)}});
}
