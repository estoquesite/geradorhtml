try{
(function(){
  var $=function(i){return document.getElementById(i)};
  function idDe(c){var m=c.innerHTML.match(/removerDoRoteiro\('([^']+)'\)/);return m?m[1]:null}
  function item(id){return (dadosApp.itinerario||[]).filter(function(i){return String(i.id)===String(id)})[0]}

  /* ---------- ROTEIRO: ordem por data, concluído desce, o da vez pisca ---------- */
  function feito(it){
    var t=0,n=0;
    (it.trechos||[]).forEach(function(tr){
      var P=window.v277Percurso?window.v277Percurso(it,tr):null;if(!P)return;
      P.pts.forEach(function(pt){t++;var k=tr.id+'|'+(pt.k==='p'&&pt.p?pt.p.id:pt.k);if(it.pontosFeitos&&it.pontosFeitos[k])n++});
      (tr.conducoes||[]).forEach(function(c){t++;if(c.concluido)n++});
    });
    return t>0&&n===t;
  }
  var busy=false;
  function ordena(){
    var box=$('lista-leitura-html');if(!box||busy)return;
    var cards=[].slice.call(box.children).filter(function(c){return idDe(c)});
    if(!cards.length)return;
    var info=cards.map(function(c,i){var it=item(idDe(c))||{};return {c:c,i:i,d:feito(it)?1:0,dt:it.dataInicio||'9999-99-99'}});
    var want=info.slice().sort(function(a,b){return (a.d-b.d)||(a.dt<b.dt?-1:a.dt>b.dt?1:0)||(a.i-b.i)});
    var same=want.every(function(w,k){return w.c===cards[k]});
    if(!same){busy=true;want.forEach(function(w){box.appendChild(w.c)});setTimeout(function(){busy=false},0)}
    var first=want.filter(function(w){return !w.d})[0];
    cards.forEach(function(c){c.classList.toggle('v284-now',!!first&&first.c===c)});
  }
  var lr=$('lista-leitura-html');
  if(lr){
    new MutationObserver(function(){setTimeout(ordena,150)}).observe(lr,{childList:true});
    lr.addEventListener('change',function(){setTimeout(ordena,200)});
    setTimeout(ordena,400);setTimeout(ordena,1500);
  }

  /* ---------- ROTEIRO: quadro de progresso menor, com ✕ ---------- */
  function prog(){
    var p=$('progresso-viagem');if(!p||p.dataset.m284)return;p.dataset.m284=1;
    var card=p.parentElement;card.classList.add('v284-pc');
    var w=document.createElement('div');w.className='v284-pw';card.appendChild(w);w.appendChild(p);
    var x=document.createElement('button');x.type='button';x.className='v284-x';x.textContent='✕';x.setAttribute('aria-label','Fechar quadro de progresso');w.appendChild(x);
    var s=document.createElement('button');s.type='button';s.className='v284-show';s.textContent='📊 Mostrar progresso';card.parentNode.insertBefore(s,card);
    function ap(){var h=localStorage.getItem('v284_pg')==='1';card.style.display=h?'none':'';s.style.display=h?'block':'none'}
    x.onclick=function(){try{localStorage.setItem('v284_pg','1')}catch(e){}ap()};
    s.onclick=function(){try{localStorage.removeItem('v284_pg')}catch(e){}ap()};
    ap();
  }

  /* ---------- HORÁRIO (relógios): ✕ próprio ---------- */
  function clocks(){
    var c=$('v271-clocks');if(!c||c.dataset.m284)return;c.dataset.m284=1;
    var x=document.createElement('button');x.type='button';x.className='v284-cx';x.textContent='✕';x.setAttribute('aria-label','Fechar horário');
    var s=document.createElement('button');s.type='button';s.className='v284-cs';s.textContent='🕒 Mostrar horário';
    c.appendChild(x);c.appendChild(s);
    function ap(){c.classList.toggle('v284-off',localStorage.getItem('v284_ck')==='1')}
    x.onclick=function(){try{localStorage.setItem('v284_ck','1')}catch(e){}ap()};
    s.onclick=function(){try{localStorage.removeItem('v284_ck')}catch(e){}ap()};
    ap();
  }
  prog();clocks();setTimeout(function(){prog();clocks()},800);

  /* ---------- PERSONALIZAR: cor das setinhas + estrelinhas ---------- */
  var CHK='v284_ch',FXK='v284_fx';
  var ch=localStorage.getItem(CHK)||'';
  var fxOn=false;
  function applyCh(){if(ch)document.documentElement.style.setProperty('--v284-ch',ch);else document.documentElement.style.removeProperty('--v284-ch')}
  applyCh();
  var CORES=['#4338ca','#db2777','#0d9488','#ea580c','#16a34a','#0891b2','#7c3aed','#0f172a'];
  var P=$('v-panel');
  function inj(){
    if(!P||P.querySelector('#v284-sec'))return;
    var s=document.createElement('div');s.id='v284-sec';
    s.innerHTML='<h4>Cor das setinhas</h4>'+CORES.map(function(c){return '<button type="button" class="v-dot'+(ch===c?' on':'')+'" data-c="'+c+'" style="background:'+c+'" aria-label="Cor"></button>'}).join('')+
      '<input type="color" data-cc value="'+(ch||'#4338ca')+'" style="width:26px;height:26px;border:0;padding:0;background:none;vertical-align:top"><div style="margin-top:6px"><button type="button" class="v-chip" data-r="1">↺ Cor padrão</button></div>'+
      '<h4>Estrelinhas e corações</h4><button type="button" class="v-chip'+(fxOn?' on':'')+'" data-fx="1">'+(fxOn?'Ligado':'Desligado')+'</button>';
    s.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
      if(b.dataset.c){ch=b.dataset.c;try{localStorage.setItem(CHK,ch)}catch(x){}applyCh()}
      else if(b.dataset.r){ch='';try{localStorage.removeItem(CHK)}catch(x){}applyCh()}
      else if(b.dataset.fx){fxOn=!fxOn;try{localStorage.setItem(FXK,fxOn?'1':'0')}catch(x){}fxState()}});
    s.addEventListener('change',function(e){if(e.target.dataset.cc!==undefined){ch=e.target.value;try{localStorage.setItem(CHK,ch)}catch(x){}applyCh()}});
    P.appendChild(s);
  }
  

  /* ---------- ESTRELINHAS E CORAÇÕES: sobem devagar; ao tocar, abrem e depois fecham ---------- */
  var cv=document.createElement('canvas');cv.id='v284-fx-old';cv.style.display='none';document.body.appendChild(cv);
  var g=cv.getContext('2d'),W=0,H=0,dpr=Math.min(window.devicePixelRatio||1,2),A=[],ptr={d:false,x:0,y:0},raf=0,last=0;
  var EM=['✨','💗','⭐','💜','💖','✨'];
  function mk(init){return {x:Math.random()*W,y:init?Math.random()*H:H+30,s:14+Math.random()*16,v:14+Math.random()*22,ph:Math.random()*6.28,sw:.4+Math.random()*.7,e:EM[Math.floor(Math.random()*EM.length)],ox:0,oy:0,vx:0,vy:0,a:.4+Math.random()*.4}}
  function size(){W=window.innerWidth;H=window.innerHeight;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);g.setTransform(dpr,0,0,dpr,0,0);
    var n=Math.max(12,Math.min(26,Math.round(W*H/38000)));while(A.length<n)A.push(mk(true));A.length=n}
  function frame(t){
    raf=requestAnimationFrame(frame);
    var dt=Math.min((t-last)/1000,.05);last=t;g.clearRect(0,0,W,H);
    for(var i=0;i<A.length;i++){var p=A[i];
      p.y-=p.v*dt;p.ph+=p.sw*dt;
      var bx=p.x+Math.sin(p.ph)*14,px=bx+p.ox,py=p.y+p.oy;
      if(ptr.d){var dx=px-ptr.x,dy=py-ptr.y,d=Math.sqrt(dx*dx+dy*dy)||1,R=130;
        if(d<R){var f=(1-d/R)*900*dt;p.vx+=dx/d*f;p.vy+=dy/d*f}}
      p.vx+=-p.ox*6*dt;p.vy+=-p.oy*6*dt;p.vx*=.9;p.vy*=.9;p.ox+=p.vx*dt*8;p.oy+=p.vy*dt*8;
      if(p.y<-30){A[i]=mk(false);continue}
      g.globalAlpha=p.a*(.75+.25*Math.sin(p.ph*2.3));g.font=p.s+'px serif';g.fillText(p.e,px,py);
    }
    g.globalAlpha=1;
  }
  function fxState(){
    cv.style.display=fxOn?'block':'none';
    if(fxOn&&!raf){last=performance.now();raf=requestAnimationFrame(frame)}
    if(!fxOn&&raf){cancelAnimationFrame(raf);raf=0}
  }
  size();window.addEventListener('resize',size);
  window.addEventListener('pointerdown',function(e){ptr.d=true;ptr.x=e.clientX;ptr.y=e.clientY},{passive:true});
  window.addEventListener('pointermove',function(e){if(ptr.d){ptr.x=e.clientX;ptr.y=e.clientY}},{passive:true});
  ['pointerup','pointercancel','blur'].forEach(function(n){window.addEventListener(n,function(){ptr.d=false},{passive:true})});
  document.addEventListener('visibilitychange',function(){if(document.hidden){if(raf){cancelAnimationFrame(raf);raf=0}}else fxState()});
  fxState();
})();
}catch(e){console.error('[bloco com erro]',e)}

