try{
(function(){
  var $=function(i){return document.getElementById(i)};
  function item(id){return (dadosApp.itinerario||[]).filter(function(i){return String(i.id)===String(id)})[0]}
  function trecho(it,id){return it&&(it.trechos||[]).filter(function(t){return String(t.id)===String(id)})[0]}
  function T(m,t){if(window.mostrarToast)mostrarToast(m,t||'info')}
  function aplicar(){try{salvarStorage()}catch(e){}try{atualizarTudo()}catch(e){}}
  function undo(){try{registarEstadoAnterior()}catch(e){}}
  function troca(arr,a,b){var t=arr[a];arr[a]=arr[b];arr[b]=t}


  /* sobe/desce uma condução: primeiro dentro do mesmo trecho; no limite, passa para o trecho vizinho */
  function moveCond(itId,trId,cId,d){
    var it=item(itId),tr=trecho(it,trId);if(!tr)return;
    var P=window.v277Percurso?window.v277Percurso(it,tr):null;if(!P)return;
    var k=-1,pos=-1,c=null;
    P.legs.forEach(function(l,i){l.forEach(function(x,j){if(String(x.c.id)===String(cId)){k=i;pos=j;c=x.c}})});
    if(!c)return;
    var leg=P.legs[k],n=P.legs.length;undo();
    if(d<0){
      if(pos>0)troca(tr.conducoes,leg[pos].i,leg[pos-1].i);
      else if(k>0)c.perna=k;
      else{T('Já é o primeiro do percurso.');return}
    }else{
      if(pos<leg.length-1)troca(tr.conducoes,leg[pos].i,leg[pos+1].i);
      else if(k<n-1)c.perna=k+2;
      else{T('Já é o último do percurso. Crie uma parada para ter mais trechos.');return}
    }
    aplicar();
  }
  /* sobe/desce a rota inteira (as paradas vão junto) */
  function moveTrecho(itId,trId,d){
    var it=item(itId);if(!it||!it.trechos)return;
    var i=it.trechos.findIndex(function(t){return String(t.id)===String(trId)}),j=i+d;
    if(i<0||j<0||j>=it.trechos.length){T(d<0?'Já é a primeira rota.':'Já é a última rota.');return}
    undo();troca(it.trechos,i,j);aplicar();
  }


  function setas(){
    var box=$('lista-blocos');if(!box)return;
    /* conduções */
    [].forEach.call(box.querySelectorAll('select[onchange*="\'transporte\'"]'),function(sel){
      var row=sel.parentElement;if(!row||row.dataset.m278)return;
      var m=sel.getAttribute('onchange').match(/atualizarConducaoItem\('([^']+)',\s*'([^']+)',\s*'([^']+)'/);if(!m)return;
      row.dataset.m278=1;
      var w=document.createElement('span');w.className='v278-mv';
      w.innerHTML='<button type="button" data-d="-1" aria-label="Subir condução">⬆️</button><button type="button" data-d="1" aria-label="Descer condução">⬇️</button>';
      w.addEventListener('click',function(e){var b=e.target.closest('button');if(b)moveCond(m[1],m[2],m[3],+b.dataset.d)});
      row.insertBefore(w,row.firstChild);
    });
    /* rotas */
    [].forEach.call(box.querySelectorAll('button[onclick^="removerTrecho("]'),function(btn){
      var row=btn.parentElement;if(!row||row.dataset.m278)return;
      var m=btn.getAttribute('onclick').match(/removerTrecho\('([^']+)',\s*'([^']+)'/);if(!m)return;
      row.dataset.m278=1;
      var w=document.createElement('span');w.className='v278-mv';
      w.innerHTML='<button type="button" class="v278-tr" data-d="-1" aria-label="Subir rota">⬆️</button><button type="button" class="v278-tr" data-d="1" aria-label="Descer rota">⬇️</button>';
      w.addEventListener('click',function(e){var b=e.target.closest('button');if(b)moveTrecho(m[1],m[2],+b.dataset.d)});
      row.insertBefore(w,btn);
    });
  }
  var lb=$('lista-blocos');
  if(lb){new MutationObserver(function(){setTimeout(setas,0)}).observe(lb,{childList:true});setas()}
})();
}catch(e){console.error('[bloco com erro]',e)}

try{
(function(){
  var $=function(i){return document.getElementById(i)};
  var SK='v279_s',S={open:{},shut:{}};
  try{var x=JSON.parse(localStorage.getItem(SK));if(x){S.open=x.open||{};S.shut=x.shut||{}}}catch(e){}
  function sv(){try{localStorage.setItem(SK,JSON.stringify(S))}catch(e){}}
  function T(m,t){if(window.mostrarToast)mostrarToast(m,t||'info')}
  var dbp=null;
  function dbo(){if(dbp)return dbp;dbp=new Promise(function(res,rej){var r=indexedDB.open('v281_maps',1);r.onupgradeneeded=function(){r.result.createObjectStore('img')};r.onsuccess=function(){res(r.result)};r.onerror=function(){rej(r.error)}});return dbp}
  function idb(mode,fn){return dbo().then(function(d){return new Promise(function(res,rej){var t=d.transaction('img',mode),q=fn(t.objectStore('img'));t.oncomplete=function(){res(q&&q.result)};t.onerror=function(){rej(t.error)}})})}
  function mapaOff(el,pk){
    var ms=document.createElement('div');ms.className='v279-mo';
    ms.innerHTML='<div class="t">🖼️ Mapa offline <small>(fica só neste aparelho)</small></div><div class="b"><button type="button" data-a="p">📋 Colar imagem</button><label class="f">📁 Escolher<input type="file" accept="image/*" hidden></label></div><div class="pz" contenteditable="true" hidden>Segure aqui e toque em Colar</div><div class="im"></div>';
    var pz=ms.querySelector('.pz'),im=ms.querySelector('.im');
    function salvar(b){if(!b)return;
      var f=(typeof comprimirImagem==='function')?comprimirImagem(b,1200,0.7):Promise.resolve(null);
      f.then(function(u){if(!u)throw 0;return idb('readwrite',function(s){return s.put(u,pk)})}).then(function(){T('Mapa salvo neste aparelho!','sucesso');ms.refresh()}).catch(function(){T('Não consegui salvar a imagem.','erro')})}
    ms.refresh=function(){idb('readonly',function(s){return s.get(pk)}).then(function(u){
      ms.has=!!u;
      im.innerHTML=u?'<img alt="Mapa"><div class="ac"><a class="dl" download="mapa.jpg">📥 Baixar</a><button type="button" data-a="x">🗑 Remover</button></div>':'';
      if(u){var g=im.querySelector('img');g.src=u;g.onclick=function(){if(window.abrirLeitorArquivo)abrirLeitorArquivo(u,'Mapa')};im.querySelector('a').href=u}
      if(ms.ic)ms.ic.textContent=ms.base+(u?'🖼️':'')}).catch(function(){})};
    ms.addEventListener('click',function(e){
      var b=e.target.closest('button');if(!b)return;
      if(b.dataset.a==='x'){idb('readwrite',function(s){return s.delete(pk)}).then(function(){ms.refresh()});return}
      if(b.dataset.a==='p'){
        if(!navigator.clipboard||!navigator.clipboard.read){pz.hidden=false;T('Cole na caixa que apareceu.','info');return}
        navigator.clipboard.read().then(function(items){
          for(var i=0;i<items.length;i++){var t=items[i].types.filter(function(x){return x.indexOf('image/')===0})[0];if(t){items[i].getType(t).then(salvar);return}}
          T('Não há imagem copiada.','info')}).catch(function(){pz.hidden=false;T('Cole na caixa que apareceu.','info')})}});
    ms.querySelector('input').addEventListener('change',function(e){salvar(e.target.files[0]);e.target.value=''});
    ms.addEventListener('paste',function(e){var its=(e.clipboardData&&e.clipboardData.items)||[];
      for(var i=0;i<its.length;i++){if(its[i].type.indexOf('image/')===0){e.preventDefault();salvar(its[i].getAsFile());pz.hidden=true;return}}});
    el.appendChild(ms);return ms}


  function item(id){return (dadosApp.itinerario||[]).filter(function(i){return String(i.id)===String(id)})[0]}
  function idDe(c){var m=c.innerHTML.match(/(?:alternarBloqueio|removerDoRoteiro|apagarBloco)\('([^']+)'\)/);return m?m[1]:null}
  function sink(parent,els,isDone){
    var a=els.filter(function(e){return !isDone(e)}),b=els.filter(isDone);
    a.concat(b).forEach(function(e){parent.appendChild(e)});
  }
  function totais(it){
    var n=0,t=0;
    (it.trechos||[]).forEach(function(tr){
      var P=window.v277Percurso?window.v277Percurso(it,tr):null;if(!P)return;
      P.pts.forEach(function(pt){t++;var k=tr.id+'|'+(pt.k==='p'&&pt.p?pt.p.id:pt.k);if(it.pontosFeitos&&it.pontosFeitos[k])n++});
      (tr.conducoes||[]).forEach(function(c){t++;if(c.concluido)n++});
    });
    return [n,t];
  }
  function compactar(){
    var box=$('lista-leitura-html');if(!box)return;
    [].forEach.call(box.children,function(card){
      var id=idDe(card),it=id&&item(id);if(!it)return;
      var kp=null;
      function progBloco(){if(!kp)return;var r=totais(it);kp.textContent=r[0]+'/'+r[1]+' ✓'}
      /* bloco inteiro recolhivel */
      if(!card.dataset.m279c){
        var inner=card.firstElementChild,head=inner&&inner.firstElementChild,left=head&&head.firstElementChild;
        if(head&&left){
          card.dataset.m279c=1;head.classList.add('v279-kh');
          var cvk=document.createElement('span');cvk.className='v279-cv';
          kp=document.createElement('span');kp.className='v279-kp';
          left.appendChild(kp);left.insertBefore(cvk,left.firstChild);
          var kk='k|'+id;
          if(S.shut[kk])card.classList.add('v279-cc');
          cvk.textContent=S.shut[kk]?'▸':'▾';
          head.addEventListener('click',function(e){
            if(e.target.closest('button'))return;
            var c=card.classList.toggle('v279-cc');if(c)S.shut[kk]=1;else delete S.shut[kk];cvk.textContent=c?'▸':'▾';sv()});
          progBloco();
        }
      }else{kp=card.querySelector('.v279-kp')}
      [].forEach.call(card.querySelectorAll('.v277-tl'),function(tl,k){
        if(tl.dataset.m279)return;
        var tr=(it.trechos||[])[k];if(!tr||!window.v277Percurso)return;
        var P=window.v277Percurso(it,tr);if(!P)return;
        tl.dataset.m279=1;
        function kf(jj){var pt=P.pts[jj];return tr.id+'|'+(pt.k==='p'&&pt.p?pt.p.id:pt.k)}
        function done(key){return !!(it.pontosFeitos&&it.pontosFeitos[key])}
        var route=tl.closest('.my-2'),hdr=route&&route.firstElementChild,rp=null,rcv=null,rk=id+'|'+tr.id;
        function prog(){
          if(rp){var n=0,t=P.pts.length+(tr.conducoes||[]).length;
            P.pts.forEach(function(p,jj){if(done(kf(jj)))n++});
            (tr.conducoes||[]).forEach(function(c){if(c.concluido)n++});
            rp.textContent=n+'/'+t+' ✓'}
          progBloco();
        }
        if(hdr){
          hdr.classList.add('v279-rh');
          var l=document.createElement('span');l.innerHTML=hdr.innerHTML;hdr.innerHTML='';hdr.appendChild(l);
          var r=document.createElement('span');r.style.cssText='display:flex;gap:6px;align-items:center;flex:none';
          rp=document.createElement('span');rp.className='v279-rp';rcv=document.createElement('span');rcv.className='v279-cv';
          r.appendChild(rp);r.appendChild(rcv);hdr.appendChild(r);
          if(S.shut[rk])route.classList.add('v279-rc');
          rcv.textContent=S.shut[rk]?'▸':'▾';
          hdr.addEventListener('click',function(){var c=route.classList.toggle('v279-rc');if(c)S.shut[rk]=1;else delete S.shut[rk];rcv.textContent=c?'▸':'▾';sv()});
        }
        var units=[],j=-1;
        [].slice.call(tl.children).forEach(function(el){
          if(el.classList.contains('v277-pt')){j++;units.push({els:[el],key:kf(j)});ponto(el,j)}
          else if(el.classList.contains('v277-lg')&&units.length){units[units.length-1].els.push(el);perna(el)}
        });
        function reordenar(){
          var a=units.filter(function(u){return !done(u.key)}),b=units.filter(function(u){return done(u.key)});
          a.concat(b).forEach(function(u){u.els.forEach(function(e){tl.appendChild(e)})});
        }
        function ponto(el,jj){
          var hd=el.querySelector('.hd');if(!hd)return;
          var key=kf(jj),pk='p|'+id+'|'+key,cv=null,ms=mapaOff(el,pk),body=el.querySelector('.tx,.mp,.v279-mo');
          var cb=document.createElement('input');cb.type='checkbox';cb.className='v279-cb';cb.checked=done(key);cb.setAttribute('aria-label','Marcar como concluído');
          hd.insertBefore(cb,hd.firstChild);
          if(body){
            var ic=document.createElement('span');ic.className='v279-ic';ms.base=(el.querySelector('.tx')?'📝':'')+(el.querySelector('.mp')?'🗺️':'');ic.textContent=ms.base;ms.ic=ic;
            cv=document.createElement('span');cv.className='v279-cv';hd.appendChild(ic);hd.appendChild(cv);
          }
          ms.refresh();
          if(done(key))el.classList.add('v279-d');
          else if(S.open[pk])el.classList.add('v279-o');
          if(cv)cv.textContent=el.classList.contains('v279-o')?'▾':'▸';
          hd.addEventListener('click',function(e){
            if(e.target===cb||!body)return;
            var o=el.classList.toggle('v279-o');if(o)S.open[pk]=1;else delete S.open[pk];cv.textContent=o?'▾':'▸';sv()});
          cb.addEventListener('change',function(){
            if(!it.pontosFeitos)it.pontosFeitos={};
            if(cb.checked){it.pontosFeitos[key]=true;el.classList.remove('v279-o');delete S.open[pk];sv();if(cv)cv.textContent='▸'}
            else delete it.pontosFeitos[key];
            el.classList.toggle('v279-d',cb.checked);prog();reordenar();
            try{salvarStorage()}catch(x){}
          });
        }
        /* cada conducao vira uma caixinha propria, igual as paradas */
        function perna(el){
          var cards=[].slice.call(el.children);
          cards.forEach(function(cd){
            var cb=cd.querySelector('input[type=checkbox]');if(!cb)return;
            var m=(cb.getAttribute('onchange')||'').match(/alternarConcluidoConducao\('([^']+)',\s*'([^']+)',\s*'([^']+)'/);
            var ck='c|'+(m?m[1]+'|'+m[2]+'|'+m[3]:Math.random());
            cd.classList.add('v279-cd');if(cb.checked)cd.classList.add('v279-cdd');
            cb.classList.add('v279-cb');
            var info=cb.nextElementSibling,row=cb.parentElement,has=false;
            if(info)[].slice.call(info.children).forEach(function(c,i){if(i>0){c.classList.add('v279-bd');has=true}});
            if(has){
              var cv=document.createElement('span');cv.className='v279-cv';
              var ic=document.createElement('span');ic.className='v279-ic';ic.textContent='📝';
              row.appendChild(ic);row.appendChild(cv);
              if(S.open[ck]&&!cb.checked)cd.classList.add('v279-o');
              cv.textContent=cd.classList.contains('v279-o')?'▾':'▸';
              cd.addEventListener('click',function(e){
                if(e.target.closest('input,img,a,button'))return;
                var o=cd.classList.toggle('v279-o');if(o)S.open[ck]=1;else delete S.open[ck];cv.textContent=o?'▾':'▸';sv()});
            }
          });
          sink(el,cards,function(c){var i=c.querySelector('input[type=checkbox]');return i&&i.checked});
        }
        prog();reordenar();
      });
    });
  }
  var box=$('lista-leitura-html');
  if(box){new MutationObserver(function(){setTimeout(compactar,60)}).observe(box,{childList:true});setTimeout(compactar,300);setTimeout(compactar,1200)}
})();
}catch(e){console.error('[bloco com erro]',e)}

try{
(function(){
  var $=function(i){return document.getElementById(i)};
  function T(m,t){if(window.mostrarToast)mostrarToast(m,t||'info')}
  /* ---------- EDITAR: setinha para recolher cada bloco ---------- */
  var EK='v281_e',E={};
  try{E=JSON.parse(localStorage.getItem(EK))||{}}catch(e){}
  function se(){try{localStorage.setItem(EK,JSON.stringify(E))}catch(e){}}
  function idDe(c){var m=c.innerHTML.match(/(?:alternarBloqueio|apagarBloco)\('([^']+)'\)/);return m?m[1]:null}
  function aplica(card,id,shut,btn){card.classList.toggle('v281-ec',shut);if(btn)btn.textContent=shut?'▸':'▾'}
  function editar(){
    var box=$('lista-blocos');if(!box)return;
    [].forEach.call(box.children,function(card){
      if(card.dataset.m281e)return;var id=idDe(card);if(!id)return;
      var head=card.firstElementChild,row=head&&head.firstElementChild,left=row&&row.firstElementChild;if(!left)return;
      card.dataset.m281e=1;
      var b=document.createElement('button');b.type='button';b.className='v281-cvb';b.setAttribute('aria-label','Recolher ou abrir bloco');
      left.insertBefore(b,left.firstChild);
      aplica(card,id,!!E[id],b);
      b.addEventListener('click',function(){var s=!card.classList.contains('v281-ec');if(s)E[id]=1;else delete E[id];se();aplica(card,id,s,b)});
    });
    if(!$('v281-bulk')){
      var bar=document.createElement('div');bar.id='v281-bulk';bar.className='v281-bulk';
      bar.innerHTML='<button type="button" data-s="1">⏫ Recolher todos</button><button type="button" data-s="0">⏬ Abrir todos</button>';
      bar.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var s=b.dataset.s==='1';
        [].forEach.call(box.children,function(card){var id=idDe(card);if(!id)return;if(s)E[id]=1;else delete E[id];aplica(card,id,s,card.querySelector('.v281-cvb'))});se()});
      box.parentNode.insertBefore(bar,box);
    }
  }
  var lb=$('lista-blocos');
  if(lb){new MutationObserver(function(){setTimeout(editar,0)}).observe(lb,{childList:true});editar()}


  /* ---------- MODO OFFLINE manual ---------- */
  var OK='v281_off',off=localStorage.getItem(OK)==='1';
  var desc=Object.getOwnPropertyDescriptor(Navigator.prototype,'onLine');
  try{Object.defineProperty(navigator,'onLine',{configurable:true,get:function(){return !off&&(desc?desc.get.call(navigator):true)}})}catch(e){}
  try{
    var prev=supabaseClient.from.bind(supabaseClient);
    supabaseClient.from=function(t){
      if(t==='app_dados'&&off)return {select:function(){return {eq:function(){return {single:function(){return Promise.resolve({data:null,error:{message:'offline'}})}}}}},upsert:function(){return Promise.resolve({error:null})}};
      return prev(t)};
  }catch(e){}
  var chip=document.createElement('button');chip.id='v281-off';chip.type='button';chip.innerHTML='<span>🌐</span>';var barra=$('v271-bar');if(barra)barra.appendChild(chip);else{chip.style.cssText='position:fixed;top:8px;right:8px;z-index:70';document.body.appendChild(chip)}
  function pinta(){chip.firstChild.textContent=off?'📴':'🌐';chip.classList.toggle('x',off);chip.title=off?'Offline (toque para voltar online)':'Online (toque para trabalhar offline)';chip.setAttribute('aria-label',chip.title)}
  pinta();
  chip.addEventListener('click',function(){
    off=!off;try{localStorage.setItem(OK,off?'1':'0')}catch(e){}
    pinta();window.dispatchEvent(new Event(off?'offline':'online'));
    T(off?'Modo offline: tudo fica salvo só neste aparelho.':'De volta online: sincronizando...',off?'info':'sucesso');
  });
  if(off)setTimeout(function(){window.dispatchEvent(new Event('offline'))},600);
})();
}catch(e){console.error('[bloco com erro]',e)}

try{
(function(){
  var $=function(i){return document.getElementById(i)};
  var K='v282_s',S={open:{},shut:{}};
  try{var x=JSON.parse(localStorage.getItem(K));if(x){S.open=x.open||{};S.shut=x.shut||{}}}catch(e){}
  function sv(){try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}}
  function chev(){var b=document.createElement('button');b.type='button';b.className='v281-cvb';b.setAttribute('aria-label','Fechar ou abrir');return b}
  function barra(id,fn){
    var bar=document.createElement('div');bar.id=id;bar.className='v281-bulk';bar.style.margin='0 0 8px';
    bar.innerHTML='<button type="button" data-s="1">⏫ Fechar tudo</button><button type="button" data-s="0">⏬ Abrir tudo</button>';
    bar.addEventListener('click',function(e){var b=e.target.closest('button');if(b)fn(b.dataset.s==='1')});return bar}


  /* ---------- HUB: cada caixa fecha ---------- */
  function hub(){
    var g=$('hub-utilidades-grid');if(!g)return;
    [].forEach.call(g.children,function(card){
      if(card.dataset.m282||!card.id)return;
      var head=card.firstElementChild,h3=head&&head.querySelector('h3');if(!h3)return;
      card.dataset.m282=1;
      var w=document.createElement('span');w.style.cssText='display:flex;align-items:center;gap:6px;min-width:0';
      var b=chev(),k='h|'+card.id;
      head.insertBefore(w,h3);w.appendChild(b);w.appendChild(h3);
      function ap(){var c=!!S.shut[k];card.classList.toggle('v282-c',c);b.textContent=c?'▸':'▾'}
      ap();card._ap=ap;card._k=k;
      b.addEventListener('click',function(){if(S.shut[k])delete S.shut[k];else S.shut[k]=1;sv();ap()});
    });
    if(!$('v282-hb')&&g.children.length){
      g.parentNode.insertBefore(barra('v282-hb',function(fechar){
        [].forEach.call(g.children,function(c){if(!c._k)return;if(fechar)S.shut[c._k]=1;else delete S.shut[c._k];c._ap()});sv()}),g);
    }
  }


  /* ---------- ITENS (Orçamento e Compras): nascem fechadinhos ---------- */
  function itens(sel,prep){
    [].forEach.call(document.querySelectorAll(sel),function(it){
      if(it.dataset.m282)return;
      if(it.querySelector('input[id^="desc-"],select[id^="orc-tr-transp-"]'))return; /* em edição: fica aberto */
      var p=prep(it);if(!p)return;
      it.dataset.m282=1;
      var b=chev(),sm=document.createElement('span');sm.className='v282-sm';
      p.row.insertBefore(b,p.row.firstChild);p.slot(sm);
      function ap(){var c=!S.open[p.key];it.classList.toggle('v282-c',c);b.textContent=c?'▸':'▾';sm.style.display=c?'':'none';if(c)sm.textContent=p.sum()}
      ap();it._ap=ap;it._k=p.key;
      b.addEventListener('click',function(){if(S.open[p.key])delete S.open[p.key];else S.open[p.key]=1;sv();ap()});
    });
  }
  function todos(sel,abrir){
    [].forEach.call(document.querySelectorAll(sel),function(it){if(!it._k)return;if(abrir)S.open[it._k]=1;else delete S.open[it._k];it._ap()});sv()}


  var SO='#orcamento-conteudo [class~="space-y-2.5"] > div';
  function orc(){
    var c=$('orcamento-conteudo');if(!c)return;
    itens(SO,function(it){
      var h=it.innerHTML,f=it.firstElementChild;if(!f)return null;
      var m=h.match(/abrirEdicaoConducaoOrcamento\('[^']+',\s*'[^']+',\s*'([^']+)'\)/);
      if(m&&f.tagName==='DIV'){
        return {key:'oc|'+m[1],row:f,slot:function(s){f.insertBefore(s,f.lastElementChild)},
          sum:function(){var v=it.querySelector('.font-black.text-sm'),r=it.querySelector('.text-emerald-700');return (v?v.textContent.trim():'')+(r?' ('+r.textContent.trim()+')':'')}};
      }
      var m2=h.match(/atualizarOrcamentoDescricao\((\d+)/);
      if(m2&&f.tagName==='INPUT'){
        var row=document.createElement('div');row.style.cssText='display:flex;align-items:center;gap:6px';
        it.insertBefore(row,f);row.appendChild(f);f.style.flex='1';
        return {key:'om|'+m2[1],row:row,slot:function(s){row.appendChild(s)},
          sum:function(){var v=it.querySelector('input[id^="despesa-val-"]'),cu=it.textContent.match(/Valor \(([^)]+)\)/);return ((v&&v.value)||'0')+' '+(cu?cu[1]:'')}};
      }
      return null;
    });
    if(!c.querySelector('.v282-ob')&&document.querySelector(SO)){
      var bar=barra('v282-ob',function(fechar){todos(SO,!fechar)});bar.classList.add('v282-ob');c.insertBefore(bar,c.firstChild);
    }
  }
  /* despesa nova nasce aberta para digitar */
  if(typeof window.adicionarDespesa==='function'){
    var ad=window.adicionarDespesa;
    window.adicionarDespesa=function(m){ad(m);var o=dadosApp.orcamento&&dadosApp.orcamento[0];if(o){S.open['om|'+o.id]=1;sv();try{renderizarOrcamentoTab()}catch(e){}}};
  }


  var SC='#compras-lista-itens > div';
  function comp(){
    var l=$('compras-lista-itens');if(!l)return;
    itens(SC,function(it){
      var f=it.firstElementChild,cb=it.querySelector('input[type=checkbox]');if(!f||!cb)return null;
      var m=(cb.getAttribute('onchange')||'').match(/alternarConcluidoItemDireto\('([^']+)'/);if(!m)return null;
      return {key:'c|'+m[1],row:f,slot:function(s){f.insertBefore(s,f.lastElementChild)},
        sum:function(){var v=it.querySelector('.text-indigo-900'),r=it.querySelector('.text-emerald-700');return (v?v.textContent.trim():'')+(r?' ('+r.textContent.trim()+')':'')}};
    });
    if(!$('v282-cb')){
      l.parentNode.insertBefore(barra('v282-cb',function(fechar){todos(SC,!fechar)}),l);
    }
  }


  function obs(id,fn){var e=$(id);if(!e)return;new MutationObserver(function(){setTimeout(fn,0)}).observe(e,{childList:true});fn()}
  obs('hub-utilidades-grid',hub);obs('orcamento-conteudo',orc);obs('compras-lista-itens',comp);
  setTimeout(function(){hub();orc();comp()},800);
})();
}catch(e){console.error('[bloco com erro]',e)}

