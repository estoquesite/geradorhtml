try{
(function(){
  var $=function(i){return document.getElementById(i)};
  var KEY='v272_cfg', cfg={bg:'liso',color:'#eef2ff',shape:'pad',acc:0};
  try{var s=JSON.parse(localStorage.getItem(KEY));if(s)for(var k in s)cfg[k]=s[k]}catch(e){}
  var ACC=[['Índigo','#6366f1','#7c3aed'],['Rosa','#ec4899','#a855f7'],['Turquesa','#14b8a6','#0ea5e9'],['Lilás','#8b5cf6','#d946ef']];
  var COLS=['#eef2ff','#fdf2f8','#ecfeff','#f0fdf4','#faf5ff','#f1f5f9','#e0f2fe','#fce7f3'];
  var BGS=[['liso','Liso'],['grad','Degradê'],['dots','Bolinhas'],['squares','Quadriculado'],['hearts','Corações'],['bubbles','Bolhas']];
  var SHAPES=[['pad','Padrão','20px'],['sq','Quadrado','6px'],['round','Redondo','28px'],['bubble','Bolha','42px']];


  var bg=document.createElement('div');bg.id='v-bg';document.body.insertBefore(bg,document.body.firstChild);
  function floaters(list,n,size){var h='';for(var i=0;i<n;i++){var sz=size[0]+Math.random()*(size[1]-size[0]);
    h+='<span style="left:'+Math.round(Math.random()*96)+'%;font-size:'+Math.round(sz)+'px;animation-duration:'+(9+Math.random()*10).toFixed(1)+'s,'+(3+Math.random()*3).toFixed(1)+'s;animation-delay:-'+(Math.random()*14).toFixed(1)+'s;opacity:.55">'+list+'</span>'}return h}
  function applyAll(){
    var c=cfg.color,st=bg.style;st.background=c;bg.innerHTML='';
    if(cfg.bg==='grad')st.background='linear-gradient(160deg,'+c+',#fff 70%)';
    if(cfg.bg==='dots')st.background='radial-gradient(rgba(99,102,241,.22) 2px,transparent 2.5px) 0 0/22px 22px,'+c;
    if(cfg.bg==='squares')st.background='linear-gradient(rgba(99,102,241,.1) 1px,transparent 1px) 0 0/26px 26px,linear-gradient(90deg,rgba(99,102,241,.1) 1px,transparent 1px) 0 0/26px 26px,'+c;
    if(cfg.bg==='hearts')bg.innerHTML=floaters('💗',14,[14,30]);
    if(cfg.bg==='bubbles'){st.background='linear-gradient(160deg,'+c+',#e0f2fe)';
      bg.innerHTML=floaters('<i style="display:block;width:1em;height:1em;border-radius:50%;background:rgba(255,255,255,.55);border:1px solid rgba(99,102,241,.25)"></i>',16,[16,60])}
    [].forEach.call(bg.children,function(x){x.style.animationName='vrise,vsway'});
    var a=ACC[cfg.acc]||ACC[0],r=document.documentElement.style;r.setProperty('--va1',a[1]);r.setProperty('--va2',a[2]);
    var sh=SHAPES.filter(function(x){return x[0]===cfg.shape})[0]||SHAPES[0];r.setProperty('--v-r',sh[2]);
    document.body.classList.toggle('v-shape',cfg.shape!=='pad');
    try{localStorage.setItem(KEY,JSON.stringify(cfg))}catch(e){}
  }
  var P=document.createElement('div');P.id='v-panel';document.body.appendChild(P);
  function render(){
    var h='<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:14px">🎨 Personalizar</b><button id="v-x" style="border:0;background:none;font-size:16px">✕</button></div>';
    h+='<h4>Fundo</h4>'+BGS.map(function(b){return '<button class="v-chip'+(cfg.bg===b[0]?' on':'')+'" data-bg="'+b[0]+'">'+b[1]+'</button>'}).join('');
    h+='<h4>Cor do fundo</h4>'+COLS.map(function(c){return '<button class="v-dot'+(cfg.color===c?' on':'')+'" data-col="'+c+'" style="background:'+c+'" aria-label="Cor"></button>'}).join('');
    h+='<h4>Formato dos quadrados</h4>'+SHAPES.map(function(b){return '<button class="v-chip'+(cfg.shape===b[0]?' on':'')+'" data-sh="'+b[0]+'">'+b[1]+'</button>'}).join('');
    h+='<h4>Cor de destaque</h4>'+ACC.map(function(a,i){return '<button class="v-dot'+(cfg.acc===i?' on':'')+'" data-acc="'+i+'" style="background:linear-gradient(135deg,'+a[1]+','+a[2]+')" aria-label="'+a[0]+'"></button>'}).join('');
    h+='<div style="margin-top:8px"><button class="v-chip" id="v-reset">↺ Restaurar padrão</button></div>';
    P.innerHTML=h;
  }
  P.addEventListener('click',function(e){var t=e.target.closest('button');if(!t)return;
    if(t.id==='v-x'){P.style.display='none';return}
    if(t.id==='v-reset'){cfg={bg:'liso',color:'#eef2ff',shape:'pad',acc:0}}
    if(t.dataset.bg)cfg.bg=t.dataset.bg; if(t.dataset.col)cfg.color=t.dataset.col;
    if(t.dataset.sh)cfg.shape=t.dataset.sh; if(t.dataset.acc!==undefined)cfg.acc=+t.dataset.acc;
    applyAll();render()});
  var fab=document.createElement('button');fab.id='v-fab';fab.textContent='🎨';fab.setAttribute('aria-label','Personalizar cores');
  fab.onclick=function(){render();P.style.display=P.style.display==='block'?'none':'block'};document.body.appendChild(fab);
  var top=document.createElement('button');top.id='v-top';top.textContent='⬆';top.setAttribute('aria-label','Voltar ao topo');
  top.onclick=function(){scrollTo({top:0,behavior:'smooth'})};document.body.appendChild(top);
  addEventListener('scroll',function(){top.classList.toggle('on',scrollY>500)},{passive:true});
  applyAll();


  /* cartões do Editar e do Roteiro em tom pastel da cor de cada destino */
  function tint(box,read,apply){if(!box)return;
    var run=function(){[].forEach.call(box.children,function(c){if(c.dataset.vp)return;var col=read(c);if(!col)return;c.dataset.vp=1;apply(c,col)})};
    new MutationObserver(run).observe(box,{childList:true});run()}
  tint($('lista-blocos'),function(c){return c.style.backgroundColor},function(c,col){
    c.style.backgroundColor='color-mix(in srgb,'+col+' 13%,white)';c.style.borderLeft='6px solid '+col});
  tint($('lista-leitura-html'),function(c){return c.style.borderLeftColor},function(c,col){
    c.style.background='linear-gradient(180deg,color-mix(in srgb,'+col+' 9%,white),#fff 60%)'});


  /* extras: confete ao concluir, vibração leve */
  document.addEventListener('change',function(e){var t=e.target;
    if(t.type!=='checkbox'||!t.checked||!t.closest('#tab-leitura'))return;
    var r=t.getBoundingClientRect(),em=['🎉','✨','💜','⭐','💗'];
    for(var i=0;i<12;i++){(function(){var s=document.createElement('span');s.textContent=em[i%em.length];
      s.style.cssText='position:fixed;z-index:999;pointer-events:none;font-size:18px;left:'+(r.left+8)+'px;top:'+(r.top+8)+'px';document.body.appendChild(s);
      var a=Math.random()*6.28,d=40+Math.random()*70;
      s.animate([{transform:'translate(0,0)',opacity:1},{transform:'translate('+Math.cos(a)*d+'px,'+(Math.sin(a)*d-30)+'px)',opacity:0}],{duration:800,easing:'ease-out'}).onfinish=function(){s.remove()}})()}
  });
  document.addEventListener('click',function(e){if(e.target.closest('button')&&navigator.vibrate)try{navigator.vibrate(8)}catch(x){}});
})();
}catch(e){console.error('[bloco com erro]',e)}