try{
(function(){
  var $=function(i){return document.getElementById(i)};
  function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function item(id){return (dadosApp.itinerario||[]).filter(function(i){return String(i.id)===String(id)})[0]}
  function trecho(it,id){return it&&(it.trechos||[]).filter(function(t){return String(t.id)===String(id)})[0]}
  function cond(it,trId,cId){var tr=trecho(it,trId);return tr&&(tr.conducoes||[]).filter(function(c){return String(c.id)===String(cId)})[0]}
  function save(){try{salvarStorage()}catch(e){}}
  function idDe(c){var m=c.innerHTML.match(/(?:alternarBloqueio|removerDoRoteiro|apagarBloco)\('([^']+)'\)/);return m?m[1]:null}

  /* ---------- progresso: "4 / 4" sem a palavra Aprovados (cabe no celular) ---------- */
  var pg=$('progresso-viagem');
  function enc(){if(pg&&/Aprovados/.test(pg.textContent))pg.textContent=pg.textContent.replace(/\s*Aprovados/,'')}
  if(pg){new MutationObserver(enc).observe(pg,{childList:true,characterData:true,subtree:true});enc()}

  /* ---------- LINHAS (chips estilo Google) ---------- */
  var PAL=['#e2231a','#6ab42d','#4caf7a','#1e3a6e','#0d9488','#ea580c','#7c3aed','#db2777','#0891b2','#475569'];
  function hs(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h}
  function corAuto(n){var u=String(n).toUpperCase().replace(/\s/g,'');
    if(/^(IR|IC|ICE|EC|RJ|TGV|RE)/.test(u))return PAL[0];
    if(/^S\d/.test(u)){var g=['#6ab42d','#4caf7a','#2e8b57','#1e3a6e','#0d9488'];return g[hs(u)%g.length]}
    return PAL[hs(u)%PAL.length]}
  function chips(c,rm){return (c.linhas||[]).map(function(l){return '<span class="v285-ch" data-id="'+esc(l.id)+'" style="background:'+esc(l.cor||corAuto(l.nome))+'">'+esc(l.nome)+(rm?'<i data-x="1">✕</i>':'')+'</span>'}).join('')}
  function todasLinhas(){var s=[];(dadosApp.itinerario||[]).forEach(function(i){(i.trechos||[]).forEach(function(t){(t.conducoes||[]).forEach(function(c){(c.linhas||[]).forEach(function(l){if(s.indexOf(l.nome)<0)s.push(l.nome)})})})});return s}

  function linhasEdit(){
    var box=$('lista-blocos');if(!box)return;
    [].forEach.call(box.querySelectorAll('select[onchange*="\'transporte\'"]'),function(sel){
      if(sel.dataset.l285)return;
      var m=sel.getAttribute('onchange').match(/atualizarConducaoItem\('([^']+)',\s*'([^']+)',\s*'([^']+)'/);if(!m)return;
      var card=sel.parentElement&&sel.parentElement.parentElement;if(!card)return;
      sel.dataset.l285=1;
      var u='v285'+Math.floor(Math.random()*1e9),w=document.createElement('div');w.className='v285-ed';
      w.innerHTML='<div class="r"><span>🚏</span><input list="'+u+'" placeholder="Linha (ex.: S2, IR75, 31) e toque ＋"><button type="button" class="p" aria-label="Adicionar linha">＋</button></div><datalist id="'+u+'"></datalist><div class="g"></div><div class="h">Toque na linha para mudar a cor.</div>';
      var inp=w.querySelector('input'),G=w.querySelector('.g'),DL=w.querySelector('datalist');
      function C(){return cond(item(m[1]),m[2],m[3])}
      function draw(){var c=C()||{};G.innerHTML=chips(c,true);DL.innerHTML=todasLinhas().map(function(n){return '<option value="'+esc(n)+'">'}).join('')}
      function add(){var c=C();if(!c)return;var v=inp.value.split(',').map(function(x){return x.trim()}).filter(Boolean);if(!v.length)return;
        if(!c.linhas)c.linhas=[];
        v.forEach(function(n){c.linhas.push({id:'l'+Date.now()+Math.floor(Math.random()*9999),nome:n,cor:corAuto(n)})});
        inp.value='';save();draw()}
      w.querySelector('.p').onclick=add;
      inp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();add()}});
      G.addEventListener('click',function(e){var ch=e.target.closest('.v285-ch');if(!ch)return;var c=C();if(!c)return;
        if(e.target.closest('[data-x]')){c.linhas=(c.linhas||[]).filter(function(l){return l.id!==ch.dataset.id})}
        else{var l=(c.linhas||[]).filter(function(x){return x.id===ch.dataset.id})[0];if(l){var i=PAL.indexOf(l.cor);l.cor=PAL[(i+1)%PAL.length]}}
        save();draw()});
      draw();card.appendChild(w);
    });
  }

  function linhasRead(){
    var box=$('lista-leitura-html');if(!box)return;
    [].forEach.call(box.querySelectorAll('input[type=checkbox][onchange*="alternarConcluidoConducao"]'),function(cb){
      var m=cb.getAttribute('onchange').match(/alternarConcluidoConducao\('([^']+)',\s*'([^']+)',\s*'([^']+)'/);if(!m)return;
      var info=cb.nextElementSibling,title=info&&info.firstElementChild;if(!title||title.dataset.l285)return;
      title.dataset.l285=1;var c=cond(item(m[1]),m[2],m[3]);if(!c||!(c.linhas||[]).length)return;
      var s=document.createElement('span');s.className='v285-ln';s.innerHTML=chips(c,false);title.appendChild(s);
    });
  }

  /* ---------- TEXTO na saída (azul) e na chegada (verde) ---------- */
  function textosEdit(){
    var box=$('lista-blocos');if(!box)return;
    [].forEach.call(box.children,function(card){
      var id=idDe(card);if(!id)return;
      [].forEach.call(card.querySelectorAll('button[onclick^="removerTrecho("]'),function(btn){
        var row=btn.parentElement;if(!row||row.dataset.t285)return;
        var m=btn.getAttribute('onclick').match(/removerTrecho\('([^']+)',\s*'([^']+)'\)/);if(!m)return;row.dataset.t285=1;
        var tr=trecho(item(id),m[2])||{},w=document.createElement('div');w.className='v285-tx';
        w.innerHTML='<textarea data-k="textoSaida" placeholder="📝 Texto da saída (aparece dentro da caixa azul)"></textarea><textarea data-k="textoChegada" placeholder="📝 Texto da chegada (aparece dentro da caixa verde)"></textarea>';
        [].forEach.call(w.querySelectorAll('textarea'),function(t){t.value=tr[t.dataset.k]||'';
          t.addEventListener('input',function(){var x=trecho(item(id),m[2]);if(x){x[t.dataset.k]=t.value;save()}})});
        row.insertAdjacentElement('afterend',w);
      });
    });
  }

  function mapaUrl(o,d){return 'https://www.google.com/maps/dir/?api=1'+(o?'&origin='+encodeURIComponent(o):'')+'&destination='+encodeURIComponent(d||'')+'&travelmode=transit'}
  function roteiro(){
    var box=$('lista-leitura-html');if(!box)return;
    [].forEach.call(box.children,function(card){
      var id=idDe(card),it=id&&item(id);if(!it)return;
      var rotas=[].filter.call(card.querySelectorAll('div.my-2'),function(d){return /📍 Rota/.test(d.textContent)});
      rotas.forEach(function(rt,k){
        var tr=(it.trechos||[])[k];if(!tr||rt.dataset.r285)return;
        var hdr=rt.firstElementChild,tl=rt.querySelector('.v277-tl');if(!hdr||!tl||!hdr.classList.contains('v279-rh'))return;
        rt.dataset.r285=1;
        /* mapa da rota completa, no topo */
        var r=hdr.lastElementChild;
        if(r){var a=document.createElement('a');a.className='v285-hm';a.target='_blank';a.rel='noopener';a.textContent='🗺️';a.title='Mapa da rota';
          a.href=mapaUrl(tr.origem,tr.destino);a.addEventListener('click',function(e){e.stopPropagation()});r.insertBefore(a,r.firstChild)}
        /* texto dentro da caixa azul (saída) e verde (chegada) + mapa da saída */
        [['.v277-pt.o','textoSaida'],['.v277-pt.d','textoChegada']].forEach(function(p){
          var el=tl.querySelector(p[0]);if(!el)return;
          var ref=el.querySelector('.v279-mo'),bx=document.createElement('div');bx.className='v285-bx';
          bx.innerHTML='<textarea placeholder="Cole ou escreva um texto aqui…"></textarea>';
          var ta=bx.querySelector('textarea');ta.value=tr[p[1]]||'';
          ta.addEventListener('input',function(){var x=trecho(item(id),tr.id);if(x){x[p[1]]=ta.value;save()}});
          el.insertBefore(bx,ref||null);
          if(p[1]==='textoSaida'&&tr.origem){
            var l=document.createElement('a');l.className='mp';l.target='_blank';l.rel='noopener';l.textContent='🗺️ Como chegar aqui (de onde estou)';l.href=mapaUrl('',tr.origem);
            el.insertBefore(l,bx)}
        });
      });
    });
  }

  function obs(id,fn,ms){var e=$(id);if(!e)return;new MutationObserver(function(){setTimeout(fn,ms||0)}).observe(e,{childList:true});setTimeout(fn,ms||0)}
  obs('lista-blocos',linhasEdit);obs('lista-blocos',textosEdit);
  obs('lista-leitura-html',linhasRead,300);obs('lista-leitura-html',roteiro,350);
  setTimeout(function(){linhasEdit();textosEdit();linhasRead();roteiro()},1500);
})();
}catch(e){console.error('[bloco com erro]',e)}

