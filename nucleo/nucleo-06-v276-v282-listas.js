try{
(function(){
  var $=function(i){return document.getElementById(i)};
  function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function idDe(c){var m=c.innerHTML.match(/(?:alternarBloqueio|removerDoRoteiro|apagarBloco)\('([^']+)'\)/);return m?m[1]:null}
  function item(id){var a=(typeof dadosApp!=='undefined'&&dadosApp.itinerario)||[];return a.filter(function(i){return String(i.id)===String(id)})[0]}
  function data(d){return d?d.split('-').reverse().join('/'):'?'}
  function locais(it){var s=[];function a(x){x=(x||'').trim();if(x&&s.indexOf(x)<0)s.push(x)}
    a(it.categoria);(it.trechos||[]).forEach(function(t){a(t.origem);a(t.destino)});
    var d=(typeof dadosApp!=='undefined')?dadosApp:{};[d.destinosCadastrados,d.origensCadastrados,d.destinosCadastradosLocais].forEach(function(l){(l||[]).forEach(a)});return s}
  function tags(it,rm){return (it.zonasLista||[]).map(function(z){return '<span class="v276-tg">'+esc(z.local)+' · '+esc(z.zona)+(rm?' <i data-r="'+esc(z.id)+'">✕</i>':'')+'</span>'}).join('')}
  function save(){try{salvarStorage()}catch(e){}}


  function opts(l){return l.map(function(x){return '<option value="'+esc(x)+'">'}).join('')}
  function inj(){
    var box=$('lista-blocos');if(!box)return;
    [].forEach.call(box.children,function(card){
      if(card.dataset.z276)return;var id=idDe(card);if(!id)return;
      var host=card.querySelector('[class*="bg-white/95"]');if(!host)return;
      card.dataset.z276=1;var u='v276'+Math.floor(Math.random()*1e9);
      var z=document.createElement('div');z.className='v276-z';
      z.innerHTML='<div class="r"><span class="i">🎫</span><input class="l" list="'+u+'l" placeholder="Lugar (digite ou escolha)"><input class="n" list="'+u+'n" placeholder="Zona"><button type="button" class="p" aria-label="Adicionar zona">＋</button></div><datalist id="'+u+'l"></datalist><datalist id="'+u+'n">'+opts(['Zona 1','Zona 2','Zona 3','Zona 4','Zona 5','Zona 6','Todas as zonas'])+'</datalist><div class="g"></div><input class="o" placeholder="Obs. das zonas (opcional)">';
      var L=z.querySelector('.l'),N=z.querySelector('.n'),G=z.querySelector('.g'),O=z.querySelector('.o'),DL=z.querySelector('datalist');
      function fill(){DL.innerHTML=opts(locais(item(id)||{}))}
      function show(){G.innerHTML=tags(item(id)||{},true)}
      var it0=item(id)||{};fill();show();O.value=it0.zonas||'';
      var ls=locais(it0);L.value=ls[0]||'';
      L.addEventListener('focus',function(){fill();L.dataset.p=L.value;L.value=''});
      L.addEventListener('blur',function(){if(!L.value)L.value=L.dataset.p||''});
      function add(){var it=item(id);if(!it)return;var zn=N.value.trim();if(!zn){N.focus();return}
        var lc=L.value.trim()||'Geral';if(!it.zonasLista)it.zonasLista=[];
        if(!it.zonasLista.some(function(x){return x.local===lc&&x.zona===zn}))
          it.zonasLista.push({id:'z'+Date.now()+Math.floor(Math.random()*999),local:lc,zona:zn});
        save();show();N.value=''}
      z.querySelector('.p').onclick=add;
      N.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();add()}});
      G.addEventListener('click',function(e){var r=e.target.closest('[data-r]');if(!r)return;var it=item(id);if(!it)return;
        it.zonasLista=(it.zonasLista||[]).filter(function(x){return x.id!==r.dataset.r});save();show()});
      O.addEventListener('input',function(){var it=item(id);if(it){it.zonas=O.value;save()}});
      host.insertBefore(z,host.firstChild);
    });
  }
  var injEdit=inj;


  function abrir(id){
    var it=item(id);if(!it)return;
    var h='<button class="x" type="button" aria-label="Fechar">✕</button><h3>'+esc(it.categoria||'Destino')+'</h3><div class="d">📅 '+data(it.dataInicio)+' ➔ '+data(it.dataFim)+'</div>';
    if((it.zonasLista||[]).length||(it.zonas||'').trim())h+='<div class="z">🎫 Zonas<br>'+tags(it)+((it.zonas||'').trim()?'<div class="ob">'+esc(it.zonas)+'</div>':'')+'</div>';
    (it.trechos||[]).forEach(function(tr){
      var P=percurso(it,tr);
      P.pts.forEach(function(pt,j){
        var lab=pt.k==='o'?'📍 Saída':pt.k==='d'?'🏁 Chegada':'🛑 Parada';
        h+='<div class="t" style="background:'+(pt.k==='p'?'#fef9c3':pt.k==='d'?'#dcfce7':'#eef2ff')+'"><b>'+(j+1)+'. '+lab+': '+esc(pt.nome||'—')+'</b>'+(pt.p&&pt.p.texto?'<div>'+esc(pt.p.texto)+'</div>':'');
        if(j>0)h+='<div><a href="'+esc(mapaUrl(origemMapa(P,j),pt.nome))+'" target="_blank" rel="noopener" style="color:#4338ca;font-weight:800">🗺️ Como chegar</a></div>';
        h+='</div>';
        if(j<P.legs.length)P.legs[j].forEach(function(x){var c=x.c;h+='<div class="t" style="margin-left:16px;border-left:3px dashed #a5b4fc"><div>🚌 '+esc(c.transporte)+(c.valor?' • '+esc(c.valor)+' '+esc(c.moeda):'')+(c.notas?'<br>📝 '+esc(c.notas):'')+'</div></div>'});
      });
    });
    var ns=(it.itens||[]).filter(function(n){return n.texto&&n.texto.trim()});
    if(ns.length){h+='<div class="t"><b>📌 Notas</b>';ns.forEach(function(n){h+='<div>• '+esc(n.texto)+'</div>'});h+='</div>'}
    var m=document.createElement('div');m.id='v276-m';m.innerHTML='<div>'+h+'</div>';
    m.addEventListener('click',function(e){if(e.target===m||e.target.closest('.x'))m.remove()});
    document.body.appendChild(m);
  }


  function injRead(){
    var box=$('lista-leitura-html');if(!box)return;
    [].forEach.call(box.children,function(card){
      if(card.dataset.z276)return;var id=idDe(card);if(!id)return;
      card.dataset.z276=1;var it=item(id)||{},ob=(it.zonas||'').trim(),tg=tags(it);
      var z=document.createElement('div');
      z.innerHTML=((tg||ob)?'<div class="v276-rz">'+tg+(ob?'<div class="ob">'+esc(ob)+'</div>':'')+'</div>':'')+'<button type="button" class="v276-btn">🔍 Ler em tela cheia</button>';
      z.addEventListener('click',function(e){if(e.target.closest('.v276-rz,.v276-btn'))abrir(id)});
      var inner=card.firstElementChild;if(!inner)return;
      inner.insertBefore(z,inner.children[1]||null);paradasLeitura(card,it);
    });
  }


  function anterior(it,tr,p){var l=(it.paradas||[]).filter(function(x){return String(x.apos)===String(tr.id)}),i=l.indexOf(p);
    if((p.de||'').trim())return p.de.trim();if(i>0&&l[i-1].local)return l[i-1].local;return tr.destino||tr.origem||''}
  window.v277Mapa=function(it,tr,p){return 'https://www.google.com/maps/dir/?api=1&origin='+encodeURIComponent(anterior(it,tr,p))+'&destination='+encodeURIComponent(p.local||'')+'&travelmode=transit'};
  function percurso(it,tr){
    var ps=(it.paradas||[]).filter(function(p){return String(p.apos)===String(tr.id)});
    var pts=[{k:'o',nome:tr.origem||'',p:null}];ps.forEach(function(p){pts.push({k:'p',nome:p.local||'',p:p})});pts.push({k:'d',nome:tr.destino||'',p:null});
    var n=pts.length-1,legs=[];for(var i=0;i<n;i++)legs.push([]);
    (tr.conducoes||[]).forEach(function(c,i){var k=c.perna?Math.min(Math.max(+c.perna-1,0),n-1):Math.min(i,n-1);legs[k].push({c:c,i:i})});
    return {pts:pts,legs:legs}}
  window.v277Percurso=percurso;
  function mapaUrl(o,d){return 'https://www.google.com/maps/dir/?api=1&origin='+encodeURIComponent(o||'')+'&destination='+encodeURIComponent(d||'')+'&travelmode=transit'}
  function origemMapa(P,j){var pt=P.pts[j];return (pt.p&&(pt.p.de||'').trim())||P.pts[j-1].nome}
  function paradasLeitura(card,it){
    var bl=[].filter.call(card.querySelectorAll('div.my-2'),function(d){return /📍 Rota/.test(d.textContent)});
    (it.trechos||[]).forEach(function(tr,k){var b=bl[k],holder=b&&b.children[1];if(!holder)return;
      var cn=[].slice.call(holder.children),P=percurso(it,tr),tl=document.createElement('div');tl.className='v277-tl';
      P.pts.forEach(function(pt,j){
        var lab=pt.k==='o'?'📍 Saída':pt.k==='d'?'🏁 Chegada':'🛑 Parada',d=document.createElement('div');d.className='v277-pt '+pt.k;
        var h='<div class="hd"><span class="nn">'+(j+1)+'</span><b>'+lab+': '+esc(pt.nome||'—')+'</b></div>';
        if(pt.p&&pt.p.texto)h+='<div class="tx">'+esc(pt.p.texto)+'</div>';
        if(j>0)h+='<a class="mp" href="'+esc(mapaUrl(origemMapa(P,j),pt.nome))+'" target="_blank" rel="noopener">🗺️ Como chegar (ônibus/trem)</a>';
        d.innerHTML=h;tl.appendChild(d);
        if(j<P.legs.length&&P.legs[j].length){var lg=document.createElement('div');lg.className='v277-lg';
          P.legs[j].forEach(function(x){if(cn[x.i])lg.appendChild(cn[x.i])});tl.appendChild(lg)}
      });
      holder.innerHTML='';holder.appendChild(tl)})}
  function paradasEdit(){
    var box=$('lista-blocos');if(!box)return;
    [].forEach.call(box.children,function(card){
      var id=idDe(card);if(!id)return;
      [].forEach.call(card.querySelectorAll('button[onclick^="removerTrecho("]'),function(btn){
        var tc=btn.closest('[class*="mb-3"]');if(!tc||tc.dataset.p277)return;tc.dataset.p277=1;
        var m=btn.getAttribute('onclick').match(/removerTrecho\('([^']+)',\s*'([^']+)'\)/);if(!m)return;var trId=m[2];
        var w=document.createElement('div');w.className='v277-pb';var u='v277'+Math.floor(Math.random()*1e9);
        function trc(){return ((item(id)||{}).trechos||[]).filter(function(t){return String(t.id)===String(trId)})[0]||{}}
        function lista(){return ((item(id)||{}).paradas||[]).filter(function(p){return String(p.apos)===String(trId)})}
        function ents(){var l=lista(),t=trc();[].forEach.call(w.querySelectorAll('.ent'),function(e,i){
          var a=i===0?t.origem:l[i-1].local,b=i===l.length-1?t.destino:l[i+1].local;
          e.innerHTML='↔ Fica entre <b>'+esc(a||'origem')+'</b> e <b>'+esc(b||'destino')+'</b> · posição '+(i+1)+' de '+l.length})}
        function draw(){
          w.innerHTML='<datalist id="'+u+'">'+opts(locais(item(id)||{}))+'</datalist>'+lista().map(function(p){
            return '<div class="v277-p" data-id="'+esc(p.id)+'"><div class="r"><span>🛑</span><input class="l" list="'+u+'" placeholder="Parada (ex.: Zurich HB)" value="'+esc(p.local)+'"><button type="button" class="mv" data-d="-1" aria-label="Subir">⬆</button><button type="button" class="mv" data-d="1" aria-label="Descer">⬇</button><button type="button" class="x" aria-label="Apagar parada">✕</button></div><div class="ent"></div><input class="d" placeholder="Partindo de… (opcional; se vazio, sai do ponto anterior)" value="'+esc(p.de)+'"><textarea placeholder="O que fazer aqui (ex.: deixar a mala; pegar o ônibus 31)">'+esc(p.texto)+'</textarea></div>'}).join('')+
            '<button type="button" class="v277-add">➕ Parada entre a origem e o destino desta rota</button>';ents()}
        draw();
        function achar(e){var r=e.target.closest('.v277-p'),it=item(id);return r&&it?(it.paradas||[]).filter(function(p){return p.id===r.dataset.id})[0]:null}
        w.addEventListener('input',function(e){var p=achar(e);if(!p)return;var t=e.target;
          if(t.classList.contains('l'))p.local=t.value;else if(t.classList.contains('d'))p.de=t.value;else p.texto=t.value;save();ents()});
        w.addEventListener('click',function(e){var it=item(id);if(!it)return;
          if(e.target.closest('.v277-add')){if(!it.paradas)it.paradas=[];
            it.paradas.push({id:'p'+Date.now()+Math.floor(Math.random()*999),apos:trId,local:'',de:'',texto:''});save();draw();
            var ls=w.querySelectorAll('.v277-p .l');if(ls.length)ls[ls.length-1].focus();return}
          var p=achar(e);if(!p)return;
          if(e.target.closest('.x')){it.paradas=it.paradas.filter(function(q){return q!==p});save();draw();return}
          var mv=e.target.closest('.mv');if(mv){var l=lista(),i=l.indexOf(p),j=i+(+mv.dataset.d);if(j<0||j>=l.length)return;
            var a=it.paradas.indexOf(l[i]),b=it.paradas.indexOf(l[j]),t=it.paradas[a];it.paradas[a]=it.paradas[b];it.paradas[b]=t;save();draw()}});
        tc.insertAdjacentElement('afterend',w);
      });
    });
  }
  function pernas(){
    var box=$('lista-blocos');if(!box)return;
    [].forEach.call(box.querySelectorAll('select[onchange*="\'transporte\'"]'),function(sel){
      if(sel.dataset.pn)return;var m=sel.getAttribute('onchange').match(/^atualizarConducaoItem\('([^']+)',\s*'([^']+)',\s*'([^']+)'/);if(!m)return;sel.dataset.pn=1;
      function cond(){var it=item(m[1]),tr=it&&(it.trechos||[]).filter(function(t){return String(t.id)===String(m[2])})[0];return tr&&(tr.conducoes||[]).filter(function(c){return String(c.id)===String(m[3])})[0]}
      var c0=cond(),pn=document.createElement('select');pn.className='v277-pn';pn.title='Em qual trecho do percurso esta condução é usada';
      pn.innerHTML='<option value="">Trecho: auto</option>'+[1,2,3,4,5].map(function(n){return '<option value="'+n+'">Trecho '+n+'</option>'}).join('');
      pn.value=c0&&c0.perna?String(c0.perna):'';
      pn.addEventListener('change',function(){var c=cond();if(!c)return;if(pn.value)c.perna=+pn.value;else delete c.perna;save()});
      sel.insertAdjacentElement('afterend',pn)})}
  [['lista-blocos',injEdit],['lista-blocos',paradasEdit],['lista-blocos',pernas],['lista-leitura-html',injRead]].forEach(function(p){
    var b=$(p[0]);if(!b)return;new MutationObserver(function(){setTimeout(p[1],0)}).observe(b,{childList:true});p[1]();
  });
})();
}catch(e){console.error('[bloco com erro]',e)}

