const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {createCanvas}=require('@napi-rs/canvas');
const S=require('../scenes.js');
function harness(saved={}){
  let now=0,seed=137,scrolls=0;
  const memory=new Map(Object.entries(saved)),intervals=new Map(),requests=[];
  class Element{
    constructor(tag='div'){
      this.tag=tag;this.children=[];this.listeners={};this.dataset={};this.hidden=false;this.checked=false;this.textContent='';this.disabled=false;this.clientLeft=this.clientTop=0;this.clientWidth=1080;this.clientHeight=760;
      this.classes=new Set();this.classList={toggle:(n,on)=>on?this.classes.add(n):this.classes.delete(n)};
    }
    getContext(){this.canvas??=createCanvas(1080,760);return this.canvas.getContext('2d');}
    append(...a){this.children.push(...a);}
    replaceChildren(...a){this.children=a;}
    setAttribute(name,value){this[name]=value;}
    addEventListener(name,callback){this.listeners[name]=callback;}
    scrollIntoView(){}
    getBoundingClientRect(){return {left:0,top:0,width:1080,height:760};}
    setPointerCapture(){}
    showModal(){this.open=true;}
    close(){this.open=false;}
    closest(){return this;}
  }
  const nodes={};for(const m of fs.readFileSync('index.html','utf8').matchAll(/id="([^"]+)"/g))nodes[m[1]]=new Element();
  const document={getElementById:id=>nodes[id],createElement:tag=>new Element(tag),querySelectorAll:()=>nodes['scene-choices'].children,addEventListener(){},activeElement:null};
  const context={SpotScenes:S,document,localStorage:{getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)},performance:{now:()=>now},
    crypto:{getRandomValues:a=>{a[0]=++seed;return a;}},setInterval:f=>{const key=intervals.size+1;intervals.set(key,f);return key;},clearInterval:k=>intervals.delete(k),
    setTimeout:()=>1,clearTimeout(){},fetch:async(url,options)=>{requests.push({url,options});return {ok:false};},console,Intl,Math};
  context.window={scrollBy:()=>scrolls++};context.globalThis=context;
  vm.runInNewContext(fs.readFileSync('game.js','utf8'),context);
  function click(id){nodes[id].onclick();}
  function pointer(id,name,x,y,number=1,type='mouse'){
    nodes[id].listeners[name]({type:name,clientX:x,clientY:y,pointerId:number,pointerType:type,button:0});
  }
  function tap(id,x,y){pointer(id,'pointerdown',x,y);pointer(id,'pointerup',x,y);}
  function current(){const h=JSON.parse(memory.get('ibj-spot-history-v2')).at(-1);return S.createRound(h.scene,Number(h.signature.split(':')[1]));}
  return {nodes,memory,requests,click,pointer,tap,current,advance:ms=>{now+=ms;[...intervals.values()].forEach(f=>f());},scrolls:()=>scrolls};
}
const h=harness();assert.equal(h.nodes.timed.checked,false);assert.equal(h.nodes.turns.checked,false);
assert.equal(h.nodes['scene-choices'].children.length,7);
h.click('start');assert.equal(h.nodes.setup.hidden,true);assert.equal(h.nodes.game.hidden,false);assert.equal(h.nodes.score.textContent,'0 / 10');
assert.equal(h.requests.filter(r=>r.options?.method==='PUT').length,1,'One counter increment per started round');
h.click('reveal');assert.equal(h.nodes['answer-guide'].hidden,true,'Cannot reveal during play');
h.tap('bottom',1075,755);assert.equal(h.nodes.score.textContent,'0 / 10','Wrong click does not add score');
const first=h.current(),o=first.selected[0];h.tap('bottom',o.x+o.w/2,o.y+o.h/2);assert.equal(h.nodes.score.textContent,'1 / 10');
h.tap('top',o.x+o.w/2,o.y+o.h/2);assert.equal(h.nodes.score.textContent,'1 / 10','Same object cannot be scored on both panels');
// Pinching or dragging must not count as a guess.
h.pointer('bottom','pointerdown',400,400,1,'touch');h.pointer('bottom','pointerdown',600,400,2,'touch');h.pointer('bottom','pointermove',700,400,2,'touch');h.pointer('bottom','pointerup',700,400,2,'touch');h.pointer('bottom','pointerup',400,400,1,'touch');
assert.equal(h.nodes.score.textContent,'1 / 10');assert.equal(h.nodes.reset.textContent,'1.5×');
h.click('reset');assert.equal(h.nodes.reset.textContent,'1×');
for(const x of first.selected.slice(1))h.tap('top',x.x+x.w/2,x.y+x.h/2);
assert.equal(h.nodes.score.textContent,'10 / 10');assert.equal(h.nodes.result.hidden,false);assert.match(h.nodes['result-title'].textContent,/Tahniah/);
h.click('reveal');assert.equal(h.nodes['answer-list'].children.length,10);
h.nodes.turns.checked=true;const scenes=[first.sceneIndex];
for(let i=0;i<6;i++){
  h.click('next');scenes.push(h.current().sceneIndex);assert.notEqual(scenes.at(-1),scenes.at(-2),'Next player gets a different scene');
  assert.equal(h.nodes.score.textContent,'0 / 10');assert.equal(h.nodes.result.hidden,true);assert.equal(h.nodes['answer-guide'].hidden,true);
  h.click('end');assert.equal(h.nodes['confirm-dialog'].open,true);h.click('confirm-yes');
}
assert.equal(new Set(scenes.slice(0,6)).size,6,'Random rotation uses all scenes before repeating');
// A chosen scene remains selected in normal play; turn mode overrides it for the next player.
h.click('settings');const choice=h.nodes['scene-choices'].children[3];
h.nodes['scene-choices'].listeners.click({target:choice});h.nodes.turns.checked=false;h.nodes.timed.checked=true;h.click('start');
assert.equal(h.current().sceneIndex,2);assert.equal(h.nodes['time-label'].textContent,'baki masa');assert.equal(h.nodes.time.textContent,'05:00');
h.advance(300000);assert.equal(h.nodes.time.textContent,'00:00');assert.match(h.nodes['result-title'].textContent,/Masa tamat/);
const p=h.current().selected[0];h.tap('top',p.x+p.w/2,p.y+p.h/2);assert.equal(h.nodes.score.textContent,'0 / 10','Guesses stop after expiry');
h.click('next');assert.equal(h.current().sceneIndex,2);assert.equal(h.nodes.time.textContent,'05:00');
// Cancelling end preserves the round and blocks accidental answers.
h.click('end');h.click('confirm-cancel');assert.equal(h.nodes['confirm-dialog'].open,false);assert.equal(h.nodes.result.hidden,true);
const saved=harness({'ibj-spot-history-v2':'corrupt JSON','ibj-spot-prefs-v2':'null'});saved.click('start');assert.equal(saved.nodes.score.textContent,'0 / 10');
console.log('PASS: scoring, duplicate/miss handling, pinch, answers, six-scene rotation, explicit selection, timer expiry/restart, counter isolation and damaged storage.');
