(function(){
var A=window.__afc,api=window.api,b=document.querySelector('[data-svc=Twitch]');
A.S.demo=0;A.S.ev=[];A.render();document.getElementById('vDemo').checked=false;
document.querySelector('#pClient .note').textContent='Twitch: Die Anmeldung läuft über deinen Browser. Dort einmal auf „Autorisieren“ klicken. Donation-Dienste folgen.';
api.onEv(A.add);
api.onAuth(function(n){b.dataset.u=n||'';b.textContent=n?'✓ '+n+' (abmelden)':'Mit Twitch anmelden'});
b.onclick=async function(){
  if(b.dataset.u){await api.logout();return}
  b.textContent='Warte auf Browser …';
  var r=await api.login();if(!r.ok)b.textContent='Fehler: '+r.err+' (nochmal)';
};
})();
(function(){
var api=window.api,SV={StreamElements:[['token','JWT-Token (Dashboard → Avatar → Kanal)']],Streamlabs:[['token','Socket-API-Token (Dashboard → API-Einstellungen)']],Tipeeestream:[['apiKey','API-Key'],['username','Benutzername']]};
Object.keys(SV).forEach(function(s){
  var btn=document.querySelector('[data-svc='+s+']'),row=btn.parentNode,box=document.createElement('div'),on=false;
  box.style.cssText='padding:0 6px 8px;display:none';
  var ins=SV[s].map(function(f){var i=document.createElement('input');i.type=f[0]==='username'?'text':'password';i.placeholder=f[1];i.className='search';i.style.cssText='width:100%;max-width:none;margin-top:4px';i.dataset.k=f[0];box.appendChild(i);return i});
  var go=document.createElement('button');go.textContent='Verbinden';go.style.marginTop='6px';box.appendChild(go);
  row.after(box);
  btn.onclick=function(){if(on){api.donOff(s);return}box.style.display=box.style.display==='none'?'block':'none'};
  go.onclick=async function(){var c={};ins.forEach(function(i){c[i.dataset.k]=i.value.trim()});go.textContent='Verbinde …';var r=await api.donOn(s,c);go.textContent=r.ok?'Verbinden':'Fehler: '+r.err};
  api.onDon(function(x){if(x.s!==s)return;on=!!x.on;btn.textContent=on?'✓ Verbunden (trennen)':(x.err?'Fehler: '+x.err:'Verbinden');if(on){box.style.display='none';ins.forEach(function(i){i.value=''})}});
});
})();
(function(){
var api=window.api,tr=document.querySelector('[data-svc=Twitch]').parentNode,box=document.createElement('div');
box.style.cssText='padding:0 6px 8px';
box.innerHTML='<input class="search" id="cid" style="width:100%;max-width:none" placeholder="Eigene Twitch-Client-ID (optional)"><button id="cidb" style="margin-top:6px">Client-ID speichern</button>';
tr.before(box);
var i=box.querySelector('#cid'),b=box.querySelector('#cidb');
api.getCid().then(function(v){i.value=v});
b.onclick=async function(){var r=await api.setCid(i.value);b.textContent=r.ok?'Gespeichert, bitte neu anmelden':'Fehler: '+r.err};
})();
