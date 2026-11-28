/* Editable scene artwork. Every possible change belongs to one isolated object.
   The same bounds drive painting, hit detection and the answer guide. */
(function (root) {
  'use strict';
  const W = 1080, H = 760;
  const palette = ['#d66a4e','#e4b64d','#3c847e','#597fa4','#937394','#7b964e'];
  const names = {tree:'Pokok',person:'Watak',bus:'Bas',bike:'Basikal',produce:'Bakul hasil',crate:'Peti',plant:'Pasu',cone:'Kon',sign:'Papan arah',window:'Tingkap',solar:'Panel suria',books:'Buku',clock:'Jam',flag:'Bendera hiasan',bin:'Tong',birds:'Burung',cloud:'Awan',lantern:'Tanglung',cart:'Troli',flower:'Bunga',bag:'Beg',board:'Papan tanda',barrier:'Penghadang',tools:'Alatan',helmet:'Topi keselamatan',watercan:'Penyiram',bench:'Bangku',box:'Kotak',car:'Kereta',bottle:'Botol'};
  const changes = {missing:'objek tiada',quantity:'bilangan berubah',pattern:'corak berubah',direction:'arah berubah',position:'kedudukan berubah',replace:'objek bertukar',colour:'warna berubah',detail:'bentuk atau butiran berubah'};
  const allowed = {
    tree:['quantity','detail'], person:['detail','colour'],bus:['direction','pattern','colour'],bike:['direction','detail'],
    produce:['quantity','colour'],crate:['quantity','pattern'],plant:['detail','position'],cone:['pattern','missing'],
    sign:['direction','detail'],window:['pattern','detail'],solar:['quantity','detail'],books:['quantity','pattern'],
    clock:['detail','missing'],flag:['direction','pattern'],bin:['detail','colour'],birds:['quantity','missing'],
    cloud:['detail','position'],lantern:['pattern','missing'],cart:['direction','detail'],flower:['quantity','colour'],
    bag:['pattern','replace'],board:['detail','pattern'],barrier:['pattern','missing'],tools:['replace','direction'],
    helmet:['detail','colour'],watercan:['direction','colour'],bench:['detail','position'],box:['pattern','replace'],
    car:['direction','colour'],bottle:['quantity','colour']
  };
  const themes = [
    {id:'pasar',name:'Pasar Rakyat',tag:'Usahawan & komuniti',building:'PASAR RAKYAT',sky:'#dfebe5',wall:'#f4d9ae',roof:'#b35f4d',ground:'#eee2c7',accent:'#ad5340',
      rows:[['cloud','birds','flag','lantern','cloud','birds'],['tree','sign','window','clock','window','tree'],['produce','crate','person','cart','produce','bag'],['bike','person','bin','bench','person','plant'],['flower','box','watercan','bottle','crate','flower']]},
    {id:'sekolah',name:'Sekolah Komuniti',tag:'Pendidikan & kemahiran',building:'SEKOLAH KOMUNITI',sky:'#e2edf1',wall:'#efdfb9',roof:'#557b83',ground:'#e9e4cd',accent:'#3f7e86',
      rows:[['cloud','birds','flag','cloud','birds','flag'],['tree','window','clock','window','board','tree'],['books','bag','person','books','person','plant'],['bike','person','bin','bench','sign','bag'],['flower','box','bottle','crate','watercan','flower']]},
    {id:'klinik',name:'Klinik Sejahtera',tag:'Kesihatan & kesejahteraan',building:'KLINIK SEJAHTERA',sky:'#e4eeea',wall:'#f1e7d2',roof:'#6b9390',ground:'#e5dfce',accent:'#468c82',
      rows:[['cloud','birds','cloud','flag','birds','cloud'],['tree','window','clock','window','sign','tree'],['plant','person','bottle','bench','person','plant'],['car','cone','bin','person','cart','sign'],['flower','bag','box','watercan','bottle','flower']]},
    {id:'ladang',name:'Ladang Pintar',tag:'Pertanian & keterjaminan makanan',building:'KOPERASI TANI',sky:'#e7edda',wall:'#ead4ad',roof:'#7d8656',ground:'#e5dfb7',accent:'#647e42',
      rows:[['cloud','birds','flag','cloud','birds','cloud'],['tree','solar','window','clock','solar','tree'],['produce','crate','person','produce','cart','watercan'],['bike','person','bin','sign','person','plant'],['flower','crate','tools','box','bottle','flower']]},
    {id:'transit',name:'Hab Pengangkutan',tag:'Mobiliti & kemudahan awam',building:'HAB KOMUNITI',sky:'#e1e9ed',wall:'#e6ddc7',roof:'#526e89',ground:'#e3dfd4',accent:'#496d8b',
      rows:[['cloud','birds','flag','cloud','birds','cloud'],['tree','sign','clock','window','board','tree'],['bus','person','bag','bench','person','plant'],['bike','cone','bin','car','sign','person'],['flower','box','bottle','barrier','bag','flower']]},
    {id:'bina',name:'Tapak Pembinaan',tag:'Infrastruktur & pekerjaan',building:'PUSAT KOMUNITI',sky:'#ede9dc',wall:'#e8d1af',roof:'#a07b52',ground:'#e9d9be',accent:'#ad7840',
      rows:[['cloud','birds','flag','cloud','birds','cloud'],['tree','window','solar','window','board','tree'],['helmet','crate','person','tools','person','cone'],['car','barrier','bin','cart','sign','person'],['flower','box','watercan','bottle','tools','plant']]}
  ];
  function rng(seed) { return function(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
  function shuffle(a,random) { a=a.slice();for(let i=a.length-1;i>0;i--){let j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a; }
  function makeObjects(scene,seed) {
    const random=rng(seed), objects=[];
    scene.rows.forEach((row,r)=>row.forEach((kind,col)=>{
      const x=38+col*169+(random()-.5)*12;
      const ys=[18,166,330,471,622], sizes=[88,91,104,100,91];
      const w=(kind==='bus'||kind==='car')?142:sizes[r]+(kind==='bench'?22:0);
      const h=kind==='person'?116:kind==='tree'?126:sizes[r];
      // Nine easy, twelve medium, nine hard candidates, scattered over all rows.
      const n=r*6+col, level=n%10<3?'easy':n%10<7?'medium':'hard';
      const priorities={easy:['missing','replace','colour','quantity','direction','detail'],medium:['direction','quantity','pattern','detail','colour','position','missing','replace'],hard:['detail','position','pattern','quantity','direction','colour','missing','replace']};
      const ops=allowed[kind],preferred=priorities[level].filter(op=>ops.includes(op));
      const op=preferred[Math.floor(random()*Math.min(2,preferred.length))];
      objects.push({id:scene.id+'-'+n,kind,name:names[kind],op,level,x,y:ys[r]+(random()-.5)*9,w,h,
      colour:palette[Math.floor(random()*palette.length)],count:2+Math.floor(random()*2), flip:random()<.5, variant:random()<.5?0:1});
    }));
    return objects;
  }
  function selectChanges(objects,random) {
    let chosen;
    for(let attempt=0;attempt<100;attempt++){
      chosen=['easy','medium','hard'].flatMap((level,i)=>shuffle(objects.filter(o=>o.level===level),random).slice(0,[3,4,3][i]));
      if(new Set(chosen.map(o=>o.op)).size>=5&&chosen.filter(o=>o.op==='colour').length<=2)break;
    }
    return chosen;
  }
  function createRound(sceneIndex,seed) {
    const scene=themes[sceneIndex],random=rng(seed^0x31af),objects=makeObjects(scene,seed),selected=selectChanges(objects,random);
    return {sceneIndex,seed,scene,objects,selected,changed:new Set(selected.map(o=>o.id)),signature:scene.id+':'+seed+':'+selected.map(o=>o.id).sort().join(',')};
  }
  function renderer(c) {
    const ink='#344b48';
    function line(x,y,a,b,color=ink,width=2.5){c.beginPath();c.moveTo(x,y);c.lineTo(a,b);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
    function rect(x,y,w,h,fill,r=0,stroke=null){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
    function circle(x,y,r,fill,stroke=null){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
    function poly(p,fill,stroke=null){c.beginPath();c.moveTo(...p[0]);p.slice(1).forEach(v=>c.lineTo(...v));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
    function text(t,x,y,size=15,color=ink){c.fillStyle=color;c.font='700 '+size+'px system-ui';c.textAlign='center';c.fillText(t,x,y);}
    return {ink,line,rect,circle,poly,text};
  }
  function background(c,s) {
    const {rect,line,circle,poly,text}=renderer(c);
    rect(0,0,W,H,s.sky);circle(960,65,32,'#f5db97');
    poly([[0,285],[0,194],[150,140],[320,224],[455,178],[700,252],[885,151],[1080,220],[1080,330]],'#bdcbb6');
    rect(0,286,W,474,s.ground);
    // A continuous, scene-specific setting behind the editable foreground objects.
    if(s.id==='ladang'){
      rect(196,150,692,179,s.wall,3);poly([[172,155],[540,103],[909,155]],s.roof);rect(488,249,103,80,'#8a7753');
      for(let y=351;y<760;y+=76){poly([[0,y],[1080,y-35],[1080,y-13],[0,y+22]],'#b9be80');for(let x=20;x<W;x+=53){line(x,y+18,x+8,y+9,'#7d9353',3);}}
      for(let x=0;x<W;x+=46){rect(x,301,8,36,'#c1a477',2);}line(0,314,W,314,'#b99b6c',5);
    }else if(s.id==='transit'){
      rect(165,151,756,175,s.wall,5);rect(143,143,800,20,s.roof,4);rect(159,317,770,15,'#b7b6a5');
      for(const x of [175,910])rect(x,163,13,167,s.roof);rect(0,444,W,157,'#949d98');
      for(let x=0;x<W;x+=125)rect(x,519,65,7,'#f4eedc',2);
      for(let x=65;x<340;x+=35)rect(x,554,22,40,'#e9e6d8');
    }else if(s.id==='bina'){
      rect(196,148,683,180,s.wall);for(let x=210;x<879;x+=90)line(x,149,x,326,'#bbaa8d',8);
      for(const y of [156,235,322])line(190,y,889,y,'#9f9b86',8);
      line(965,287,965,88,'#b18a46',9);line(730,90,1021,90,'#b18a46',9);line(793,93,965,37,'#b18a46',5);line(965,38,1020,90,'#b18a46',5);line(790,94,790,146,'#64716a',3);
      for(let x=4;x<W;x+=70)poly([[x,589],[x+35,589],[x+64,610],[x+29,610]],'#bba478');
    }else{
      rect(192,155,698,171,s.wall,5);poly([[166,155],[540,104],[916,155]],s.roof);
      rect(480,247,120,79,s.roof,4);rect(493,255,94,71,'#9ab4ad',2);line(540,255,540,325,'#f4ead4',3);
      rect(176,325,731,15,'#c1b594',3);
      if(s.id==='pasar'){
        for(let i=0;i<12;i++){rect(194+i*58,291,58,23,i%2?'#f2d8a8':s.roof,4);}
        for(const x of [191,890])rect(x,312,8,79,'#9d7c57');
      }
      if(s.id==='klinik'){rect(914,172,58,58,'#f5f0df',9);rect(937,182,12,38,'#b3574c');rect(924,195,38,12,'#b3574c');}
      if(s.id==='sekolah'){
        for(let x=340;x<740;x+=58)rect(x,544,30,45,['#d7b35d','#9cbd9b','#b8b1c6'][(x-340)/58%3],7);
        circle(540,436,58,'#d3bf87');circle(540,436,49,'#ede0b9');
      }
    }
    rect(370,167,340,40,'#fff4d9',5);text(s.building,540,193,20,s.accent);
    // Paths and planting beds ground the objects rather than arranging them in a grid.
    if(s.id!=='transit'&&s.id!=='ladang'){
      poly([[481,338],[603,338],[734,760],[360,760]],'#f6edda');
      line(0,613,W,613,'#c5bca1',2);
    }
    for(const x of [8,1018]){rect(x,650,52,91,'#b0bb89',24);for(let y=672;y<740;y+=25)circle(x+26,y,9,'#d8c09a');}
  }
  function drawObject(c,o,changed) {
    if(changed&&o.op==='missing')return;
    const {ink,line,rect,circle,poly,text}=renderer(c);
    c.save();c.translate(o.x,o.y);c.scale(o.w/100,o.h/100);
    let kind=o.kind,color=o.colour,n=o.count,variant=o.variant;
    if(changed&&o.op==='replace')kind=kind==='tools'?'watercan':kind==='bag'?'box':'bag';
    if(changed&&o.op==='colour')color=palette[(palette.indexOf(color)+2)%palette.length];
    if(changed&&o.op==='quantity')n++;
    if(changed&&o.op==='detail')variant=1-variant;
    if(changed&&o.op==='position')c.translate(11,-8);
    const flipped=o.flip!==(changed&&o.op==='direction');
    if(['sign','flag','bus','car','bike','cart','watercan','tools'].includes(kind)&&flipped){c.translate(100,0);c.scale(-1,1);}
    const detail=changed&&o.op==='detail',pattern=changed&&o.op==='pattern';
    // Repeated shadows are deliberately subtle; omitted objects remove their shadows too.
    if(!['cloud','birds','flag','window','solar','clock','lantern','board'].includes(kind)){
      c.save();c.globalAlpha=.12;c.beginPath();c.ellipse(50,94,35,5,0,0,Math.PI*2);c.fillStyle=ink;c.fill();c.restore();
    }
    switch(kind){
      case 'cloud':circle(30,42,18,'#fbf7e9');circle(50,31,24,'#fbf7e9');circle(72,43,19,'#fbf7e9');rect(24,42,57,18,'#fbf7e9',8);if(variant)circle(66,27,14,'#fbf7e9');break;
      case 'birds':for(let i=0;i<n;i++){let x=13+i*25,y=28+(i%2)*21;c.beginPath();c.moveTo(x-9,y);c.quadraticCurveTo(x-3,y-7,x,y);c.quadraticCurveTo(x+5,y-7,x+10,y);c.strokeStyle=ink;c.lineWidth=3;c.stroke();}break;
      case 'tree':rect(44,49,12,45,'#9b7858',3);for(let i=0;i<n;i++)circle(34+(i%2)*30,30+Math.floor(i/2)*21,23,i%2?'#83a078':'#6e916e');if(variant){circle(34,32,5,'#d68b5b');circle(64,40,5,'#d68b5b');}break;
      case 'window':rect(17,10,68,78,'#f7edce',3,ink);rect(23,16,56,66,'#a0b9b4',1);line(51,17,51,82,'#f7edce',4);line(23,48,79,48,'#f7edce',4);if(variant){poly([[23,16],[39,16],[33,73],[23,78]],color);poly([[64,16],[79,16],[79,77],[69,73]],color);}else{line(30,27,41,19,'#dfe8d9',3);}break;
      case 'clock':circle(50,47,34,'#fbf2d9',ink);circle(50,47,28,'#f6ead0');for(let i=0;i<12;i++){let a=i*Math.PI/6;line(50+Math.cos(a)*25,47+Math.sin(a)*25,50+Math.cos(a)*28,47+Math.sin(a)*28,ink,2);}line(50,47,50,24,ink,3);line(50,47,variant?34:68,variant?58:47,ink,4);circle(50,47,3,color);break;
      case 'flag':line(26,94,26,5,ink,3);poly([[28,8],[83,16],[77,46],[28,39]],color);if(variant)circle(49,25,8,'#f8e9b9');break;
      case 'lantern':line(50,1,50,17,ink,2);rect(24,18,52,58,color,20);line(35,22,35,73,'#eac79d',2);line(64,22,64,73,'#eac79d',2);rect(37,14,26,7,'#b08a50',2);rect(39,75,23,6,'#b08a50',2);line(50,81,50,96,'#b08a50',3);break;
      case 'person':rect(38,39,29,39,color,9);poly([[38,68],[51,68],[47,97],[36,97]],'#4c6264');poly([[53,68],[66,68],[70,97],[59,97]],'#4c6264');circle(52,25,14,'#c9976e');rect(36,10,32,10,'#465756',6);line(40,48,27,67,'#c9976e',8);line(65,48,79,65,'#c9976e',8);if(variant){rect(37,5,31,13,'#d9ad55',6);rect(32,16,42,5,'#d9ad55',2);}else{rect(67,60,21,19,'#d4b27e',3);line(72,61,72,54,ink,2);line(84,61,84,54,ink,2);}circle(47,24,1.3,ink);circle(57,24,1.3,ink);break;
      case 'produce':rect(14,53,73,36,'#b58e58',6,ink);for(let i=0;i<n;i++){circle(28+i*18,48-(i%2)*9,12,color);line(28+i*18,35-(i%2)*9,32+i*18,30-(i%2)*9,'#628052',3);}for(let y=65;y<85;y+=9)line(19,y,82,y,'#e4c38a',2);break;
      case 'crate':for(let i=0;i<n;i++){let x=15+(i%2)*37,y=62-Math.floor(i/2)*34;rect(x,y,34,29,color,2,ink);line(x+5,y+6,x+29,y+24,'#f0ddba',2);line(x+5,y+24,x+29,y+6,'#f0ddba',2);}break;
      case 'plant':poly([[31,60],[70,60],[63,93],[38,93]],color);line(51,62,51,17,'#5b805c',4);poly([[50,46],[28,26],[27,45],[49,57]],'#6d946a');poly([[52,35],[76,18],[72,43],[52,51]],'#85a46e');if(variant)circle(51,15,9,'#dba36a');break;
      case 'flower':rect(17,75,67,18,'#aa845c',3);for(let i=0;i<n;i++){let x=24+i*18,y=49-(i%2)*11;line(x,79,x,y,'#678656',3);for(let k=0;k<5;k++){let a=k*Math.PI*2/5;circle(x+Math.cos(a)*6,y+Math.sin(a)*6,5,color);}circle(x,y,4,'#efcb6d');}break;
      case 'cone':poly([[22,86],[48,17],[55,17],[80,86]],'#cc8350',ink);poly([[34,53],[67,53],[73,68],[28,68]],'#f8edd4');rect(14,86,76,8,'#626d60',2);break;
      case 'sign':rect(44,34,9,62,'#907b5b',2);poly([[14,16],[70,16],[88,34],[70,51],[14,51]],color,ink);line(26,33,65,33,'#f8edce',4);line(57,25,66,33,'#f8edce',4);line(66,33,57,41,'#f8edce',4);if(variant)rect(21,61,61,17,'#efdfbb',3,ink);break;
      case 'solar':rect(13,18,77,56,'#658c9f',3,ink);for(let x=28;x<90;x+=19)line(x,19,x,73,'#c4d9d7',2);for(let i=1;i<=n;i++)line(14,18+i*55/(n+1),89,18+i*55/(n+1),'#c4d9d7',2);line(36,75,29,95,ink,3);line(67,75,74,95,ink,3);if(variant)circle(80,28,5,'#f4de92');break;
      case 'books':for(let i=0;i<n;i++){rect(17+(i%2)*5,80-i*17,68,14,i%2?'#d4ae58':color,2,ink);rect(25+(i%2)*5,83-i*17,55,7,'#f8ebcf',1);}break;
      case 'bin':rect(26,30,51,62,color,7,ink);rect(21,25,61,9,'#526e60',3);rect(43,18,19,7,'#526e60',2);if(variant){line(36,45,36,80,'#f5e6bc',3);line(65,45,65,80,'#f5e6bc',3);}else{circle(52,59,14,'#f5e6bc');poly([[52,47],[63,67],[41,67]],color);}break;
      case 'bag':rect(20,31,61,61,color,9,ink);c.beginPath();c.arc(50,31,16,Math.PI,0);c.strokeStyle=ink;c.lineWidth=4;c.stroke();rect(33,55,36,25,'#f0d7aa',4);break;
      case 'box':rect(18,25,65,64,color,3,ink);rect(44,25,12,64,'#e4c597');line(18,46,83,46,ink,2);break;
      case 'bottle':for(let i=0;i<n;i++){let x=12+i*23;rect(x,36,17,54,color,5,ink);rect(x+4,26,9,14,'#dce5d7',2);rect(x+3,23,11,6,'#6e887b',2);rect(x+2,58,13,15,'#f6eacb',1);}break;
      case 'watercan':rect(25,45,43,41,color,6,ink);c.beginPath();c.arc(29,50,21,Math.PI*.5,Math.PI*1.6);c.strokeStyle=ink;c.lineWidth=4;c.stroke();poly([[65,57],[89,34],[95,39],[69,77]],color,ink);rect(43,37,12,9,'#c4ab77',2);break;
      case 'bench':rect(12,28,77,12,color,3,ink);rect(12,45,77,12,color,3,ink);rect(8,65,84,10,'#9f805c',2);line(23,73,23,94,ink,5);line(78,73,78,94,ink,5);if(variant)rect(13,10,76,11,color,3,ink);break;
      case 'board':rect(15,14,71,60,'#f7e9c9',4,ink);line(25,75,19,98,ink,4);line(75,75,82,98,ink,4);rect(24,24,53,8,color,2);if(variant){circle(39,52,12,color);line(57,44,72,44,ink,3);line(57,54,72,54,ink,3);}else{line(28,45,72,45,ink,3);line(28,56,65,56,ink,3);}break;
      case 'barrier':line(23,50,18,96,ink,5);line(79,50,85,96,ink,5);rect(5,31,91,25,'#ead39a',3,ink);for(let x=15;x<90;x+=25)poly([[x,32],[x+12,32],[x+1,55],[x-11,55]],color);break;
      case 'helmet':c.beginPath();c.arc(50,61,30,Math.PI,0);c.fillStyle=color;c.fill();rect(14,60,74,11,color,4,ink);line(50,31,50,60,'#f3d895',5);if(variant)rect(37,47,26,8,'#f5edcd',2);break;
      case 'tools':line(26,87,69,24,'#a8875e',9);rect(56,15,34,16,'#73847e',3,ink);line(62,88,31,26,'#788e87',9);poly([[20,14],[34,11],[32,27],[42,31],[49,19],[50,37],[35,43],[25,31]],'#82958c',ink);break;
      case 'bike':circle(23,74,18,'#e5dcc2',ink);circle(79,74,18,'#e5dcc2',ink);for(const x of [23,79]){line(x,58,x,90,'#9caa9e',1);line(x-16,74,x+16,74,'#9caa9e',1);}line(23,74,44,44,color,4);line(44,44,60,74,color,4);line(23,74,60,74,color,4);line(44,44,69,44,color,4);line(69,44,79,74,color,4);line(68,44,67,29,ink,3);line(67,29,81,29,ink,3);line(42,44,40,35,ink,3);line(33,35,47,35,ink,4);if(variant)rect(3,42,26,13,'#c69e66',3,ink);break;
      case 'cart':circle(29,87,8,ink);circle(75,87,8,ink);rect(16,41,68,35,color,3,ink);line(83,44,91,23,ink,4);line(90,23,99,23,ink,4);if(variant){rect(25,20,26,23,'#dfc18b',2,ink);rect(54,27,24,15,'#e8d6ae',2,ink);}break;
      case 'bus':rect(4,28,91,53,color,9,ink);rect(10,35,20,20,'#d3e0d6',3);rect(36,35,20,20,'#d3e0d6',3);rect(62,35,25,20,'#d3e0d6',3);rect(71,58,16,23,'#d3e0d6',2);circle(24,82,11,ink);circle(75,82,11,ink);circle(24,82,5,'#e9ddc2');circle(75,82,5,'#e9ddc2');rect(89,65,6,7,'#f7dda1',2);break;
      case 'car':rect(7,52,86,28,color,7,ink);poly([[22,52],[35,28],[67,28],[82,52]],color,ink);poly([[32,48],[40,33],[63,33],[73,48]],'#c3d6ce');circle(27,81,11,ink);circle(75,81,11,ink);circle(27,81,5,'#e9ddc2');circle(75,81,5,'#e9ddc2');rect(87,58,8,8,'#f8d992',2);break;
    }
    if(pattern){
      c.save();c.globalAlpha=.85;
      if(['window','flag','lantern','bag','box','board','bus'].includes(kind)){
        for(let x=30;x<=68;x+=12)for(let y=36;y<=63;y+=12)rect(x,y,6,6,'#fff0c2',1);
      }else{for(let y=47;y<75;y+=12)line(30,y,68,y,'#fff0c2',4);}
      c.restore();
    }
    c.restore();
  }
  function paint(c,round,altered){background(c,round.scene);round.objects.forEach(o=>drawObject(c,o,altered&&round.changed.has(o.id)));}
  function describe(o){
    const specific={
      'tree:quantity':'bilangan rimbunan daun berubah', 'tree:detail':'buah pada pokok berubah',
      'produce:quantity':'bilangan hasil di dalam bakul berubah', 'crate:quantity':'bilangan peti berubah',
      'solar:quantity':'bilangan garisan pembahagi panel berubah', 'solar:detail':'penanda pada panel berubah',
      'person:detail':'topi dan barang yang dipegang berubah', 'clock:detail':'kedudukan jarum jam berubah',
      'cloud:detail':'bentuk awan berubah', 'plant:detail':'bunga pada tumbuhan berubah',
      'window:detail':'langsir tingkap berubah', 'sign:detail':'papan kecil pada tiang berubah',
      'bin:detail':'simbol pada tong berubah', 'bike:detail':'bakul basikal berubah',
      'bench:detail':'bilangan papan penyandar berubah', 'cart:detail':'muatan troli berubah',
      'board:detail':'kandungan papan tanda berubah', 'helmet:detail':'jalur pada topi berubah'
    };
    return o.name+': '+(specific[o.kind+':'+o.op]||changes[o.op])+'.';
  }
  function hit(o,x,y){return x>=o.x-4&&x<=o.x+o.w+16&&y>=o.y-12&&y<=o.y+o.h+4;}
  const api={W,H,themes,palette,names,changes,rng,shuffle,makeObjects,createRound,paint,drawObject,describe,hit};
  if(typeof module!=='undefined')module.exports=api;else root.SpotScenes=api;
})(typeof window!=='undefined'?window:globalThis);
