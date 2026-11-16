const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('api',{login:()=>ipcRenderer.invoke('login'),logout:()=>ipcRenderer.invoke('logout'),
donOn:(s,c)=>ipcRenderer.invoke('donOn',s,c),donOff:s=>ipcRenderer.invoke('donOff',s),onDon:f=>ipcRenderer.on('don',(_,v)=>f(v)),getCid:()=>ipcRenderer.invoke('getCid'),setCid:v=>ipcRenderer.invoke('setCid',v),onAuth:f=>ipcRenderer.on('auth',(_,v)=>f(v)),onEv:f=>ipcRenderer.on('ev',(_,v)=>f(v))});
