const {app,BrowserWindow,shell,ipcMain,safeStorage}=require('electron');
const path=require('path'),fs=require('fs'),WebSocket=require('ws');
const DEF_CID='7dd2p2ksvbfnn5jznlpij9c9rqqjb7';let CID=DEF_CID;
const sfile=()=>path.join(app.getPath('userData'),'settings.json');
try{const s=JSON.parse(fs.readFileSync(sfile()));if(s.clientId)CID=s.clientId}catch(e){}
const SCOPES='channel:read:subscriptions moderator:read:followers bits:read';
const T={'1000':'T1','2000':'T2','3000':'T3'};
let win,tok=null,user=null,ws=null;
const file=()=>path.join(app.getPath('userData'),'twitch.bin');
function saveTok(){try{if(safeStorage.isEncryptionAvailable())fs.writeFileSync(file(),safeStorage.encryptString(JSON.stringify(tok)))}catch(e){}}
function loadTok(){try{tok=JSON.parse(safeStorage.decryptString(fs.readFileSync(file())))}catch(e){tok=null}}
const post=async(url,o)=>{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(o)});return{ok:r.ok,j:await r.json()}};
async function refresh(){const t=await post('https://id.twitch.tv/oauth2/token',{client_id:CID,grant_type:'refresh_token',refresh_token:tok.refresh_token});if(!t.ok)throw new Error('Token abgelaufen, bitte neu anmelden');tok=t.j;saveTok()}
async function login(){
  const d=await post('https://id.twitch.tv/oauth2/device',{client_id:CID,scopes:SCOPES});
  if(!d.ok)throw new Error(d.j.message||'Device-Code fehlgeschlagen');
  shell.openExternal(d.j.verification_uri);
  const end=Date.now()+d.j.expires_in*1000;
  while(Date.now()<end){
    await new Promise(r=>setTimeout(r,(d.j.interval||5)*1000));
    const t=await post('https://id.twitch.tv/oauth2/token',{client_id:CID,scopes:SCOPES,device_code:d.j.device_code,grant_type:'urn:ietf:params:oauth:grant-type:device_code'});
    if(t.ok){tok=t.j;saveTok();return start()}
    if(t.j.message!=='authorization_pending')throw new Error(t.j.message)
  }
  throw new Error('Zeit abgelaufen')
}
async function start(){
  const val=()=>fetch('https://id.twitch.tv/oauth2/validate',{headers:{Authorization:'OAuth '+tok.access_token}});
  let v=await val();if(!v.ok){await refresh();v=await val()}
  user=await v.json();win.webContents.send('auth',user.login);connect('wss://eventsub.wss.twitch.tv/ws',false)
}
function connect(url,re){
  const old=ws,w=new WebSocket(url);ws=w;
  w.on('message',async m=>{
    const j=JSON.parse(m),t=j.metadata.message_type;
    if(t==='session_welcome'){if(old){old.removeAllListeners();old.close()}if(!re)await subscribe(j.payload.session.id)}
    if(t==='session_reconnect')connect(j.payload.session.reconnect_url,true);
    if(t==='notification')handle(j.payload.subscription.type,j.payload.event)
  });
  w.on('error',()=>{});
  w.on('close',()=>{if(w===ws&&tok)setTimeout(()=>start().catch(()=>{}),5000)})
}
async function subscribe(sid){
  const id=user.user_id,b={broadcaster_user_id:id};
  const S=[['channel.follow',2,{broadcaster_user_id:id,moderator_user_id:id}],['channel.subscribe',1,b],['channel.subscription.message',1,b],['channel.subscription.gift',1,b],['channel.cheer',1,b],['channel.raid',1,{to_broadcaster_user_id:id}]];
  for(const [type,version,condition] of S){
    const r=await fetch('https://api.twitch.tv/helix/eventsub/subscriptions',{method:'POST',headers:{'Client-Id':CID,Authorization:'Bearer '+tok.access_token,'Content-Type':'application/json'},body:JSON.stringify({type,version,condition,transport:{method:'websocket',session_id:sid}})});
    if(!r.ok)console.log(type,r.status,await r.text())
  }
}
function handle(type,e){
  let x=null;
  if(type==='channel.follow')x={type:'follow',name:e.user_name};
  if(type==='channel.subscribe'&&!e.is_gift)x={type:'sub',name:e.user_name,months:1,tier:T[e.tier]};
  if(type==='channel.subscription.message')x={type:'sub',name:e.user_name,months:e.cumulative_months,tier:T[e.tier]};
  if(type==='channel.subscription.gift')x={type:'gift',name:e.is_anonymous?'Anonym':e.user_name,n:e.total,tier:T[e.tier]};
  if(type==='channel.cheer')x={type:'bits',name:e.is_anonymous?'Anonym':e.user_name,n:e.bits,msg:e.message};
  if(type==='channel.raid')x={type:'raid',name:e.from_broadcaster_user_name,n:e.viewers};
  if(x)win.webContents.send('ev',Object.assign({ts:Date.now(),id:Math.random()},x))
}
const DS=require('./donations');const SYM={EUR:'€',USD:'$',GBP:'£'};
const dfile=()=>path.join(app.getPath('userData'),'donations.bin');let dc={},dstop={};
const emit=e=>{e.cur=SYM[e.cur]||e.cur||'€';win.webContents.send('ev',Object.assign({ts:Date.now(),id:Math.random()},e))};
function dsave(){try{if(safeStorage.isEncryptionAvailable())fs.writeFileSync(dfile(),safeStorage.encryptString(JSON.stringify(dc)))}catch(e){}}
function dstart(s){if(dstop[s])dstop[s]();dstop[s]=DS[s](dc[s],emit,(on,err)=>win.webContents.send('don',{s,on,err}))}
function dload(){try{dc=JSON.parse(safeStorage.decryptString(fs.readFileSync(dfile())))}catch(e){dc={}}Object.keys(dc).forEach(s=>{if(DS[s])dstart(s)})}
ipcMain.handle('donOn',(_,s,c)=>{try{if(!DS[s])throw new Error('Unbekannter Dienst');if(Object.values(c).some(v=>!v))throw new Error('Bitte alle Felder ausfüllen');dc[s]=c;dsave();dstart(s);return{ok:1}}catch(e){return{ok:0,err:e.message}}});
ipcMain.handle('donOff',(_,s)=>{if(dstop[s])dstop[s]();delete dstop[s];delete dc[s];dsave();win.webContents.send('don',{s,on:false})});
ipcMain.handle('getCid',()=>CID);
ipcMain.handle('setCid',(_,v)=>{v=String(v||'').trim();if(v&&!/^[a-z0-9]{20,40}$/.test(v))return{ok:0,err:'Ungültige Client-ID'};
  const w=ws;tok=null;ws=null;if(w){w.removeAllListeners();w.close()}try{fs.unlinkSync(file())}catch(e){}
  CID=v||DEF_CID;try{fs.writeFileSync(sfile(),JSON.stringify({clientId:v}))}catch(e){}win.webContents.send('auth',null);return{ok:1}});
ipcMain.handle('login',async()=>{try{await login();return{ok:1}}catch(e){return{ok:0,err:e.message}}});
ipcMain.handle('logout',()=>{const w=ws;tok=null;ws=null;if(w){w.removeAllListeners();w.close()}try{fs.unlinkSync(file())}catch(e){}win.webContents.send('auth',null)});
app.whenReady().then(()=>{
  win=new BrowserWindow({width:520,height:820,backgroundColor:'#0f0f12',autoHideMenuBar:true,title:'Activity Feed Client',webPreferences:{preload:path.join(__dirname,'preload.js')}});
  win.webContents.setWindowOpenHandler(({url})=>{if(/^https?:/.test(url))shell.openExternal(url);return{action:'deny'}});
  win.loadFile('renderer/index.html');
  win.webContents.on('did-finish-load',()=>{loadTok();if(tok)start().catch(()=>{});dload()});
  setInterval(()=>{if(tok)refresh().catch(()=>{})},3*3600e3)
});
app.on('window-all-closed',()=>app.quit());
