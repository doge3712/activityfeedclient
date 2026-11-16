const WebSocket=require('ws'),{io}=require('socket.io-client'),io2=require('socketio2');
function se(c,emit,st){
  let w,dead=false,t,room='';const seen={};
  try{room=JSON.parse(Buffer.from(c.token.split('.')[1],'base64url')).channel||''}catch(e){}
  const open=()=>{
    w=new WebSocket('wss://astro.streamelements.com/');
    w.on('message',m=>{let j;try{j=JSON.parse(m)}catch(e){return}
      if(j.type==='welcome')['channel.tips','channel.activities'].forEach(t=>w.send(JSON.stringify({type:'subscribe',nonce:t,data:{topic:t,room,token:c.token,token_type:'jwt'}})));
      else if(j.type==='response')st(!j.error,j.error);
      else if(j.type==='message'){let x=null;
        if(j.topic==='channel.tips'){const d=(j.data||{}).donation||{};x={name:(d.user||{}).username,amt:d.amount,cur:d.currency,msg:d.message}}
        else if(j.topic==='channel.activities'&&(j.data||{}).type==='tip'){const d=(j.data||{}).data||{};x={name:d.displayName||d.username,amt:d.amount,cur:d.currency,msg:d.message}}
        if(x){const k=(x.name||'')+'|'+x.amt,n=Date.now();if(seen[k]&&n-seen[k]<20000)return;seen[k]=n;emit({type:'don',name:x.name||'Anonym',amt:x.amt,cur:x.cur,msg:x.msg||''})}
        else console.log('SE',j.topic,JSON.stringify(j.data).slice(0,300))}});
    w.on('error',()=>{});
    w.on('close',()=>{st(false);if(!dead)t=setTimeout(open,5000)})};
  open();return()=>{dead=true;clearTimeout(t);w.close()}
}
function sl(c,emit,st){
  const s=io('https://sockets.streamlabs.com?token='+encodeURIComponent(c.token),{transports:['websocket']});
  s.on('connect',()=>st(true));s.on('disconnect',()=>st(false));s.on('connect_error',e=>st(false,e.message));
  s.on('event',d=>{if(d&&d.type==='donation'&&(!d.for||d.for==='streamlabs'))(d.message||[]).forEach(m=>emit({type:'don',name:m.name||m.from||'Anonym',amt:+m.amount,cur:m.currency,msg:m.message||''}))});
  return()=>s.close()
}
function tp(c,emit,st){
  let s,dead=false;
  (async()=>{try{
    const r=await(await fetch('https://api.tipeeestream.com/v2.0/site/socket')).json();if(dead)return;
    s=io2(r.datas.host+':'+r.datas.port,{query:{access_token:c.apiKey},transports:['websocket']});
    s.on('connect',()=>{s.emit('join-room',{room:c.apiKey,username:c.username});st(true)});
    s.on('disconnect',()=>st(false));s.on('connect_error',e=>st(false,String(e.message||e)));
    s.on('new-event',d=>{const e=(d||{}).event||{};if(e.type!=='donation')return;const p=e.parameters||{};
      emit({type:'don',name:p.username||(e.user||{}).username||'Anonym',amt:+(p.amount!==undefined?p.amount:e.amount),cur:(e.user&&e.user.currency&&e.user.currency.code)||p.currency,msg:String(p.message||p.formattedMessage||'').replace(/<[^>]*>/g,'')})})
  }catch(e){st(false,e.message)}})();
  return()=>{dead=true;if(s)s.close()}
}
module.exports={StreamElements:se,Streamlabs:sl,Tipeeestream:tp};
