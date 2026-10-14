import { isAuthenticated, json } from "../_lib.js";
export async function onRequestGet(context) {
  if (!context.env.SESSION_SECRET) return json({error:"Server setup is incomplete."},500);
  return json({authenticated:await isAuthenticated(context.request,context.env.SESSION_SECRET)});
}
