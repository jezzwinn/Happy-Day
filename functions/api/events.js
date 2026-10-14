import { json, requireAdmin, readEvents, writeEvents, validOrigin } from "../_lib.js";
function cleanString(value,max=1200){return typeof value==="string"?value.trim().slice(0,max):"";}
export async function onRequestGet({env}) {
  if (!env.EVENTS_KV) return json({error:"EVENTS_KV binding is missing."},500);
  const events=await readEvents(env);
  return json({events:events.map(({id,occasion,people,heading,message,from,photos,createdAt,updatedAt})=>({id,occasion,people,heading,message,from,photos,createdAt,updatedAt}))});
}
export async function onRequestPost(context) {
  const denied=await requireAdmin(context);if(denied)return denied;
  if(!validOrigin(context.request))return json({error:"Request origin rejected."},403);
  let body;try{body=await context.request.json();}catch(_){return json({error:"Invalid request."},400);}
  const occasion=cleanString(body.occasion,60),people=cleanString(body.people,100),heading=cleanString(body.heading,100);
  if(!occasion||!people||!heading)return json({error:"Occasion, people and heading are required."},400);
  const photos=Array.isArray(body.photos)?body.photos.filter(p=>p&&typeof p.key==="string"&&typeof p.url==="string").slice(0,30):[];
  const event={id:crypto.randomUUID(),occasion,people,heading,message:cleanString(body.message),from:cleanString(body.from,100),photos,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  const events=await readEvents(context.env);events.unshift(event);await writeEvents(context.env,events);
  return json({event},201);
}
