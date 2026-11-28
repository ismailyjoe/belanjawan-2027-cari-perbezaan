/* Clear object, colour and fabric changes. Source pixels never move or rescale. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BelanjawanDifferences=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const WIDTH=983,HEIGHT=750;
  const itemNames={birds:'Burung',kite:'Layang-layang',balloon:'Belon',butterfly:'Rama-rama',boat:'Sampan kecil',fish:'Ikan',buoy:'Pelampung',flower:'Bunga',ball:'Bola',gift:'Kotak hadiah',cone:'Kon jalan',basket:'Bakul buah',umbrella:'Payung',lantern:'Tanglung',watering:'Penyiram pokok',pinwheel:'Kincir angin kecil',dragonfly:'Pepatung',hat:'Topi',flag:'Bendera hiasan'};
  const slots=[
    [347,91,21,['birds','kite']],[384,139,20,['balloon','birds']],
    [325,183,18,['butterfly','dragonfly']],[678,75,22,['kite','balloon']],
    [724,132,22,['birds','kite']],[808,169,23,['kite','balloon']],
    [882,96,23,['balloon','birds']],[934,161,19,['birds','kite']],
    [642,171,18,['birds','butterfly']],[212,170,19,['butterfly','dragonfly']],
    [126,200,18,['butterfly','lantern']],[54,235,18,['butterfly','dragonfly']],
    [903,366,22,['boat','fish']],[950,422,22,['boat','buoy']],
    [922,471,20,['fish','buoy']],[960,541,21,['boat','fish']],
    [939,607,22,['buoy','boat']],[889,651,20,['fish','buoy']],
    [72,554,21,['butterfly','flower']],[99,628,21,['flower','pinwheel']],
    [169,678,22,['gift','watering']],[290,700,22,['flower','basket']],
    [359,704,21,['ball','gift']],[474,691,22,['ball','hat']],
    [567,699,21,['basket','watering']],[653,701,21,['flower','pinwheel']],
    [723,691,21,['cone','gift']],[791,681,21,['ball','watering']],
    [67,458,20,['lantern','butterfly']],[445,340,18,['butterfly','dragonfly']],
    [608,391,19,['cone','basket']],[622,473,18,['butterfly','dragonfly']],
    [771,397,19,['umbrella','pinwheel']],[795,466,18,['butterfly','dragonfly']],
    [50,349,17,['lantern','flag']],[427,601,18,['ball','gift']]
  ];
  // Polygons follow actual garments and objects. Hue gates protect skin,
  // lettering and neighbouring objects inside their bounding polygons.
  const surfaces=[
    {id:'runner',name:'baju pelari',poly:[[721,410],[734,412],[743,419],[747,432],[741,440],[720,438],[716,426]],hues:[.44,.68],sat:.24,target:.94},
    {id:'uniform',name:'baju seragam pekerja',poly:[[210,435],[226,431],[238,441],[238,481],[216,482],[208,467],[201,458]],hues:[.50,.77],sat:.20,target:.39},
    {id:'apron',name:'apron peniaga',poly:[[302,447],[319,445],[326,457],[323,502],[302,501],[299,482]],hues:[.89,.09],sat:.26,target:.60},
    {id:'blue-shirt',name:'kemeja biru di tengah',poly:[[444,463],[455,454],[473,459],[480,470],[477,529],[459,528],[450,501],[437,493]],hues:[.51,.76],sat:.17,target:.10},
    {id:'pink-scarf',name:'tudung merah jambu di tengah',poly:[[501,440],[508,430],[519,427],[532,434],[541,452],[536,473],[528,482],[511,473],[501,459]],exclude:[[518,449,10,13]],hues:[.85,.995],sat:.17,target:.47},
    {id:'girl-scarf',name:'tudung biru murid',poly:[[474,493],[487,490],[498,503],[501,531],[498,570],[462,570],[463,533],[465,511]],hues:[.50,.76],sat:.17,target:.86},
    {id:'left-scarf',name:'pakaian merah jambu wanita di kiri',poly:[[252,437],[262,418],[277,418],[289,428],[286,455],[278,473],[263,475],[254,461]],exclude:[[275,436,9,13]],hues:[.85,.995],sat:.18,target:.57},
    {id:'elder-scarf',name:'pakaian warga emas',poly:[[680,389],[688,384],[698,394],[699,436],[687,437],[681,419]],exclude:[[689,390,7,10]],hues:[.70,.98],sat:.12,target:.42},
    {id:'farmer',name:'baju pesawah',poly:[[736,540],[749,535],[765,541],[770,558],[756,564],[735,560]],hues:[.49,.76],sat:.16,target:.96},
    {id:'car',name:'badan kereta hijau',poly:[[406,380],[416,377],[440,378],[452,384],[450,390],[427,391],[406,389]],hues:[.20,.47],sat:.20,target:.06},
    {id:'canopy',name:'bumbung stesen minyak',poly:[[620,327],[672,317],[728,329],[727,335],[621,335]],hues:[.69,.94],sat:.18,target:.45},
    {id:'awning',name:'awning kedai merah',poly:[[126,332],[177,339],[207,352],[154,345],[126,342]],hues:[.91,.10],sat:.25,target:.58}
  ];
  const details=[
    [778,447,11,'hatband','Jalur merah pada topi pekebun bertambah.'],
    [757,530,11,'hatband','Jalur merah pada topi pesawah bertambah.'],
    [863,512,10,'hatband','Jalur merah pada topi nelayan bertambah.'],
    [552,416,10,'star','Lambang bintang bertambah pada topi graduasi.'],
    [265,457,11,'diamond','Lambang berlian bertambah pada buku yang dipegang.'],
    [803,548,12,'rope','Gelung tali bertambah pada sampan.'],
    [561,189,11,'vane','Penunjuk arah bertambah pada puncak menara.'],
    [63,319,12,'window','Palang tingkap tambahan kelihatan di kedai kiri.'],
    [965,293,12,'window','Palang tingkap tambahan kelihatan pada bangunan kanan.'],
    [832,546,14,'hull-stripe','Jalur merah dan putih bertambah pada sampan.']
  ];
  function bounds(poly){const x=(Math.min(...poly.map(a=>a[0]))+Math.max(...poly.map(a=>a[0])))/2,y=(Math.min(...poly.map(a=>a[1]))+Math.max(...poly.map(a=>a[1])))/2;return {x,y,r:Math.ceil(Math.max(...poly.map(a=>Math.hypot(a[0]-x,a[1]-y))))+2};}
  function pool(){
    const out=[];
    slots.forEach(([x,y,r,items],i)=>items.forEach((kind,j)=>out.push({id:'item-'+i+'-'+j,group:'item-'+i,x,y,r,kind,type:'addition',label:itemNames[kind]+' bertambah.',variant:(i+j)%4})));
    surfaces.forEach(surface=>{
      const p={...bounds(surface.poly),group:surface.id,surface};
      out.push({...p,id:surface.id+'-colour',kind:'surface',type:'colour',mode:'colour',label:'Warna '+surface.name+' berubah.'});
      for(const pattern of ['stripes','dots','checks'])out.push({...p,id:surface.id+'-'+pattern,kind:'surface',type:'texture',mode:pattern,label:'Corak '+({stripes:'berjalur',dots:'berbintik',checks:'berkotak'}[pattern])+' kelihatan pada '+surface.name+'.'});
    });
    details.forEach(([x,y,r,kind,label],i)=>out.push({id:'detail-'+i,group:'detail-'+i,x,y,r,kind,label,type:'detail'}));
    out.push({id:'clock-flower',group:'tower-clock',x:546.5,y:233,r:8,kind:'clock-flower',type:'replacement',label:'Muka jam menara diganti dengan lambang bunga.'});
    out.push({id:'clock-star',group:'tower-clock',x:546.5,y:233,r:8,kind:'clock-star',type:'replacement',label:'Muka jam menara diganti dengan lambang bintang.'});
    return out;
  }
  function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
  function shuffle(a,random){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function conflicts(a,b){return a.group===b.group||Math.hypot(a.x-b.x,a.y-b.y)<a.r+b.r+12;}
  function select(candidates,seed,history=[]){
    const random=rng(seed),recent=history.slice(-3);
    for(let attempt=0;attempt<2000;attempt++){
      const picked=[];
      for(const [type,count] of [['colour',2],['texture',2],['detail',1],['addition',3],['any',2]]){
        for(const p of shuffle(candidates.filter(p=>type==='any'||p.type===type),random)){
          const have=type==='any'?picked.length:picked.filter(o=>o.type===type).length;
          if(have>=(type==='any'?10:count))break;
          if(picked.some(o=>conflicts(p,o)))continue;
          const cap={addition:4,colour:3,texture:3,detail:2,replacement:1}[p.type];
          if(picked.filter(o=>o.type===p.type).length>=cap)continue;
          picked.push(p);
        }
      }
      if(picked.length!==10||picked.filter(p=>p.type==='addition').length<3||picked.filter(p=>p.type==='colour').length<2||picked.filter(p=>p.type==='texture').length<2||!picked.some(p=>p.type==='detail'))continue;
      // Treat alternate versions of the same object as the same recent location.
      if(recent.some(ids=>picked.filter(p=>ids.some(id=>id===p.id||id===p.group||id.startsWith(p.group+'-'))).length>5))continue;
      return shuffle(picked,random);
    }
    if(history.length)return select(candidates,seed+1,[]);
    throw Error('Tidak cukup perubahan jelas untuk pusingan ini. Sila muat semula.');
  }
  function inside(x,y,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
  function toHsl(r,g,b){r/=255;g/=255;b/=255;const hi=Math.max(r,g,b),lo=Math.min(r,g,b),d=hi-lo,l=(hi+lo)/2;let h=0,s=0;if(d){s=d/(1-Math.abs(2*l-1));h=hi===r?((g-b)/d)%6:hi===g?(b-r)/d+2:(r-g)/d+4;h=(h/6+1)%1;}return [h,s,l];}
  function fromHsl(h,s,l){const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs(h*6%2-1)),m=l-c/2;const v=h<1/6?[c,x,0]:h<2/6?[x,c,0]:h<3/6?[0,c,x]:h<4/6?[0,x,c]:h<5/6?[x,0,c]:[c,0,x];return v.map(n=>Math.round((n+m)*255));}
  function surfaceSprite(base,p,makeCanvas){
    const sx=Math.floor(p.x-p.r-2),sy=Math.floor(p.y-p.r-2),d=2*p.r+5,canvas=makeCanvas(d,d),c=canvas.getContext('2d');
    const source=base.getContext('2d').getImageData(sx,sy,d,d),result=c.createImageData(d,d),a=source.data,b=result.data,s=p.surface;
    for(let y=0;y<d;y++)for(let x=0;x<d;x++){
      const gx=sx+x,gy=sy+y,i=(y*d+x)*4;if(!inside(gx+.5,gy+.5,s.poly))continue;
      if(s.exclude?.some(([cx,cy,rx,ry])=>((gx-cx)/rx)**2+((gy-cy)/ry)**2<=1))continue;
      const [h,sat,l]=toHsl(a[i],a[i+1],a[i+2]),inHue=s.hues[0]<=s.hues[1]?h>=s.hues[0]&&h<=s.hues[1]:h>=s.hues[0]||h<=s.hues[1];
      if(!inHue||sat<s.sat||l<.09||l>.91)continue;
      let rgb;
      if(p.mode==='colour')rgb=fromHsl(s.target,Math.max(.48,Math.min(.82,sat)),l);
      else{
        const on=p.mode==='stripes'?Math.floor((gx+gy*.35)/5)%2===0:p.mode==='checks'?(Math.floor(gx/5)+Math.floor(gy/5))%2===0:Math.hypot((gx%9)-4,(gy%9)-4)<2.3;
        if(!on)continue;
        rgb=fromHsl(h,Math.min(.2,sat),Math.min(.94,l*.25+.68));
      }
      b[i]=rgb[0];b[i+1]=rgb[1];b[i+2]=rgb[2];b[i+3]=255;
    }
    c.putImageData(result,0,0);return {canvas,sx,sy};
  }
  function drawItem(c,p){
    const {x,y,r,kind}=p;
    c.save();c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.clip();c.translate(x,y);c.lineCap='round';c.lineJoin='round';c.lineWidth=1.3;
    const colours=['#dc7858','#d4b653','#67a3a1','#8b83b9'],fill=colours[p.variant||0],ink='#42504a',cream='#f7e6b6';
    const line=(a,b,d,e,color=ink,w=1.3)=>{c.beginPath();c.moveTo(a,b);c.lineTo(d,e);c.strokeStyle=color;c.lineWidth=w;c.stroke();};
    const circle=(a,b,size,color)=>{c.beginPath();c.arc(a,b,size,0,Math.PI*2);c.fillStyle=color;c.fill();};
    const poly=(v,color,stroke=ink)=>{c.beginPath();c.moveTo(...v[0]);v.slice(1).forEach(q=>c.lineTo(...q));c.closePath();c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}};
    const box=(a,b,w,h,color,corner=2)=>{c.beginPath();c.roundRect(a,b,w,h,corner);c.fillStyle=color;c.fill();c.strokeStyle=ink;c.lineWidth=1;c.stroke();};
    const star=(cx,cy,size,color,n=5)=>{const v=[];for(let i=0;i<n*2;i++){const a=i*Math.PI/n-Math.PI/2,rr=i%2?size*.43:size;v.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr]);}poly(v,color);};
    if(kind==='birds')for(const [a,b] of [[-10,2],[0,-6],[10,4]]){c.beginPath();c.moveTo(a-5,b);c.quadraticCurveTo(a-2,b-5,a,b);c.quadraticCurveTo(a+3,b-5,a+6,b);c.strokeStyle=ink;c.lineWidth=1.7;c.stroke();}
    if(kind==='kite'){poly([[0,-r*.75],[r*.5,-2],[0,r*.45],[-r*.5,-2]],fill);line(-r*.5,-2,r*.5,-2,cream);line(0,-r*.75,0,r*.45,cream);line(0,r*.45,5,r*.72,cream);line(5,r*.72,1,r*.9,cream);}
    if(kind==='balloon'){c.beginPath();c.ellipse(0,-5,r*.52,r*.65,0,0,Math.PI*2);c.fillStyle=fill;c.fill();c.strokeStyle=ink;c.lineWidth=1;c.stroke();poly([[-3,r*.4],[3,r*.4],[0,r*.22]],fill);line(0,r*.43,-4,r*.9,cream);line(-r*.22,-r*.5,-r*.18,-r*.25,cream,2);}
    if(kind==='butterfly'){for(const dx of [-1,1]){c.beginPath();c.ellipse(dx*r*.34,-3,r*.33,r*.48,-dx*.5,0,Math.PI*2);c.fillStyle=fill;c.fill();c.strokeStyle=ink;c.stroke();circle(dx*r*.35,-5,3,cream);c.beginPath();c.ellipse(dx*r*.25,7,r*.24,r*.25,dx*.5,0,Math.PI*2);c.fillStyle='#e5ba68';c.fill();}line(0,-9,0,12,ink,2);line(0,-8,-5,-14);line(0,-8,5,-14);}
    if(kind==='dragonfly'){line(0,-10,0,13,ink,2);for(const side of [-1,1])for(const yy of [-4,4]){c.beginPath();c.ellipse(side*8,yy,10,3,side*.25,0,Math.PI*2);c.fillStyle='#d4dfc3';c.fill();c.strokeStyle='#697d65';c.lineWidth=1;c.stroke();}circle(0,-10,3,fill);}
    if(kind==='boat'){poly([[-r*.8,5],[r*.8,5],[r*.5,12],[-r*.5,12]],'#966646');poly([[0,-r*.75],[0,3],[r*.55,3]],cream);line(0,-r*.75,0,6);line(-r*.5,8,r*.5,8,fill,3);}
    if(kind==='fish'){c.beginPath();c.ellipse(-2,0,r*.58,r*.31,0,0,Math.PI*2);c.fillStyle=fill;c.fill();c.strokeStyle=ink;c.stroke();poly([[r*.4,0],[r*.85,-r*.4],[r*.85,r*.4]],fill);circle(-r*.4,-2,2,ink);line(-3,-5,1,-9,cream);}
    if(kind==='buoy'){c.beginPath();c.arc(0,0,r*.62,0,Math.PI*2);c.strokeStyle=cream;c.lineWidth=7;c.stroke();for(let i=0;i<4;i++){const a=i*Math.PI/2;c.beginPath();c.arc(0,0,r*.62,a,a+.38);c.strokeStyle='#c05b46';c.lineWidth=7;c.stroke();}}
    if(kind==='flower'){line(0,4,-2,r*.85,'#6a8646',2);for(let k=0;k<6;k++){const a=k*Math.PI/3;circle(Math.cos(a)*7,Math.sin(a)*7-4,5,fill);}circle(0,-4,4,'#ead26c');poly([[-1,10],[-10,5],[-8,13]],'#79944e');}
    if(kind==='ball'){circle(0,0,r*.68,'#e8dec2');c.beginPath();c.arc(0,0,r*.68,0,Math.PI*2);c.strokeStyle=ink;c.stroke();star(0,0,r*.35,fill);for(let k=0;k<5;k++){const a=k*Math.PI*2/5;line(Math.cos(a)*r*.3,Math.sin(a)*r*.3,Math.cos(a)*r*.64,Math.sin(a)*r*.64,ink,1);}}
    if(kind==='gift'){box(-r*.65,-r*.4,r*1.3,r*1.1,fill);box(-r*.72,-r*.53,r*1.44,5,fill);box(-2,-r*.53,4,r*1.22,cream,0);c.beginPath();c.ellipse(-5,-r*.68,6,3,.4,0,Math.PI*2);c.ellipse(5,-r*.68,6,3,-.4,0,Math.PI*2);c.strokeStyle=cream;c.lineWidth=2;c.stroke();}
    if(kind==='cone'){poly([[-r*.6,r*.65],[0,-r*.75],[r*.6,r*.65]],'#d58246');poly([[-r*.32,0],[r*.32,0],[r*.43,r*.25],[-r*.43,r*.25]],cream);box(-r*.75,r*.65,r*1.5,4,ink);}
    if(kind==='basket'){box(-r*.65,0,r*1.3,r*.65,'#b58b51');for(let y=4;y<r*.65;y+=4)line(-r*.55,y,r*.55,y,cream,1);for(const [a,b] of [[-8,-3],[0,-8],[8,-3]]){circle(a,b,6,fill);line(a,b-4,a+1,b-8,'#607548',2);}}
    if(kind==='umbrella'){line(0,-4,0,r*.8,ink,2);c.beginPath();c.arc(3,r*.77,3,0,Math.PI);c.strokeStyle=ink;c.stroke();c.beginPath();c.arc(0,-3,r*.78,Math.PI,Math.PI*2);c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=ink;c.stroke();line(0,-r*.78,0,-3,cream);}
    if(kind==='lantern'){line(0,-r*.9,0,-r*.6,ink);box(-r*.5,-r*.6,r,r*1.12,fill,7);line(-r*.2,-r*.5,-r*.2,r*.4,cream);line(r*.2,-r*.5,r*.2,r*.4,cream);line(0,r*.55,0,r*.9,'#b19558',2);}
    if(kind==='watering'){box(-9,-3,17,15,fill,3);poly([[8,2],[r*.8,-8],[r*.9,-5],[8,10]],fill);c.beginPath();c.arc(-8,1,7,Math.PI*.5,Math.PI*1.6);c.strokeStyle=ink;c.lineWidth=2;c.stroke();}
    if(kind==='pinwheel'){line(0,0,0,r*.9,'#ad8b5b',2);for(let i=0;i<4;i++){c.save();c.rotate(i*Math.PI/2);poly([[0,0],[r*.65,-r*.55],[r*.65,0]],i%2?cream:fill);c.restore();}circle(0,0,2,ink);}
    if(kind==='hat'){c.beginPath();c.ellipse(0,6,r*.8,r*.2,0,0,Math.PI*2);c.fillStyle='#d8b36c';c.fill();box(-r*.48,-r*.5,r*.96,r*.75,'#d8b36c',5);line(-r*.44,1,r*.44,1,fill,3);}
    if(kind==='flag'){line(-r*.45,-r*.8,-r*.45,r*.85,ink,2);poly([[-r*.45,-r*.75],[r*.65,-r*.48],[-r*.45,-r*.1]],fill);}
    if(kind==='hatband'){line(-r*.8,2,r*.8,2,'#b84739',3);line(-r*.65,5,r*.65,5,cream,1);}
    if(kind==='star')star(0,0,r*.7,'#e5bd58');
    if(kind==='diamond')poly([[0,-r*.7],[r*.6,0],[0,r*.7],[-r*.6,0]],'#73aaa5');
    if(kind==='window'){line(-r*.7,0,r*.7,0,cream,2);line(0,-r*.7,0,r*.7,cream,2);}
    if(kind==='hull-stripe'){line(-r*.8,-3,r*.8,-3,cream,3);line(-r*.8,2,r*.8,2,'#c4523d',3);}
    if(kind==='rope'){c.beginPath();c.ellipse(0,0,r*.75,r*.45,-.2,0,Math.PI*2);c.strokeStyle='#ddc995';c.lineWidth=2;c.stroke();line(-7,4,-9,9,'#ddc995',2);}
    if(kind==='vane'){line(0,-r*.8,0,r*.8,'#a88148',2);line(-r*.7,-2,r*.7,-2,'#a88148',2);poly([[r*.7,-2],[r*.25,-6],[r*.25,2]],'#b98944');}
    if(kind==='clock-flower'||kind==='clock-star'){circle(0,0,r-.8,'#eadabb');if(kind==='clock-star')star(0,0,r*.75,'#a3573c');else{for(let k=0;k<6;k++){const a=k*Math.PI/3;circle(Math.cos(a)*3,Math.sin(a)*3,2.5,'#a3573c');}circle(0,0,2,'#dfbc59');}}
    c.restore();
  }
  function prepare(base,unusedPatches,makeCanvas){
    return pool().map(p=>{
      let rendered;if(p.kind==='surface')rendered=surfaceSprite(base,p,makeCanvas);
      else {const sx=Math.floor(p.x-p.r-2),sy=Math.floor(p.y-p.r-2),d=2*p.r+5,canvas=makeCanvas(d,d),c=canvas.getContext('2d');c.translate(-sx,-sy);drawItem(c,p);rendered={canvas,sx,sy};}
      const {canvas,sx,sy}=rendered,d=canvas.width,check=makeCanvas(d,d),c=check.getContext('2d');
      c.drawImage(base,sx,sy,d,d,0,0,d,d);const before=c.getImageData(0,0,d,d).data;c.drawImage(canvas,0,0);const after=c.getImageData(0,0,d,d).data;let changed=0;
      for(let i=0;i<before.length;i+=4)if(Math.abs(before[i]-after[i])+Math.abs(before[i+1]-after[i+1])+Math.abs(before[i+2]-after[i+2])>36)changed++;
      return {...p,sprite:canvas,sx,sy,visiblePixels:changed};
    }).filter(p=>p.visiblePixels>=(p.kind==='surface'?45:30));
  }
  return {WIDTH,HEIGHT,pool,surfaces,rng,shuffle,conflicts,select,prepare,drawItem,surfaceSprite,toHsl,fromHsl};
});