try{
(function(){
  var $=function(i){return document.getElementById(i)};
  function call(n){return function(){if(typeof window[n]==='function')window[n]()}}


  /* ---------- EDITAR: barra unica e compacta ---------- */
  function tb(){
    var tab=$('tab-itinerario'),lista=$('lista-blocos'),sel=$('select-ordenacao-blocos');
    if(!tab||!lista||!sel||$('v283-tb'))return;
    var velhos=[].filter.call(tab.children,function(c){return c!==lista&&c.id!=='filtros-container'&&c.id!=='v281-bulk'&&(c.contains(sel)||/Blocos de Destino/i.test(c.textContent))});
    var card=document.createElement('div');card.id='v283-tb';
    card.innerHTML='<div class="r"><span class="t">📦 Blocos de destino</span><button type="button" class="v283-b" data-a="u">↩️ Voltar</button><button type="button" class="v283-b p" data-a="n">➕ Novo</button></div><div class="r" id="v283-r2"><button type="button" class="v283-b" data-a="f">⏫ Fechar</button><button type="button" class="v283-b" data-a="o">⏬ Abrir</button></div>';
    card.querySelector('#v283-r2').insertBefore(sel,card.querySelector('#v283-r2').firstChild);
    velhos.forEach(function(c){c.style.display='none'});
    card.addEventListener('click',function(e){
      var b=e.target.closest('button');if(!b)return;var a=b.dataset.a;
      if(a==='u')call('desfazerUltimaAcao')();
      else if(a==='n')call('adicionarBloco')();
      else{var x=document.querySelector('#v281-bulk button[data-s="'+(a==='f'?1:0)+'"]');if(x)x.click()}
    });
    tab.insertBefore(card,$('v281-bulk')||lista);
  }


  /* ---------- ROTEIRO: fechar tudo / abrir tudo ---------- */
  function rot(){
    var l=$('lista-leitura-html');if(!l||$('v283-rb'))return;
    var bar=document.createElement('div');bar.id='v283-rb';bar.className='v281-bulk';
    bar.innerHTML='<button type="button" data-s="1">⏫ Fechar tudo</button><button type="button" data-s="0">⏬ Abrir tudo</button>';
    bar.addEventListener('click',function(e){
      var b=e.target.closest('button');if(!b)return;var fechar=b.dataset.s==='1';
      if(fechar){
        [].forEach.call(l.children,function(c){if(!c.classList.contains('v279-cc')){var h=c.querySelector('.v279-kh');if(h)h.click()}});
        return;
      }
      [].forEach.call(l.children,function(c){if(c.classList.contains('v279-cc')){var h=c.querySelector('.v279-kh');if(h)h.click()}});
      [].forEach.call(l.querySelectorAll('.v279-rc .v279-rh'),function(h){h.click()});
      [].forEach.call(l.querySelectorAll('.v277-pt:not(.v279-o):not(.v279-d) .hd'),function(h){if(h.querySelector('.v279-cv'))h.click()});
      [].forEach.call(l.querySelectorAll('.v279-cd:not(.v279-o):not(.v279-cdd)'),function(c){if(c.querySelector('.v279-cv'))c.click()});
    });
    l.parentNode.insertBefore(bar,l);
  }


  /* ---------- botao flutuante que muda conforme a pagina ---------- */
  var ACT={
    leitura:['📲','Compartilhar roteiro no WhatsApp',call('compartilharRoteiroWhatsApp'),1],
    itinerario:['➕','Novo bloco',call('adicionarBloco'),0],
    utilidades:['↩️','Desfazer última ação',call('desfazerUltimaAcao'),0],
    orcamento:['🖨️','Imprimir orçamento (PDF)',function(){if(typeof imprimirSeccaoCustom==='function')imprimirSeccaoCustom('Orçamento & Câmbio',$('tab-orcamento').innerHTML)},0],
    compras:['📲','Compartilhar lista de compras no WhatsApp',call('compartilharComprasWhatsApp'),1]
  };
  var fab=document.createElement('button');fab.id='v283-act';fab.type='button';document.body.appendChild(fab);
  var cur='leitura';
  function upd(t){if(!ACT[t])return;cur=t;var a=ACT[t];fab.textContent=a[0];fab.title=a[1];fab.setAttribute('aria-label',a[1]);fab.classList.toggle('g',!!a[3])}
  fab.addEventListener('click',function(){ACT[cur][2]()});
  var om=window.mudarTab;
  if(typeof om==='function'){window.mudarTab=function(t){var r=om.apply(this,arguments);upd(t);return r}}
  upd(localStorage.getItem('tab_ativa_v269')||'leitura');


  tb();rot();setTimeout(function(){tb();rot()},600);setTimeout(function(){tb();rot()},1800);
})();
}catch(e){console.error('[bloco com erro]',e)}
