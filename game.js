(function(){
  'use strict';
  const S=SpotScenes,$=id=>document.getElementById(id),canvases=[$('top'),$('bottom')];
  const HISTORY='ibj-spot-history-v2',PREFS='ibj-spot-prefs-v2';
  const counterURL='https://belanjawan-2027-games-default-rtdb.asia-southeast1.firebasedatabase.app/counters/cari_perbezaan.json';
  let round=null,found=new Set(),phase='idle',chosenScene=-1,answers=false,zoom=1,offsetX=0,offsetY=0;
  let startedAt=0,deadline=0,clock=null,miss=null,missTimer=null,roundToken=0,cursor=null,finishedElapsed=0,pending=null;
  let history=read(HISTORY,[]),session=0;
  function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
  function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{/* Gameplay also works without storage. */}}
  if(!Array.isArray(history))history=[];
  history=history.filter(h=>h&&Number.isInteger(h.scene)&&typeof h.signature==='string').slice(-30);
  const prefs=read(PREFS,{});
  $('timed').checked=prefs?.timed===true;$('turns').checked=prefs?.turns===true;
  function randomSeed(){if(globalThis.crypto?.getRandomValues){return crypto.getRandomValues(new Uint32Array(1))[0];}return Math.floor(Math.random()*4294967296);}
  function sceneChoices(){
    const random=document.createElement('button');random.className='scene-choice random';random.type='button';random.dataset.scene='-1';random.setAttribute('aria-pressed','true');random.innerHTML='<span class="symbol" aria-hidden="true">⤨</span><span>Pilihan rawak<small>Suasana berlainan daripada pusingan terakhir</small></span>';$('scene-choices').append(random);
    S.themes.forEach((scene,i)=>{
      const b=document.createElement('button');b.className='scene-choice';b.type='button';b.dataset.scene=String(i);b.setAttribute('aria-pressed','false');
      const canvas=document.createElement('canvas');canvas.width=324;canvas.height=228;canvas.setAttribute('aria-hidden','true');const c=canvas.getContext('2d');c.scale(.3,.3);S.paint(c,S.createRound(i,1234+i),false);
      const label=document.createElement('span');label.className='choice-caption';label.textContent=scene.name;b.append(canvas,label);$('scene-choices').append(b);
    });
    $('scene-choices').addEventListener('click',e=>{const b=e.target.closest('button[data-scene]');if(!b)return;chosenScene=Number(b.dataset.scene);document.querySelectorAll('[data-scene]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
  }
  function remember(){history.push({scene:round.sceneIndex,signature:round.signature,locations:round.selected.map(o=>o.id)});history=history.slice(-30);save(HISTORY,history);}
  function newRound(forceNext){
    const last=history.at(-1);let sceneIndex=chosenScene;
    if(chosenScene===-1||forceNext){
      const recent=new Set(history.slice(-Math.min(5,history.length)).map(h=>h.scene));
      let pool=S.themes.map((_,i)=>i).filter(i=>!recent.has(i));
      if(!pool.length)pool=S.themes.map((_,i)=>i).filter(i=>i!==last?.scene);
      sceneIndex=pool[Math.floor(Math.random()*pool.length)];
    }
    let candidate;
    for(let attempt=0;attempt<100;attempt++){
      candidate=S.createRound(sceneIndex,randomSeed());
      const previous=history.filter(h=>h.scene===sceneIndex).slice(-3);
      if(!previous.some(h=>h.signature===candidate.signature||candidate.selected.filter(o=>h.locations?.includes(o.id)).length>6))break;
    }
    return candidate;
  }
  function begin(forceNext=false){
    clearInterval(clock);clearTimeout(missTimer);round=newRound(forceNext);remember();session++;roundToken++;
    found=new Set();phase='playing';answers=false;miss=null;cursor=null;zoom=1;offsetX=offsetY=0;finishedElapsed=0;
    startedAt=performance.now();deadline=$('timed').checked?startedAt+300000:0;
    save(PREFS,{timed:$('timed').checked,turns:$('turns').checked});
    $('setup').hidden=true;$('game').hidden=false;$('result').hidden=true;$('answer-guide').hidden=true;$('reveal').hidden=false;
    $('scene-name').textContent=round.scene.name;$('scene-tag').textContent=round.scene.tag;
    $('round-label').textContent='PUSINGAN '+session+' · CABARAN '+round.seed.toString(36).toUpperCase();
    $('next').textContent=$('turns').checked?'Pemain seterusnya ↗':'Main lagi ↗';
    $('restart').textContent=$('turns').checked?'Pemain seterusnya ↗':'Cabaran baharu ↗';
    $('time-label').textContent=deadline?'baki masa':'masa bermain';$('end').disabled=false;
    $('status').textContent='Bandingkan kedua-dua gambar. Ketik perbezaan pada mana-mana gambar.';
    updateScore();draw();tick();clock=setInterval(tick,200);count(true);
    $('scene-name').scrollIntoView({block:'start',behavior:'instant'});
  }
  function updateScore(){$('score').textContent=found.size+' / 10';}
  function formatTime(ms){const sec=Math.max(0,Math.ceil(ms/1000));return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');}
  function tick(){
    if(phase!=='playing')return;
    const now=performance.now();$('time').textContent=formatTime(deadline?deadline-now:now-startedAt);
    $('time').classList.toggle('urgent',Boolean(deadline&&deadline-now<30000));
    if(deadline&&now>=deadline)finish('expired');
  }
  function finish(reason){
    if(phase!=='playing')return;
    phase=reason;clearInterval(clock);finishedElapsed=deadline?Math.min(300000,performance.now()-startedAt):performance.now()-startedAt;
    $('end').disabled=true;$('result').hidden=false;
    $('result-title').textContent=reason==='won'?'Tahniah, kesemua 10 ditemui!':reason==='expired'?'Masa tamat. Cubaan yang baik!':'Pusingan ditamatkan.';
    $('result-detail').textContent=found.size+' daripada 10 perbezaan ditemui dalam '+formatTime(finishedElapsed)+'. '+($('turns').checked?'Pemain seterusnya akan menerima suasana baharu.':'Cabaran baharu menanti anda.');
    $('status').textContent=$('result-title').textContent;
    $('result').scrollIntoView({block:'start',behavior:'instant'});
  }
  function draw(){
    if(!round)return;
    canvases.forEach((canvas,panel)=>{
      const c=canvas.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,S.W,S.H);c.setTransform(zoom,0,0,zoom,-offsetX,-offsetY);
      S.paint(c,round,panel===1);
      round.selected.forEach((o,i)=>{
        if(found.has(o.id)||answers){
          const color=found.has(o.id)?'#16664c':'#b86625',x=o.x-4,y=o.y-6,w=o.w+12,h=o.h+10;
          c.beginPath();c.roundRect(x,y,w,h,10);c.lineWidth=6/zoom;c.strokeStyle='#fff8e6';c.stroke();c.lineWidth=3/zoom;c.strokeStyle=color;c.stroke();
          c.beginPath();c.arc(x+9,y+9,12/zoom,0,Math.PI*2);c.fillStyle=color;c.fill();c.fillStyle='#fff';c.textAlign='center';c.textBaseline='middle';c.font='700 '+12/zoom+'px system-ui';c.fillText(String(i+1),x+9,y+9);c.textBaseline='alphabetic';
        }
      });
      if(miss&&miss.panel===panel){c.beginPath();c.arc(miss.x,miss.y,13/zoom,0,Math.PI*2);c.strokeStyle='#a23e32';c.lineWidth=3/zoom;c.stroke();}
      if(cursor?.panel===panel&&document.activeElement===canvas){c.beginPath();c.arc(cursor.x,cursor.y,10/zoom,0,Math.PI*2);c.strokeStyle='#253b7a';c.lineWidth=2/zoom;c.stroke();}
    });
    $('reset').textContent=Number(zoom.toFixed(1))+'×';$('out').disabled=zoom<=1;$('in').disabled=zoom>=4;
  }
  function guess(x,y,panel){
    tick();if(phase!=='playing')return;
    const object=round.selected.find(o=>S.hit(o,x,y));
    if(object){
      if(found.has(object.id)){$('status').textContent='Perbezaan ini sudah ditemui.';return;}
      found.add(object.id);miss=null;updateScore();$('status').textContent='Bagus! '+found.size+' daripada 10 ditemui.';
      if(found.size===10)finish('won');
    }else{miss={x,y,panel};$('status').textContent='Belum tepat. Perhatikan objek, arah dan butirannya.';clearTimeout(missTimer);missTimer=setTimeout(()=>{miss=null;draw();},450);}
    draw();
  }
  function pan(x,y){offsetX=Math.max(0,Math.min(S.W*(zoom-1),x));offsetY=Math.max(0,Math.min(S.H*(zoom-1),y));draw();}
  function magnify(next){next=Math.max(1,Math.min(4,next));const ratio=next/zoom;zoom=next;pan((offsetX+S.W/2)*ratio-S.W/2,(offsetY+S.H/2)*ratio-S.H/2);}
  canvases.forEach((canvas,panel)=>{
    const pointers=new Map();let pinch=null;
    function position(x,y){const rect=canvas.getBoundingClientRect();return {x:(x-rect.left-canvas.clientLeft)*S.W/canvas.clientWidth,y:(y-rect.top-canvas.clientTop)*S.H/canvas.clientHeight};}
    function geometry(){const [a,b]=pointers.values();return {distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),center:position((a.x+b.x)/2,(a.y+b.y)/2)};}
    function rebase(){pinch=null;if(pointers.size>=2){const {distance,center}=geometry();pinch={distance,zoom,x:(offsetX+center.x)/zoom,y:(offsetY+center.y)/zoom};}else if(pointers.size===1){const [p]=pointers.values();Object.assign(p,{startX:p.x,startY:p.y,lastY:p.y,left:offsetX,top:offsetY});}}
    canvas.addEventListener('pointerdown',e=>{if(e.button!==0||!round)return;if(pointers.size&&e.pointerType!=='touch')return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,moved:false,suppress:false,type:e.pointerType,token:roundToken});if(pointers.size>1)for(const p of pointers.values())p.suppress=true;canvas.setPointerCapture(e.pointerId);rebase();});
    canvas.addEventListener('pointermove',e=>{const p=pointers.get(e.pointerId);if(!p||p.token!==roundToken)return;p.x=e.clientX;p.y=e.clientY;if(pinch){const {distance,center}=geometry();zoom=Math.max(1,Math.min(4,pinch.zoom*distance/pinch.distance));pan(pinch.x*zoom-center.x,pinch.y*zoom-center.y);return;}const dx=p.x-p.startX,dy=p.y-p.startY;if(Math.hypot(dx,dy)>7)p.moved=true;if(!p.moved)return;if(zoom>1)pan(p.left-dx*S.W/canvas.clientWidth,p.top-dy*S.H/canvas.clientHeight);else if(p.type==='touch'){window.scrollBy(0,p.lastY-p.y);p.lastY=p.y;}});
    function endPointer(e){const p=pointers.get(e.pointerId);if(!p)return;const tap=e.type==='pointerup'&&p.token===roundToken&&!p.suppress&&!p.moved&&Math.hypot(e.clientX-p.startX,e.clientY-p.startY)<=7;pointers.delete(e.pointerId);rebase();if(tap){const point=position(e.clientX,e.clientY);guess((point.x+offsetX)/zoom,(point.y+offsetY)/zoom,panel);}}
    for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,endPointer);
    canvas.addEventListener('keydown',e=>{if(!round)return;const directions={ArrowLeft:[-15,0],ArrowRight:[15,0],ArrowUp:[0,-15],ArrowDown:[0,15]};if(!directions[e.key]&&e.key!=='Enter'&&e.key!==' ')return;e.preventDefault();if(!cursor||cursor.panel!==panel)cursor={x:(offsetX+S.W/2)/zoom,y:(offsetY+S.H/2)/zoom,panel};const d=directions[e.key];if(d){cursor.x=Math.max(0,Math.min(S.W,cursor.x+d[0]/zoom));cursor.y=Math.max(0,Math.min(S.H,cursor.y+d[1]/zoom));draw();}else guess(cursor.x,cursor.y,panel);});
    canvas.addEventListener('blur',()=>draw());
  });
  function requestEnd(action){if(phase==='playing'){pending=action;$('confirm-dialog').showModal();}else action();}
  $('confirm-cancel').onclick=()=>{$('confirm-dialog').close();pending=null;};
  $('confirm-yes').onclick=()=>{const action=pending;pending=null;$('confirm-dialog').close();finish('ended');if(action)action();};
  $('confirm-dialog').addEventListener('cancel',()=>{pending=null;});
  $('start').onclick=()=>begin();$('next').onclick=()=>begin($('turns').checked);
  $('restart').onclick=()=>requestEnd(()=>begin($('turns').checked));$('end').onclick=()=>requestEnd(()=>{});
  $('settings').onclick=()=>requestEnd(()=>{$('game').hidden=true;$('setup').hidden=false;$('setup').scrollIntoView({block:'start',behavior:'instant'});});
  $('in').onclick=()=>magnify(zoom+.5);$('out').onclick=()=>magnify(zoom-.5);$('reset').onclick=()=>magnify(1);
  $('reveal').onclick=()=>{
    if(phase==='playing'||!round)return;answers=true;$('answer-guide').hidden=false;$('reveal').hidden=true;
    $('answer-list').replaceChildren();round.selected.forEach(o=>{const li=document.createElement('li');li.textContent=S.describe(o);const small=document.createElement('small');const region=(o.y<250?'Bahagian atas':o.y<500?'Bahagian tengah':'Bahagian bawah')+' · '+(o.x<360?'kiri':o.x<720?'tengah':'kanan');small.textContent=region+' · '+(found.has(o.id)?'Ditemui':'Belum ditemui');li.append(small);$('answer-list').append(li);});
    draw();$('top').scrollIntoView({block:'center',behavior:'instant'});
  };
  async function count(increment){try{const r=await fetch(counterURL,increment?{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({'.sv':{increment:1}})}:{cache:'no-store'});if(!r.ok)return;const value=await r.json();if(typeof value==='number')$('budget-count').textContent=new Intl.NumberFormat('ms-MY').format(value);}catch{/* Counter availability never blocks a game. */}}
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
  sceneChoices();count(false);
})();
