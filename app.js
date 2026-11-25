const DB_NAME = "vortex-local-media";
const STORE = "media";
let db;
const $ = id => document.getElementById(id);
const bytes = n => n < 1024*1024 ? `${(n/1024).toFixed(0)} KB` : `${(n/1024/1024).toFixed(1)} MB`;
const toast = msg => { const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600); };

function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>req.result.createObjectStore(STORE,{keyPath:"id"});
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
}
function tx(mode="readonly"){return db.transaction(STORE,mode).objectStore(STORE);}
function allItems(){return new Promise((resolve,reject)=>{const r=tx().getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function saveItem(item){return new Promise((resolve,reject)=>{const r=tx("readwrite").put(item);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error);});}
function deleteItem(id){return new Promise((resolve,reject)=>{const r=tx("readwrite").delete(id);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error);});}
function formatName(name){return name.replace(/[<>]/g,"");}

async function render(){
  const items=await allItems();$("itemCount").textContent=`${items.length} ITEM${items.length===1?"":"S"}`;
  $("emptyState").classList.toggle("hidden",items.length>0);
  $("mediaList").innerHTML="";
  let total=0;
  for(const item of items.sort((a,b)=>b.added-a.added)){
    total+=item.size;
    const card=document.createElement("article");card.className="media-card";
    const icon=document.createElement("div");icon.className="file-icon";icon.textContent=item.type.startsWith("audio/")?"♫":"▶";
    const meta=document.createElement("div");meta.className="file-meta";
    const name=document.createElement("strong");name.textContent=item.name;
    const sub=document.createElement("small");sub.textContent=`${bytes(item.size)} · ${new Date(item.added).toLocaleDateString()}`;
    meta.append(name,sub);
    const actions=document.createElement("div");actions.className="file-actions";
    const play=document.createElement("button");play.className="small-btn";play.textContent="Play";play.onclick=()=>playItem(item);
    const del=document.createElement("button");del.className="small-btn delete-btn";del.textContent="Delete";del.onclick=async()=>{if(confirm(`Delete "${item.name}" from VORTEX?`)){await deleteItem(item.id);render();toast("Removed from library");}};
    actions.append(play,del);card.append(icon,meta,actions);$("mediaList").append(card);
  }
  $("storageLabel").textContent=bytes(total);$("storageBar").style.width=`${Math.min(100,total/(500*1024*1024)*100)}%`;
}
function playItem(item){
  const video=$("player");const url=URL.createObjectURL(item.blob);
  video.src=url;$("playerTitle").textContent=item.name;$("playerDialog").showModal();
  video.play().catch(()=>{});
  video.onended=()=>URL.revokeObjectURL(url);
}
function importFiles(files){
  [...files].forEach(async file=>{
    if(!file.type.startsWith("video/")&&!file.type.startsWith("audio/"))return;
    try{
      await saveItem({id:crypto.randomUUID(),name:formatName(file.name),type:file.type||"application/octet-stream",size:file.size,added:Date.now(),blob:file});
      toast(`Imported ${file.name}`);await render();
    }catch(e){toast("Could not save file. It may exceed available browser storage.");}
  });
}
async function downloadURL(){
  const url=$("mediaUrl").value.trim();const title=$("mediaTitle").value.trim();
  const msg=$("urlMessage");msg.textContent="Connecting…";
  try{
    const parsed=new URL(url);
    if(!["http:","https:"].includes(parsed.protocol))throw new Error("Only HTTP or HTTPS URLs are supported.");
    if(/youtube\.com|youtu\.be$/i.test(parsed.hostname))throw new Error("A YouTube page is not a direct media file URL.");
    const response=await fetch(parsed.href,{mode:"cors"});
    if(!response.ok)throw new Error(`Server returned ${response.status}.`);
    const blob=await response.blob();
    if(!blob.type.startsWith("video/")&&!blob.type.startsWith("audio/"))throw new Error("The URL did not return a recognized audio/video file.");
    const filename=title||decodeURIComponent(parsed.pathname.split("/").pop()||"Downloaded media");
    await saveItem({id:crypto.randomUUID(),name:formatName(filename),type:blob.type,size:blob.size,added:Date.now(),blob});
    msg.textContent=`Saved ${filename} (${bytes(blob.size)}).`; $("mediaUrl").value="";$("mediaTitle").value="";await render();
  }catch(e){msg.textContent=e.message.includes("Failed to fetch")?"Download blocked by the source server's browser/CORS policy, or network unavailable. Try importing the file from Files instead.":e.message;}
}
function selectTab(tab){
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
  ["library","add","about"].forEach(name=>$(name+"Panel").classList.toggle("hidden",name!==tab));
}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>selectTab(b.dataset.tab)));
$("importButton").onclick=$("importButton2").onclick=$("emptyImport").onclick=()=>$("fileInput").click();
$("fileInput").addEventListener("change",e=>{importFiles(e.target.files);e.target.value="";});
$("urlButton").onclick=()=>selectTab("add");
$("downloadUrlButton").onclick=downloadURL;
$("closePlayer").onclick=()=>{const v=$("player");v.pause();if(v.src.startsWith("blob:"))URL.revokeObjectURL(v.src);v.removeAttribute("src");v.load();$("playerDialog").close();};
function network(){const on=navigator.onLine;$("networkStatus").textContent=on?"ONLINE":"OFFLINE";$("networkStatus").style.color=on?"#59d8f3":"#e5b36b";}
window.addEventListener("online",network);window.addEventListener("offline",network);
(async()=>{try{db=await openDB();await render();}catch(e){toast("Local storage is unavailable in this browser.");}network();if("serviceWorker"in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(()=>{});})();
