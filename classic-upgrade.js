/* Randomised differences over the original Belanjawan artwork.
   The base image, logo and policy labels remain the original asset. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else {root.BelanjawanRandom=api;api.install();}
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const core=typeof module==='object'&&module.exports?require('./crisp-differences.js'):globalThis.BelanjawanDifferences;
  const {WIDTH,HEIGHT,pool,rng,shuffle,conflicts,select,prepare}=core;
  function install(){
    if(typeof document==='undefined'||typeof artwork==='undefined')return;
    const KEY='ibj-original-crisp-v4';let history=[],prepared=null,sequence=0,started=0;
    try{const h=JSON.parse(localStorage.getItem(KEY));if(Array.isArray(h))history=h.filter(a=>Array.isArray(a)&&a.every(x=>typeof x==='string')).slice(-20);}catch{}
    const intro=document.querySelector('header p');intro.textContent='Ilustrasi asal Belanjawan 2027. Setiap pusingan mempunyai 10 perbezaan rawak. Ketik perbezaan pada gambar bawah.';
    const hint=document.createElement('p');hint.id='random-note';hint.textContent='Cari objek tambahan, warna baharu, corak kain dan perubahan butiran yang jelas.';document.querySelector('.setup').after(hint);
    const label=document.createElement('p');label.id='round-info';$('game').prepend(label);
    const stop=document.createElement('button');stop.id='stop-round';stop.textContent='Tamatkan pusingan';$('reveal').before(stop);
    const guide=document.createElement('section');guide.id='answer-guide';guide.hidden=true;const title=document.createElement('h2');title.textContent='Jawapan pusingan ini';const list=document.createElement('ol');list.id='answer-list';guide.append(title,list);$('game').append(guide);
    const footer=document.createElement('footer');footer.innerHTML='<p>Jumlah dimainkan: <b id="budget-count">—</b> · <a href="https://ismailyjoe.github.io/belanjawan-2027-game/landing.html">← Kembali ke Menu Utama</a></p><p>© 2026 IBJ. All rights reserved. Made by IBJ.</p>';document.querySelector('main').append(footer);
    const style=document.createElement('style');style.textContent='#round-info{font-size:.84rem;font-weight:700;color:#536851}#random-note,footer{font-size:.87rem;color:#536851}footer{border-top:1px solid #d8d0bc;margin-top:25px;padding-top:10px}#answer-guide{border:1px solid #c6cfbb;border-radius:12px;padding:18px;margin-top:20px}#answer-guide h2{font:700 25px Georgia;margin:0 0 12px}#answer-list{padding-left:25px}#answer-list li{margin:0 0 10px;line-height:1.45}#answer-list small{display:block;color:#536851}button{min-height:42px}';document.head.append(style);
    function seed(){if(globalThis.crypto&&crypto.getRandomValues)return crypto.getRandomValues(new Uint32Array(1))[0];return Math.floor(Math.random()*4294967296);}
    function region(p){return (p.y<250?'Bahagian atas':p.y<500?'Bahagian tengah':'Bahagian bawah')+' · '+(p.x<328?'kiri':p.x<656?'tengah':'kanan');}
    function getReady(){
      if(prepared)return;
      if(!artwork.complete||!colourPatches.complete||!artwork.naturalWidth||!colourPatches.naturalWidth)throw Error('Gambar masih dimuatkan. Cuba sebentar lagi.');
      const base=document.createElement('canvas');base.width=W;base.height=H;base.getContext('2d').drawImage(artwork,0,0,W,H);
      prepared=prepare(base,colourPatches,(w,h)=>{const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;return canvas;});
      if(prepared.length<30)throw Error('Gambar perbezaan tidak lengkap. Sila muat semula halaman.');
      points.splice(0,points.length,...prepared);sets.splice(0,sets.length,[]);
    }
    draw=function(){
      if(round<0)return;
      canvases.forEach((canvas,panel)=>{
        const c=canvas.getContext('2d');c.setTransform(zoom,0,0,zoom,-offsetX,-offsetY);c.drawImage(artwork,0,0,W,H);
        if(panel===1)for(const i of sets[round]){const p=points[i];c.drawImage(p.sprite,p.sx,p.sy);}
        sets[round].forEach((i,n)=>{
          const p=points[i];if(!found.has(i)&&!answers)return;
          const color=found.has(i)?'#086648':'#a94f15';ring(c,p.x,p.y,p.r+7,color);
          c.beginPath();c.arc(p.x,p.y-p.r-7,9/zoom,0,Math.PI*2);c.fillStyle=color;c.fill();c.fillStyle='#fff9ec';c.font='700 '+11/zoom+'px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(String(n+1),p.x,p.y-p.r-7);c.textBaseline='alphabetic';
        });
        if(panel===1&&miss)ring(c,miss.x,miss.y,13/zoom,'#a8312d');
        if(panel===1&&cursor&&document.activeElement===canvas)ring(c,cursor.x,cursor.y,9/zoom,'#212d62');
      });
      $('reset').textContent=Number(zoom.toFixed(1))+'×';$('out').disabled=zoom<=1;$('in').disabled=zoom>=4;
    };
    finish=function(won,ended=false){
      if(phase!=='playing')return;
      phase=won?'won':ended?'ended':'expired';clearInterval(clock);stop.disabled=true;
      $('status').textContent=won?'Tahniah! Semua 10 perbezaan ditemui.':ended?'Pusingan ditamatkan. '+found.size+' daripada 10 ditemui.':'Masa tamat. '+found.size+' daripada 10 ditemui.';
      $('reveal').hidden=false;$('reveal').textContent='Lihat jawapan pusingan ini';
      $('restart').textContent='Pemain seterusnya';
    };
    begin=function(){
      try{getReady();const n=seed(),selected=select(prepared,n,history);history.push(selected.map(p=>p.id));history=history.slice(-20);try{localStorage.setItem(KEY,JSON.stringify(history));}catch{}
        clearInterval(clock);clearTimeout(missTimer);round=0;sets[0]=selected.map(p=>points.indexOf(p));
        found=new Set();phase='playing';answers=false;miss=null;cursor=null;deadline=0;zoom=1;offsetX=offsetY=0;roundToken++;started=performance.now();sequence++;
        $('game').hidden=false;$('start').hidden=true;$('reveal').hidden=true;guide.hidden=true;list.replaceChildren();stop.disabled=false;
        $('time').hidden=!$('timed').checked;$('time').textContent='05:00';$('restart').textContent='Cabaran baharu';
        label.textContent='Pusingan '+sequence+' · Set '+n.toString(36).toUpperCase()+' · 10 perbezaan rawak';
        $('status').textContent='Cubaan baharu, kombinasi baharu. Cubit untuk zum dan seret gambar untuk mengalih pandangan.';
        updateScore();draw();if($('timed').checked){deadline=started+300000;timeTick();clock=setInterval(timeTick,100);}
        count(true);
      }catch(e){$('status').textContent=e.message;$('game').hidden=false;}
    };
    $('start').onclick=()=>begin();$('restart').onclick=()=>begin();
    stop.onclick=()=>{timeTick();finish(false,true);};
    $('reveal').onclick=()=>{
      if(phase==='playing'||round<0)return;
      answers=true;guide.hidden=false;$('reveal').hidden=true;list.replaceChildren();
      sets[round].forEach(i=>{const p=points[i],li=document.createElement('li'),small=document.createElement('small');li.textContent=p.label;small.textContent=region(p)+' · '+(found.has(i)?'Ditemui':'Belum ditemui');li.append(small);list.append(li);});draw();
    };
    const counterURL='https://belanjawan-2027-games-default-rtdb.asia-southeast1.firebasedatabase.app/counters/cari_perbezaan.json';
    async function count(increment){try{const r=await fetch(counterURL,increment?{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({'.sv':{increment:1}})}:{cache:'no-store'});if(!r.ok)return;const value=await r.json();if(typeof value==='number')$('budget-count').textContent=new Intl.NumberFormat('ms-MY').format(value);}catch{}}
    count(false);
  }
  return {...core,install};
});