try{
(function(){
  var $=function(i){return document.getElementById(i)};
  function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function item(id){return (dadosApp.itinerario||[]).filter(function(i){return String(i.id)===String(id)})[0]}
  function sv(){try{salvarStorage()}catch(e){}}
  function T(m,t){if(window.mostrarToast)mostrarToast(m,t||'sucesso')}
  function undo(){try{registarEstadoAnterior()}catch(e){}}


  /* LIGAR: lê o número digitado na hora do toque */
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[title="Ligar"]');if(!a)return;
    e.preventDefault();e.stopPropagation();
    var inp=a.parentElement&&a.parentElement.querySelector('input[placeholder="Número..."]');
    var n=((inp&&inp.value)||'').replace(/[^\d+*#]/g,'');
    if(!n){T('Digite o número primeiro.','info');return}
    location.href='tel:'+n;
  },true);


  /* DIÁLOGOS PRÓPRIOS (no lugar de prompt/confirm, que alguns celulares bloqueiam) */
  function dlg(titulo,msg,campos,ok){
    var m=document.createElement('div');m.id='v276-d';
    var h='<div class="b"><h3>'+esc(titulo)+'</h3>'+(msg?'<p>'+esc(msg)+'</p>':'');
    campos.forEach(function(c){h+='<label>'+esc(c.l)+'</label><input type="'+(c.t||'text')+'" value="'+esc(c.v||'')+'">'});
    h+='<div class="bt"><button type="button" class="c">Cancelar</button><button type="button" class="k">OK</button></div></div>';
    m.innerHTML=h;document.body.appendChild(m);
    var f=m.querySelector('input');if(f&&f.type==='text')setTimeout(function(){f.focus()},60);
    m.addEventListener('click',function(e){
      if(e.target===m||e.target.closest('.c')){m.remove();return}
      if(e.target.closest('.k')){var v=[].map.call(m.querySelectorAll('input'),function(x){return x.value.trim()});m.remove();ok(v)}});
  }
  window.adicionarNovoDestinoFiltro=function(){
    dlg('Novo destino','',[{l:'Nome do destino'},{l:'Cor',t:'color',v:'#ec4899'}],function(v){
      var n=v[0];if(!n)return;undo();
      if(dadosApp.destinosCadastrados.indexOf(n)<0)dadosApp.destinosCadastrados.push(n);
      if(!dadosApp.coresDestinos)dadosApp.coresDestinos={};dadosApp.coresDestinos[n]=v[1]||'#ec4899';
      var t=Date.now();
      dadosApp.itinerario.unshift({id:t,categoria:n,dataInicio:'',dataFim:'',cor:dadosApp.coresDestinos[n],bloqueado:false,concluido:false,trechos:[{id:t+1,origem:'',destino:'',concluido:false,conducoes:[{id:t+11,transporte:'Trem',valor:0,moeda:'EUR',notas:'',fotosExtras:[]},{id:t+12,transporte:'Ônibus',valor:0,moeda:'EUR',notas:'',fotosExtras:[]}]}],itens:[]});
      sv();atualizarTudo();filtrarDestino(n);T('Destino '+n+' adicionado!');
    });
  };
  window.apagarBloco=function(id){
    dlg('Excluir este bloco?','Depois você pode usar “Voltar” para desfazer.',[],function(){
      undo();dadosApp.itinerario=dadosApp.itinerario.filter(function(i){return String(i.id)!==String(id)});sv();atualizarTudo();T('Bloco excluído.','info')});
  };
  window.alterarSenhaPin=function(){
    dlg('Alterar senha','',[{l:'Senha atual',t:'password'},{l:'Nova senha',t:'password'}],function(v){
      var p=localStorage.getItem('app_pin_v269')||'1510';
      if(v[0]!==p){T('Senha atual incorreta.','erro');return}
      if(!v[1])return;localStorage.setItem('app_pin_v269',v[1]);T('Senha alterada!')});
  };


  var CFG={cat:['destinosCadastrados','Destinos'],org:['origensCadastrados','Origens'],loc:['destinosCadastradosLocais','Destinos das rotas']};
  function troca(kind,a,b){
    (dadosApp.itinerario||[]).forEach(function(bl){
      if(kind==='cat'){if(b&&bl.categoria===a)bl.categoria=b}
      else (bl.trechos||[]).forEach(function(t){var f=kind==='org'?'origem':'destino';if(t[f]===a)t[f]=b})});
    if(kind==='cat'){var c=dadosApp.coresDestinos||{};if(b&&c[a])c[b]=c[a];delete c[a];
      if(typeof destinoFiltro!=='undefined'&&destinoFiltro===a)destinoFiltro=b||'todos'}
  }
  function gerir(kind){
    var k=CFG[kind][0],m=document.createElement('div');m.id='v276-d';
    function draw(){var l=dadosApp[k]||[];
      m.innerHTML='<div class="b"><h3>Gerir: '+CFG[kind][1]+'</h3>'+(l.length?l.map(function(x,i){return '<div class="gr"><input data-i="'+i+'" value="'+esc(x)+'"><button type="button" data-s="'+i+'" aria-label="Salvar nome">💾</button><button type="button" data-x="'+i+'" aria-label="Apagar">🗑</button></div>'}).join(''):'<p>Nada cadastrado ainda.</p>')+'<div class="bt"><button type="button" class="c">Fechar</button></div></div>'}
    draw();document.body.appendChild(m);
    m.addEventListener('click',function(e){
      if(e.target===m||e.target.closest('.c')){m.remove();return}
      var s=e.target.closest('[data-s]'),x=e.target.closest('[data-x]'),l=dadosApp[k];
      if(s){var i=+s.dataset.s,nv=m.querySelector('input[data-i="'+i+'"]').value.trim(),old=l[i];if(!nv||nv===old)return;undo();l[i]=nv;troca(kind,old,nv);sv();atualizarTudo();draw();T('Renomeado!')}
      if(x){var j=+x.dataset.x,o=l[j];undo();l.splice(j,1);troca(kind,o,'');sv();atualizarTudo();draw();T('Apagado.','info')}});
  }
  window.gerenciarDestinos=function(){gerir('cat')};
  window.gerenciarOrigens=function(){gerir('org')};
  window.gerenciarDestinosLocais=function(){gerir('loc')};


  /* CAMPOS DIGITÁVEIS + ESCOLHER: destino do quadrado, origem e destino das rotas */
  function grava(kind,a,b,v){
    var d=dadosApp,it=item(a);if(!it)return;undo();
    if(kind==='cat'){if(!v)return;if(d.destinosCadastrados.indexOf(v)<0)d.destinosCadastrados.push(v);it.categoria=v;it.cor=obterCorPorCategoria(v)}
    else{var tr=(it.trechos||[]).filter(function(t){return String(t.id)===String(b)})[0];if(!tr)return;
      tr[kind==='org'?'origem':'destino']=v;var key=kind==='org'?'origensCadastrados':'destinosCadastradosLocais';
      if(v){if(!d[key])d[key]=[];if(d[key].indexOf(v)<0)d[key].push(v)}}
    sv();atualizarTudo();
  }
  function combos(){
    var box=$('lista-blocos');if(!box)return;
    [].forEach.call(box.querySelectorAll('select[onchange]'),function(s){
      var oc=s.getAttribute('onchange'),m,kind,a,b,d=dadosApp;
      if(m=oc.match(/^lidarSelecaoDestino\('([^']+)'/)){kind='cat';a=m[1]}
      else if(m=oc.match(/^lidarSelecaoOrigemTrecho\('([^']+)',\s*'([^']+)'/)){kind='org';a=m[1];b=m[2]}
      else if(m=oc.match(/^lidarSelecaoDestinoTrecho\('([^']+)',\s*'([^']+)'/)){kind='dst';a=m[1];b=m[2]}
      else return;
      var list=(kind==='cat'?d.destinosCadastrados:kind==='org'?d.origensCadastrados:d.destinosCadastradosLocais)||[];
      var u='v276c'+Math.floor(Math.random()*1e9),i=document.createElement('input'),dl=document.createElement('datalist');
      i.type='text';i.className=s.className;i.setAttribute('list',u);i.value=s.value||'';
      i.placeholder=kind==='org'?'Origem (digite ou escolha)':kind==='dst'?'Destino (digite ou escolha)':'Destino…';
      dl.id=u;dl.innerHTML=list.map(function(x){return '<option value="'+esc(x)+'">'}).join('');
      i.addEventListener('focus',function(){i.dataset.p=i.value;i.value=''});
      i.addEventListener('blur',function(){if(!i.value)i.value=i.dataset.p||''});
      i.addEventListener('change',function(){grava(kind,a,b,i.value.trim())});
      s.parentNode.insertBefore(dl,s);s.parentNode.replaceChild(i,s);
    });
  }


  window.compartilharRoteiroWhatsApp=function(){
    var bl=(dadosApp.itinerario||[]).filter(function(i){return i.bloqueado===true});
    if(!bl.length){T('Nenhum bloco aprovado para compartilhar.','info');return}
    function f(d){return d?d.split('-').reverse().join('/'):'?'}
    var t='🚄 *Roteiro Oficial de Viagem - Mariana* ✈️\n\n';
    bl.forEach(function(b){
      t+='📍 *'+(b.categoria||'Destino')+'* ('+f(b.dataInicio)+' a '+f(b.dataFim)+')\n';
      if((b.zonasLista||[]).length)t+='  🎫 '+b.zonasLista.map(function(z){return z.local+' · '+z.zona}).join(', ')+'\n';
      if((b.zonas||'').trim())t+='  🎫 '+b.zonas.trim()+'\n';
      (b.trechos||[]).forEach(function(tr){
        var P=window.v277Percurso(b,tr);
        P.pts.forEach(function(pt,j){t+='  '+(j+1)+'. '+(pt.k==='o'?'📍 Saída':pt.k==='d'?'🏁 Chegada':'🛑 Parada')+': '+(pt.nome||'?')+(pt.p&&pt.p.texto?' — '+pt.p.texto:'')+'\n';
          if(j<P.legs.length)P.legs[j].forEach(function(x){t+='      - '+x.c.transporte+' ('+x.c.valor+' '+x.c.moeda+')'+(x.c.notas?' ['+x.c.notas+']':'')+'\n'})});
      });t+='\n'});
    if(navigator.share){navigator.share({title:'Roteiro Europa Mariana',text:t}).catch(function(){})}
    else window.open('https://api.whatsapp.com/send?text='+encodeURIComponent(t),'_blank');
  };
  var lb=$('lista-blocos');
  if(lb){new MutationObserver(function(){setTimeout(combos,0)}).observe(lb,{childList:true});combos()}
})();
}catch(e){console.error('[bloco com erro]',e)}
