import { json, requireAdmin, readEvents, writeEvents, validOrigin } from "../../_lib.js";
function cleanString(value,max=1200){return typeof value==="string"?value.trim().slice(0,max):"";}
export async function onRequestPut(context) {
  const denied=await requireAdmin(context);if(denied)return denied;
  if(!validOrigin(context.request))return json({error:"Request origin rejected."},403);
  let body;try{body=await context.request.json();}catch(_){return json({error:"Invalid request."},400);}
  const id=context.params.id,events=await readEvents(context.env),index=events.findIndex(e=>e.id===id);
  if(index<0)return json({error:"Celebration not found."},404);
  const occasion=cleanString(body.occasion,60),people=cleanString(body.people,100),heading=cleanString(body.heading,100);
  if(!occasion||!people||!heading)return json({error:"Occasion, people and heading are required."},400);
  const photos=Array.isArray(body.photos)?body.photos.filter(p=>p&&typeof p.key==="string"&&typeof p.url==="string").slice(0,30):[];
  events[index]={...events[index],occasion,people,heading,message:cleanString(body.message),from:cleanString(body.from,100),photos,updatedAt:new Date().toISOString()};
  await writeEvents(context.env,events);return json({event:events[index]});
}
export async function onRequestDelete(context) {
  const denied=await requireAdmin(context);if(denied)return denied;
  if(!validOrigin(context.request))return json({error:"Request origin rejected."},403);
  const id=context.params.id,events=await readEvents(context.env),event=events.find(e=>e.id===id);
  if(!event)return json({error:"Celebration not found."},404);
  await writeEvents(context.env,events.filter(e=>e.id!==id));
  // Uploaded objects can be cleaned from R2 separately; this does not expose them to clients.
  return new Response(null,{status:204});
}