try{
(function(){
  var $=function(i){return document.getElementById(i)};
  function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function T(m,t){if(window.mostrarToast)mostrarToast(m,t||'info')}
  function pad(n){return n<10?'0'+n:''+n}
  function iso(y,m,d){return y+'-'+pad(m+1)+'-'+pad(d)}
  function fmt(d){return d?d.split('-').reverse().join('/'):'?'}
  var MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  var now=new Date(),Y=now.getFullYear(),M=now.getMonth(),SEL=null,ALVO=null;
  var HOJE=iso(Y,M,now.getDate());
  function item(id){return (dadosApp.itinerario||[]).filter(function(i){return String(i.id)===String(id)})[0]}
  function blocosDo(dia){return (dadosApp.itinerario||[]).filter(function(b){var a=b.dataInicio,z=b.dataFim||a;return a&&a<=dia&&dia<=z})}
  function corDe(b){return b.cor||(typeof obterCorPorCategoria==='function'?obterCorPorCategoria(b.categoria):'#6366f1')}
  var PAL=['#e2231a','#6ab42d','#4caf7a','#1e3a6e','#0d9488','#ea580c','#7c3aed','#db2777','#0891b2','#475569'];
  function hs(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h}
  function corAuto(n){var u=String(n).toUpperCase().replace(/\s/g,'');
    if(/^(IR|IC|ICE|EC|RJ|TGV|RE)/.test(u))return PAL[0];
    if(/^S\d/.test(u)){var g=['#6ab42d','#4caf7a','#2e8b57','#1e3a6e','#0d9488'];return g[hs(u)%g.length]}
    return PAL[hs(u)%PAL.length]}
  function lugarDoLink(u){u=(u||'').trim();var m=u.match(/\/place\/([^\/?#]+)/);
    if(!m)m=u.match(/[?&](?:q|query|destination)=([^&#]+)/);
    if(!m)return '';var s=m[1].replace(/\+/g,' ');try{s=decodeURIComponent(s)}catch(e){}return s.split(',')[0].trim()}

  function grade(){
    var first=new Date(Y,M,1).getDay(),n=new Date(Y,M+1,0).getDate();
    var h='<div class="v286-hd"><button type="button" data-a="pm" aria-label="Mês anterior">◀</button><b>'+MESES[M]+' '+Y+'</b><button type="button" data-a="nm" aria-label="Próximo mês">▶</button><button type="button" data-a="x" aria-label="Fechar">✕</button></div>';
    h+='<div class="v286-wk">'+['D','S','T','Q','Q','S','S'].map(function(x){return '<span>'+x+'</span>'}).join('')+'</div><div class="v286-gr">';
    for(var i=0;i<first;i++)h+='<i></i>';
    for(var d=1;d<=n;d++){var k=iso(Y,M,d),bs=blocosDo(k);
      h+='<button type="button" class="v286-dy'+(k===HOJE?' hj':'')+(k===SEL?' sl':'')+'" data-d="'+k+'"><span>'+d+'</span><em>'+bs.slice(0,3).map(function(b){return '<u style="background:'+esc(corDe(b))+'"></u>'}).join('')+'</em></button>'}
    return h+'</div>';
  }
  function lista(arr){return arr.map(function(x){return '<option value="'+esc(x)+'">'}).join('')}
  function painel(){
    if(!SEL)return '<p class="mu">Toque num dia para ver o que já existe ou montar uma rota nova.</p>';
    var bs=blocosDo(SEL),h='<h3>📅 '+fmt(SEL)+'</h3>';
    bs.forEach(function(b){
      h+='<div class="v286-bk" style="border-left:6px solid '+esc(corDe(b))+'"><b>'+esc(b.categoria||'Dia')+'</b><small>'+fmt(b.dataInicio)+(b.dataFim&&b.dataFim!==b.dataInicio?' → '+fmt(b.dataFim):'')+' · '+(b.trechos||[]).length+' rota(s)'+(b.bloqueado?' · no Roteiro':'')+'</small><div class="ac"><button type="button" data-e="'+esc(b.id)+'">✏️ Editar</button><button type="button" data-r="'+esc(b.id)+'">➕ Rota aqui</button></div></div>'});
    if(!bs.length)h+='<p class="mu">Nada neste dia ainda.</p>';
    var al=ALVO&&item(ALVO),d=dadosApp;
    h+='<div class="v286-fm"><b>'+(al?'➕ Nova rota em “'+esc(al.categoria)+'”':'➕ Nova rota neste dia')+'</b>';
    if(!al)h+='<div><label>Destino do dia (cidade)</label><input id="v286-cat" list="v286-dc" placeholder="Ex.: Zurique"><datalist id="v286-dc">'+lista(d.destinosCadastrados||[])+'</datalist></div>';
    h+='<div><label>De onde?</label><input id="v286-de" list="v286-do" placeholder="Ex.: Aeroporto de Zurique"><datalist id="v286-do">'+lista(d.origensCadastrados||[])+'</datalist></div>'+
      '<div><label>Para onde?</label><input id="v286-para" list="v286-dd" placeholder="Ex.: Zurich HB"><datalist id="v286-dd">'+lista(d.destinosCadastradosLocais||[])+'</datalist></div>'+
      '<div><label>🗺️ Link do Google Maps (opcional)</label><div class="lk"><input id="v286-lk" type="url" placeholder="Cole o link aqui"><button type="button" data-a="imp">Ler</button></div></div>'+
      '<div><label>Paradas no meio (uma por linha, opcional)</label><textarea id="v286-pd" rows="2" placeholder="Ex.: Zurich HB"></textarea></div>'+
      '<div class="r2"><div><label>Transporte</label><select id="v286-tr"><option>Trem</option><option>Ônibus</option><option>Metrô</option><option>Avião</option><option>Carro</option><option>Outro</option></select></div><div><label>Linhas</label><input id="v286-ln" placeholder="S2, IR75, 31"></div></div>'+
      '<div class="r2"><div><label>Valor</label><input id="v286-vl" inputmode="decimal" placeholder="0"></div><div><label>Moeda</label><select id="v286-mo"><option>EUR</option><option>CHF</option></select></div></div>'+
      '<label class="ck"><input id="v286-env" type="checkbox" checked> Já enviar para o Roteiro</label>'+
      '<button type="button" class="ok" data-a="sv">✓ Salvar rota</button></div>';
    return h;
  }
  function desenha(g,p){if(g!==false)$('v286-g').innerHTML=grade();if(p!==false)$('v286-p').innerHTML=painel()}
  function reg(arr,v){if(v&&arr.indexOf(v)<0)arr.push(v)}
  function salvar(){
    var v=function(i){var e=$('v286-'+i);return e?e.value.trim():''};
    var de=v('de'),para=v('para'),lk=v('lk');
    if(!para&&lk)para=lugarDoLink(lk);
    if(!para){T('Diga para onde (ou cole um link que eu consiga ler).','erro');return}
    var it=ALVO&&item(ALVO),cat=v('cat');
    if(!it&&!cat){T('Diga o destino do dia (cidade).','erro');return}
    try{registarEstadoAnterior()}catch(e){}
    var d=dadosApp,t=Date.now();
    if(!it){reg(d.destinosCadastrados=d.destinosCadastrados||[],cat);
      it={id:t,categoria:cat,dataInicio:SEL,dataFim:SEL,cor:obterCorPorCategoria(cat),bloqueado:false,concluido:false,trechos:[],itens:[]};
      d.itinerario=d.itinerario||[];d.itinerario.unshift(it)}
    var linhas=v('ln').split(',').map(function(x){return x.trim()}).filter(Boolean).map(function(n,i){return {id:'l'+t+i,nome:n,cor:corAuto(n)}});
    var tr={id:t+1,origem:de,destino:para,concluido:false,conducoes:[{id:t+2,transporte:v('tr')||'Trem',valor:limparNumero(v('vl')),moeda:v('mo')||'EUR',notas:'',fotosExtras:[],linhas:linhas}]};
    if(lk)tr.textoChegada='🗺️ '+lk;
    it.trechos=it.trechos||[];it.trechos.push(tr);
    v('pd').split('\n').map(function(x){return x.trim()}).filter(Boolean).forEach(function(l,i){
      it.paradas=it.paradas||[];it.paradas.push({id:'p'+t+i,apos:tr.id,local:l,de:'',texto:''})});
    reg(d.origensCadastrados=d.origensCadastrados||[],de);reg(d.destinosCadastradosLocais=d.destinosCadastradosLocais||[],para);
    if($('v286-env')&&$('v286-env').checked)it.bloqueado=true;
    try{salvarStorage()}catch(e){}try{atualizarTudo()}catch(e){}
    ALVO=it.id;T('Rota salva! ✓','sucesso');desenha();
  }
  function criar(){
    var m=document.createElement('div');m.id='v286-m';m.innerHTML='<div class="w"><div id="v286-g"></div><div id="v286-p"></div></div>';
    document.body.appendChild(m);
    m.addEventListener('click',function(e){
      var b=e.target.closest('button');if(!b)return;
      var a=b.dataset.a;
      if(a==='x'){m.style.display='none';return}
      if(a==='pm'||a==='nm'){M+=a==='pm'?-1:1;if(M<0){M=11;Y--}if(M>11){M=0;Y++}desenha(true,false);return}
      if(a==='sv'){salvar();return}
      if(a==='imp'){var n=lugarDoLink($('v286-lk').value);if(n){$('v286-para').value=n;T('Lugar: '+n,'sucesso')}else T('Não consegui ler o nome deste link. Digite o nome em “Para onde?”.','info');return}
      if(b.dataset.d){SEL=b.dataset.d;ALVO=null;desenha();return}
      if(b.dataset.r){ALVO=b.dataset.r;desenha(false,true);return}
      if(b.dataset.e){var it=item(b.dataset.e);m.style.display='none';try{mudarTab('itinerario');if(it)filtrarDestino(it.categoria)}catch(x){}}
    });
    return m;
  }
  function abrir(){var m=$('v286-m')||criar();m.style.display='block';var b=(dadosApp.itinerario||[]).filter(function(i){return i.dataInicio})[0];
    if(!SEL)SEL=HOJE;desenha();m.scrollTop=0}
  window.abrirCalendario=abrir;
  var bar=$('v271-bar');
  if(bar){var o=document.createElement('button');o.id='v286-open';o.type='button';o.title='Calendário';o.setAttribute('aria-label','Abrir calendário');o.innerHTML='<span>📅</span>';o.onclick=abrir;bar.insertBefore(o,bar.firstChild)}
})();
}catch(e){console.error('[bloco com erro]',e)}

try{
(function(){
  var $=function(i){return document.getElementById(i)};
  function item(id){return (dadosApp.itinerario||[]).filter(function(i){return String(i.id)===String(id)})[0]}
  function idDe(c){var m=c.innerHTML.match(/(?:alternarBloqueio|removerDoRoteiro|apagarBloco)\('([^']+)'\)/);return m?m[1]:null}
  function T(m,t){if(window.mostrarToast)mostrarToast(m,t||'info')}
  function enc(x){return encodeURIComponent(x||'')}
  function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
  function mapaUrl(o,d){return 'https://www.google.com/maps/dir/?api=1&origin='+enc(o)+'&destination='+enc(d)+'&travelmode=transit'}
  function btn(cls,txt,tit){var b=document.createElement('button');b.type='button';b.className='v287-b '+cls;b.textContent=txt;b.title=tit;b.setAttribute('aria-label',tit);
    b.addEventListener('click',function(e){e.stopPropagation()});return b}
  function nomeAnt(P,j){for(var q=j-1;q>=0;q--)if((P.pts[q].nome||'').trim())return P.pts[q].nome;return ''}
  function nomeProx(P,j){for(var q=j+1;q<P.pts.length;q++)if((P.pts[q].nome||'').trim())return P.pts[q].nome;return ''}

  function irEditar(itId,trId,pId,cId){
    if(typeof mudarTab==='function')mudarTab('itinerario');
    setTimeout(function(){
      var box=$('lista-blocos');if(!box)return;
      var card=[].filter.call(box.children,function(c){return idDe(c)===String(itId)})[0];if(!card)return;
      if(card.classList.contains('v281-ec')){var cv=card.querySelector('.v281-cvb');if(cv)cv.click()}
      var alvo=null;
      if(pId)alvo=card.querySelector('.v277-p[data-id="'+pId+'"]');
      else if(cId){var s=[].filter.call(card.querySelectorAll('select[onchange*="\'transporte\'"]'),function(x){return x.getAttribute('onchange').indexOf("'"+cId+"'")>-1})[0];
        alvo=s&&s.parentElement&&s.parentElement.parentElement}
      else if(trId){var b=[].filter.call(card.querySelectorAll('button[onclick^="removerTrecho("]'),function(x){return x.getAttribute('onclick').indexOf("'"+trId+"'")>-1})[0];alvo=b&&b.parentElement}
      alvo=alvo||card;
      alvo.scrollIntoView({behavior:'smooth',block:'center'});
      alvo.classList.add('v287-flash');setTimeout(function(){alvo.classList.remove('v287-flash')},2400);
    },500);
  }
  window.v287IrEditar=irEditar;

  function baixar(el,nome){
    var a=el.querySelector('.v279-mo .im a.dl');
    if(!a||!a.href||a.href.indexOf('data:')!==0){T('Este ponto ainda não tem imagem colada.','info');return}
    var l=document.createElement('a');l.href=a.href;l.download='mapa-'+(nome||'ponto').replace(/[^\w\-]+/g,'_')+'.jpg';
    document.body.appendChild(l);l.click();l.remove();
  }

  function processa(card){
    var id=idDe(card),it=id&&item(id);if(!it||!window.v277Percurso)return;

    var rz=card.querySelector('.v276-rz');
    if(rz&&!rz.querySelector('.ob')&&rz.style.display!=='none')rz.style.display='none';

    var rotas=[].filter.call(card.querySelectorAll('div.my-2'),function(d){return /📍 Rota/.test(d.textContent)});
    rotas.forEach(function(rt,k){
      var tr=(it.trechos||[])[k],tl=rt.querySelector('.v277-tl');if(!tr||!tl)return;
      var P=window.v277Percurso(it,tr),usados={};
      [].slice.call(tl.children).filter(function(e){return e.classList.contains('v277-pt')}).forEach(function(el){
        var j=-1;
        if(el.classList.contains('o'))j=0;
        else if(el.classList.contains('d'))j=P.pts.length-1;
        else{
          var t=((el.querySelector('.hd b')||{}).textContent||'').replace(/^.*Parada:\s*/,'').trim(),q;
          for(q=1;q<P.pts.length-1;q++){if(!usados[q]&&(P.pts[q].nome||'—')===t){j=q;break}}
          if(j<0)for(q=1;q<P.pts.length-1;q++){if(!usados[q]){j=q;break}}
        }
        if(j<0||!P.pts[j])return;usados[j]=1;
        var pt=P.pts[j],org,dst;
        if(j===0){org=pt.nome;dst=nomeProx(P,0)}
        else{org=(pt.p&&(pt.p.de||'').trim())||nomeAnt(P,j);dst=pt.nome}
        var url=mapaUrl(org,dst);
        if(!el.dataset.m287){
          el.dataset.m287=1;
          var hd=el.querySelector('.hd');
          if(hd){
            var w=document.createElement('span');w.className='v287-ac';
            var a=document.createElement('a');a.className='v287-b';a.target='_blank';a.rel='noopener';a.textContent='🗺️';a.title='Mapa (transporte público)';a.setAttribute('aria-label','Mapa em transporte público');
            a.href=url;a.addEventListener('click',function(e){e.stopPropagation()});
            var ph=btn('ph','📷','Adicionar foto do mapa (escolher ou câmera)');
            ph.addEventListener('click',function(){var inp=el.querySelector(':scope > .v279-mo input[type=file]');if(inp)inp.click();else T('Abra o card e use "Escolher" no Mapa offline.','info')});
            var d=btn('dl','📥','Baixar imagem colada');d.addEventListener('click',function(){baixar(el,pt.nome)});
            var p=btn('ed','✏️','Editar este ponto');
            var pid=(pt.k==='p'&&pt.p)?pt.p.id:null;
            p.addEventListener('click',function(){irEditar(id,tr.id,pid,null)});
            w.appendChild(a);w.appendChild(ph);w.appendChild(d);w.appendChild(p);
            hd.insertBefore(w,hd.querySelector('.v279-ic')||hd.querySelector('.v279-cv')||null);
          }
        }
        var mp=el.querySelector(':scope > a.mp');
        if(mp){
          var txt=org?('🗺️ Como chegar: '+org+' ➔ '+(dst||'?')):('⚠️ Falta o nome do ponto anterior ➔ '+(dst||'?'));
          if(mp.getAttribute('href')!==url)mp.setAttribute('href',url);
          if(mp.textContent!==txt)mp.textContent=txt;
        }
        var mo=el.querySelector(':scope > .v279-mo');
        if(j===0){
          var lg=el.querySelector(':scope > .v277-lg');
          if(!lg){var n=el.nextElementSibling;if(n&&n.classList.contains('v277-lg'))lg=n}
          if(lg){lg.classList.add('v287-lgin');if(lg.parentElement!==el||(mo&&mo.previousElementSibling!==lg))el.insertBefore(lg,mo||null)}
        }
        var rl=el.querySelector(':scope > .v286-rl');
        if(rl&&(rl.parentElement!==el||(mo&&mo.previousElementSibling!==rl)))el.insertBefore(rl,mo||null);
      });
    });
    [].forEach.call(card.querySelectorAll('.v279-cd'),function(cd){
      if(cd.dataset.m287)return;
      var cb=cd.querySelector('input[type=checkbox]');if(!cb)return;
      var m=(cb.getAttribute('onchange')||'').match(/alternarConcluidoConducao\('([^']+)',\s*'([^']+)',\s*'([^']+)'/);if(!m)return;
      cd.dataset.m287=1;
      var p=btn('ed','✏️','Editar esta condução');
      p.addEventListener('click',function(){irEditar(m[1],m[2],null,m[3])});
      (cb.parentElement||cd).appendChild(p);
    });
  }
  function roda(){var box=$('lista-leitura-html');if(!box)return;[].forEach.call(box.children,processa)}
  var t=null,box=$('lista-leitura-html');
  if(box)new MutationObserver(function(){clearTimeout(t);t=setTimeout(roda,250)}).observe(box,{childList:true,subtree:true});
  [500,1300,2600].forEach(function(ms){setTimeout(roda,ms)});

  var SKIP=/^(checkbox|radio|file|button|color)$/;
  document.addEventListener('focusin',function(e){var x=e.target;if(/INPUT|TEXTAREA|SELECT/.test(x.tagName)&&!SKIP.test(x.type||''))document.body.classList.add('v287-typing')});
  document.addEventListener('focusout',function(){setTimeout(function(){var a=document.activeElement;if(!(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)&&!SKIP.test(a.type||'')))document.body.classList.remove('v287-typing')},150)});

  function ov(h){var o=$('v287-dg');if(!o){o=document.createElement('div');o.id='v287-dg';document.body.appendChild(o)}
    o.innerHTML='<div class="b">'+h+'</div>';
    o.onclick=function(e){if(e.target===o||e.target.closest('[data-c]'))o.remove();else if(e.target.closest('[data-s]')){o.remove();window.dispatchEvent(new Event('online'));T('Sincronizando...','info')}};return o}
  function req(url,opt){
    var c=new AbortController(),tm=setTimeout(function(){c.abort()},10000),t0=Date.now();
    return fetch(url,Object.assign({signal:c.signal},opt)).then(function(r){return r.text().then(function(b){return {ok:r.ok,s:r.status,b:b,ms:Date.now()-t0}})}).finally(function(){clearTimeout(tm)})}
  async function diag(){
    ov('<h3>🔎 Testando conexão…</h3><div class="l">Aguarde até 10 segundos.</div>');
    var L=[],H={apikey:SUPABASE_ANON_KEY,Authorization:'Bearer '+SUPABASE_ANON_KEY},base=SUPABASE_URL+'/rest/v1/app_dados';
    L.push((navigator.onLine?'✅':'❌')+' Internet do aparelho: '+(navigator.onLine?'ligada':'desligada ou modo offline (🌐/📴) ativo'));
    if(localStorage.getItem('v281_off')==='1')L.push('⚠️ Você está no MODO OFFLINE (botão 🌐 do topo). Nada sincroniza até voltar online.');
    L.push((window.supabase&&window.supabase.createClient?'✅':'❌')+' Biblioteca do Supabase carregada');
    try{
      var r=await req(base+'?id=eq.1&select=id',{headers:H});
      if(r.ok){var n=0;try{n=JSON.parse(r.b).length}catch(e){}
        L.push('✅ Leitura: servidor respondeu em '+r.ms+' ms'+(n?' (dados do roteiro encontrados)':' — mas a linha id=1 ainda não existe'))}
      else L.push('❌ Leitura recusada (código '+r.s+'): '+(r.s===401||r.s===403?'permissão (RLS) ou chave inválida':r.s===404?'tabela app_dados não existe':'erro')+'\n'+r.b.slice(0,160));
    }catch(e){L.push('❌ Leitura falhou: '+(e&&e.name==='AbortError'?'o servidor não respondeu em 10 s':'sem conexão ou bloqueio de rede'))}
    try{
      var w=await req(base,{method:'POST',headers:Object.assign({'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},H),body:JSON.stringify([{id:'ping',conteudo:{t:Date.now()}}])});
      if(w.ok)L.push('✅ Gravação: ok em '+w.ms+' ms (criou/atualizou a linha de teste "ping")');
      else L.push('❌ Gravação recusada (código '+w.s+'): '+(w.s===401||w.s===403?'a política (RLS) não permite gravar com a chave pública':'erro')+'\n'+w.b.slice(0,160));
    }catch(e){L.push('❌ Gravação falhou: '+(e&&e.name==='AbortError'?'o servidor não respondeu em 10 s':'sem conexão ou bloqueio de rede'))}
    if(localStorage.getItem('v275_dirty')==='1')L.push('🟡 Há alterações só neste aparelho aguardando envio.');
    ov('<h3>🔎 Conexão com o Supabase</h3>'+L.map(function(x){return '<div class="l">'+esc(x)+'</div>'}).join('')+'<div class="r"><button type="button" data-s="1">🔄 Sincronizar agora</button><button type="button" class="k" data-c="1">Fechar</button></div>');
  }
  function ligaDiag(){var s=$('v275-st');if(s&&!s.dataset.m287){s.dataset.m287=1;s.onclick=diag;s.title='Toque para testar a conexão com o Supabase'}}
  [300,1200,2500].forEach(function(ms){setTimeout(ligaDiag,ms)});
})();
}catch(e){console.error('[bloco com erro]',e)}
