try{
(function(){
  var $ = function(i){return document.getElementById(i)};
  var T = function(m,t){if(window.mostrarToast)mostrarToast(m,t||'info')};
  var undo = function(){try{registarEstadoAnterior()}catch(e){}};
  var save = function(){try{salvarStorage()}catch(e){}};
  function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
  function idDe(c){var m=c.innerHTML.match(/(?:alternarBloqueio|removerDoRoteiro|apagarBloco)\('([^']+)'\)/);return m?m[1]:null}
  function item(id){return (dadosApp.itinerario||[]).filter(function(i){return String(i.id)===String(id)})[0]}

  /* ========================================================
     1. CORES DA SETINHA E DO QUADRADINHO EM VOLTA (ABRIR/FECHAR)
     ======================================================== */
  var CFG_ARROWS_KEY = 'v288_arrows_cfg';
  var arrowCfg = {
    color: '#4338ca',
    bg: '#eef2ff',
    border: '#c7d2fe'
  };
  try {
    var savedArr = JSON.parse(localStorage.getItem(CFG_ARROWS_KEY));
    if (savedArr) {
      if (savedArr.color) arrowCfg.color = savedArr.color;
      if (savedArr.bg) arrowCfg.bg = savedArr.bg;
      if (savedArr.border) arrowCfg.border = savedArr.border;
    }
  } catch(e){}

  function applyArrowColors() {
    var r = document.documentElement.style;
    r.setProperty('--v-arrow-color', arrowCfg.color);
    r.setProperty('--v-arrow-bg', arrowCfg.bg);
    r.setProperty('--v-arrow-border', arrowCfg.border);
    try {
      localStorage.setItem(CFG_ARROWS_KEY, JSON.stringify(arrowCfg));
    } catch(e){}
    var pEl = $('v288-preview-cvb');
    if (pEl) {
      pEl.style.color = arrowCfg.color;
      pEl.style.backgroundColor = arrowCfg.bg;
      pEl.style.borderColor = arrowCfg.border;
    }
  }
  applyArrowColors();

  /* ========================================================
     2. PAPEL DE PAREDE INTERATIVO: ESTRELINHA, CORAÇÃOZINHO, BOLINHA
        "Quando eu toco, ele se abre. Quando eu paro de tocar, ele fecha. E continua se movendo."
     ======================================================== */
  var FX_TYPE_KEY = 'v288_fx_mode';
  var fxMode = localStorage.getItem(FX_TYPE_KEY) || 'todos'; // 'todos', 'estrelas', 'coracoes', 'bolinhas', 'off'

  var cv = $('v284-fx') || document.createElement('canvas');
  cv.id = 'v284-fx';
  if (!cv.parentElement) document.body.appendChild(cv);
  var ctx = cv.getContext('2d');
  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var particles = [];
  var touchState = {
    active: false,
    x: 0,
    y: 0,
    openFactor: 0 // 0 = fechado, 1 = totalmente aberto
  };
  var animFrameId = 0, lastTime = 0;

  var ITEMS_STARS = ['✨', '⭐', '🌟'];
  var ITEMS_HEARTS = ['💗', '💖', '💕'];
  var ITEMS_BUBBLES = ['🫧', '⚪', '🟣'];

  function getAvailableEmojis() {
    if (fxMode === 'estrelas') return ITEMS_STARS;
    if (fxMode === 'coracoes') return ITEMS_HEARTS;
    if (fxMode === 'bolinhas') return ITEMS_BUBBLES;
    return ITEMS_STARS.concat(ITEMS_HEARTS).concat(ITEMS_BUBBLES);
  }

  function createParticle(isInitial) {
    var emojis = getAvailableEmojis();
    return {
      x: Math.random() * W,
      y: isInitial ? Math.random() * H : H + 25 + Math.random() * 20,
      size: 15 + Math.random() * 16,
      speedY: 16 + Math.random() * 22,
      phase: Math.random() * 6.28,
      swaySpeed: 0.6 + Math.random() * 0.8,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      offsetX: 0,
      offsetY: 0,
      targetOffsetX: 0,
      targetOffsetY: 0,
      alpha: 0.45 + Math.random() * 0.45
    };
  }

  function resizeCanvas() {
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var count = Math.max(16, Math.min(32, Math.round((W * H) / 32000)));
    while (particles.length < count) particles.push(createParticle(true));
    particles.length = count;
  }

  function renderParticles(t) {
    animFrameId = requestAnimationFrame(renderParticles);
    if (!lastTime) lastTime = t;
    var dt = Math.min((t - lastTime) / 1000, 0.05);
    lastTime = t;

    ctx.clearRect(0, 0, W, H);
    if (fxMode === 'off') return;

    // Interpolação suave de abertura e fechamento
    var targetFactor = touchState.active ? 1.0 : 0.0;
    touchState.openFactor += (targetFactor - touchState.openFactor) * Math.min(dt * 8, 1);

    var touchX = touchState.active ? touchState.x : W / 2;
    var touchY = touchState.active ? touchState.y : H / 2;
    var openRadius = 140 * touchState.openFactor;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      // Movimento contínuo para cima
      p.y -= p.speedY * dt;
      p.phase += p.swaySpeed * dt;
      var baseX = p.x + Math.sin(p.phase) * 16;
      var baseY = p.y;

      // Dinâmica de "abrir quando toca, fechar quando solta":
      if (touchState.openFactor > 0.01) {
        var dx = (baseX + p.offsetX) - touchX;
        var dy = (baseY + p.offsetY) - touchY;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;

        if (dist < openRadius + 60) {
          var push = (1 - dist / (openRadius + 60)) * openRadius * 1.5;
          p.targetOffsetX = (dx / dist) * push;
          p.targetOffsetY = (dy / dist) * push;
        } else {
          p.targetOffsetX = 0;
          p.targetOffsetY = 0;
        }
      } else {
        // Fechou: volta à posição original de fluxo contínuo
        p.targetOffsetX = 0;
        p.targetOffsetY = 0;
      }

      // Mola suave para offset
      p.offsetX += (p.targetOffsetX - p.offsetX) * Math.min(dt * 10, 1);
      p.offsetY += (p.targetOffsetY - p.offsetY) * Math.min(dt * 10, 1);

      var drawX = baseX + p.offsetX;
      var drawY = baseY + p.offsetY;

      // Recicla se passar do topo
      if (drawY < -40) {
        particles[i] = createParticle(false);
        continue;
      }

      ctx.globalAlpha = p.alpha;
      ctx.font = Math.round(p.size * (1 + touchState.openFactor * 0.15)) + 'px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.emoji, drawX, drawY);
    }
    ctx.globalAlpha = 1;
  }

  function startParticleAnimation() {
    resizeCanvas();
    if (fxMode !== 'off') {
      cv.style.display = 'block';
      if (!animFrameId) {
        lastTime = performance.now();
        animFrameId = requestAnimationFrame(renderParticles);
      }
    } else {
      cv.style.display = 'none';
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = 0;
      }
    }
  }

  // Interatividade ao toque e clique:
  window.addEventListener('resize', resizeCanvas);
  
  function handlePointerStart(x, y) {
    touchState.active = true;
    touchState.x = x;
    touchState.y = y;
  }
  function handlePointerMove(x, y) {
    if (touchState.active) {
      touchState.x = x;
      touchState.y = y;
    }
  }
  function handlePointerEnd() {
    touchState.active = false;
  }

  window.addEventListener('pointerdown', function(e){ handlePointerStart(e.clientX, e.clientY); }, {passive:true});
  window.addEventListener('pointermove', function(e){ handlePointerMove(e.clientX, e.clientY); }, {passive:true});
  ['pointerup', 'pointercancel', 'blur'].forEach(function(ev){
    window.addEventListener(ev, handlePointerEnd, {passive:true});
  });

  startParticleAnimation();

  /* ========================================================
     3. ROTEIRO: CABEÇALHO FINO EM UMA LINHA SÓ COM XIZINHO À DIREITA
     "Ali em roteiro, tá um quadradão, né? Poderia ficar só uma linha. 
      E aí, esse xizinho, ele mais pro cantinho do lado direito, meu direito, tá? 
      Ali depois de 0 barra 4, ele podia ficar ali. E aí, é diminuir o tamanho desse quadradão."
     ======================================================== */
  var SK_ROTEIRO = 'v288_rot_state';
  var rotShut = {};
  try {
    rotShut = JSON.parse(localStorage.getItem(SK_ROTEIRO)) || {};
  } catch(e){}

  function saveRotState() {
    try {
      localStorage.setItem(SK_ROTEIRO, JSON.stringify(rotShut));
    } catch(e){}
  }

  function formatarDataCurta(iso) {
    if (!iso) return '?';
    var p = iso.split('-');
    return p.length === 3 ? (p[2] + '/' + p[1]) : iso;
  }

  function simplificarCabecalhoRoteiro() {
    var box = $('lista-leitura-html');
    if (!box) return;

    [].forEach.call(box.children, function(card) {
      var id = idDe(card);
      var it = id && item(id);
      if (!it) return;

      var inner = card.firstElementChild;
      if (!inner) return;

      // Verifica se já criamos o cabeçalho novo v288
      var oldHead = card.querySelector('.v288-rot-head');
      if (card.dataset.v288Head && oldHead) {
        // Apenas atualiza o contador e data se necessário
        var progEl = oldHead.querySelector('.v288-rot-prog');
        if (progEl) {
          var t = 0, n = 0;
          (it.trechos||[]).forEach(function(tr){
            var P = window.v277Percurso ? window.v277Percurso(it, tr) : null;
            if(!P) return;
            P.pts.forEach(function(pt){
              t++;
              var k = tr.id + '|' + (pt.k==='p'&&pt.p ? pt.p.id : pt.k);
              if (it.pontosFeitos && it.pontosFeitos[k]) n++;
            });
            (tr.conducoes||[]).forEach(function(c){
              t++;
              if(c.concluido) n++;
            });
          });
          progEl.textContent = n + '/' + t + ' ✓';
        }
        return;
      }

      card.dataset.v288Head = '1';

      // Remove os cabeçalhos antigos redundantes e botão de remover avulso
      var oldHeaders = card.querySelectorAll('.flex.justify-between.items-center.gap-2.flex-wrap, .v279-kh');
      oldHeaders.forEach(function(el){ el.remove(); });

      // Calcula progresso
      var total = 0, concluidos = 0;
      (it.trechos||[]).forEach(function(tr){
        var P = window.v277Percurso ? window.v277Percurso(it, tr) : null;
        if(!P) return;
        P.pts.forEach(function(pt){
          total++;
          var k = tr.id + '|' + (pt.k==='p'&&pt.p ? pt.p.id : pt.k);
          if (it.pontosFeitos && it.pontosFeitos[k]) concluidos++;
        });
        (tr.conducoes||[]).forEach(function(c){
          total++;
          if(c.concluido) concluidos++;
        });
      });

      var corMaster = it.cor || (typeof obterCorPorCategoria==='function'?obterCorPorCategoria(it.categoria):'#3b82f6');
      var dIni = formatarDataCurta(it.dataInicio);
      var dFim = formatarDataCurta(it.dataFim);

      // Zonas em badges pequeninos
      var zonasHtml = '';
      if (it.zonasLista && it.zonasLista.length > 0) {
        it.zonasLista.forEach(function(z){
          zonasHtml += '<span class="v287-z" style="font-size:10px;padding:1px 6px;">🎫 ' + esc(z.zona || z.local) + '</span>';
        });
      }

      var isShut = !!rotShut[id];
      card.classList.toggle('v279-cc', isShut);

      // CRIAÇÃO DO CABEÇALHO ULTRA-FINO EM UMA LINHA SÓ
      var head = document.createElement('div');
      head.className = 'v288-rot-head';
      head.innerHTML = `
        <div class="v288-left">
          <button type="button" class="v288-cvb" title="Abrir / Recolher este destino">${isShut ? '▸' : '▾'}</button>
          <span class="v288-rot-badge" style="background-color: ${corMaster};">${esc(it.categoria || 'Destino')}</span>
          <span class="v288-rot-prog">${concluidos}/${total} ✓</span>
          <span class="v288-rot-dates">📅 ${dIni} ➔ ${dFim}</span>
          ${zonasHtml}
        </div>
        <button type="button" class="v288-rot-x" data-ref="removerDoRoteiro('${id}')" title="Remover este destino do Roteiro (meu lado direito)">✕</button>
      `;

      var cvb = head.querySelector('.v288-cvb');
      var btnX = head.querySelector('.v288-rot-x');

      // Clique no botão de fechar/abrir ou na barra
      head.addEventListener('click', function(e){
        if (e.target.closest('.v288-rot-x')) return;
        var shut = !card.classList.contains('v279-cc');
        card.classList.toggle('v279-cc', shut);
        if (cvb) cvb.textContent = shut ? '▸' : '▾';
        if (shut) rotShut[id] = 1; else delete rotShut[id];
        saveRotState();
      });

      // Clique no xizinho (remover do roteiro)
      btnX.addEventListener('click', function(e){
        e.stopPropagation();
        if (typeof removerDoRoteiro === 'function') {
          removerDoRoteiro(id);
        }
      });

      inner.insertBefore(head, inner.firstChild);
    });
  }

  /* ========================================================
     4. ASSISTENTE DE MONTAGEM RÁPIDA DE ROTAS A PARTIR DO MAPS / TEXTO
     ======================================================== */
  function parseMapsOuTexto(inputStr) {
    inputStr = (inputStr || '').trim();
    var pontos = [], modos = [], linhas = [];

    if (inputStr.indexOf('google.com/maps') > -1 || inputStr.indexOf('maps.app.goo.gl') > -1) {
      if (inputStr.indexOf('/dir/') > -1) {
        var pathPart = inputStr.split('/dir/')[1].split('?')[0].split('@')[0];
        var rawPts = pathPart.split('/').map(function(p){
          return decodeURIComponent(p.replace(/\+/g, ' ')).trim();
        }).filter(function(p){
          return p && p.indexOf('data=') !== 0 && p.indexOf('@') !== 0;
        });

        rawPts.forEach(function(p){
          var clean = p.replace(/^[-\d.]+,\s*[-\d.]+$/, '').trim();
          if (clean) pontos.push(clean);
          else if (p) pontos.push(p);
        });
      }

      // Parâmetros de consulta
      try {
        var urlObj = new URL(inputStr);
        var orig = urlObj.searchParams.get('origin');
        var dest = urlObj.searchParams.get('destination');
        var wps = urlObj.searchParams.get('waypoints');
        if (orig && dest) {
          pontos = [orig];
          if (wps) {
            wps.split('|').forEach(function(w){ if(w.trim()) pontos.push(w.trim()); });
          }
          pontos.push(dest);
        }
        var tm = (urlObj.searchParams.get('travelmode') || '').toLowerCase();
        var defaultMode = 'Trem';
        if (tm === 'driving') defaultMode = 'Carro';
        else if (tm === 'walking') defaultMode = 'A pé';
        for (var i = 0; i < Math.max(1, pontos.length - 1); i++) modos.push(defaultMode);
      } catch(e){}

    } else {
      // Entrada em texto (separado por setas, hífens ou quebras de linha)
      var partes = inputStr.split(/\s*(?:->|➔|—|–|>|\n)\s*/);
      partes.forEach(function(ptRaw){
        ptRaw = ptRaw.trim();
        if (!ptRaw) return;

        var mode = 'Trem';
        var lineStr = '';
        var parenMatch = ptRaw.match(/\((.*?)\)/);
        if (parenMatch) {
          var info = parenMatch[1].toLowerCase();
          if (/ônibus|onibus|bus|flixbus/.test(info)) mode = 'Ônibus';
          else if (/trem|train|tgv|sbb|bahn|s-bahn|comboio/.test(info)) mode = 'Trem';
          else if (/metrô|metro|subway|u-bahn/.test(info)) mode = 'Metrô';
          else if (/avião|aviao|voo|flight/.test(info)) mode = 'Avião';
          else if (/carro|uber|táxi|taxi/.test(info)) mode = 'Carro';

          var lMatch = info.match(/\b(ir\s*\d+|ic\s*\d+|s\s*\d+|tgv\s*\d+|\d{1,3})\b/i);
          if (lMatch) lineStr = lMatch[0].toUpperCase();
        }

        var clean = ptRaw.replace(/\(.*?\)/g, '').replace(/^\d+[\.\)\-]\s*/, '').trim();
        if (clean) {
          pontos.push(clean);
          modos.push(mode);
          linhas.push(lineStr);
        }
      });
    }

    return { pontos: pontos, modos: modos, linhas: linhas };
  }

  function abrirModalMontagemRapida(blocoId, trechoId) {
    var modal = $('modal-montagem-rapida');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-montagem-rapida';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="box-m space-y-4 text-xs">
        <div class="flex justify-between items-center border-b pb-2">
          <h3 class="font-black text-sm text-indigo-950 flex items-center gap-1.5">
            <span>⚡</span> Montagem Rápida de Rota
          </h3>
          <button type="button" class="text-slate-400 hover:text-slate-600 font-bold text-base p-1" onclick="fecharModalMontagemRapida()">✕</button>
        </div>
        <p class="text-slate-600 text-[11px] leading-relaxed">
          Cole abaixo um <b>link do Google Maps</b> ou digite o trajeto separado por <b>-&gt;</b>.<br>
          O aplicativo criará automaticamente a rota, todas as paradas intermediárias e os transportes.
        </p>
        <textarea id="v288-input-maps-raw" rows="4" class="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-xs text-slate-800 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600" placeholder="Cole aqui o link do Google Maps ou texto:&#10;Ex: Zurich HB -> Luzern (Trem IR75) -> Interlaken Ost (Ônibus)"></textarea>
        
        <div class="flex gap-2">
          <button type="button" onclick="executarMontagemRapida('${blocoId}', '${trechoId||''}')" class="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-sm active:scale-95">
            ⚡ Criar Rota & Paradas Automaticamente
          </button>
          <button type="button" onclick="fecharModalMontagemRapida()" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition border border-slate-300 active:scale-95">
            Cancelar
          </button>
        </div>
      </div>
    `;
    modal.style.display = 'flex';
    var ta = $('v288-input-maps-raw');
    if (ta) ta.focus();
  }
  window.abrirModalMontagemRapida = abrirModalMontagemRapida;

  function fecharModalMontagemRapida() {
    var modal = $('modal-montagem-rapida');
    if (modal) modal.style.display = 'none';
  }
  window.fecharModalMontagemRapida = fecharModalMontagemRapida;

  function executarMontagemRapida(blocoId, trechoId) {
    var ta = $('v288-input-maps-raw');
    if (!ta || !ta.value.trim()) {
      T('Cole um link ou texto de rota antes de continuar.', 'erro');
      return;
    }

    var res = parseMapsOuTexto(ta.value);
    if (!res.pontos || res.pontos.length < 2) {
      T('Não foi possível identificar pelo menos 2 pontos (Origem e Destino).', 'erro');
      return;
    }

    undo();
    var it = item(blocoId);
    if (!it) return;

    var tr = trechoId ? (it.trechos||[]).filter(function(t){return String(t.id)===String(trechoId)})[0] : null;
    if (!tr) {
      if (!it.trechos) it.trechos = [];
      tr = {
        id: Date.now() + 1,
        origem: '',
        destino: '',
        concluido: false,
        conducoes: []
      };
      it.trechos.push(tr);
    }

    // Ponto inicial e final
    tr.origem = res.pontos[0];
    tr.destino = res.pontos[res.pontos.length - 1];

    // Limpa paradas antigas deste trecho se houver e adiciona as novas
    if (!it.paradas) it.paradas = [];
    it.paradas = it.paradas.filter(function(p){ return String(p.apos) !== String(tr.id); });

    var intermediarios = res.pontos.slice(1, res.pontos.length - 1);
    intermediarios.forEach(function(pontoNome, idx){
      it.paradas.push({
        id: 'p' + (Date.now() + idx + 10),
        apos: tr.id,
        local: pontoNome,
        de: '',
        texto: ''
      });
    });

    // Conduções automáticas
    tr.conducoes = [];
    for (var i = 0; i < res.pontos.length - 1; i++) {
      var modo = (res.modos && res.modos[i]) ? res.modos[i] : 'Trem';
      var linhaNome = (res.linhas && res.linhas[i]) ? res.linhas[i] : '';
      var condObj = {
        id: 'c' + (Date.now() + i + 50),
        transporte: modo,
        valor: 0,
        moeda: 'EUR',
        notas: '',
        fotosExtras: [],
        linhas: linhaNome ? [{ id: 'l' + Date.now() + i, nome: linhaNome, cor: '#4f46e5' }] : []
      };
      tr.conducoes.push(condObj);
    }

    // Salva listas de sugestão de origens/destinos
    if (!dadosApp.origensCadastrados) dadosApp.origensCadastrados = [];
    if (dadosApp.origensCadastrados.indexOf(tr.origem) < 0) dadosApp.origensCadastrados.push(tr.origem);
    if (!dadosApp.destinosCadastradosLocais) dadosApp.destinosCadastradosLocais = [];
    if (dadosApp.destinosCadastradosLocais.indexOf(tr.destino) < 0) dadosApp.destinosCadastradosLocais.push(tr.destino);

    save();
    fecharModalMontagemRapida();
    if (typeof atualizarTudo === 'function') atualizarTudo();
    T('⚡ Rota de ' + res.pontos.length + ' pontos montada com sucesso!', 'sucesso');
  }
  window.executarMontagemRapida = executarMontagemRapida;

  // Injetar botões de Montagem Rápida no Editar
  function injetarBotoesMontagemRapida() {
    var box = $('lista-blocos');
    if (!box) return;

    [].forEach.call(box.children, function(card){
      var id = idDe(card);
      if (!id) return;

      var headerRotas = card.querySelector('.font-bold.text-slate-700.uppercase.text-\\[10px\\]');
      if (headerRotas && !headerRotas.parentElement.querySelector('.v288-btn-maps-global')) {
        var btnGlobal = document.createElement('button');
        btnGlobal.type = 'button';
        btnGlobal.className = 'v288-btn-maps v288-btn-maps-global';
        btnGlobal.innerHTML = '<span>⚡</span> Colar do Maps';
        btnGlobal.title = 'Montagem Rápida de Rota colando link do Google Maps ou texto';
        btnGlobal.onclick = function(){ abrirModalMontagemRapida(id, ''); };
        headerRotas.parentElement.appendChild(btnGlobal);
      }

      [].forEach.call(card.querySelectorAll('button[onclick^="removerTrecho("]'), function(btnRemover){
        var row = btnRemover.parentElement;
        if (row && !row.querySelector('.v288-btn-maps-tr')) {
          var m = btnRemover.getAttribute('onclick').match(/removerTrecho\('([^']+)',\s*'([^']+)'\)/);
          if (m) {
            var btnTr = document.createElement('button');
            btnTr.type = 'button';
            btnTr.className = 'v288-btn-maps v288-btn-maps-tr';
            btnTr.innerHTML = '<span>⚡</span> Maps';
            btnTr.title = 'Colar dados do Maps nesta rota específica';
            btnTr.onclick = function(){ abrirModalMontagemRapida(m[1], m[2]); };
            row.insertBefore(btnTr, btnRemover);
          }
        }
      });
    });
  }

  /* ========================================================
     5. PAINEL DE PERSONALIZAÇÃO: OPÇÕES DE CORES DA SETINHA/QUADRADINHO E WALLPAPER
     ======================================================== */
  function injetarPainelV288() {
    var P = $('v-panel');
    if (!P || P.querySelector('#v288-panel-sec')) return;

    var sec = document.createElement('div');
    sec.id = 'v288-panel-sec';

    var CORES_SETINHA = ['#4338ca', '#db2777', '#0d9488', '#ea580c', '#16a34a', '#0891b2', '#7c3aed', '#0f172a', '#ffffff'];
    var CORES_QUADRADINHO = ['#eef2ff', '#fdf2f8', '#f0fdfa', '#fff7ed', '#f0fdf4', '#ecfeff', '#f5f3ff', '#ffffff', '#1e293b'];
    var CORES_BORDA = ['#c7d2fe', '#fbcfe8', '#99f6e4', '#fed7aa', '#bbf7d0', '#a5f3fc', '#ddd6fe', '#e2e8f0', '#475569'];

    sec.innerHTML = `
      <h4>Abrir e Fechar (Setinha e Quadradinho)</h4>
      <div style="background:#f8fafc;padding:10px;border-radius:14px;border:1px solid #e2e8f0;margin-bottom:8px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <span style="font-weight:700;font-size:11px;color:#334155;">Prévia:</span>
          <button type="button" id="v288-preview-cvb" class="v288-cvb" style="color:${arrowCfg.color};background:${arrowCfg.bg};border-color:${arrowCfg.border};">▾</button>
          <span style="font-size:11px;color:#64748b;">(Exemplo do botão)</span>
        </div>

        <div style="margin-bottom:6px;">
          <span style="font-size:11px;font-weight:700;color:#475569;display:block;margin-bottom:3px;">🔻 Cor da Setinha (Ícone):</span>
          <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center;">
            ${CORES_SETINHA.map(function(c){
              return `<button type="button" class="v-dot ${arrowCfg.color===c?'on':''}" data-arr-col="${c}" style="background:${c};" aria-label="Cor setinha"></button>`;
            }).join('')}
            <input type="color" data-arr-col-free value="${arrowCfg.color}" style="width:24px;height:24px;border:0;padding:0;background:none;cursor:pointer;">
          </div>
        </div>

        <div style="margin-bottom:6px;">
          <span style="font-size:11px;font-weight:700;color:#475569;display:block;margin-bottom:3px;">📦 Cor do Quadradinho (Fundo):</span>
          <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center;">
            ${CORES_QUADRADINHO.map(function(c){
              return `<button type="button" class="v-dot ${arrowCfg.bg===c?'on':''}" data-arr-bg="${c}" style="background:${c};" aria-label="Fundo quadradinho"></button>`;
            }).join('')}
            <input type="color" data-arr-bg-free value="${arrowCfg.bg}" style="width:24px;height:24px;border:0;padding:0;background:none;cursor:pointer;">
          </div>
        </div>

        <div>
          <span style="font-size:11px;font-weight:700;color:#475569;display:block;margin-bottom:3px;">🔲 Cor da Borda do Quadradinho:</span>
          <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center;">
            ${CORES_BORDA.map(function(c){
              return `<button type="button" class="v-dot ${arrowCfg.border===c?'on':''}" data-arr-bd="${c}" style="background:${c};" aria-label="Borda quadradinho"></button>`;
            }).join('')}
            <input type="color" data-arr-bd-free value="${arrowCfg.border}" style="width:24px;height:24px;border:0;padding:0;background:none;cursor:pointer;">
          </div>
        </div>
      </div>

      <h4>Papel de Parede Interativo</h4>
      <p style="font-size:11px;color:#64748b;margin:0 0 6px;">Ele vai passando no fundo. Quando toca, ele se abre. Quando solta, ele fecha e continua!</p>
      <div style="display:flex;gap:4px;flex-wrap:wrap;">
        <button type="button" class="v-chip ${fxMode==='todos'?'on':''}" data-fx-m="todos">⭐ 💗 🫧 Todos</button>
        <button type="button" class="v-chip ${fxMode==='estrelas'?'on':''}" data-fx-m="estrelas">⭐ Estrelas</button>
        <button type="button" class="v-chip ${fxMode==='coracoes'?'on':''}" data-fx-m="coracoes">💗 Corações</button>
        <button type="button" class="v-chip ${fxMode==='bolinhas'?'on':''}" data-fx-m="bolinhas">🫧 Bolinhas</button>
        <button type="button" class="v-chip ${fxMode==='off'?'on':''}" data-fx-m="off">✕ Desligado</button>
      </div>
    `;

    sec.addEventListener('click', function(e){
      var b = e.target.closest('button');
      if (!b) return;

      if (b.dataset.arrCol) {
        arrowCfg.color = b.dataset.arrCol;
        applyArrowColors();
        injetarPainelV288();
      } else if (b.dataset.arrBg) {
        arrowCfg.bg = b.dataset.arrBg;
        applyArrowColors();
        injetarPainelV288();
      } else if (b.dataset.arrBd) {
        arrowCfg.border = b.dataset.arrBd;
        applyArrowColors();
        injetarPainelV288();
      } else if (b.dataset.fxM) {
        fxMode = b.dataset.fxM;
        try { localStorage.setItem(FX_TYPE_KEY, fxMode); } catch(x){}
        startParticleAnimation();
        injetarPainelV288();
      }
    });

    sec.addEventListener('change', function(e){
      var inp = e.target;
      if (inp.dataset.arrColFree !== undefined) {
        arrowCfg.color = inp.value;
        applyArrowColors();
      } else if (inp.dataset.arrBgFree !== undefined) {
        arrowCfg.bg = inp.value;
        applyArrowColors();
      } else if (inp.dataset.arrBdFree !== undefined) {
        arrowCfg.border = inp.value;
        applyArrowColors();
      }
    });

    P.appendChild(sec);
  }

  // Observadores e execução inicial
  var lr = $('lista-leitura-html');
  if (lr) {
    new MutationObserver(function(){ setTimeout(simplificarCabecalhoRoteiro, 80); }).observe(lr, {childList: true});
  }

  var lb = $('lista-blocos');
  if (lb) {
    new MutationObserver(function(){ setTimeout(injetarBotoesMontagemRapida, 120); }).observe(lb, {childList: true});
  }

  var panel = $('v-panel');
  if (panel) {
    new MutationObserver(injetarPainelV288).observe(panel, {childList: true});
    injetarPainelV288();
  }

  [200, 600, 1400, 2800].forEach(function(ms){
    setTimeout(function(){
      simplificarCabecalhoRoteiro();
      injetarBotoesMontagemRapida();
      injetarPainelV288();
    }, ms);
  });

})();
}catch(e){console.error('[bloco com erro]',e)}
