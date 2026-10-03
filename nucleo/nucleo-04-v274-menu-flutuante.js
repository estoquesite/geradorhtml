try{
(function(){
  var $=function(i){return document.getElementById(i)};
  var KEY='v274_cfg', cfg={tx:'#0f172a',tabs:{}};
  try{var s0=JSON.parse(localStorage.getItem(KEY));if(s0){cfg.tx=s0.tx||cfg.tx;cfg.tabs=s0.tabs||{}}}catch(e){}
  var TABS=[['leitura','Roteiro'],['itinerario','Editar'],['utilidades','Hub'],['orcamento','Orçamento'],['compras','Compras']];
  var TABC=['#7c3aed','#2563eb','#0d9488','#db2777','#ea580c','#16a34a','#475569','#0891b2'];
  var SOFT=['#60a5fa','#fbbf24','#f472b6','#34d399','#a78bfa','#fb7185','#22d3ee','#a3e635'];
  var TXC=['#0f172a','#000000','#1e1b4b','#3b0764','#1e3a8a','#064e3b'];
  function save(){try{localStorage.setItem(KEY,JSON.stringify(cfg))}catch(e){}}
  function apply(){
    document.documentElement.style.setProperty('--v-tx',cfg.tx);
    TABS.forEach(function(t){var el=$('tab-'+t[0]);if(el&&cfg.tabs[t[0]])el.style.setProperty('--tc',cfg.tabs[t[0]])});
  }
  apply();


  /* 1. cabeçalho / relógios / menu de abas */
  var hdr=document.querySelector('body>header'), bar=$('v271-bar'), clk=$('v271-clocks');
  if(hdr&&clk) hdr.insertAdjacentElement('afterend',clk);
  if(hdr&&bar){
    var row=[].filter.call(hdr.children,function(c){return c.tagName==='DIV'&&!c.id})[0];
    if(row){
      var frag=document.createDocumentFragment();
      [].slice.call(row.children).forEach(function(el){
        if(el.tagName==='SPAN')return;
        var emoji=(el.textContent.trim().split(' ')[0])||'•';
        el.innerHTML='<span>'+emoji+'</span>';
        frag.appendChild(el);
      });
      bar.insertBefore(frag,bar.firstChild);
      row.remove();
    }
  }
  var b0=$('tab-btn-leitura'), tabsEl=$('v273-tabs')||(b0&&b0.parentElement);
  if(tabsEl){tabsEl.id='v273-tabs';document.body.appendChild(tabsEl)}


  /* 2. menu: aparece ao rolar, some quando para */
  var tm=null;
  function hide(){if(!tabsEl)return;tabsEl.classList.add('v-off');document.body.classList.add('v-menu-off')}
  function show(ms){if(!tabsEl)return;tabsEl.classList.remove('v-off');document.body.classList.remove('v-menu-off');clearTimeout(tm);tm=setTimeout(hide,ms||1600)}
  addEventListener('scroll',function(){show(1600)},{passive:true});
  addEventListener('touchmove',function(){show(1600)},{passive:true});
  if(tabsEl){
    tabsEl.addEventListener('touchstart',function(){clearTimeout(tm)},{passive:true});
    tabsEl.addEventListener('click',function(){show(3000)});
  }
  var hd=document.createElement('button');hd.id='v274-handle';hd.type='button';hd.setAttribute('aria-label','Mostrar menu');
  hd.onclick=function(){show(4000)};document.body.appendChild(hd);
  show(2800);


  /* 3. Editar e Roteiro: a cor de cada destino aparece na lateral e no fundo */
  function tintLista(box,mk){
    if(!box)return;
    var run=function(){setTimeout(function(){
      [].forEach.call(box.children,function(c){
        if(c.dataset.v4)return;
        var col=c.style.borderLeftColor;if(!col)return;
        c.dataset.v4=1;c.style.borderLeftWidth='8px';mk(c,col);
      });
    },0)};
    new MutationObserver(run).observe(box,{childList:true});run();
  }
  tintLista($('lista-blocos'),function(c,col){c.style.backgroundColor='color-mix(in srgb,'+col+' 24%,white)'});
  tintLista($('lista-leitura-html'),function(c,col){c.style.background='linear-gradient(180deg,color-mix(in srgb,'+col+' 24%,white),#fff 80%)'});


  /* paleta do Editar com cores suaves */
  var MAP={'#ff007f':'#f472b6','#00ff66':'#4ade80','#00ffff':'#22d3ee','#ccff00':'#facc15','#ff3300':'#fb923c','#a855f7':'#a78bfa','#3b82f6':'#60a5fa','#f59e0b':'#fbbf24','#ec4899':'#f9a8d4','#10b981':'#34d399','#8b5cf6':'#c4b5fd','#64748b':'#94a3b8'};
  var lb=$('lista-blocos');
  function soft(){
    if(!lb)return;
    [].forEach.call(lb.querySelectorAll('button[onclick^="atualizarCorBlocoLocal"]'),function(b){
      if(b.dataset.s4)return;b.dataset.s4=1;
      var oc=b.getAttribute('onclick');
      Object.keys(MAP).forEach(function(k){
        if(oc.indexOf("'"+k+"'")>-1){b.setAttribute('onclick',oc.split("'"+k+"'").join("'"+MAP[k]+"'"));b.style.backgroundColor=MAP[k]}
      });
    });
  }
  if(lb){new MutationObserver(soft).observe(lb,{childList:true});soft()}


  /* 4. texto sempre legível sobre qualquer cor de fundo */
  function contraste(){
    [].forEach.call(document.querySelectorAll('[style*="background-color"]'),function(el){
      if(el.closest('#v-panel,#v-bg,#tela-bloqueio'))return;
      if(!el.textContent.trim()&&el.tagName!=='SELECT')return;
      var bg=getComputedStyle(el).backgroundColor;
      if(bg.indexOf('rgb')!==0)return;
      var m=bg.match(/[0-9.]+/g);if(!m||m.length<3)return;
      if(m.length>3&&parseFloat(m[3])<0.5)return;
      var l=0.299*m[0]+0.587*m[1]+0.114*m[2];
      el.style.setProperty('color',l>150?'#0f172a':'#ffffff','important');
    });
  }
  var ct=null;
  function agenda(){clearTimeout(ct);ct=setTimeout(contraste,80)}
  new MutationObserver(agenda).observe(document.body,{childList:true,subtree:true});
  agenda();


  /* 5. painel 🎨: letras, destinos e abas */
  function esc(t){return String(t).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}
  function hex(c){return /^#[0-9a-f]{6}$/i.test(c)?c:'#60a5fa'}
  function dot(attrs,c,on){return '<button type="button" class="v-dot'+(on?' on':'')+'" '+attrs+' style="background:'+c+'"></button>'}
  function build(){
    var h='<h4>Cor das letras</h4>'+TXC.map(function(c){return dot('data-tx="'+c+'"',c,cfg.tx===c)}).join('');
    var d=typeof dadosApp!=='undefined'?dadosApp:null;
    h+='<h4>Cores dos destinos</h4>';
    if(d&&d.destinosCadastrados){
      d.destinosCadastrados.forEach(function(n){
        var cur=(d.coresDestinos&&d.coresDestinos[n])||(typeof obterCorPorCategoria==='function'?obterCorPorCategoria(n):'#60a5fa');
        h+='<div style="margin-bottom:6px"><b style="font-size:12px">'+esc(n)+'</b><div>'+
          SOFT.map(function(c){return dot('data-d="'+esc(n)+'" data-c="'+c+'"',c,String(cur).toLowerCase()===c)}).join('')+
          '<input type="color" data-dcol="'+esc(n)+'" value="'+hex(cur)+'" style="width:26px;height:26px;border:0;padding:0;background:none;vertical-align:top"></div></div>';
      });
    }
    h+='<h4>Cor de cada aba</h4>';
    TABS.forEach(function(t){
      var el=$('tab-'+t[0]);var cur=cfg.tabs[t[0]]||(el?getComputedStyle(el).getPropertyValue('--tc').trim():'');
      h+='<div style="margin-bottom:6px"><b style="font-size:12px">'+t[1]+'</b><div>'+
        TABC.map(function(c){return dot('data-tab="'+t[0]+'" data-c="'+c+'"',c,String(cur).toLowerCase()===c)}).join('')+
        '<input type="color" data-tabcol="'+t[0]+'" value="'+hex(cur)+'" style="width:26px;height:26px;border:0;padding:0;background:none;vertical-align:top"></div></div>';
    });
    return h;
  }
  function setDest(n,c){
    try{
      if(typeof registarEstadoAnterior==='function')registarEstadoAnterior();
      if(!dadosApp.coresDestinos)dadosApp.coresDestinos={};
      dadosApp.coresDestinos[n]=c;
      (dadosApp.itinerario||[]).forEach(function(b){if(b.categoria===n)b.cor=c});
      salvarStorage();atualizarTudo();
    }catch(x){}
  }
  var P=$('v-panel');
  function inject(){
    if(!P||P.querySelector('#v274-sec'))return;
    var sec=document.createElement('div');sec.id='v274-sec';sec.innerHTML=build();
    sec.addEventListener('click',function(e){
      var b=e.target.closest('button');if(!b)return;
      if(b.dataset.tx){cfg.tx=b.dataset.tx;save();apply()}
      else if(b.dataset.d){setDest(b.dataset.d,b.dataset.c)}
      else if(b.dataset.tab){cfg.tabs[b.dataset.tab]=b.dataset.c;save();apply()}
    });
    sec.addEventListener('change',function(e){
      var i=e.target;
      if(i.dataset.dcol)setDest(i.dataset.dcol,i.value);
      if(i.dataset.tabcol){cfg.tabs[i.dataset.tabcol]=i.value;save();apply()}
    });
    P.appendChild(sec);
  }
  if(P){new MutationObserver(inject).observe(P,{childList:true});inject()}
})();
}catch(e){console.error('[bloco com erro]',e)}

try{
(function(){
  var clk=document.getElementById('v271-clocks');if(!clk)return;
  var box=document.createElement('div');box.id='v274-count';clk.insertAdjacentElement('afterend',box);
  function alvo(){
    var d=typeof dadosApp!=='undefined'?dadosApp:null;if(!d)return null;
    var ds=[];
    (d.itinerario||[]).forEach(function(b){if(b.dataInicio)ds.push(new Date(b.dataInicio+'T00:00:00'))});
    (d.voos||[]).forEach(function(v){if(v.data)ds.push(new Date(v.data+'T00:00:00'))});
    ds=ds.filter(function(x){return !isNaN(x)});
    if(!ds.length)return null;
    ds.sort(function(a,b){return a-b});return ds[0];
  }
  function p(n){return n<10?'0'+n:''+n}
  function cell(v,l){return '<div class="vc"><b>'+v+'</b><small>'+l+'</small></div>'}
  var KH='v274_count_hidden';
  function oculto(){try{return localStorage.getItem(KH)==='1'}catch(e){return false}}
  box.addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;
    try{if(b.dataset.a==='hide')localStorage.setItem(KH,'1');else localStorage.removeItem(KH)}catch(x){}
    tick();
  });
  function tick(){
    if(oculto()){box.innerHTML='<button type="button" data-a="show" class="vc-show">⏳ Mostrar contagem</button>';return}
    var x='<button type="button" data-a="hide" class="vc-x" aria-label="Esconder contagem">✕</button>';
    var t=alvo();
    if(!t){box.innerHTML='<div class="msg">⏳ Defina a data do primeiro bloco no Editar para ligar a contagem</div>'+x;return}
    var ms=t-new Date();
    if(ms<=0){box.innerHTML='<div class="msg">✈️ Viagem em andamento!</div>'+x;return}
    var s=Math.floor(ms/1000),d=Math.floor(s/86400);s-=d*86400;
    var h=Math.floor(s/3600);s-=h*3600;var m=Math.floor(s/60);s-=m*60;
    box.innerHTML=cell(d,'dias')+cell(p(h),'horas')+cell(p(m),'min')+cell(p(s),'seg')+x;
  }
  tick();setInterval(tick,1000);
})();
}catch(e){console.error('[bloco com erro]',e)}
