try{
(function(){
  var $=function(i){return document.getElementById(i)};
  var toast=function(m,t){if(window.mostrarToast)mostrarToast(m,t)};
  var origFrom=supabaseClient.from.bind(supabaseClient);
  var blobs={},snap=null,up={},rev=0,timer=null,syncing=false,again=false,pending=false;
  var dirty=localStorage.getItem('v275_dirty')==='1';
  try{snap=JSON.parse(localStorage.getItem('v275_snap'))}catch(e){}
  try{up=JSON.parse(localStorage.getItem('v275_up'))||{}}catch(e){}
  var J=function(x){return JSON.stringify(x===undefined?null:x)};
  function setDirty(v){dirty=v;try{v?localStorage.setItem('v275_dirty','1'):localStorage.removeItem('v275_dirty')}catch(e){}}


  /*MERGE-START*/
  function hasId(x){return x&&typeof x==='object'&&x.id!==undefined}
  function mapId(a){var m={};a.forEach(function(x){m[x.id]=x});return m}
  function mergeArr(B,L,S){
    if(!L.concat(S).every(hasId)){
      if(J(L)===J(B))return S; if(J(S)===J(B))return L;
      var u=L.slice();S.forEach(function(x){if(u.map(J).indexOf(J(x))<0)u.push(x)});return u;
    }
    var bm=mapId(B),lm=mapId(L),sm=mapId(S),ids=[],seen={},out=[];
    L.concat(S).forEach(function(x){if(!seen[x.id]){seen[x.id]=1;ids.push(x.id)}});
    ids.forEach(function(id){
      var l=lm[id],s=sm[id],b=bm[id];
      if(l&&s)out.push(J(l)===J(b)?s:l);
      else if(l){if(b&&J(l)===J(b))return;out.push(l)}
      else{if(b&&J(s)===J(b))return;out.push(s)}
    });
    return out;
  }
  function mergeState(base,loc,srv){
    var out={},keys={};
    Object.keys(loc).concat(Object.keys(srv)).forEach(function(k){keys[k]=1});
    Object.keys(keys).forEach(function(k){
      var L=loc[k],S=srv[k],B=base?base[k]:undefined;
      if(Array.isArray(L)||Array.isArray(S))out[k]=mergeArr(Array.isArray(B)?B:[],Array.isArray(L)?L:[],Array.isArray(S)?S:[]);
      else if(J(L)===J(B))out[k]=S===undefined?L:S;
      else out[k]=L;
    });
    return out;
  }
  /*MERGE-END*/
  window.__v275={mergeState:mergeState};


  function hash(s){var h=5381;for(var i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(36)+s.length.toString(36)}
  function strip(o){
    var found={};
    var out=JSON.parse(JSON.stringify(o),function(k,v){
      if(typeof v==='string'&&v.length>20000&&v.indexOf('data:')===0){var h=hash(v);blobs[h]=v;found[h]=1;return 'ref:'+h}
      return v;
    });
    return {obj:out,found:found};
  }
  async function hydrate(o){
    var need={};
    (function w(x){if(typeof x==='string'){if(x.indexOf('ref:')===0)need[x.slice(4)]=1}else if(x&&typeof x==='object')for(var k in x)w(x[k])})(o);
    var ids=Object.keys(need).filter(function(h){return !(h in blobs)});
    if(ids.length){
      var r=await origFrom('app_dados').select('id,conteudo').in('id',ids.map(function(h){return 'blob:'+h}));
      if(r.error)throw r.error;
      r.data.forEach(function(row){blobs[row.id.slice(5)]=row.conteudo.d});
    }
    return JSON.parse(JSON.stringify(o),function(k,v){return (typeof v==='string'&&v.indexOf('ref:')===0&&blobs[v.slice(4)])?blobs[v.slice(4)]:v});
  }
  async function fetchMain(){
    var r=await origFrom('app_dados').select('conteudo').eq('id','1').single();
    if(r.error){if(r.error.code==='PGRST116')return null;throw r.error}
    return r.data&&r.data.conteudo?r.data.conteudo:null;
  }
  function saveSnap(){try{localStorage.setItem('v275_snap',J(snap))}catch(e){}}
  function rerender(){
    var a=document.activeElement;
    if(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)){pending=true}else{try{atualizarTudo()}catch(e){}}
  }
  document.addEventListener('focusout',function(){if(pending){pending=false;setTimeout(function(){var a=document.activeElement;if(!(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)))try{atualizarTudo()}catch(e){}},300)}});


  /* salvar: grava no aparelho na hora e sincroniza com calma */
  window.salvarStorage=function(){
    rev++;setDirty(true);
    try{localStorage.setItem(CHAVE_APP,JSON.stringify(dadosApp))}catch(e){toast('Memória do aparelho cheia (fotos/PDF grandes).','erro')}
    clearTimeout(timer);timer=setTimeout(sync,1200);badge();
    return Promise.resolve();
  };


  async function sync(){
    if(syncing){again=true;return}
    if(!navigator.onLine){badge();return}
    syncing=true;badge();
    try{
      var myRev=rev,L=strip(dadosApp),srv=await fetchMain();
      var merged=srv?mergeState(snap,L.obj,srv):L.obj;
      for(var h in L.found){
        if(!up[h]){
          var r=await origFrom('app_dados').upsert({id:'blob:'+h,conteudo:{d:blobs[h]}});
          if(r.error)throw r.error;
          up[h]=1;try{localStorage.setItem('v275_up',J(up))}catch(e){}
        }
      }
      if(!srv||J(merged)!==J(srv)){
        var r2=await origFrom('app_dados').upsert({id:'1',conteudo:merged});
        if(r2.error)throw r2.error;
      }
      if(rev===myRev){
        snap=merged;saveSnap();setDirty(false);
        if(J(merged)!==J(L.obj)){
          var full=await hydrate(merged);
          if(rev===myRev){dadosApp=full;try{localStorage.setItem(CHAVE_APP,JSON.stringify(dadosApp))}catch(e){}rerender();toast('Mudanças de outro aparelho foram incluídas.','info')}
        }
      }
      badge(true);
    }catch(e){console.error('sync',e);badge('erro')}
    syncing=false;
    if(again){again=false;setTimeout(sync,500)}
  }


  /* carregar: junta o que está no servidor com o que ficou só no aparelho */
  supabaseClient.from=function(t){
    if(t!=='app_dados')return origFrom(t);
    return {select:function(){return {eq:function(){return {single:async function(){
      try{
        var srv=await fetchMain();
        if(!srv)return {data:null,error:{code:'PGRST116'}};
        var content=srv;
        var loc=null;try{loc=JSON.parse(localStorage.getItem(CHAVE_APP))}catch(e){}
        if(dirty&&loc)content=mergeState(snap,strip(loc).obj,srv);
        snap=srv;saveSnap();
        content=await hydrate(content);
        setTimeout(sync,2500);
        return {data:{conteudo:content},error:null};
      }catch(e){return {data:null,error:e}}
    }}}}},upsert:function(){return Promise.resolve({error:null})}};
  };


  /* indicador + login na barra de ícones */
  function badge(s){
    var b=$('v275-st');if(!b)return;
    var e=!navigator.onLine?'🟠':(s==='erro'?'🔴':(syncing?'🔄':(dirty?'🟡':'🟢')));
    var t=!navigator.onLine?'Sem internet: tudo fica salvo no aparelho':(s==='erro'?'Erro ao sincronizar':(syncing?'Sincronizando...':(dirty?'Alterações aguardando envio':'Tudo sincronizado')));
    b.firstChild.textContent=e;b.title=t;b.dataset.t=t;
  }
  var bar=$('v271-bar');
  if(bar){
    var st=document.createElement('button');st.id='v275-st';st.type='button';st.innerHTML='<span>🟢</span>';
    st.onclick=function(){toast(st.dataset.t||'Sincronizando...','info');sync()};
    var lg=document.createElement('button');lg.type='button';lg.innerHTML='<span>🔐</span>';lg.title='Entrar / sair da conta';lg.onclick=abrirLogin;
    bar.insertBefore(lg,bar.firstChild);bar.insertBefore(st,bar.firstChild);
  }
  badge();
  addEventListener('online',function(){badge();sync()});
  addEventListener('offline',function(){badge()});
  document.addEventListener('visibilitychange',function(){if(!document.hidden)sync()});
  setInterval(function(){if(!document.hidden)sync()},60000);


  async function abrirLogin(){
    var s=null;try{s=(await supabaseClient.auth.getSession()).data.session}catch(e){}
    if(s){if(confirm('Conectado como '+s.user.email+'. Sair da conta?')){await supabaseClient.auth.signOut();localStorage.removeItem('v275_auth');toast('Você saiu da conta.','info')}return}
    var g=document.createElement('div');
    g.style.cssText='position:fixed;inset:0;z-index:600;background:rgba(15,23,42,.85);display:flex;align-items:center;justify-content:center;padding:16px';
    g.innerHTML='<div style="background:#fff;color:#0f172a;border-radius:24px;padding:20px;max-width:320px;width:100%;font-size:13px"><h3 style="font-size:16px;font-weight:800;margin:0 0 10px">🔐 Entrar na conta</h3><input id="v275-em" type="email" placeholder="E-mail" style="width:100%;padding:11px;border:1px solid #cbd5e1;border-radius:12px;margin-bottom:8px"><input id="v275-pw" type="password" placeholder="Senha" style="width:100%;padding:11px;border:1px solid #cbd5e1;border-radius:12px;margin-bottom:10px"><div id="v275-er" style="color:#b91c1c;font-weight:700;min-height:16px;margin-bottom:6px"></div><button id="v275-ok" style="width:100%;padding:12px;border:0;border-radius:12px;color:#fff;font-weight:800;background:linear-gradient(135deg,#6366f1,#a855f7)">Entrar</button><button id="v275-no" style="width:100%;padding:10px;border:0;background:none;color:#475569;font-weight:700;margin-top:4px">Agora não</button></div>';
    document.body.appendChild(g);
    g.querySelector('#v275-no').onclick=function(){g.remove()};
    g.querySelector('#v275-ok').onclick=async function(){
      var r=await supabaseClient.auth.signInWithPassword({email:g.querySelector('#v275-em').value.trim(),password:g.querySelector('#v275-pw').value});
      if(r.error){g.querySelector('#v275-er').textContent='E-mail ou senha incorretos.';return}
      localStorage.setItem('v275_auth','1');g.remove();toast('Conectado!','sucesso');sync();
    };
  }
  if(localStorage.getItem('v275_auth')==='1'&&navigator.onLine){
    supabaseClient.auth.getSession().then(function(r){if(!r.data.session)abrirLogin()});
  }


  if('serviceWorker' in navigator&&location.protocol!=='file:')Promise.resolve().catch(function(){});
})();
}catch(e){console.error('[bloco com erro]',e)}
