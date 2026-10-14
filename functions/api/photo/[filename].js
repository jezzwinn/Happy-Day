export async function onRequestGet(context) {
  const bucket=context.env.EVENT_PHOTOS;
  if(!bucket)return new Response("Photo storage is not configured.",{status:500});
  const filename=String(context.params.filename||"");
  if(!/^[a-f0-9-]+\.(jpg|png|webp|gif)$/i.test(filename))return new Response("Not found.",{status:404});
  const object=await bucket.get("uploads/"+filename);
  if(!object)return new Response("Not found.",{status:404});
  const headers=new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control","public, max-age=31536000, immutable");
  headers.set("X-Content-Type-Options","nosniff");
  return new Response(object.body,{headers});
}
