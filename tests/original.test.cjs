const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const R=require('../crisp-differences.js');
async function main(){
 const html=fs.readFileSync('game-original.html','utf8'),source=fs.readFileSync('classic-upgrade.js','utf8');
 assert.equal(execFileSync('git',['hash-object','game-original.html'],{encoding:'utf8'}).trim(),'7963ea0935a6ee1b1008e20e882907b2989e633a','Original illustration file must remain byte-for-byte unchanged');
 const imageData=name=>html.match(new RegExp(name+"\\.src='([^']+)'"))[1];
 const art=await loadImage(imageData('artwork')),patches=await loadImage(imageData('colourPatches'));
 const native=createCanvas(art.width,art.height).getContext('2d');
 native.drawImage(art,0,0);
 const layouts=[];
 const locations=new Set();
 for(let id=1;id<=10;id++){
  const {width,height,answers,atlas}=JSON.parse(fs.readFileSync('sets/'+id+'.json','utf8'));
  assert.deepEqual([width,height],[art.width,art.height]);
  assert.equal(answers.length,10);
  const image=await loadImage(atlas);
  const tiles=createCanvas(image.width,image.height).getContext('2d');
  tiles.drawImage(image,0,0);
  let nextOffset=0;
  for(const [index,area] of answers.entries()){
   const {x,y,w,h,offset,label}=area;
   assert.ok(label && x>=0 && y>=0 && w>0 && h>0 && x+w<=width && y+h<=height);
   assert.ok(w<=image.width && offset+h<=image.height);
   assert.equal(offset,nextOffset);
   nextOffset+=h;
   for(const other of answers.slice(0,index)){
    assert.ok(x>=other.x+other.w || other.x>=x+w ||
      y>=other.y+other.h || other.y>=y+h,'Tap areas must stay distinct');
   }
   const before=native.getImageData(x,y,w,h).data;
   const after=tiles.getImageData(0,offset,w,h).data;
   let visible=0;
   for(let i=0;i<before.length;i+=4){
    if(Math.max(...[0,1,2].map(c=>Math.abs(before[i+c]-after[i+c])))>=22)visible++;
   }
   assert.ok(visible>=150,'Set '+id+': '+label);
  }
  assert.equal(nextOffset,image.height);
  const layout=new Set(answers.map(({location})=>location));
  for(const prior of layouts){
   assert.ok([...layout].filter(location=>prior.has(location)).length<=6,'Sets must differ in at least four locations');
  }
  layouts.push(layout);
  for(const location of layout)locations.add(location);
 }
 assert.equal(layouts.length,10);
 assert.ok(locations.size>=21,'Use at least 21 distinct edit locations across the set rotation');
 const base=createCanvas(983,750);base.getContext('2d').drawImage(art,0,0,983,750);
 const valid=R.prepare(base,patches,createCanvas);
 assert.ok(valid.length>=120,'Need at least 120 clear candidate edits, got '+valid.length);
 assert.ok(!R.pool().some(p=>['mirror','turn','size','hue'].includes(p.kind)),'No distorted or legacy colour-patch candidates');
 assert.ok(!fs.readFileSync('crisp-differences.js','utf8').includes('createRadialGradient'),'No feathered image patches');
 assert.equal(R.pool().length,132);
 let minKinds=99;
 let history=[];
 for(let seed=1;seed<=10000;seed++){
  const chosen=R.select(valid,seed,history);assert.equal(chosen.length,10);
  assert.ok(chosen.filter(p=>p.type==='addition').length>=3);
  assert.ok(chosen.filter(p=>p.type==='colour').length>=2);
  assert.ok(chosen.filter(p=>p.type==='texture').length>=2);
  assert.ok(chosen.some(p=>p.type==='detail'));
  assert.ok(new Set(chosen.map(p=>p.id)).size===10);
  assert.ok(chosen.filter(p=>p.type==='colour').length<=3);
  assert.ok(chosen.filter(p=>p.type==='addition').length<=4);
  const kinds=new Set(chosen.map(p=>p.type)).size;minKinds=Math.min(minKinds,kinds);assert.ok(kinds>=4);
  for(let a=0;a<chosen.length;a++)for(let b=a+1;b<chosen.length;b++)assert.ok(!R.conflicts(chosen[a],chosen[b]),'Overlapping differences');
  if(seed<100)for(const old of history.slice(-3))assert.ok(chosen.filter(p=>old.some(id=>id===p.id||id.startsWith(p.group+'-'))).length<=5,'Recognisable recent repeat');
  history.push(chosen.map(p=>p.id));history=history.slice(-3);
 }
 for(const p of valid){
  assert.ok(p.visiblePixels>=18,p.id+' has no visible difference');
  const w=p.sprite.width,h=p.sprite.height,data=p.sprite.getContext('2d').getImageData(0,0,w,h).data;
  for(let i=0;i<data.length;i+=4)if(data[i+3]>0){const x=i/4%w+p.sx,y=Math.floor(i/4/w)+p.sy;assert.ok(Math.hypot(x-p.x,y-p.y)<=p.r+2,p.id+' outside its answer area');}
 }
 // Recolouring preserves every pixel position and original lightness; faces are excluded.
 for(const p of valid.filter(p=>p.kind==='surface')){
  const a=base.getContext('2d').getImageData(p.sx,p.sy,p.sprite.width,p.sprite.height).data;
  const b=p.sprite.getContext('2d').getImageData(0,0,p.sprite.width,p.sprite.height).data;
  for(let i=0;i<b.length;i+=4){
   assert.ok(b[i+3]===0||b[i+3]===255,'Surface changes must use a crisp mask');
   if(!b[i+3])continue;
   if(p.mode==='colour')assert.ok(Math.abs(R.toHsl(a[i],a[i+1],a[i+2])[2]-R.toHsl(b[i],b[i+1],b[i+2])[2])<.005,'Original shading must remain at the same pixel');
   const gx=p.sx+(i/4)%p.sprite.width,gy=p.sy+Math.floor(i/4/p.sprite.width);
   assert.ok(!p.surface.exclude?.some(([cx,cy,rx,ry])=>((gx-cx)/rx)**2+((gy-cy)/ry)**2<=1),'Faces must remain untouched');
  }
 }
 console.log('PASS: sharp surface masks, original shading and face exclusions.');
 console.log('PASS: original artwork hash unchanged; '+valid.length+' visible candidate edits; 10000 balanced rounds; at least '+minKinds+' change types; no overlapping answer regions.');
 // Run the original engine and upgrade together, using real native Canvas images.
 const nodes={},intervals=new Map(),memory=new Map(),requests=[];let now=0,nextSeed=9900;
 class Element{
  constructor(){this.children=[];this.listeners={};this.hidden=false;this.disabled=false;this.checked=false;this.textContent='';}
  append(...a){this.children.push(...a);}prepend(...a){this.children.unshift(...a);}after(){}before(){}replaceChildren(...a){this.children=a;}
  addEventListener(k,f){this.listeners[k]=f;}setPointerCapture(){}setAttribute(k,v){this[k]=v;}
 }
 function makeNode(canvas=false){
  const n=canvas?createCanvas(983,750):new Element();
  if(canvas){const getContext=n.getContext.bind(n);n.getContext=(...args)=>{const ctx=getContext(...args);if(!ctx.adapted){const draw=ctx.drawImage.bind(ctx);ctx.drawImage=(image,...coords)=>draw(image.native??image,...coords);ctx.adapted=true;}return ctx;};for(const k of Object.getOwnPropertyNames(Element.prototype))if(k!=='constructor')n[k]=Element.prototype[k];n.listeners={};n.children=[];n.clientLeft=n.clientTop=0;n.clientWidth=983;n.clientHeight=750;n.getBoundingClientRect=()=>({left:0,top:0});}
  return n;
 }
 for(const m of html.matchAll(/id="([^"]+)"/g))nodes[m[1]]=makeNode(['top','bottom'].includes(m[1]));
 for(const id of ['budget-count','random-note','round-info','stop-round','answer-guide','answer-list'])nodes[id]=makeNode();
 const extra={'header p':makeNode(),'.setup':makeNode(),main:makeNode()};
 let comparisonCanvas;
 const document={getElementById:id=>nodes[id],createElement:tag=>{
  const n=makeNode(tag==='canvas');
  if(tag==='canvas')comparisonCanvas=n;
  let id;Object.defineProperty(n,'id',{get:()=>id,set:v=>{id=v;nodes[v]=n;},configurable:true});
  return n;
 },querySelector:selector=>extra[selector],head:makeNode(),activeElement:null};
 // Native image properties are available in browsers; provide them in the test host too.
 for(const image of [art,patches]){if(!image.complete)Object.defineProperty(image,'complete',{value:true});if(!image.naturalWidth)Object.defineProperty(image,'naturalWidth',{value:image.width});}
 const sandbox={BelanjawanDifferences:require('../crisp-differences.js'),document,console,Intl,Math,Map,Set,Uint32Array,__artwork:art,__patches:patches,localStorage:{getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)},performance:{now:()=>now},crypto:{getRandomValues:a=>{a[0]=++nextSeed;return a;}},setInterval:f=>{const id=intervals.size+1;intervals.set(id,f);return id;},clearInterval:id=>intervals.delete(id),setTimeout:()=>1,clearTimeout(){},requestAnimationFrame:f=>f(),Image:class{async decode(){return loadImage(this.src).then(image=>{this.native=image;});}},fetch:async(url,options)=>{requests.push({url,options});return url.startsWith('sets/')?{ok:true,json:()=>JSON.parse(fs.readFileSync(url.split('?')[0],'utf8'))}:{ok:false};}};
 sandbox.window=sandbox;sandbox.globalThis=sandbox;vm.createContext(sandbox);
 let originalScript=html.match(/<script>([\s\S]*?)<\/script>/)[1];
 originalScript=originalScript.replace('const artwork=new Image();','const artwork=__artwork;').replace('const colourPatches=new Image();','const colourPatches=__patches;');
 originalScript=originalScript.replace(/\$\('start'\)\.disabled=true;[\s\S]*?(?=function paintChange)/,"$('start').disabled=false;\n");
 vm.runInContext(originalScript,sandbox);vm.runInContext(source,sandbox);
 function state(expression){return vm.runInContext(expression,sandbox);}
 function click(id){return nodes[id].onclick();}
 function tap(p,dx=0){const canvas=nodes.bottom;const ev={button:0,pointerId:1,pointerType:'mouse',clientX:p.x+dx,clientY:p.y,type:'pointerdown'};canvas.listeners.pointerdown(ev);canvas.listeners.pointerup({...ev,type:'pointerup'});}
 assert.equal(nodes.timed.checked,true,'Three-minute timer is enabled by default');
 await click('start');assert.equal(nodes.time.textContent,'03:00');assert.equal(nodes.time.hidden,false);assert.equal(state('phase'),'playing');assert.equal(state('sets[round].length'),10);assert.equal(nodes.score.textContent,'0 / 10 ditemui');
 assert.equal(requests.filter(r=>r.options?.method==='PUT').length,1);
 click('reveal');assert.equal(state('answers'),false,'Answers must stay hidden during play');
 const selection=state('sets[round].map(i=>points[i])');
 tap(selection[0]);assert.equal(state('found.size'),1);tap(selection[0]);assert.equal(state('found.size'),1,'No double counting');
 for(const p of selection.slice(1))tap(p);
 assert.equal(state('phase'),'won');assert.equal(state('found.size'),10);
 assert.equal(nodes['answer-guide'].hidden,true);
 assert.equal(nodes.reveal['aria-expanded'],'false');
 click('reveal');assert.equal(state('answers'),true);assert.equal(nodes['answer-list'].children.length,10);
 assert.equal(nodes.reveal['aria-expanded'],'true');
 assert.equal(nodes.reveal.hidden,false);
 click('reveal');assert.equal(state('answers'),false);assert.equal(nodes['answer-guide'].hidden,true);
 assert.equal(nodes.reveal['aria-expanded'],'false');
 click('reveal');assert.equal(state('answers'),true);assert.equal(nodes['answer-list'].children.length,10);
 await click('restart');assert.notEqual(requests.filter(r=>r.url.startsWith('sets/'))[0].url,requests.filter(r=>r.url.startsWith('sets/'))[1].url);
 assert.equal(state('found.size'),0);assert.equal(state('answers'),false);assert.equal(nodes['answer-guide'].hidden,true);
 nodes.timed.checked=true;await click('restart');assert.equal(nodes.time.textContent,'03:00');now+=179999;[...intervals.values()].forEach(f=>f());assert.equal(state('phase'),'playing');assert.equal(nodes.time.textContent,'00:01');now+=1;[...intervals.values()].forEach(f=>f());assert.equal(state('phase'),'expired');assert.equal(nodes.time.textContent,'00:00');
 const before=state('found.size');tap(state('points[sets[round][0]]'));assert.equal(state('found.size'),before);
 nodes.timed.checked=false;await click('restart');now+=180000;[...intervals.values()].forEach(f=>f());assert.equal(state('phase'),'playing','Untimed option still works');assert.equal(nodes.time.hidden,true);nodes.timed.checked=true;
 await click('restart');click('stop-round');assert.equal(state('phase'),'ended');click('reveal');assert.equal(nodes['answer-list'].children.length,10);
 await click('restart');nodes.in.onclick();assert.equal(state('zoom'),1.5);nodes.reset.onclick();assert.equal(state('zoom'),1);
 // A cancelled/pinched gesture cannot become an answer.
 const target=state('points[sets[round][0]]'),canvas=nodes.bottom;
 const event=(type,id,x,y)=>({type,pointerId:id,clientX:x,clientY:y,button:0,pointerType:'touch'});
 canvas.listeners.pointerdown(event('pointerdown',10,target.x-30,target.y));
 canvas.listeners.pointerdown(event('pointerdown',11,target.x+30,target.y));
 canvas.listeners.pointermove(event('pointermove',11,target.x+60,target.y));
 canvas.listeners.pointerup(event('pointerup',11,target.x+60,target.y));
 canvas.listeners.pointerup(event('pointerup',10,target.x-30,target.y));
 assert.equal(state('found.size'),0);assert.ok(state('zoom')>1);
 for(let i=6;i<11;i++)await click('restart');
 const loaded=requests.filter(r=>r.url.startsWith('sets/')).map(r=>r.url);
 assert.equal(loaded.length,11);
 assert.equal(new Set(loaded.slice(0,10)).size,10);
 assert.notEqual(loaded[9],loaded[10]);
 const tested=new Set();
 const verifiedJackets=new Set();
 for(let i=0;tested.size<10 && i<19;i++){
  await click('restart');
  const current=requests.filter(r=>r.url.startsWith('sets/')).at(-1).url;
  tested.add(current);
  const {answers}=JSON.parse(fs.readFileSync(current.split('?')[0],'utf8'));
  const area=answers.find(answer=>answer.location==='1794,1111');
  if(area){
   const {x,y,w,h}=area;
   const before=native.getImageData(x,y,w,h).data;
   const after=comparisonCanvas.getContext('2d').getImageData(x,y,w,h).data;
   let bluePixels=0;
   for(let p=0;p<before.length;p+=4){
    if(before[p]-before[p+2]>=62 && after[p+2]-after[p]>=90)bluePixels++;
   }
   assert.ok(bluePixels>=120,'The fisherman’s orange jacket must become clearly blue in '+current);
   assert.ok(state('points').some(point=>point.label.includes('jingga kepada biru')));
   verifiedJackets.add(current);
  }
  for(const p of state('points'))tap(p);
  assert.equal(state('found.size'),10,current);
  assert.equal(state('phase'),'won');
 }
 assert.equal(tested.size,10);
 assert.equal(verifiedJackets.size,6);
 console.log('PASS: all 100 answer tiles contain visible edits and all 100 tap targets score.');
 console.log('PASS: ten-set rotation without repeats, including the cycle boundary.');
 console.log('PASS: original engine plus upgrade: real canvas rendering, scoring, duplicate handling, answers, restart, timer expiry, manual ending, zoom and pinch suppression.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
