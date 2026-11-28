(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else {root.BelanjawanRandom=api;api.install();}
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const SET_COUNT = 10;
  const KEY = 'ibj-belanjawan-set-cycle-v6';
  function install(){
    if(typeof document==='undefined'||typeof artwork==='undefined')return;
    $('timed').checked=true;
    let remaining=[], last=0, sequence=0, loading=false, comparison=null;
    try{
      const saved=JSON.parse(localStorage.getItem(KEY));
      if(saved && Array.isArray(saved.remaining)){
        remaining=[...new Set(saved.remaining.filter(id=>Number.isInteger(id)&&id>=1&&id<=SET_COUNT))];
        last=saved.last;
      }
    }catch{}
    const intro=document.querySelector('header p');intro.textContent='Ilustrasi asal Belanjawan 2027. Terdapat 10 set, dengan 10 perbezaan dalam setiap set. Ketik perbezaan pada gambar bawah.';
    const hint=document.createElement('p');hint.id='random-note';hint.textContent='Perhatikan perubahan warna, tekstur dan kemasan pada objek.';document.querySelector('.setup').after(hint);
    const label=document.createElement('p');label.id='round-info';$('game').prepend(label);
    const stop=document.createElement('button');stop.id='stop-round';stop.textContent='Tamatkan pusingan';$('reveal').before(stop);
    const guide=document.createElement('section');guide.id='answer-guide';guide.hidden=true;const title=document.createElement('h2');title.textContent='Jawapan pusingan ini';const list=document.createElement('ol');list.id='answer-list';guide.append(title,list);$('game').append(guide);
    const footer=document.createElement('footer');footer.innerHTML='<p>Jumlah dimainkan: <b id="budget-count">—</b> · <a href="https://ismailyjoe.github.io/belanjawan-2027-game/landing.html">← Kembali ke Menu Utama</a></p><p>© 2026 IBJ. All rights reserved. Made by IBJ.</p>';document.querySelector('main').append(footer);
    const style=document.createElement('style');style.textContent='#round-info{font-size:.84rem;font-weight:700;color:#536851}#random-note,footer{font-size:.87rem;color:#536851}footer{border-top:1px solid #d8d0bc;margin-top:25px;padding-top:10px}#answer-guide{border:1px solid #c6cfbb;border-radius:12px;padding:18px;margin-top:20px}#answer-guide h2{font:700 25px Georgia;margin:0 0 12px}#answer-list{padding-left:25px}#answer-list li{margin:0 0 10px;line-height:1.45}#answer-list small{display:block;color:#536851}button{min-height:42px}';document.head.append(style);
    function region(p){return (p.y<250?'Bahagian atas':p.y<500?'Bahagian tengah':'Bahagian bawah')+' · '+(p.x<328?'kiri':p.x<656?'tengah':'kanan');}
    function nextSet(){
      if(!remaining.length){
        remaining=Array.from({length:SET_COUNT},(_,i)=>i+1);
        for(let i=remaining.length-1;i>0;i--){
          const j=Math.floor(Math.random()*(i+1));
          [remaining[i],remaining[j]]=[remaining[j],remaining[i]];
        }
        if(remaining[0]===last) [remaining[0],remaining[1]]=[remaining[1],remaining[0]];
      }
      return remaining[0];
    }
    async function loadSet(id){
      const response=await fetch('sets/'+id+'.json?v=7');
      if(!response.ok)throw Error('Set tidak dapat dimuatkan.');
      const {width,height,answers,atlas}=await response.json();
      if(width!==artwork.naturalWidth||height!==artwork.naturalHeight||answers?.length!==10)throw Error('Set tidak lengkap.');
      const tiles=new Image();
      tiles.src=atlas;
      await tiles.decode();
      const image=document.createElement('canvas');
      image.width=width;
      image.height=height;
      const ctx=image.getContext('2d');
      ctx.drawImage(artwork,0,0);
      const areas=answers.map(({label,x,y,w,h,offset})=>{
        ctx.drawImage(tiles,0,offset,w,h,x,y,w,h);
        const halfWidth=w*W/width/2,halfHeight=h*H/height/2;
        return {label,x:x*W/width+halfWidth,y:y*H/height+halfHeight,halfWidth,halfHeight,r:Math.hypot(halfWidth,halfHeight)};
      });
      return {image,areas};
    }
    draw=function(){
      if(round<0)return;
      canvases.forEach((canvas,panel)=>{
        const c=canvas.getContext('2d');c.setTransform(zoom,0,0,zoom,-offsetX,-offsetY);c.drawImage(panel===1?comparison:artwork,0,0,W,H);
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
    guess=function(x,y){
      timeTick();
      if(phase!=='playing')return;
      let closest=null, best=Infinity;
      for(const [i,p] of points.entries()){
        const distance=Math.hypot(Math.max(0,Math.abs(x-p.x)-p.halfWidth),Math.max(0,Math.abs(y-p.y)-p.halfHeight));
        if(distance<=8&&distance<best){closest=i;best=distance;}
      }
      if(closest!==null){
        if(found.has(closest))return;
        found.add(closest);updateScore();miss=null;
        $('status').textContent='Perbezaan ditemui!';
        if(found.size===total)finish(true);
        draw();
      }else{
        miss={x,y};$('status').textContent='Cuba lagi.';
        clearTimeout(missTimer);missTimer=setTimeout(()=>{miss=null;draw()},350);draw();
      }
    };
    begin=async function(){
      if(loading)return;
      loading=true;
      const button=round<0?$('start'):$('restart');
      const previousText=button.textContent;
      button.disabled=true;button.textContent='Memuatkan set…';
      try{
        const id=nextSet();
        const {image,areas}=await loadSet(id);
        remaining.shift();last=id;
        try{localStorage.setItem(KEY,JSON.stringify({remaining,last}));}catch{}
        clearInterval(clock);clearTimeout(missTimer);
        comparison=image;round=0;
        points.splice(0,points.length,...areas);sets[0]=areas.map((_,i)=>i);
        found=new Set();phase='playing';answers=false;miss=null;cursor=null;deadline=0;zoom=1;offsetX=offsetY=0;roundToken++;sequence++;
        $('game').hidden=false;$('start').hidden=true;$('reveal').hidden=true;guide.hidden=true;list.replaceChildren();stop.disabled=false;
        $('time').hidden=!$('timed').checked;$('time').textContent='03:00';
        label.textContent='Pusingan '+sequence+' · 10 perbezaan';
        $('status').textContent='Cubit untuk zum dan seret gambar untuk mengalih pandangan.';
        updateScore();draw();if($('timed').checked){deadline=performance.now()+180000;timeTick();clock=setInterval(timeTick,100);}
        count(true);
      }catch{
        const message='Set gagal dimuatkan. Cuba lagi.';
        if(round<0)hint.textContent=message;
        else $('status').textContent=message;
      }finally{
        loading=false;button.disabled=false;
        button.textContent=phase==='playing'&&round>=0?'Cabaran baharu':previousText;
        if(round>=0&&phase==='playing')$('restart').textContent='Cabaran baharu';
      }
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
  return {install};
});
