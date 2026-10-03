try{
(function(){
  function monta(){
    var tabs=document.getElementById('v273-tabs');
    if(!tabs||document.getElementById('v290-cal'))return;
    var b=document.createElement('button');b.id='v290-cal';b.type='button';
    b.className='py-2.5 px-1 rounded-xl bg-white text-slate-700 font-extrabold shadow-xs transition text-[11px] flex flex-col items-center gap-0.5 active:scale-95';
    b.innerHTML='<span>📅</span><span class="text-[8px] uppercase tracking-wider">Agenda</span>';
    b.setAttribute('aria-label','Abrir calendário');
    b.onclick=function(){if(window.v289AbrirCalendario)window.v289AbrirCalendario();else if(window.abrirCalendario)window.abrirCalendario()};
    tabs.appendChild(b);
  }
  monta();setTimeout(monta,600);setTimeout(monta,1800);
})();
}catch(e){console.error('[bloco com erro]',e)}
