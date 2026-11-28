/* Randomised differences over the original Belanjawan artwork.
   The base image, logo and policy labels remain the original asset. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else {root.BelanjawanRandom=api;api.install();}
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const WIDTH=983,HEIGHT=750;
  const legacy=[
    [364,112,18,'birds'],[116,233,15,'flag'],[557,208,18,'hue'],[706,234,18,'kite'],[937,375,21,'boat'],[19,481,19,'hue'],[514,541,13,'hue'],[781,474,13,'hue'],[174,668,18,'flowers'],[841,668,20,'leaf'],
    [397,161,17,'kite'],[209,162,19,'birds'],[728,276,15,'hue'],[947,286,16,'hue'],[575,321,15,'hue'],[736,428,14,'hue'],[209,492,12,'hue'],[67,551,18,'flowers'],[944,608,19,'boat'],[453,677,18,'leaf'],
    [679,68,19,'birds'],[795,210,15,'kite'],[335,223,17,'hue'],[613,249,16,'flag'],[26,323,16,'hue'],[472,474,15,'hue'],[897,453,20,'boat'],[854,510,13,'hue'],[748,550,14,'hue'],[352,706,22,'flowers']
  ];
  const rows={557:0,19:88,514:176,781:264,728:352,947:440,575:528,736:616,209:704,335:792,26:880,472:968,854:1056,748:1144};
  const extras=[
    [546,233,9,'clock','Jarum jam pada menara berubah.'],
    [356,579,24,'mirror','Arah kucing besar berubah.'],
    [309,579,17,'mirror','Arah kucing kecil berubah.'],
    [96,594,18,'turn','Susunan dedaun di kiri bawah berubah.'],
    [130,124,18,'mirror','Arah dedaun pada pokok besar berubah.'],
    [232,282,16,'turn','Arah corak bumbung kedai berubah.'],
    [430,190,22,'mirror','Bentuk awan di tengah berubah.'],
    [778,447,10,'hatband','Jalur pada topi pekebun bertambah.'],
    [737,422,11,'stripe','Jalur pada baju pelari bertambah.'],
    [832,546,14,'stripe','Jalur pada badan sampan bertambah.'],
    [883,554,12,'buoy','Pelampung di sisi sampan bertambah.'],
    [478,389,11,'dash','Tanda pada permukaan jalan bertambah.'],
    [757,530,10,'hatband','Jalur pada topi pesawah bertambah.'],
    [552,416,9,'badge','Lambang kecil pada topi graduasi bertambah.'],
    [217,456,9,'pocket','Butiran poket pada baju pekerja berubah.'],
    [523,541,9,'badge','Lambang pada beg sekolah bertambah.'],
    [63,319,12,'window','Palang pada tingkap kedai bertambah.'],
    [965,293,11,'window','Palang pada tingkap bangunan kanan bertambah.'],
    [826,377,16,'mirror','Arah daun palma di kanan berubah.'],
    [160,389,9,'fruit','Bilangan hasil di gerai bertambah.'],
    [265,457,10,'badge','Corak kecil pada buku yang dipegang bertambah.'],
    [863,512,9,'hatband','Jalur pada topi nelayan bertambah.'],
    [803,548,11,'rope','Gelung tali pada sampan bertambah.'],
    [666,327,12,'stripe','Corak pada bumbung stesen minyak bertambah.'],
    [561,189,9,'finial','Bentuk hiasan puncak menara berubah.'],
    [572,502,9,'badge','Butiran pada pakaian graduan bertambah.'],
    [614,687,15,'mirror','Arah dedaun di bahagian bawah berubah.'],
    [103,675,17,'size','Saiz gugusan daun di kiri bawah berubah.'],
    [898,691,17,'turn','Susunan batu dan dedaun di kanan bawah berubah.'],
    [383,689,17,'size','Saiz daun di hadapan laluan berubah.']
  ];
  const captions={birds:'Bilangan burung di langit bertambah.',flag:'Bendera kecil bertambah.',hue:'Warna pada bahagian ini berubah.',kite:'Layang-layang bertambah.',boat:'Sampan kecil bertambah.',flowers:'Bilangan bunga bertambah.',leaf:'Daun kecil bertambah.'};
  function pool(){
    const a=legacy.map(([x,y,r,kind],i)=>({id:'asal-'+i,x,y,r,kind,level:kind==='hue'?'easy':'medium',type:kind==='hue'?'colour':'addition',label:captions[kind]}));
    extras.forEach(([x,y,r,kind,label],i)=>{
      const type=['mirror','turn'].includes(kind)?'direction':kind==='size'?'size':kind==='fruit'?'quantity':kind==='clock'?'detail':'pattern';
      a.push({id:'butiran-'+i,x,y,r,kind,label,type,level:['mirror','turn','size','clock'].includes(kind)?'hard':'medium'});
    });
    // Keep enough easy non-colour choices so colour swaps never dominate.
    [0,1,3,4,8,9,10,11,17,18,19,20,21,23,26,29].forEach((n,i)=>{if(i%2===0)a[n].level='easy';});
    return a;
  }
  function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
  function shuffle(a,random){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function conflicts(a,b){return Math.hypot(a.x-b.x,a.y-b.y)<a.r+b.r+20;}
  function select(candidates,seed,history=[]){
    const random=rng(seed);
    for(let attempt=0;attempt<2500;attempt++){
      const picked=[];
      for(const [level,n] of [['hard',3],['medium',4],['easy',3]]){
        const choices=shuffle(candidates.filter(p=>p.level===level),random);
        for(const p of choices){
          if(picked.filter(x=>x.level===level).length>=n)break;
          if(picked.some(x=>conflicts(x,p)))continue;
          if(p.type==='colour'&&picked.filter(x=>x.type==='colour').length>=2)continue;
          if(p.type==='addition'&&picked.filter(x=>x.type==='addition').length>=3)continue;
          picked.push(p);
        }
      }
      if(picked.length!==10||new Set(picked.map(x=>x.type)).size<5)continue;
      const ids=picked.map(x=>x.id);
      if(history.slice(-3).some(h=>h.filter(id=>ids.includes(id)).length>5))continue;
      return shuffle(picked,random);
    }
    // A fresh valid layout takes priority over a long repeat history.
    if(history.length)return select(candidates,seed+1,[]);
    throw Error('Tidak cukup perbezaan yang sah untuk pusingan ini.');
  }
  function paintEdit(c,p,base,patches){
    const {x,y,r,kind}=p,d=r*2;
    c.save();c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.clip();
    if(kind==='hue'){
      c.drawImage(patches,0,rows[x],4*r,4*r,x-r,y-r,d,d);
      c.restore();return;
    }
    if(['mirror','turn','size'].includes(kind)){
      c.translate(x,y);
      if(kind==='mirror')c.scale(-1,1);
      if(kind==='turn')c.rotate(Math.PI/4);
      if(kind==='size')c.scale(1.3,1.3);
      c.drawImage(base,x-r,y-r,d,d,-r,-r,d,d);
      c.restore();return;
    }
    c.translate(x,y);c.lineWidth=1.6;c.lineCap='round';
    const path=(v,fill,stroke)=>{c.beginPath();c.moveTo(...v[0]);v.slice(1).forEach(a=>c.lineTo(...a));if(fill){c.closePath();c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}};
    const dot=(a,b,size,fill)=>{c.beginPath();c.arc(a,b,size,0,Math.PI*2);c.fillStyle=fill;c.fill();};
    if(kind==='birds'){
      [[-10,2],[0,-6],[10,3]].forEach(([a,b])=>{c.beginPath();c.moveTo(a-4,b-2);c.quadraticCurveTo(a-2,b-4,a,b);c.quadraticCurveTo(a+2,b-4,a+5,b-2);c.strokeStyle='#253948';c.stroke();});
    }
    if(kind==='kite'){path([[0,-11],[8,0],[0,10],[-8,0]],'#c65343','#593b40');path([[0,9],[5,14],[0,17]],null,'#f9e7a7');}
    if(kind==='flag'){path([[-5,12],[-5,-11]],null,'#e9d9a7');path([[-5,-11],[11,-7],[-5,-2]],'#bd5539','#704336');}
    if(kind==='boat'){path([[-16,6],[16,6],[10,12],[-10,12]],'#743e2d','#374c50');path([[0,-12],[0,4],[11,4]],'#f8e4b0','#697674');}
    if(kind==='flowers'){
      [[-9,4],[0,-6],[9,3]].forEach(([a,b])=>{path([[a,b],[a-2,b+8]],null,'#687a2c');for(let k=0;k<5;k++){const t=k*Math.PI*2/5;dot(a+Math.cos(t)*3,b+Math.sin(t)*3,2.6,'#dc8967');}dot(a,b,1.7,'#efd574');});
    }
    if(kind==='leaf'){c.beginPath();c.ellipse(0,0,12,5,-.55,0,Math.PI*2);c.fillStyle='#a69d4a';c.fill();path([[-9,5],[9,-5]],null,'#dbce82');}
    if(kind==='clock'){
      dot(0,0,r-1,'#d9d2ba');
      for(let k=0;k<12;k++){const a=k*Math.PI/6;dot(Math.cos(a)*(r-2.5),Math.sin(a)*(r-2.5),.5,'#545348');}
      path([[0,-r+3],[0,0],[r-3,2]],null,'#393d38');dot(0,0,1,'#393d38');
    }
    if(kind==='hatband'){path([[-r*.8,2],[r*.8,2]],null,'#704039');path([[-r*.7,4],[r*.7,4]],null,'#dbc187');}
    if(kind==='stripe'){for(let yy=-4;yy<=4;yy+=4)path([[-r*.7,yy],[r*.7,yy]],null,'#e7d9ac');}
    if(kind==='badge'){dot(0,0,r*.48,'#e7cc7d');path([[0,-r*.4],[2,0],[0,r*.4],[-2,0]],'#b56c3e',null);}
    if(kind==='pocket'){path([[-6,-5],[6,-5],[5,4],[0,7],[-5,4]],null,'#d3c09a');dot(0,-1,1.2,'#edd9ad');}
    if(kind==='window'){path([[-r*.7,0],[r*.7,0]],null,'#d4c8a1');path([[0,-r*.7],[0,r*.7]],null,'#d4c8a1');}
    if(kind==='fruit'){[[-4,3],[4,2],[0,-4]].forEach(([a,b])=>{dot(a,b,3.4,'#d59168');path([[a,b-2],[a+1,b-5]],null,'#768b3d');});}
    if(kind==='dash'){path([[-r*.7,-2],[r*.7,2]],null,'#e5dfcd');}
    if(kind==='buoy'){c.beginPath();c.arc(0,0,r*.65,0,Math.PI*2);c.strokeStyle='#e8d6a4';c.lineWidth=4;c.stroke();for(const a of [0,Math.PI]){c.beginPath();c.arc(0,0,r*.65,a,a+.5);c.strokeStyle='#b7593b';c.stroke();}}
    if(kind==='rope'){c.beginPath();c.ellipse(0,0,r*.7,r*.4,-.3,0,Math.PI*2);c.strokeStyle='#bdab76';c.lineWidth=2;c.stroke();path([[-r*.6,3],[-r*.8,r*.7]],null,'#bdab76');}
    if(kind==='finial'){dot(0,-3,3,'#c49e65');path([[0,0],[0,7],[-5,9],[5,9]],null,'#8b6342');}
    c.restore();
  }
  function prepare(base,patches,makeCanvas){
    return pool().map(p=>{
      const d=2*p.r+4,canvas=makeCanvas(d,d),c=canvas.getContext('2d'),sx=p.x-p.r-2,sy=p.y-p.r-2;
      c.translate(-sx,-sy);paintEdit(c,p,base,patches);c.setTransform(1,0,0,1,0,0);
      // Blend image transformations into their surroundings rather than leaving square seams.
      if(['mirror','turn','size'].includes(p.kind)){
        c.globalCompositeOperation='destination-in';
        const g=c.createRadialGradient(d/2,d/2,p.r*.72,d/2,d/2,p.r);g.addColorStop(0,'#fff');g.addColorStop(1,'#fff0');c.fillStyle=g;c.fillRect(0,0,d,d);c.globalCompositeOperation='source-over';
      }
      const check=makeCanvas(d,d),v=check.getContext('2d');v.drawImage(base,sx,sy,d,d,0,0,d,d);const before=v.getImageData(0,0,d,d).data;
      v.drawImage(canvas,0,0);const after=v.getImageData(0,0,d,d).data;let changed=0;
      for(let i=0;i<before.length;i+=4)if(Math.abs(before[i]-after[i])+Math.abs(before[i+1]-after[i+1])+Math.abs(before[i+2]-after[i+2])>24)changed++;
      return {...p,sprite:canvas,sx,sy,visiblePixels:changed};
    }).filter(p=>p.visiblePixels>=18);
  }
  function install(){
    if(typeof document==='undefined'||typeof artwork==='undefined')return;
    const KEY='ibj-original-random-v3';let history=[],prepared=null,sequence=0,started=0;
    try{const h=JSON.parse(localStorage.getItem(KEY));if(Array.isArray(h))history=h.filter(a=>Array.isArray(a)&&a.every(x=>typeof x==='string')).slice(-20);}catch{}
    const intro=document.querySelector('header p');intro.textContent='Ilustrasi asal Belanjawan 2027. Setiap pusingan mempunyai 10 perbezaan rawak. Ketik perbezaan pada gambar bawah.';
    const hint=document.createElement('p');hint.id='random-note';hint.textContent='Perhatikan warna, arah, saiz, corak, bilangan dan butiran kecil.';document.querySelector('.setup').after(hint);
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
  return {WIDTH,HEIGHT,pool,rng,shuffle,conflicts,select,paintEdit,prepare,install};
});
