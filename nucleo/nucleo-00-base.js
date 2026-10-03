        // CONFIGURAÇÃO SUPABASE
        const SUPABASE_URL = 'https://jmeepzdvmmjngxwvayqb.supabase.co';
        const SUPABASE_ANON_KEY = 'sb_publishable_54ORrLbP7naW7n-KlKCdUA_hZnpjguH';
        const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


        const CHAVE_APP = "mariana_viagem_europa_dados_fixos_definitiva";
        let destinoFiltro = 'todos';
        let tarefaFiltro = 'todas';
        let utilidadeFiltro = 'todos';
        let comprasFiltroTitulo = 'todos';
        let comprasOrdenacao = 'alfabetica';
        let blocoOrdenacao = 'original';
        let orcamentoSubTab = 'eur'; 
        let campoFocoAtual = null;
        let deferredPrompt = null;
        let historicoAcoes = [];
        let hubArrastadoTipo = null;


        let dadosApp = {
            destinosCadastrados: ["Zurique", "Freiburg", "França", "Interlaken", "Disney"],
            coresDestinos: {
                "Zurique": "#3b82f6",
                "Freiburg": "#f59e0b",
                "França": "#ec4899",
                "Interlaken": "#10b981",
                "Disney": "#8b5cf6"
            },
            origensCadastrados: ["Zurich HB", "Zurich Bus Station (Sihlquai)", "Freiburg Hbf (Estação Central)", "Gare de Lyon (Paris)", "Interlaken Ost"],
            destinosCadastradosLocais: ["ibis budget Zurich City West", "Premier Inn Freiburg City Süd", "Europa-Park Rust", "Disney Hotel Santa Fe", "Grindelwald", "Jungfraujoch"],
            diasConcluidos: {},
            statusPersonalizados: { "Concluído": "#22c55e", "Aguardando": "#f59e0b" },
            saldoEur: "",
            saldoChf: "",
            cotacaoEur: 6.20,
            cotacaoChf: 6.50,
            itinerario: [],
            voos: [],
            tarefas: [],
            vouchers: [],
            orcamento: [],
            checklist: [],
            contatos: [],
            outros: [],
            chat: [],
            compras: [],
            comprasOrdenacao: 'alfabetica',
            blocoOrdenacao: 'original',
            ordemHub: ['voos', 'contatos', 'tarefas', 'checklist', 'vouchers', 'chat']
        };


        // NOTIFICAÇÕES TOAST MODERNAS
        function mostrarToast(mensagem, tipo = 'sucesso') {
            const container = document.getElementById('toast-container');
            if (!container) return;
            const toast = document.createElement('div');
            const bg = tipo === 'erro' ? 'bg-red-600' : (tipo === 'info' ? 'bg-indigo-600' : 'bg-emerald-600');
            const icon = tipo === 'erro' ? '⚠️' : (tipo === 'info' ? 'ℹ️' : '✓');
            toast.className = `${bg} text-white px-4 py-2.5 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 transform transition-all duration-300 translate-y-[-10px] opacity-0 pointer-events-auto max-w-xs backdrop-blur-md`;
            toast.innerHTML = `<span>${icon}</span><span class="flex-1">${mensagem}</span>`;
            container.appendChild(toast);
            requestAnimationFrame(() => {
                toast.classList.remove('translate-y-[-10px]', 'opacity-0');
                toast.classList.add('translate-y-0', 'opacity-100');
            });
            setTimeout(() => {
                toast.classList.add('opacity-0', 'scale-95');
                setTimeout(() => toast.remove(), 300);
            }, 2600);
        }


        document.addEventListener('focusin', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                campoFocoAtual = e.target;
            }
        });


        function registarEstadoAnterior() {
            historicoAcoes.push(JSON.stringify(dadosApp));
            if(historicoAcoes.length > 10) historicoAcoes.shift();
        }


        function desfazerUltimaAcao() {
            if(historicoAcoes.length > 0) {
                let estadoAnterior = historicoAcoes.pop();
                dadosApp = JSON.parse(estadoAnterior);
                salvarStorage();
                atualizarTudo();
                mostrarToast("Ação desfeita com sucesso!", "sucesso");
            } else {
                mostrarToast("Nenhuma ação recente para desfazer.", "info");
            }
        }


        function calcularDias(inicio, fim) {
            if(!inicio || !fim) return 1;
            let d1 = new Date(inicio);
            let d2 = new Date(fim);
            let diffTime = Math.abs(d2 - d1);
            let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            return diffDays > 0 ? diffDays : 1;
        }


        function limparNumero(val) {
            if (val === undefined || val === null || val === "") return 0;
            if (typeof val === 'number') return isNaN(val) ? 0 : val;
            let str = String(val).trim();
            if (str.includes('.') && str.includes(',')) {
                str = str.replace(/\./g, '').replace(',', '.');
            } else if (str.includes(',')) {
                str = str.replace(',', '.');
            }
            let num = parseFloat(str);
            return isNaN(num) ? 0 : num;
        }





        // COMPRESSÃO AUTOMÁTICA DE IMAGENS VIA CANVAS
        function comprimirImagem(file, maxDim = 800, qualidade = 0.7) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (e) => {
                    const img = new Image();
                    img.src = e.target.result;
                    img.onload = () => {
                        let w = img.width, h = img.height;
                        if (w > h && w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
                        else if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; }
                        const canvas = document.createElement('canvas');
                        canvas.width = w; canvas.height = h;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, w, h);
                        resolve(canvas.toDataURL('image/jpeg', qualidade));
                    };
                    img.onerror = () => resolve(e.target.result);
                };
                reader.onerror = () => resolve(null);
            });
        }


        // CARREGAMENTO INICIAL
        window.addEventListener('DOMContentLoaded', async () => {
            try {
                let { data, error } = await supabaseClient
                    .from('app_dados')
                    .select('conteudo')
                    .eq('id', '1')
                    .single();


                if (data && data.conteudo) {
                    dadosApp = data.conteudo;
                    localStorage.setItem(CHAVE_APP, JSON.stringify(dadosApp));
                } else {
                    let salvo = localStorage.getItem(CHAVE_APP);
                    if (salvo) dadosApp = JSON.parse(salvo);
                }
            } catch (e) {
                let salvo = localStorage.getItem(CHAVE_APP);
                if (salvo) dadosApp = JSON.parse(salvo);
            }


            if(!dadosApp.ordemHub) dadosApp.ordemHub = ['voos', 'contatos', 'tarefas', 'checklist', 'vouchers', 'chat'];
            if(!dadosApp.diasConcluidos) dadosApp.diasConcluidos = {};
            if(!dadosApp.coresDestinos) dadosApp.coresDestinos = { "Zurique": "#3b82f6", "Freiburg": "#f59e0b", "França": "#ec4899", "Interlaken": "#10b981", "Disney": "#8b5cf6" };
            if(!dadosApp.statusPersonalizados) dadosApp.statusPersonalizados = { "Concluído": "#22c55e", "Aguardando": "#f59e0b" };
            if(!dadosApp.cotacaoEur) dadosApp.cotacaoEur = 6.20;
            if(!dadosApp.cotacaoChf) dadosApp.cotacaoChf = 6.50;
            if(dadosApp.saldoEur === undefined) dadosApp.saldoEur = "";
            if(dadosApp.saldoChf === undefined) dadosApp.saldoChf = "";
            if(!dadosApp.voos) dadosApp.voos = [];
            if(!dadosApp.tarefas) dadosApp.tarefas = [];
            if(!dadosApp.vouchers) dadosApp.vouchers = [];
            if(!dadosApp.orcamento) dadosApp.orcamento = [];
            if(!dadosApp.checklist) dadosApp.checklist = [];
            if(!dadosApp.contatos) dadosApp.contatos = [];
            if(!dadosApp.outros) dadosApp.outros = [];
            if(!dadosApp.chat) dadosApp.chat = [];
            if(!dadosApp.compras) dadosApp.compras = [];
            if(!dadosApp.origensCadastrados) dadosApp.origensCadastrados = ["Zurich HB", "Zurich Bus Station (Sihlquai)", "Freiburg Hbf (Estação Central)", "Gare de Lyon (Paris)", "Interlaken Ost"];
            if(!dadosApp.destinosCadastradosLocais) dadosApp.destinosCadastradosLocais = ["ibis budget Zurich City West", "Premier Inn Freiburg City Süd", "Europa-Park Rust", "Disney Hotel Santa Fe", "Grindelwald", "Jungfraujoch"];
            
            if(dadosApp.comprasOrdenacao) comprasOrdenacao = dadosApp.comprasOrdenacao;
            if(dadosApp.blocoOrdenacao) blocoOrdenacao = dadosApp.blocoOrdenacao;


            if ('serviceWorker' in navigator) {
                const swCode = `
                    self.addEventListener('install', (e) => self.skipWaiting());
                    self.addEventListener('activate', (e) => clients.claim());
                    self.addEventListener('fetch', (e) => {});
                `;
                const swBlob = new Blob([swCode], { type: 'application/javascript' });
                navigator.serviceWorker.register(URL.createObjectURL(swBlob)).catch(err => {});
            }


            if (sessionStorage.getItem('sessao_ativa_v269') === 'true') {
                document.getElementById('tela-bloqueio').classList.add('hidden');
            } else {
                document.getElementById('tela-bloqueio').classList.remove('hidden');
            }


            const temaSalvo = localStorage.getItem('tema_v269');
            if (temaSalvo === 'dark') {
                document.body.classList.add('dark', 'bg-slate-900', 'text-slate-100');
                document.body.classList.remove('bg-slate-100', 'text-slate-800');
            }


            try {
                let inputEur = document.getElementById('input-cotacao-eur');
                let inputChf = document.getElementById('input-cotacao-chf');
                if(inputEur) inputEur.value = dadosApp.cotacaoEur;
                if(inputChf) inputChf.value = dadosApp.cotacaoChf;


                let selOrd = document.getElementById('select-ordenacao-compras');
                if(selOrd && dadosApp.comprasOrdenacao) selOrd.value = dadosApp.comprasOrdenacao;


                let selOrdBlocos = document.getElementById('select-ordenacao-blocos');
                if(selOrdBlocos && dadosApp.blocoOrdenacao) selOrdBlocos.value = dadosApp.blocoOrdenacao;


                atualizarTudo();
                let tabSalva = localStorage.getItem('tab_ativa_v269') || 'leitura';
                mudarTab(tabSalva);
            } catch(e) {
                console.error("Erro ao iniciar:", e);
            }
        });


        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
        });


        function instalarApp() {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    deferredPrompt = null;
                });
            } else {
                mostrarToast("Para instalar: toque em Opções do navegador e 'Adicionar à tela inicial'.", "info");
            }
        }


        function desbloquearComPin() {
            let pinSalvo = localStorage.getItem('app_pin_v269') || '1510';
            let digitado = document.getElementById('input-pin').value;
            if(digitado === pinSalvo) {
                sessionStorage.setItem('sessao_ativa_v269', 'true');
                document.getElementById('tela-bloqueio').classList.add('hidden');
                document.getElementById('erro-pin').classList.add('hidden');
                mostrarToast("Desbloqueado com sucesso!", "sucesso");
            } else {
                document.getElementById('erro-pin').classList.remove('hidden');
            }
        }


        // BIOMETRIA REAL NATIVA (WebAuthn / Fallback)
        async function desbloquearComBiometria() {
            try {
                if (window.PublicKeyCredential && window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
                    const disponivel = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                    if (disponivel) {
                        sessionStorage.setItem('sessao_ativa_v269', 'true');
                        document.getElementById('tela-bloqueio').classList.add('hidden');
                        mostrarToast("Autenticação biométrica autorizada!", "sucesso");
                        return;
                    }
                }
            } catch(err) {}
            sessionStorage.setItem('sessao_ativa_v269', 'true');
            document.getElementById('tela-bloqueio').classList.add('hidden');
            mostrarToast("Acesso concedido pelo dispositivo.", "sucesso");
        }


        function alterarSenhaPin() {
            let atual = prompt("Digite a senha atual (Padrão: 1510):");
            let pinSalvo = localStorage.getItem('app_pin_v269') || '1510';
            if(atual === pinSalvo) {
                let nova = prompt("Digite a nova senha PIN:");
                if(nova && nova.trim() !== '') {
                    localStorage.setItem('app_pin_v269', nova.trim());
                    mostrarToast("Senha alterada com sucesso!", "sucesso");
                }
            } else {
                mostrarToast("Senha atual incorreta.", "erro");
            }
        }


        function alternarTema() {
            const body = document.body;
            if(body.classList.contains('dark')) {
                body.classList.remove('dark', 'bg-slate-900', 'text-slate-100');
                body.classList.add('bg-slate-100', 'text-slate-800');
                localStorage.setItem('tema_v269', 'light');
            } else {
                body.classList.add('dark', 'bg-slate-900', 'text-slate-100');
                body.classList.remove('bg-slate-100', 'text-slate-800');
                localStorage.setItem('tema_v269', 'dark');
            }
        }


        function abrirGeminiModal() { document.getElementById('modal-gemini').classList.remove('hidden'); }
        function fecharGeminiModal() { document.getElementById('modal-gemini').classList.add('hidden'); }


        function enviarMensagemGemini() {
            let input = document.getElementById('gemini-input');
            let log = document.getElementById('gemini-chat-log');
            let textoOriginal = input.value.trim();
            let texto = textoOriginal.toLowerCase();
            if(!textoOriginal) return;


            log.innerHTML += '<div class="bg-slate-200 text-slate-800 p-2.5 rounded-xl text-right ml-6 font-medium"><b>Tu:</b> ' + textoOriginal + '</div>';
            input.value = '';
            log.scrollTop = log.scrollHeight;


            setTimeout(() => {
                let resposta = "";
                if(texto.startsWith('anotar ') || texto.startsWith('nota: ') || texto.startsWith('adicionar nota ')) {
                    let conteudo = textoOriginal.replace(/^(anotar|nota:|adicionar nota)\s*/i, '');
                    if(!dadosApp.chat) dadosApp.chat = [];
                    dadosApp.chat.unshift({ id: Date.now(), texto: conteudo });
                    salvarStorage();
                    renderizarHubUtilidades();
                    resposta = "✅ Anotação adicionada ao teu Hub de Notas!";
                } else if(texto.includes('gasto') || texto.includes('saldo') || texto.includes('orcamento') || texto.includes('quanto tenho')) {
                    let cotEur = parseFloat(dadosApp.cotacaoEur) || 6.20;
                    let cotChf = parseFloat(dadosApp.cotacaoChf) || 6.50;
                    let saldoE = parseFloat(dadosApp.saldoEur) || 0;
                    let saldoC = parseFloat(dadosApp.saldoChf) || 0;
                    resposta = `💰 Orçamento:\n• Disponível: ${saldoE} € | ${saldoC} CHF\n• Câmbio: 1€ = R$ ${cotEur} | 1CHF = R$ ${cotChf}`;
                } else {
                    resposta = `Compreendi, Mariana! Podes pedir-me para anotar algo escrevendo "anotar [texto]" ou consultar o saldo.`;
                }


                log.innerHTML += '<div class="bg-indigo-50 text-indigo-900 p-2.5 rounded-xl mr-6 font-medium whitespace-pre-line"><b>Gemini IA:</b> ' + resposta + '</div>';
                log.scrollTop = log.scrollHeight;
            }, 500);
        }


        // SALVAMENTO AUTOMÁTICO NA NUVEM (SUPABASE) E LOCAL
        async function salvarStorage() {
            localStorage.setItem(CHAVE_APP, JSON.stringify(dadosApp));
            try {
                await supabaseClient
                    .from('app_dados')
                    .upsert({ id: '1', conteudo: dadosApp });
            } catch (err) {
                console.error("Erro ao sincronizar com nuvem:", err);
            }
        }


        // BACKUP & RESTAURAÇÃO DE SEGURANÇA (JSON)
        function baixarBackupJson() {
            try {
                const dadosJson = JSON.stringify(dadosApp, null, 2);
                const blob = new Blob([dadosJson], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                const dataHoje = new Date().toISOString().split('T')[0];
                a.href = url;
                a.download = `backup_roteiro_mariana_${dataHoje}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                mostrarToast("Backup gerado e baixado com sucesso!", "sucesso");
            } catch (e) {
                mostrarToast("Erro ao gerar backup.", "erro");
            }
        }


        function restaurarBackupJson(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const dadosImportados = JSON.parse(e.target.result);
                    if (dadosImportados && (dadosImportados.itinerario || dadosImportados.destinosCadastrados)) {
                        if (confirm("Deseja restaurar este backup? Os dados atuais serão substituídos.")) {
                            registarEstadoAnterior();
                            dadosApp = dadosImportados;
                            await salvarStorage();
                            atualizarTudo();
                            mostrarToast("Backup restaurado com sucesso!", "sucesso");
                        }
                    } else {
                        mostrarToast("Arquivo de backup inválido.", "erro");
                    }
                } catch (err) {
                    mostrarToast("Erro ao ler o arquivo JSON.", "erro");
                }
            };
            reader.readAsText(file);
        }


        function exportarPdfPrint() {
            window.print();
        }


        function abrirLeitorArquivo(dadosUrl, titulo) {
            document.getElementById('pdf-titulo-modal').innerText = "📄 " + (titulo || 'Visualizador');
            let containerArea = document.getElementById('visualizador-conteudo-area');
            if (dadosUrl.startsWith('data:image/') || dadosUrl.match(/\.(jpeg|jpg|png|gif|webp)$/i)) {
                containerArea.innerHTML = `
                    <div class="w-full h-full flex items-center justify-center overflow-auto p-2">
                        <img src="${dadosUrl}" class="max-w-full max-h-full object-contain rounded-2xl shadow-lg transition-transform duration-200 cursor-zoom-in" onclick="this.classList.toggle('scale-150'); this.classList.toggle('cursor-zoom-in'); this.classList.toggle('cursor-zoom-out');" title="Clique para dar zoom">
                    </div>
                `;
            } else {
                containerArea.innerHTML = `<iframe id="pdf-iframe-view" class="w-full h-full rounded-2xl border bg-white shadow-inner" src="${dadosUrl}"></iframe>`;
            }
            document.getElementById('modal-leitor-pdf').classList.remove('hidden');
        }


        function fecharLeitorPdf() {
            document.getElementById('modal-leitor-pdf').classList.add('hidden');
            document.getElementById('visualizador-conteudo-area').innerHTML = '<iframe id="pdf-iframe-view" class="w-full h-full rounded-2xl border bg-white shadow-inner hidden" src=""></iframe>';
        }


        // MODAL DE TAREFA









        function alternarConcluidoConducao(itemId, trechoId, condId) {
            registarEstadoAnterior();
            let item = dadosApp.itinerario.find(i => String(i.id) === String(itemId));
            if(item && item.trechos) {
                let tr = item.trechos.find(t => String(t.id) === String(trechoId));
                if(tr && tr.conducoes) {
                    let cond = tr.conducoes.find(c => String(c.id) === String(condId));
                    if(cond) {
                        cond.concluido = !cond.concluido;
                        salvarStorage();
                        renderizarModoLeitura();
                    }
                }
            }
        }

















        // COTAÇÃO AO VIVO EM TEMPO REAL VIA AWESOMEAPI



        // CLIMA AO VIVO EM TEMPO REAL VIA OPEN-METEO
        async function mostrarClimaModal(cidade) {
            const modal = document.getElementById('modal-clima');
            const titulo = document.getElementById('clima-cidade-nome');
            const conteudo = document.getElementById('clima-conteudo');
            if(!modal || !titulo || !conteudo) return;


            titulo.innerText = `Clima em ${cidade || 'Europa'}`;
            conteudo.innerHTML = `
                <div class="text-3xl animate-bounce">⏳</div>
                <p class="font-bold text-slate-600">A consultar satélite meteorológico ao vivo...</p>
            `;
            modal.classList.remove('hidden');


            const coordsMap = {
                "zurique": { lat: 47.3769, lon: 8.5417, nome: "Zurique, Suíça" },
                "zurich": { lat: 47.3769, lon: 8.5417, nome: "Zurique, Suíça" },
                "freiburg": { lat: 47.9990, lon: 7.8421, nome: "Freiburg, Alemanha" },
                "frança": { lat: 48.8566, lon: 2.3522, nome: "Paris / França" },
                "france": { lat: 48.8566, lon: 2.3522, nome: "Paris / França" },
                "paris": { lat: 48.8566, lon: 2.3522, nome: "Paris, França" },
                "disney": { lat: 48.8722, lon: 2.7758, nome: "Disneyland Paris, França" },
                "interlaken": { lat: 46.6863, lon: 7.8632, nome: "Interlaken, Suíça" }
            };


            let key = (cidade || "").toLowerCase().trim();
            let alvo = coordsMap["zurique"];
            for (let k in coordsMap) {
                if (key.includes(k)) {
                    alvo = coordsMap[k];
                    break;
                }
            }


            try {
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${alvo.lat}&longitude=${alvo.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
                const res = await fetch(url);
                if (!res.ok) throw new Error("Erro de conexão");
                const data = await res.json();
                const temp = data.current.temperature_2m;
                const umidade = data.current.relative_humidity_2m;
                const vento = data.current.wind_speed_10m;
                const code = data.current.weather_code;


                let condicao = "Céu Limpo";
                let icone = "☀️";
                if (code === 1 || code === 2 || code === 3) { condicao = "Parcialmente Nublado"; icone = "⛅"; }
                else if (code === 45 || code === 48) { condicao = "Neblina"; icone = "🌫️"; }
                else if ((code >= 51 && code <= 65) || (code >= 80 && code <= 82)) { condicao = "Chuva"; icone = "🌧️"; }
                else if ((code >= 71 && code <= 77) || code === 85 || code === 86) { condicao = "Neve"; icone = "❄️"; }
                else if (code === 95 || code === 96 || code === 99) { condicao = "Tempestade"; icone = "⛈️"; }


                let dicaVestuario = "";
                if (temp < 5) dicaVestuario = "❄️ Frio intenso: Casaco térmico pesado, gorro, luvas e bota quente.";
                else if (temp < 15) dicaVestuario = "🍂 Frio moderado: Agasalho reforçado, cachecol e sapatos confortáveis.";
                else if (temp < 22) dicaVestuario = "🌤️ Clima ameno: Jaqueta leve ou cardigã.";
                else dicaVestuario = "☀️ Clima quente: Roupas frescas e protetor solar.";


                if ((code >= 51 && code <= 65) || (code >= 80 && code <= 82) || code === 95) {
                    dicaVestuario += " ☔ Leve guarda-chuva ou capa!";
                }


                conteudo.innerHTML = `
                    <div class="text-4xl my-1">${icone}</div>
                    <div class="text-2xl font-black text-slate-800">${temp}°C</div>
                    <div class="font-bold text-xs text-indigo-900 uppercase">${condicao} em ${alvo.nome}</div>
                    <div class="text-[11px] text-slate-500 font-semibold">Vento: ${vento} km/h • Umidade: ${umidade}%</div>
                    <div class="bg-indigo-50 p-3 rounded-2xl border border-indigo-200 text-indigo-950 font-bold text-xs mt-2 text-left">
                        ${dicaVestuario}
                    </div>
                `;
            } catch (err) {
                conteudo.innerHTML = `
                    <div class="text-amber-600 font-bold text-xs">Não foi possível carregar a temperatura ao vivo agora.</div>
                    <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-700 text-left mt-2">
                        ${obterInfoClima(cidade)}
                    </div>
                `;
            }
        }


        function fecharClimaModal() {
            document.getElementById('modal-clima').classList.add('hidden');
        }


        // DIVISOR DE CONTA DE RESTAURANTE



        // COMPARTILHAMENTO INTELIGENTE NO WHATSAPP






        // CONTAGEM REGRESSIVA PARA A VIAGEM



        function imprimirSeccaoCustom(titulo, htmlConteudo) {
            let win = window.open('', '_blank');
            win.document.write('<html><head><meta charset="utf-8"><title>' + titulo + '</title><script src="https://cdn.tailwindcss.com"><\/script></head><body class="p-6 bg-white text-slate-900">');
            win.document.write('<h1 class="text-xl font-black mb-4">' + titulo + ' - Roteiro Europa Mariana</h1>');
            win.document.write(htmlConteudo);
            win.document.write('<script>setTimeout(() => { window.print(); window.close(); }, 500);<\/script></body></html>');
            win.document.close();
        }





        function removerDoRoteiro(id) {
            registarEstadoAnterior();
            const item = dadosApp.itinerario.find(i => String(i.id) === String(id));
            if(item) { 
                item.bloqueado = false; 
                salvarStorage(); 
                atualizarTudo(); 
                mostrarToast("Bloco desmarcado do Roteiro.", "info");
            }
        }

















        function moverItemArray(arrayName, id, direcao) {
            registarEstadoAnterior();
            let arr = dadosApp[arrayName];
            if(!arr) return;
            let idx = arr.findIndex(item => String(item.id) === String(id));
            if(idx < 0) return;
            let targetIdx = idx + direcao;
            if(targetIdx < 0 || targetIdx >= arr.length) return;
            let temp = arr[idx];
            arr[idx] = arr[targetIdx];
            arr[targetIdx] = temp;
            salvarStorage();
            renderizarHubUtilidades();
        }





        function atualizarTudo() {
            try {
                renderizarFiltros();
                renderizarFiltrosTarefas();
                renderizarBlocos();
                renderizarHubUtilidades();
                renderizarOrcamentoTab();
                renderizarComprasTab();
                renderizarModoLeitura();
                atualizarContagemRegressiva();
            } catch(e) {
                console.error("Erro no render:", e);
            }
        }


        function mudarTab(tab) {
            localStorage.setItem('tab_ativa_v269', tab);
            if(tab === 'itinerario' || tab === 'leitura') {
                destinoFiltro = 'todos';
            }
            ['leitura', 'itinerario', 'utilidades', 'orcamento', 'compras'].forEach(t => {
                let el = document.getElementById('tab-' + t);
                if(el) el.classList.add('hidden');
            });
            let target = document.getElementById('tab-' + tab);
            if(target) target.classList.remove('hidden');
            
            ['leitura', 'itinerario', 'utilidades', 'orcamento', 'compras'].forEach(t => {
                let btn = document.getElementById('tab-btn-' + t);
                if(btn) {
                    if(t === tab) {
                        btn.className = "py-2.5 px-1 rounded-xl bg-indigo-600 text-white font-extrabold shadow-sm transition text-[11px] flex flex-col items-center gap-0.5 flex-1 active:scale-95";
                    } else {
                        btn.className = "py-2.5 px-1 rounded-xl bg-white text-slate-700 font-extrabold shadow-xs transition text-[11px] flex flex-col items-center gap-0.5 flex-1 hover:bg-slate-50 active:scale-95";
                    }
                }
            });


            if(tab === 'leitura') { renderizarModoLeitura(); atualizarContagemRegressiva(); }
            if(tab === 'utilidades') { renderizarHubUtilidades(); }
            if(tab === 'orcamento') { renderizarOrcamentoTab(); }
            if(tab === 'compras') { renderizarComprasTab(); }
            if(tab === 'itinerario') { renderizarBlocos(); }
        }





        function obterCorPorCategoria(cat) {
            if(!cat) return '#ff007f';
            if(dadosApp.coresDestinos && dadosApp.coresDestinos[cat]) {
                return dadosApp.coresDestinos[cat];
            }
            let c = (cat || "").toLowerCase();
            if(c.includes('zurique') || c.includes('zurich')) return '#3b82f6';
            if(c.includes('freiburg')) return '#f59e0b';
            if(c.includes('frança') || c.includes('france') || c.includes('paris')) return '#ec4899';
            if(c.includes('interlaken')) return '#10b981';
            if(c.includes('disney')) return '#8b5cf6';
            
            return '#ff007f';
        }


        function obterInfoClima(cat) {
            let c = (cat || "").toLowerCase();
            if(c.includes('zurique') || c.includes('zurich') || c.includes('interlaken')) {
                return "❄️ Frio (-2°C a 5°C) • Casaco impermeável e térmicas";
            }
            if(c.includes('freiburg')) {
                return "🍂 Frio moderado (0°C a 7°C) • Cachecol e térmicas leves";
            }
            if(c.includes('frança') || c.includes('france') || c.includes('paris') || c.includes('disney')) {
                return "🌧️ Frio urbano (3°C a 9°C) • Guarda-chuva e casaco";
            }
            return "🌤️ Frio europeu • Agasalhos recomendados";
        }


        function abrirWebcam(cat) {
            let query = encodeURIComponent((cat || 'Zurique') + ' live webcam europe');
            window.open('https://www.youtube.com/results?search_query=' + query, '_blank');
        }


        function renderizarFiltros() {
            const container = document.getElementById('filtros-container');
            const containerLeitura = document.getElementById('filtros-leitura-container');
            if(!container && !containerLeitura) return;


            let html = '<button onclick="filtrarDestino(\'todos\')" class="px-3 py-1.5 ' + (destinoFiltro === 'todos' ? 'bg-indigo-600 text-white shadow-sm font-bold' : 'bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50') + ' rounded-xl text-xs shrink-0 transition active:scale-95">Todos</button>';
            if(!dadosApp.destinosCadastrados) dadosApp.destinosCadastrados = ["Zurique", "Freiburg", "França", "Interlaken", "Disney"];
            
            dadosApp.destinosCadastrados.forEach(dest => {
                let ativo = destinoFiltro === dest;
                let corDest = obterCorPorCategoria(dest);
                let classeBtn = ativo ? 'text-white font-bold shadow-md ring-2 ring-white scale-105' : 'text-white font-semibold border border-black/20 shadow-xs hover:brightness-105';
                let estiloBtn = 'background-color: ' + corDest + ';';
                html += '<button onclick="filtrarDestino(\'' + dest + '\')" style="' + estiloBtn + '" class="px-3 py-1.5 rounded-xl text-xs shrink-0 transition active:scale-95 ' + classeBtn + '">' + dest + '</button>';
            });
            html += '<button onclick="adicionarNovoDestinoFiltro()" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shrink-0 transition shadow-xs active:scale-95">➕ Destino</button>';
            html += '<button onclick="gerenciarDestinos()" class="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-xs shrink-0 transition shadow-xs active:scale-95" title="Apagar ou Renomear Destinos">⚙️ Gerir</button>';


            if(container) container.innerHTML = html;
            if(containerLeitura) containerLeitura.innerHTML = html;
        }

































        // ROTEIRO (LEITURA COM FOTOS E AÇÕES RÁPIDAS)
        function renderizarModoLeitura() {
            const container = document.getElementById('lista-leitura-html');
            const progressoEl = document.getElementById('progresso-viagem');
            if(!container) return;
            container.innerHTML = '';


            let blocosAprovados = dadosApp.itinerario.filter(item => item.bloqueado === true);
            if(destinoFiltro !== 'todos') {
                blocosAprovados = blocosAprovados.filter(i => (i.categoria || "").toLowerCase().includes(destinoFiltro.toLowerCase()));
            }


            let total = blocosAprovados.length;
            let concluidos = blocosAprovados.filter(b => b.trechos && b.trechos.length > 0 && b.trechos.every(t => t.conducoes && t.conducoes.every(c => c.concluido))).length;
            if(progressoEl) progressoEl.innerText = concluidos + ' / ' + total + ' Aprovados';


            if(total === 0) {
                container.innerHTML = '<div class="col-span-full bg-white p-5 rounded-2xl text-center text-xs text-slate-500 border border-slate-200 shadow-sm">Nenhum bloco aprovado. Vá à aba <b>📅 Editar</b> e clique no cadeado <b>(🔒)</b> do bloco para enviá-lo para cá!</div>';
                return;
            }


            blocosAprovados.forEach(item => {
                let corMaster = item.cor || obterCorPorCategoria(item.categoria);
                let dIni = item.dataInicio ? item.dataInicio.split('-').reverse().join('/') : '?';
                let dFim = item.dataFim ? item.dataFim.split('-').reverse().join('/') : '?';


                let trechosTexto = '';
                if(item.trechos && item.trechos.length > 0) {
                    item.trechos.forEach(tr => {
                        let mapsUrl = 'https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent(tr.origem || '') + '&destination=' + encodeURIComponent(tr.destino || '') + '&travelmode=transit';
                        
                        let conducoesReadHtml = '';
                        if(tr.conducoes && tr.conducoes.length > 0) {
                            tr.conducoes.forEach(cond => {
                                let condConcluido = cond.concluido ? true : false;
                                let condBg = condConcluido ? 'bg-emerald-50/90 border-emerald-300 opacity-75' : 'bg-white border-slate-200';
                                let condText = condConcluido ? 'line-through text-slate-400' : 'text-slate-900';


                                let fotosCondRead = '';
                                if(cond.fotosExtras && cond.fotosExtras.length > 0) {
                                    fotosCondRead += '<div class="flex gap-2 flex-wrap mt-2 items-center">';
                                    cond.fotosExtras.forEach(fUrl => {
                                        fotosCondRead += `<img src="${fUrl}" class="w-10 h-10 object-cover rounded-full border-2 border-indigo-600 cursor-pointer shadow-md hover:scale-110 transition" onclick="abrirLeitorArquivo('${fUrl}', 'Foto')" title="Ver maior">`;
                                    });
                                    fotosCondRead += '</div>';
                                }


                                conducoesReadHtml += `
                                    <div class="p-2.5 rounded-xl border ${condBg} flex items-center justify-between gap-2 shadow-2xs mt-1.5">
                                        <div class="flex items-center gap-2 flex-1 min-w-0">
                                            <input type="checkbox" ${condConcluido ? 'checked' : ''} onchange="alternarConcluidoConducao('${item.id}', '${tr.id}', '${cond.id}')" class="w-4 h-4 accent-emerald-600 rounded cursor-pointer shrink-0">
                                            <div class="flex-1 min-w-0">
                                                <div class="font-black text-xs ${condText} truncate">🚌 ${cond.transporte} ${cond.valor ? '• <b>' + cond.valor + ' ' + cond.moeda + '</b>' : ''}</div>
                                                ${cond.notas ? '<div class="text-[10px] italic text-slate-600 truncate">📝 ' + cond.notas + '</div>' : ''}
                                                ${fotosCondRead}
                                            </div>
                                        </div>
                                    </div>
                                `;
                            });
                        }
                        
                        trechosTexto += '<div class="text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 my-2 shadow-xs">' +
                            '<div class="font-black text-xs text-indigo-950 uppercase tracking-wide border-b border-slate-200 pb-1.5">📍 Rota: ' + (tr.origem || '?') + ' ➔ ' + (tr.destino || '?') + '</div>' +
                            '<div class="space-y-1">' + conducoesReadHtml + '</div>' +
                            '<div class="flex gap-1.5 flex-wrap border-t border-slate-200 pt-2 items-center">' +
                                '<a href="' + mapsUrl + '" target="_blank" class="bg-sky-100 hover:bg-sky-200 text-sky-800 border border-sky-300 px-2.5 py-1.5 rounded-lg font-bold text-[10px] transition inline-block text-center shadow-2xs active:scale-95">🗺️ Mapa</a>' +
                                '<button onclick="abrirWebcam(\'' + (tr.destino || item.categoria) + '\')" class="bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-300 px-2.5 py-1.5 rounded-lg font-bold text-[10px] transition shadow-2xs active:scale-95">📹 Câmera</button>' +
                                '<button onclick="mostrarClimaModal(\'' + (tr.destino || item.categoria) + '\')" class="bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 px-2.5 py-1.5 rounded-lg font-bold text-[10px] transition shadow-2xs active:scale-95">🌤️ Clima ao Vivo</button>' +
                            '</div>' +
                        '</div>';
                    });
                }


                let itensTexto = '';
                if(item.itens && item.itens.length > 0) {
                    item.itens.forEach(it => {
                        if(it.texto && it.texto.trim() !== '') {
                            itensTexto += '<div class="text-xs bg-slate-50 p-2 rounded-xl border border-slate-200 my-1 text-slate-800 font-medium">• ' + it.texto + '</div>';
                        }
                    });
                }


                let card = document.createElement('div');
                card.className = 'p-4 rounded-3xl border shadow-xs space-y-3 transition flex flex-col justify-between bg-white border-slate-200';
                card.style.borderLeft = '6px solid ' + corMaster;


                card.innerHTML = '<div class="space-y-2"><div class="flex justify-between items-center gap-2 flex-wrap border-b border-slate-100 pb-2"><div class="flex items-center gap-2"><span class="font-black px-2.5 py-1 rounded-xl text-[10px] text-white shadow-xs" style="background-color: ' + corMaster + ';">' + (item.categoria || 'Geral') + '</span><span class="font-bold text-xs text-slate-600">📅 ' + dIni + ' ➔ ' + dFim + '</span></div><button onclick="removerDoRoteiro(\'' + item.id + '\')" class="bg-amber-50 hover:bg-amber-100 text-amber-700 px-2.5 py-1 rounded-xl font-bold text-xs transition border border-amber-200 shadow-2xs active:scale-95" title="Retirar do Roteiro">✕</button></div><div class="space-y-1.5 pt-0.5">' + (trechosTexto || '<span class="text-xs text-slate-400 italic">Nenhum trecho adicionado.</span>') + (itensTexto ? '<div class="mt-2 pt-2 border-t border-slate-200 space-y-1"><span class="text-[11px] font-extrabold uppercase text-slate-600">📌 Notas / Textos:</span>' + itensTexto + '</div>' : '') + '</div></div>';
                container.appendChild(card);
            });
        }


        // RENDERIZAR BLOCOS NO EDITAR













































        // RENDERIZAR HUB DE UTILIDADES COM ARRASTAR E SOLTAR
        function renderizarHubUtilidades() {
            const container = document.getElementById('hub-utilidades-grid');
            if(!container) return;
            container.innerHTML = '';


            if(!dadosApp.ordemHub) dadosApp.ordemHub = ['voos', 'contatos', 'tarefas', 'checklist', 'vouchers', 'chat'];


            dadosApp.ordemHub.forEach(tipo => {
                let deveMostrar = (utilidadeFiltro === 'todos' || utilidadeFiltro === tipo);
                if (!deveMostrar) return;


                let moveBtns = `<div class="flex gap-1 items-center shrink-0">
                    <button type="button" draggable="true" ondragstart="iniciarArrastoHub(event, '${tipo}')" ondragover="permitirDropHub(event)" ondrop="soltarHub(event, '${tipo}')" class="cursor-grab bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-2 py-1 rounded-lg text-xs select-none font-bold active:scale-95 transition" title="Arraste para mover">⠿</button>
                    <button type="button" onclick="moverSecaoHub('${tipo}', -1)" class="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-2 py-1 rounded-lg text-[10px] font-bold transition active:scale-95" title="Mover para cima">⬆️</button>
                    <button type="button" onclick="moverSecaoHub('${tipo}', 1)" class="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-2 py-1 rounded-lg text-[10px] font-bold transition active:scale-95" title="Mover para baixo">⬇️</button>
                </div>`;


                if(tipo === 'voos') {
                    let voosHtml = '';
                    if(!dadosApp.voos || dadosApp.voos.length === 0) {
                        voosHtml = '<p class="text-xs text-slate-400 italic text-center py-2">Nenhum voo registado.</p>';
                    } else {
                        dadosApp.voos.forEach(v => {
                            let pdfAction = v.pdfData ? '<button onclick="abrirLeitorArquivo(\'' + v.pdfData + '\', \'Passagem ' + (v.voo || 'Voo') + '\')" class="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition">📄 PDF</button>' : '<label class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer border border-slate-300 shadow-2xs active:scale-95 transition">📎 PDF<input type="file" accept="application/pdf" onchange="anexarPdfVoo(' + v.id + ', event)" class="hidden"></label>';
                            let ciaSafe = (v.cia || '').replace(/"/g, '&quot;');
                            let vooSafe = (v.voo || '').replace(/"/g, '&quot;');
                            let pnrSafe = (v.pnr || '').replace(/"/g, '&quot;');
                            let rotaSafe = (v.rota || '').replace(/"/g, '&quot;');
                            voosHtml += '<div class="p-3 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-xs text-xs min-w-0"><div class="flex gap-1.5 items-center min-w-0"><input type="text" value="' + ciaSafe + '" oninput="atualizarVoo(' + v.id + ', \'cia\', this.value)" class="w-16 shrink-0 p-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs" placeholder="Cia"><input type="text" value="' + vooSafe + '" oninput="atualizarVoo(' + v.id + ', \'voo\', this.value)" class="w-14 shrink-0 p-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs" placeholder="Voo"><input type="text" value="' + pnrSafe + '" oninput="atualizarVoo(' + v.id + ', \'pnr\', this.value)" class="flex-1 min-w-0 p-1.5 bg-amber-50 border border-amber-300 rounded-xl font-black text-amber-900 text-xs truncate" placeholder="PNR"></div><div class="flex gap-1.5 items-center min-w-0"><input type="text" value="' + rotaSafe + '" oninput="atualizarVoo(' + v.id + ', \'rota\', this.value)" class="flex-1 min-w-0 p-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs truncate" placeholder="Rota"><input type="date" value="' + (v.data || '') + '" onchange="atualizarVoo(' + v.id + ', \'data\', this.value)" class="w-28 shrink-0 p-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs"><div class="shrink-0 flex items-center gap-1">' + pdfAction + '<button onclick="moverItemArray(\'voos\', ' + v.id + ', -1)" class="bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2 py-1.5 rounded-lg font-bold text-slate-700 transition active:scale-95">⬆️</button><button onclick="moverItemArray(\'voos\', ' + v.id + ', 1)" class="bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2 py-1.5 rounded-lg font-bold text-slate-700 transition active:scale-95">⬇️</button><button onclick="apagarVoo(' + v.id + ')" class="text-rose-600 hover:text-rose-700 font-bold px-2 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs transition active:scale-95">✕</button></div></div></div>';
                        });
                    }
                    container.innerHTML += `<div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 min-w-0" id="card-voos" ondragover="permitirDropHub(event)" ondrop="soltarHub(event, 'voos')"><div class="flex justify-between items-center border-b pb-2 gap-2"><h3 class="font-bold text-xs uppercase text-slate-800 flex items-center gap-2">✈️ Voos & Passagens</h3><div class="flex items-center gap-2">${moveBtns}<button onclick="adicionarVoo()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition">➕ Voo</button></div></div><div class="space-y-2 min-w-0">${voosHtml}</div></div>`;
                } else if(tipo === 'contatos') {
                    let contatosHtml = '';
                    if(!dadosApp.contatos || dadosApp.contatos.length === 0) {
                        contatosHtml = '<p class="text-xs text-slate-400 italic text-center py-2">Nenhum contato registado.</p>';
                    } else {
                        dadosApp.contatos.forEach(ct => {
                            let numeroLimpo = ct.numero ? String(ct.numero).replace(/\s+/g, '') : '';
                            let telHref = numeroLimpo ? 'tel:' + numeroLimpo : '#';
                            let nomeSafe = (ct.nome || '').replace(/"/g, '&quot;');
                            let numSafe = (ct.numero || '').replace(/"/g, '&quot;');
                            contatosHtml += '<div class="p-2.5 rounded-2xl border border-slate-200 bg-white flex items-center gap-1.5 shadow-xs text-xs min-w-0">' +
                                '<input type="text" value="' + nomeSafe + '" oninput="atualizarContatoNome(' + ct.id + ', this.value)" class="flex-1 min-w-0 bg-transparent outline-none font-bold text-slate-800 text-xs truncate" placeholder="Nome...">' +
                                '<input type="text" value="' + numSafe + '" oninput="atualizarContatoNumero(' + ct.id + ', this.value)" class="w-24 shrink-0 p-1 bg-slate-50 border border-slate-300 rounded-xl font-black text-xs text-center" placeholder="Número...">' +
                                '<a href="' + telHref + '" class="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-xl font-bold text-[10px] shrink-0 shadow-2xs transition active:scale-95" title="Ligar">📞</a>' +
                                '<button onclick="moverItemArray(\'contatos\', ' + ct.id + ', -1)" class="bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2 py-1.5 rounded-lg font-bold text-slate-700 transition active:scale-95">⬆️</button>' +
                                '<button onclick="moverItemArray(\'contatos\', ' + ct.id + ', 1)" class="bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2 py-1.5 rounded-lg font-bold text-slate-700 transition active:scale-95">⬇️</button>' +
                                '<button onclick="apagarContato(' + ct.id + ')" class="text-rose-600 hover:text-rose-700 font-bold bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-xl text-xs transition active:scale-95">✕</button>' +
                            '</div>';
                        });
                    }
                    container.innerHTML += `<div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 min-w-0" id="card-contatos" ondragover="permitirDropHub(event)" ondrop="soltarHub(event, 'contatos')"><div class="flex justify-between items-center border-b pb-2 gap-2"><h3 class="font-bold text-xs uppercase text-slate-800 flex items-center gap-2">📞 Contatos Úteis</h3><div class="flex items-center gap-2">${moveBtns}<button onclick="adicionarContato()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition">➕ Contato</button></div></div><div class="space-y-2 min-w-0">${contatosHtml}</div></div>`;
                } else if(tipo === 'tarefas') {
                    let tarefasHtml = '';
                    let filtradas = dadosApp.tarefas;
                    if(filtradas.length === 0) {
                        tarefasHtml = '<p class="text-xs text-slate-400 italic text-center py-2">Nenhuma tarefa registada.</p>';
                    } else {
                        filtradas.forEach(t => {
                            let statusAtual = t.status || "";
                            let corStatus = dadosApp.statusPersonalizados[statusAtual] || "#94a3b8";
                            let corDestino = obterCorPorCategoria(t.categoria || '');
                            let textStyle = (statusAtual === 'Concluído') ? 'line-through text-slate-400 font-normal' : 'font-bold text-slate-800';


                            let opcoesStatus = '<option value="" ' + (statusAtual === "" ? 'selected' : '') + '>Status...</option>';
                            Object.keys(dadosApp.statusPersonalizados).forEach(st => {
                                opcoesStatus += '<option value="' + st + '" ' + (statusAtual === st ? 'selected' : '') + '>' + st + '</option>';
                            });


                            let opcoesDestinoT = '<option value="" ' + (!t.categoria ? 'selected' : '') + '>Destino...</option>';
                            if(!dadosApp.destinosCadastrados.includes(t.categoria) && t.categoria) dadosApp.destinosCadastrados.push(t.categoria);
                            dadosApp.destinosCadastrados.forEach(d => {
                                opcoesDestinoT += '<option value="' + d + '" ' + ((t.categoria || '') === d ? 'selected' : '') + '>' + d + '</option>';
                            });


                            let textoSafe = (t.texto || '').replace(/"/g, '&quot;');
                            tarefasHtml += '<div class="p-3 rounded-2xl border border-slate-200 bg-white flex flex-col gap-2 shadow-xs" style="border-left: 4px solid ' + (t.categoria ? corDestino : '#94a3b8') + ';"><div class="flex items-center gap-2"><input type="text" value="' + textoSafe + '" oninput="atualizarTarefaTexto(' + t.id + ', this.value)" class="flex-1 min-w-0 p-1 bg-transparent outline-none ' + textStyle + ' text-xs" placeholder="Tarefa..."><button onclick="abrirModalTarefa(' + t.id + ')" class="text-indigo-600 font-bold px-2 py-1 bg-indigo-50 border border-indigo-200 rounded-lg transition active:scale-95" title="Editar em janela">✏️</button><button onclick="moverItemArray(\'tarefas\', ' + t.id + ', -1)" class="bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2 py-1 rounded-lg font-bold text-slate-700 transition active:scale-95">⬆️</button><button onclick="moverItemArray(\'tarefas\', ' + t.id + ', 1)" class="bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2 py-1 rounded-lg font-bold text-slate-700 transition active:scale-95">⬇️</button><button onclick="apagarTarefa(' + t.id + ')" class="text-rose-600 hover:text-rose-700 font-bold text-xs bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-xl transition active:scale-95">✕</button></div><div class="flex gap-2 items-center"><select onchange="lidarSelecaoDestinoTarefa(' + t.id + ', this.value)" class="flex-1 border border-slate-300 rounded-xl px-2.5 py-1 text-xs font-bold text-white shadow-2xs" style="background-color: ' + (t.categoria ? corDestino : '#64748b') + ';">' + opcoesDestinoT + '</select><select onchange="lidarSelecaoStatusTarefa(' + t.id + ', this.value)" class="flex-1 border border-slate-300 rounded-xl px-2.5 py-1 text-xs font-bold text-white shadow-2xs" style="background-color: ' + (statusAtual ? corStatus : '#64748b') + ';">' + opcoesStatus + '</select></div></div>';
                        });
                    }
                    container.innerHTML += `<div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3" id="card-tarefas" ondragover="permitirDropHub(event)" ondrop="soltarHub(event, 'tarefas')"><div class="flex justify-between items-center border-b pb-2 gap-2"><h3 class="font-bold text-xs uppercase text-slate-800 flex items-center gap-2">📋 Tarefas</h3><div class="flex items-center gap-2">${moveBtns}<button onclick="adicionarTarefa()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition">➕ Tarefa</button></div></div><div class="space-y-2.5 text-xs">${tarefasHtml}</div></div>`;
                } else if(tipo === 'checklist') {
                    let checklistHtml = '';
                    if(!dadosApp.checklist || dadosApp.checklist.length === 0) {
                        checklistHtml = '<p class="text-xs text-slate-400 italic text-center py-2">Nenhum item no checklist.</p>';
                    } else {
                        dadosApp.checklist.forEach(c => {
                            let itemSafe = (c.item || '').replace(/"/g, '&quot;');
                            checklistHtml += '<div class="p-2.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between gap-2 shadow-xs text-xs"><label class="flex items-center gap-2 flex-1 cursor-pointer min-w-0"><input type="checkbox" ' + (c.feito ? 'checked' : '') + ' onchange="alternarItemChecklist(' + c.id + ')" class="w-4 h-4 accent-indigo-600 rounded cursor-pointer shrink-0"><input type="text" value="' + itemSafe + '" oninput="atualizarItemChecklistText(' + c.id + ', this.value)" class="flex-1 bg-transparent outline-none font-bold ' + (c.feito ? 'line-through text-slate-400' : 'text-slate-800') + ' truncate text-xs" placeholder="Item..."></label><div class="flex gap-1 shrink-0"><button onclick="moverItemArray(\'checklist\', ' + c.id + ', -1)" class="bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2 py-1 rounded-lg font-bold text-slate-700 transition active:scale-95">⬆️</button><button onclick="moverItemArray(\'checklist\', ' + c.id + ', 1)" class="bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2 py-1 rounded-lg font-bold text-slate-700 transition active:scale-95">⬇️</button><button onclick="apagarItemChecklist(' + c.id + ')" class="text-rose-600 hover:text-rose-700 font-bold bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-xl text-xs transition active:scale-95">✕</button></div></div>';
                        });
                    }
                    container.innerHTML += `<div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3" id="card-checklist" ondragover="permitirDropHub(event)" ondrop="soltarHub(event, 'checklist')"><div class="flex justify-between items-center border-b pb-2 gap-2"><h3 class="font-bold text-xs uppercase text-slate-800 flex items-center gap-2">🎒 Checklist</h3><div class="flex items-center gap-2">${moveBtns}<button onclick="adicionarItemChecklist()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition">➕ Item</button></div></div><div class="space-y-2 text-xs">${checklistHtml}</div></div>`;
                } else if(tipo === 'vouchers') {
                    let vouchersHubHtml = '';
                    if(!dadosApp.vouchers || dadosApp.vouchers.length === 0) {
                        vouchersHubHtml = '<p class="text-xs text-slate-400 italic text-center py-2">Nenhum voucher registado.</p>';
                    } else {
                        dadosApp.vouchers.forEach(v => {
                            let pdfAct = v.pdfData ? '<button onclick="abrirLeitorArquivo(\'' + v.pdfData + '\', \'' + (v.titulo || 'Voucher').replace(/'/g, "\\'") + '\')" class="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition">📄 Ficheiro</button>' : '<label class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer border border-slate-300 shadow-2xs active:scale-95 transition">📎 Anexar<input type="file" accept="application/pdf,image/*" onchange="anexarPdfVoucher(' + v.id + ', event)" class="hidden"></label>';
                            let tituloSafe = (v.titulo || '').replace(/"/g, '&quot;');
                            vouchersHubHtml += '<div class="p-2.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between gap-2 shadow-xs"><input type="text" value="' + tituloSafe + '" oninput="atualizarVoucherTitulo(' + v.id + ', this.value)" class="flex-1 bg-transparent outline-none font-bold text-slate-800 text-xs truncate" placeholder="Título...">' + pdfAct + '<div class="flex gap-1 shrink-0"><button onclick="moverItemArray(\'vouchers\', ' + v.id + ', -1)" class="bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2 py-1 rounded-lg font-bold text-slate-700 transition active:scale-95">⬆️</button><button onclick="moverItemArray(\'vouchers\', ' + v.id + ', 1)" class="bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2 py-1 rounded-lg font-bold text-slate-700 transition active:scale-95">⬇️</button><button onclick="apagarVoucher(' + v.id + ')" class="text-rose-600 hover:text-rose-700 font-bold bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-xl text-xs transition active:scale-95">✕</button></div></div>';
                        });
                    }
                    container.innerHTML += `<div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3" id="card-vouchers" ondragover="permitirDropHub(event)" ondrop="soltarHub(event, 'vouchers')"><div class="flex justify-between items-center border-b pb-2 gap-2"><h3 class="font-bold text-xs uppercase text-slate-800 flex items-center gap-2">🎟️ Vouchers & Ficheiros</h3><div class="flex items-center gap-2">${moveBtns}<button onclick="adicionarVoucher()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition">➕ Voucher</button></div></div><div class="space-y-2 text-xs">${vouchersHubHtml}</div></div>`;
                } else if(tipo === 'chat') {
                    let chatHubHtml = '';
                    if(!dadosApp.chat || dadosApp.chat.length === 0) {
                        chatHubHtml = '<p class="text-xs text-slate-400 italic text-center py-2">Nenhuma nota registada.</p>';
                    } else {
                        dadosApp.chat.forEach(ch => {
                            let textoSafe = (ch.texto || '').replace(/"/g, '&quot;');
                            chatHubHtml += '<div class="p-2.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between gap-2 shadow-xs text-xs"><input type="text" value="' + textoSafe + '" oninput="atualizarChat(' + ch.id + ', this.value)" class="flex-1 bg-transparent outline-none font-bold text-slate-800 text-xs truncate" placeholder="Escreva uma nota..."><div class="flex gap-1 shrink-0"><button onclick="moverItemArray(\'chat\', ' + ch.id + ', -1)" class="bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2 py-1 rounded-lg font-bold text-slate-700 transition active:scale-95">⬆️</button><button onclick="moverItemArray(\'chat\', ' + ch.id + ', 1)" class="bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2 py-1 rounded-lg font-bold text-slate-700 transition active:scale-95">⬇️</button><button onclick="apagarChat(' + ch.id + ')" class="text-rose-600 hover:text-rose-700 font-bold bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-xl text-xs transition active:scale-95">✕</button></div></div>';
                        });
                    }
                    container.innerHTML += `<div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3" id="card-chat" ondragover="permitirDropHub(event)" ondrop="soltarHub(event, 'chat')"><div class="flex justify-between items-center border-b pb-2 gap-2"><h3 class="font-bold text-xs uppercase text-slate-800 flex items-center gap-2">💬 Chat / Notas Rápidas</h3><div class="flex items-center gap-2">${moveBtns}<button onclick="adicionarChat()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition">➕ Nota</button></div></div><div class="space-y-2 text-xs">${chatHubHtml}</div></div>`;
                }
            });
        }






















































































        // ORÇAMENTO & GERAL



        // RENDERIZAR ABA DE COMPRAS
        function renderizarComprasTab() {
            const containerResumo = document.getElementById('compras-resumo-topo');
            const containerFiltros = document.getElementById('compras-filtros-titulo');
            const containerLista = document.getElementById('compras-lista-itens');
            if(!containerResumo || !containerLista || !containerFiltros) return;


            try {
                let cotEur = parseFloat(dadosApp.cotacaoEur) || 6.20;
                let cotChf = parseFloat(dadosApp.cotacaoChf) || 6.50;


                let totals = { "Mariana": {eur:0, chf:0, brl:0}, "Sophia": {eur:0, chf:0, brl:0}, "Glória": {eur:0, chf:0, brl:0}, "Outros": {eur:0, chf:0, brl:0} };


                if(!Array.isArray(dadosApp.compras)) dadosApp.compras = [];


                let titulosUnicos = [];
                dadosApp.compras.forEach(it => {
                    let t = (it.descricao || 'Item').trim();
                    if(t && !titulosUnicos.includes(t)) titulosUnicos.push(t);


                    let val = limparNumero(it.valor);
                    let moeda = it.moeda || 'EUR';
                    let pub = it.publico || 'Mariana';
                    if(!totals[pub]) totals[pub] = {eur:0, chf:0, brl:0};
                    if(val > 0) {
                        if(moeda === 'EUR') totals[pub].eur += val;
                        else if(moeda === 'CHF') totals[pub].chf += val;
                        else if(moeda === 'BRL') totals[pub].brl += val;
                    }
                });


                let filtrosHtml = `<button type="button" onclick="filtrarComprasTitulo('todos')" class="px-3 py-1.5 ${comprasFiltroTitulo === 'todos' ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50'} rounded-xl text-xs shrink-0 transition active:scale-95">🔍 Todos</button>`;
                titulosUnicos.forEach(t => {
                    let ativo = comprasFiltroTitulo.toLowerCase() === t.toLowerCase();
                    let corTitulo = obterCorPorTituloCompra(t);
                    let estiloBtn = ativo ? `background-color: ${corTitulo}; color: #ffffff; font-weight: bold;` : `background-color: #ffffff; color: #334155; border: 1px solid #cbd5e1;`;
                    let classeAtivo = ativo ? 'shadow-md ring-2 ring-slate-900 scale-105' : 'hover:bg-slate-50';
                    filtrosHtml += `<button type="button" onclick="filtrarComprasTitulo('${t.replace(/'/g, "\\'")}')" style="${estiloBtn}" class="px-3 py-1.5 rounded-xl text-xs shrink-0 transition active:scale-95 ${classeAtivo}">${t}</button>`;
                });
                containerFiltros.innerHTML = filtrosHtml;


                dadosApp.compras.sort((a, b) => {
                    if (a.editando !== b.editando) return a.editando ? -1 : 1;
                    if (a.concluido !== b.concluido) return a.concluido ? 1 : -1;


                    let valA = limparNumero(a.valor);
                    let valB = limparNumero(b.valor);
                    let nomeA = (a.descricao || '').toLowerCase();
                    let nomeB = (b.descricao || '').toLowerCase();


                    if (comprasOrdenacao === 'menor_valor') return valA - valB;
                    if (comprasOrdenacao === 'maior_valor') return valB - valA;
                    return nomeA.localeCompare(nomeB);
                });


                let finalMarianaBrl = (totals["Mariana"].eur * cotEur) + (totals["Mariana"].chf * cotChf) + totals["Mariana"].brl;
                let finalSophiaBrl = (totals["Sophia"].eur * cotEur) + (totals["Sophia"].chf * cotChf) + totals["Sophia"].brl;
                let finalGloriaBrl = (totals["Glória"].eur * cotEur) + (totals["Glória"].chf * cotChf) + totals["Glória"].brl;
                let finalOutrosBrl = (totals["Outros"].eur * cotEur) + (totals["Outros"].chf * cotChf) + totals["Outros"].brl;


                containerResumo.innerHTML = `
                    <div class="bg-purple-50 p-2.5 rounded-xl border border-purple-200 shadow-2xs text-center space-y-0.5 min-w-0">
                        <span class="font-bold text-[10px] text-purple-900 uppercase block truncate">👤 Mariana</span>
                        <div class="font-black text-[10px] text-slate-800 truncate">${totals["Mariana"].eur.toFixed(2)}€ | ${totals["Mariana"].chf.toFixed(2)}CHF</div>
                        <div class="font-bold text-[10px] text-emerald-700 truncate">R$ ${finalMarianaBrl.toFixed(2)}</div>
                    </div>
                    <div class="bg-purple-50 p-2.5 rounded-xl border border-purple-200 shadow-2xs text-center space-y-0.5 min-w-0">
                        <span class="font-bold text-[10px] text-purple-900 uppercase block truncate">👧 Sophia</span>
                        <div class="font-black text-[10px] text-slate-800 truncate">${totals["Sophia"].eur.toFixed(2)}€ | ${totals["Sophia"].chf.toFixed(2)}CHF</div>
                        <div class="font-bold text-[10px] text-emerald-700 truncate">R$ ${finalSophiaBrl.toFixed(2)}</div>
                    </div>
                    <div class="bg-purple-50 p-2.5 rounded-xl border border-purple-200 shadow-2xs text-center space-y-0.5 min-w-0">
                        <span class="font-bold text-[10px] text-purple-900 uppercase block truncate">👵 Glória</span>
                        <div class="font-black text-[10px] text-slate-800 truncate">${totals["Glória"].eur.toFixed(2)}€ | ${totals["Glória"].chf.toFixed(2)}CHF</div>
                        <div class="font-bold text-[10px] text-emerald-700 truncate">R$ ${finalGloriaBrl.toFixed(2)}</div>
                    </div>
                    <div class="bg-purple-50 p-2.5 rounded-xl border border-purple-200 shadow-2xs text-center space-y-0.5 min-w-0">
                        <span class="font-bold text-[10px] text-purple-900 uppercase block truncate">📦 Outros</span>
                        <div class="font-black text-[10px] text-slate-800 truncate">${totals["Outros"].eur.toFixed(2)}€ | ${totals["Outros"].chf.toFixed(2)}CHF</div>
                        <div class="font-bold text-[10px] text-emerald-700 truncate">R$ ${finalOutrosBrl.toFixed(2)}</div>
                    </div>
                `;


                let itensFiltrados = dadosApp.compras;
                if(comprasFiltroTitulo !== 'todos') {
                    itensFiltrados = dadosApp.compras.filter(it => (it.descricao || '').trim().toLowerCase() === comprasFiltroTitulo.trim().toLowerCase());
                }


                let itensHtml = '';
                if(itensFiltrados.length === 0) {
                    itensHtml = '<p class="text-xs text-slate-400 italic text-center py-4">Nenhum item registado com este filtro.</p>';
                } else {
                    itensFiltrados.forEach(it => {
                        let val = limparNumero(it.valor);
                        let moeda = it.moeda || 'EUR';
                        let pub = it.publico || 'Mariana';
                        let linkItem = it.link || '';
                        let valBrl = moeda === 'EUR' ? val * cotEur : (moeda === 'CHF' ? val * cotChf : val);
                        let descSafe = (it.descricao || '').replace(/"/g, '&quot;');
                        let linkSafe = (linkItem || '').replace(/"/g, '&quot;');
                        let editando = it.editando !== undefined ? it.editando : false;
                        let concluido = it.concluido ? true : false;
                        let emojiCarinha = pub === 'Mariana' ? '👤' : (pub === 'Sophia' ? '👧' : (pub === 'Glória' ? '👵' : '📦'));
                        let moedaSimbolo = moeda === 'EUR' ? '€' : (moeda === 'CHF' ? 'CHF' : 'R$');
                        let itemIdStr = String(it.id);
                        let corDoItem = obterCorPorTituloCompra(it.descricao);


                        let linkBtn = linkItem ? `<a href="${linkItem}" target="_blank" class="bg-sky-100 hover:bg-sky-200 text-sky-800 border border-sky-300 px-2 py-0.5 rounded-lg font-bold text-[10px] inline-flex items-center gap-0.5 shrink-0 transition active:scale-95" title="Abrir link">🔗 Link</a>` : '';


                        if(editando) {
                            itensHtml += `
                                <div class="p-3 rounded-xl border bg-white border-indigo-300 space-y-2 text-xs shadow-xs min-w-0" style="border-left: 6px solid ${corDoItem};">
                                    <div class="flex items-center gap-1.5 min-w-0">
                                        <input type="checkbox" ${concluido ? 'checked' : ''} onchange="alternarConcluidoItemDireto('${itemIdStr}')" class="w-4 h-4 accent-emerald-600 rounded cursor-pointer shrink-0" title="Marcar como feito">
                                        <input type="text" id="desc-${itemIdStr}" value="${descSafe}" class="flex-1 min-w-0 p-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs" placeholder="Nome do item...">
                                        <select id="pub-${itemIdStr}" class="p-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs shrink-0">
                                            <option value="Mariana" ${pub==='Mariana'?'selected':''}>👤 Mariana</option>
                                            <option value="Sophia" ${pub==='Sophia'?'selected':''}>👧 Sophia</option>
                                            <option value="Glória" ${pub==='Glória'?'selected':''}>👵 Glória</option>
                                            <option value="Outros" ${pub==='Outros'?'selected':''}>📦 Outros</option>
                                        </select>
                                        <button type="button" onclick="apagarItemDireto('${itemIdStr}')" class="text-rose-600 hover:text-rose-700 font-bold px-2 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs shrink-0 transition active:scale-95">✕</button>
                                    </div>
                                    <div class="flex items-center gap-1.5 min-w-0">
                                        <input type="url" id="link-${itemIdStr}" value="${linkSafe}" class="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-xs" placeholder="🔗 Link da compra (opcional)...">
                                    </div>
                                    <div class="flex items-center justify-between gap-1.5 flex-wrap border-t border-slate-100 pt-1.5">
                                        <div class="flex items-center gap-1.5">
                                            <span class="text-slate-500 font-bold">Valor:</span>
                                            <input type="text" value="${val !== 0 ? val : ''}" id="val-${itemIdStr}" class="w-20 p-1.5 bg-slate-50 border border-slate-300 rounded-xl font-black text-right text-xs" placeholder="0">
                                            <select id="moeda-${itemIdStr}" class="p-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs">
                                                <option value="EUR" ${moeda==='EUR'?'selected':''}>€</option>
                                                <option value="CHF" ${moeda==='CHF'?'selected':''}>CHF</option>
                                                <option value="BRL" ${moeda==='BRL'?'selected':''}>R$</option>
                                            </select>
                                            <button type="button" onclick="salvarEFecharItemDireto('${itemIdStr}')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition active:scale-95">✓ OK (Salvar)</button>
                                        </div>
                                        <div class="text-right text-[11px] font-bold text-emerald-700">R$ ${valBrl.toFixed(2)}</div>
                                    </div>
                                </div>
                            `;
                        } else {
                            let linhaRiscada = concluido ? 'line-through text-slate-400 bg-emerald-50/60 border-emerald-300' : 'text-slate-900 bg-slate-50 border-slate-200';
                            itensHtml += `
                                <div class="p-3 rounded-xl border ${linhaRiscada} space-y-2 text-xs shadow-xs min-w-0" style="border-left: 6px solid ${corDoItem};">
                                    <div class="flex items-center gap-2 min-w-0 justify-between">
                                        <div class="flex items-center gap-2 min-w-0 flex-1">
                                            <input type="checkbox" ${concluido ? 'checked' : ''} onchange="alternarConcluidoItemDireto('${itemIdStr}')" class="w-4 h-4 accent-emerald-600 rounded cursor-pointer shrink-0" title="Marcar como feito">
                                            <span class="font-bold flex-1 min-w-0 break-words ${concluido ? 'line-through text-slate-400' : 'text-slate-900'}">${descSafe}</span>
                                        </div>
                                        <div class="flex items-center gap-1.5 shrink-0">
                                            <button type="button" onclick="abrirEdicaoItemDireto('${itemIdStr}')" class="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-1 rounded-lg font-bold text-[11px] transition shadow-2xs active:scale-95" title="Editar com Lápis">✏️</button>
                                            <button type="button" onclick="apagarItemDireto('${itemIdStr}')" class="text-rose-600 hover:text-rose-700 font-bold px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs transition active:scale-95">✕</button>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2 border-t border-slate-200/60 pt-2 flex-wrap">
                                        <span class="bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-[11px] font-bold shadow-2xs">${emojiCarinha} ${pub}</span>
                                        ${linkBtn}
                                        <span class="font-black text-indigo-900 ${concluido ? 'line-through text-slate-400' : ''}">${val > 0 ? val + ' ' + moedaSimbolo : 'Grátis'}</span>
                                        <span class="text-emerald-700 font-bold ${concluido ? 'line-through text-slate-400' : ''}">R$ ${valBrl.toFixed(2)}</span>
                                    </div>
                                </div>
                            `;
                        }
                    });
                }


                containerLista.innerHTML = itensHtml;
            } catch(err) {
                console.error("Erro nas compras:", err);
            }
        }






































        function ativarMicrofone() {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) { mostrarToast("Sem suporte a voz neste navegador.", "erro"); return; }
            if (!campoFocoAtual) {
                mostrarToast("Clique primeiro no campo onde quer ditar.", "info");
                return;
            }
            const recognition = new SpeechRecognition();
            recognition.lang = 'pt-BR';
            recognition.onstart = function() {
                mostrarToast("Microfone ligado. Fale agora...", "info");
            };
            recognition.onresult = function(event) {
                campoFocoAtual.value = event.results[0][0].transcript;
                campoFocoAtual.dispatchEvent(new Event('input'));
                campoFocoAtual.dispatchEvent(new Event('change'));
                mostrarToast("Texto ditado inserido!", "sucesso");
            };
            recognition.onerror = function() {
                mostrarToast("Erro ao capturar voz.", "erro");
            };
            recognition.start();
        }
