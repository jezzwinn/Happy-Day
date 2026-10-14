import { json, requireAdmin, validOrigin } from "../_lib.js";
function extensionFor(type){return ({ "image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif" })[type]||null;}
export async function onRequestPost(context) {
  const denied=await requireAdmin(context);if(denied)return denied;
  if(!validOrigin(context.request))return json({error:"Request origin rejected."},403);
  if(!context.env.EVENT_PHOTOS)return json({error:"EVENT_PHOTOS R2 binding is missing."},500);
  const form=await context.request.formData().catch(()=>null);
  const file=form?.get("file");
  if(!file || typeof file.arrayBuffer!=="function")return json({error:"Choose a photo first."},400);
  const ext=extensionFor(file.type);
  if(!ext)return json({error:"Use JPG, PNG, WebP, or GIF images."},415);
  if(file.size>5*1024*1024)return json({error:"Each photo must be under 5 MB."},413);
  const key=`uploads/${crypto.randomUUID()}.${ext}`;
  await context.env.EVENT_PHOTOS.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type,cacheControl:"public, max-age=31536000, immutable"}});
  return json({photo:{key,url:`/api/photo/${key.slice("uploads/".length)}`,name:String(file.name||"photo").slice(0,120)}},201);
}
