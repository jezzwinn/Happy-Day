(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const icons = {"Birthday":"🎂","Wedding Anniversary":"💍","Anniversary":"💞","Graduation":"🎓","Wedding":"💐","Baby Shower":"🧸","New Baby":"👶","Festival":"✨","Achievement":"🏆","Thank You":"💌","Congratulations":"🎉","Custom":"🌟"};
  let events = [], pendingFiles = [], editingPhotos = [];

  async function api(url, options = {}) {
    const response = await fetch(url, { credentials:"same-origin", ...options, headers:{ ...(options.body instanceof FormData ? {} : {"Content-Type":"application/json"}), ...(options.headers || {}) }});
    const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Request failed (" + response.status + ")");
    return data;
  }
  function node(tag, cls, text) { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined) el.textContent = text; return el; }

  async function refreshEvents() {
    try {
      const data = await api("./api/events");
      events = Array.isArray(data.events) ? data.events : [];
      $("statusMessage").textContent = "";
      renderPublic();
      renderAdmin();
    } catch (error) {
      $("statusMessage").textContent = "Celebrations could not be loaded. Please refresh the page.";
      console.error(error);
    }
  }

  function renderPublic() {
    const grid = $("eventGrid"); grid.replaceChildren();
    $("emptyState").hidden = events.length > 0;
    events.forEach((item) => {
      const card = node("article","event-card"), cover = node("div","event-cover");
      if (item.photos?.length) {
        const img = document.createElement("img"); img.src = item.photos[0].url; img.alt = item.heading || item.occasion; img.loading = "lazy"; cover.appendChild(img);
      } else cover.appendChild(node("div","cover-placeholder",icons[item.occasion] || "✨"));
      cover.appendChild(node("span","event-badge",(icons[item.occasion] || "✨") + "  " + item.occasion)); card.appendChild(cover);
      const body = node("div","event-content"); body.appendChild(node("h3","",item.heading || item.occasion)); body.appendChild(node("p","people",item.people || ""));
      if (item.message) body.appendChild(node("p","message",item.message));
      if (item.photos?.length > 1) { const strip = node("div","photo-strip"); item.photos.slice(1).forEach((photo,i)=>{const img=document.createElement("img");img.src=photo.url;img.alt="Memory "+(i+2);img.loading="lazy";strip.appendChild(img);});body.appendChild(strip); }
      if (item.from) body.appendChild(node("p","event-from","With love, "+item.from)); card.appendChild(body); grid.appendChild(card);
    });
  }

  function renderAdmin() {
    const list = $("adminEventList"); list.replaceChildren(); $("eventCount").textContent = String(events.length);
    events.forEach((item) => {
      const row = node("div","admin-event");
      if (item.photos?.length) { const img=document.createElement("img");img.className="admin-thumb";img.src=item.photos[0].url;img.alt="";row.appendChild(img); }
      else row.appendChild(node("div","admin-thumb cover-placeholder",icons[item.occasion]||"✨"));
      const main=node("div","admin-event-main");main.appendChild(node("strong","",item.heading));main.appendChild(node("span","",item.occasion+" · "+(item.photos||[]).length+" photo(s)"));row.appendChild(main);
      const actions=node("div","admin-event-actions"), edit=node("button","tiny-button","Edit"), del=node("button","tiny-button","Delete");
      edit.type=del.type="button";edit.addEventListener("click",()=>beginEdit(item.id));del.addEventListener("click",async()=>{if(!confirm("Delete this celebration from the public website?"))return;try{await api("./api/events/"+encodeURIComponent(item.id),{method:"DELETE"});await refreshEvents();}catch(e){alert(e.message);}});
      actions.append(edit,del);row.appendChild(actions);list.appendChild(row);
    });
  }

  async function showLogin() {
    try {
      const session = await api("./api/session");
      if (session.authenticated) { showAdmin(true); return; }
    } catch (_) {}
    $("loginBackdrop").hidden = false; $("passwordInput").focus(); document.body.style.overflow="hidden";
  }
  function hideLogin() { $("loginBackdrop").hidden=true; if ($("adminBackdrop").hidden) document.body.style.overflow=""; }
  function showAdmin(show) { $("adminBackdrop").hidden=!show; if(show){hideLogin();document.body.style.overflow="hidden";}else document.body.style.overflow=""; }
  function resetForm() { $("eventForm").reset();$("editId").value="";pendingFiles=[];editingPhotos=[];$("selectedPhotos").replaceChildren();$("saveEvent").textContent="Publish celebration";$("cancelEdit").hidden=true;$("formError").textContent=""; }
  function beginEdit(id) {
    const item=events.find(e=>e.id===id);if(!item)return;
    $("editId").value=item.id;$("occasion").value=item.occasion;$("people").value=item.people;$("heading").value=item.heading;$("message").value=item.message||"";$("from").value=item.from||"";
    editingPhotos=[...(item.photos||[])];pendingFiles=[];$("photos").value="";drawPhotos();$("saveEvent").textContent="Update celebration";$("cancelEdit").hidden=false;$("eventForm").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function drawPhotos() {
    const container=$("selectedPhotos");container.replaceChildren();
    [...editingPhotos,...pendingFiles.map((file)=>({name:file.name,localUrl:URL.createObjectURL(file)}))].forEach((photo)=>{const img=document.createElement("img");img.src=photo.url||photo.localUrl;img.alt=photo.name||"Selected photo";container.appendChild(img);});
    if(editingPhotos.length+pendingFiles.length)container.appendChild(node("span","field-help",(editingPhotos.length+pendingFiles.length)+" photo(s) selected"));
  }

  $("adminOpen").addEventListener("click",showLogin);
  $("loginClose").addEventListener("click",hideLogin);
  $("loginBackdrop").addEventListener("click",(e)=>{if(e.target===$("loginBackdrop"))hideLogin();});
  $("adminClose").addEventListener("click",()=>showAdmin(false));
  $("adminBackdrop").addEventListener("click",(e)=>{if(e.target===$("adminBackdrop"))showAdmin(false);});
  document.addEventListener("keydown",(e)=>{if(e.key==="Escape"){hideLogin();showAdmin(false);}});

  $("loginForm").addEventListener("submit",async(e)=>{
    e.preventDefault();$("loginError").textContent="";$("loginSubmit").disabled=true;
    try { await api("./api/login",{method:"POST",body:JSON.stringify({password:$("passwordInput").value})});$("passwordInput").value="";hideLogin();showAdmin(true);await refreshEvents(); }
    catch(error){$("loginError").textContent=error.message||"Could not sign in."; }
    finally{$("loginSubmit").disabled=false;}
  });

  $("photos").addEventListener("change",(e)=>{pendingFiles=Array.from(e.target.files||[]);drawPhotos();});
  $("eventForm").addEventListener("submit",async(e)=>{
    e.preventDefault();$("formError").textContent="";$("saveEvent").disabled=true;
    try {
      const uploaded=[];
      for(const file of pendingFiles){
        if(file.size>5*1024*1024)throw new Error("Each photo must be under 5 MB. Please resize a large image and try again.");
        if(!["image/jpeg","image/png","image/webp","image/gif"].includes(file.type))throw new Error("Use JPG, PNG, WebP, or GIF images.");
        const form=new FormData();form.append("file",file,file.name);
        const result=await api("./api/upload",{method:"POST",body:form});
        uploaded.push(result.photo);
      }
      const item={occasion:$("occasion").value,people:$("people").value.trim(),heading:$("heading").value.trim(),message:$("message").value.trim(),from:$("from").value.trim(),photos:[...editingPhotos,...uploaded]};
      const id=$("editId").value;
      if(id)await api("./api/events/"+encodeURIComponent(id),{method:"PUT",body:JSON.stringify(item)});
      else await api("./api/events",{method:"POST",body:JSON.stringify(item)});
      resetForm();await refreshEvents();
    } catch(error) {$("formError").textContent=error.message||"Could not save. Please try again.";}
    finally {$("saveEvent").disabled=false;}
  });
  $("cancelEdit").addEventListener("click",resetForm);
  $("refreshEvents").addEventListener("click",refreshEvents);
  $("logoutButton").addEventListener("click",async()=>{try{await api("./api/logout",{method:"POST",body:"{}"});}catch(_){}showAdmin(false);alert("You have been logged out.");});
  refreshEvents();
})();