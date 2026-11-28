/* Run with Node and @napi-rs/canvas installed. These tests check the pixels,
   rather than assuming that selecting a change makes it visible. */
const assert=require('node:assert/strict');
const {createCanvas}=require('@napi-rs/canvas');
const S=require('../scenes.js');
const a=createCanvas(S.W,S.H),b=createCanvas(S.W,S.H),ca=a.getContext('2d'),cb=b.getContext('2d');
let roundCount=0,pixelChecks=0;
for(let scene=0;scene<S.themes.length;scene++){
  for(let seed=1;seed<=1000;seed++){
    const r=S.createRound(scene,seed);
    assert.equal(r.objects.length,30);
    assert.equal(new Set(r.selected.map(o=>o.id)).size,10);
    assert.deepEqual(['easy','medium','hard'].map(level=>r.selected.filter(o=>o.level===level).length),[3,4,3]);
    assert.ok(new Set(r.selected.map(o=>o.op)).size>=5,'Every round needs five change types');
    assert.ok(r.selected.filter(o=>o.op==='colour').length<=2);
    for(const o of r.objects){assert.ok(o.x>=0&&o.y>=0&&o.x+o.w+12<S.W&&o.y+o.h<S.H);}
    roundCount++;
    if(seed>12)continue;
    // Verify every candidate, including ones not selected in this round.
    for(const o of r.objects){
      ca.clearRect(0,0,S.W,S.H);cb.clearRect(0,0,S.W,S.H);
      S.drawObject(ca,o,false);S.drawObject(cb,o,true);
      const bounds={x:Math.max(0,Math.floor(o.x)-30),y:Math.max(0,Math.floor(o.y)-30),w:Math.ceil(o.w)+75,h:Math.ceil(o.h)+65};
      const aa=ca.getImageData(bounds.x,bounds.y,bounds.w,bounds.h).data,bb=cb.getImageData(bounds.x,bounds.y,bounds.w,bounds.h).data;
      let count=0,outside=0;
      for(let i=0;i<aa.length;i+=4){if(aa[i]!==bb[i]||aa[i+1]!==bb[i+1]||aa[i+2]!==bb[i+2]||aa[i+3]!==bb[i+3]){
        count++;const pixel=i/4;if(!S.hit(o,bounds.x+pixel%bounds.w,bounds.y+Math.floor(pixel/bounds.w)))outside++;
      }}
      assert.ok(count>25,`${o.id} ${o.op} must change visible pixels (got ${count})`);
      assert.equal(outside,0,`${o.id} ${o.op}: changed pixels outside clickable region`);
      // Check that later objects cannot completely cover this change.
      S.paint(ca,{...r,changed:new Set()},false);S.paint(cb,{...r,changed:new Set([o.id])},true);
      const finalA=ca.getImageData(Math.floor(o.x),Math.max(0,Math.floor(o.y)-12),Math.ceil(o.w)+16,Math.ceil(o.h)+16).data;
      const finalB=cb.getImageData(Math.floor(o.x),Math.max(0,Math.floor(o.y)-12),Math.ceil(o.w)+16,Math.ceil(o.h)+16).data;
      assert.ok(finalA.some((v,i)=>v!==finalB[i]),`${o.id} is obscured in the full scene`);
      pixelChecks++;
    }
  }
}
console.log(`PASS: ${roundCount} generated rounds; ${pixelChecks} candidate changes visible and inside their answer regions.`);
