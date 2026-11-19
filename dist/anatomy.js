'use strict';
// Landmarks in the 1024 x 1536 illustration; not definitions of exact linguistic boundaries.
const anatomyPoints=[
{key:'Q',name:T('Rosto'),group:T('Cabeça'),view:'face',xy:[512,143],radius:[85,108],spatial:true,note:T('Referência ao rosto. O ponto pode ser realizado no espaço à frente dele; o destaque não implica contato.')},
{key:'W',name:T('Alto da cabeça'),group:T('Cabeça'),view:'face',xy:[512,49],radius:[45,15],pin:true},
{key:'E',name:T('Lateral da cabeça'),group:T('Cabeça'),view:'face',xy:[567,103],radius:[16,42]},
{key:'R',name:T('Orelha'),group:T('Cabeça'),view:'face',xy:[577,145],radius:[14,24],pin:true},
{key:'T',name:T('Testa'),group:T('Cabeça'),view:'face',xy:[512,86],radius:[38,18],pin:true},
{key:'Y',name:T('Sobrancelha'),group:T('Cabeça'),view:'face',xy:[483,110],radius:[20,6]},
{key:'U',name:T('Olho'),group:T('Cabeça'),view:'face',xy:[483,130],radius:[17,10],pin:true},
{key:'I',name:T('Maçã do rosto'),group:T('Cabeça'),view:'face',xy:[548,152],radius:[17,12]},
{key:'O',name:T('Nariz'),group:T('Cabeça'),view:'face',xy:[512,159],radius:[15,19],pin:true},
{key:'P',name:T('Lábio superior'),group:T('Cabeça'),view:'face',xy:[512,177],radius:[17,6]},
{key:'A',name:T('Boca'),group:T('Cabeça'),view:'face',xy:[512,189],radius:[25,10],pin:true},
{key:'S',name:T('Dentes'),group:T('Cabeça'),view:'face',xy:[512,189],radius:[21,8],note:T('Os dentes ficam dentro da boca. O destaque é aproximado: a figura não mostra essa estrutura interna.')},
{key:'D',name:T('Bochecha'),group:T('Cabeça'),view:'face',xy:[476,175],radius:[18,19],pin:true},
{key:'F',name:T('Queixo'),group:T('Cabeça'),view:'face',xy:[512,215],radius:[21,10],pin:true},
{key:'G',name:T('Abaixo do queixo'),group:T('Cabeça'),view:'face',xy:[512,233],radius:[22,10]},
{key:'H',name:T('Pescoço'),group:T('Tronco'),view:'body',xy:[512,262],radius:[43,34],pin:true},
{key:'J',name:T('Corpo'),group:T('Tronco'),view:'body',xy:[512,487],radius:[125,180],spatial:true,baseOnly:true,note:T('Referência ampla ao corpo no quadro de 2016. O contorno é apenas uma ajuda de localização; não indica um toque em toda a área.')},
{key:'K',name:T('Tórax'),group:T('Tronco'),view:'body',xy:[512,383],radius:[105,75],pin:true},
{key:'L',name:T('Ao lado do corpo'),group:T('Tronco'),view:'body',xy:[785,445],radius:[37,100],spatial:true,baseOnly:true,note:T('Referência ao espaço ao lado do corpo. O destaque fica fora da silhueta para não sugerir uma superfície de contato.')},
{key:'Ç',name:T('Abdômen'),group:T('Tronco'),view:'body',xy:[512,574],radius:[83,76],pin:true},
{key:'\\',name:T('Braço inteiro'),group:T('Membros'),view:'body',xy:[326,494],radius:[49,204],note:T('Referência ampla ao membro superior. O contorno é aproximado e não determina a extensão de um contato.')},
{key:'Z',name:T('Ombro'),group:T('Membros'),view:'body',xy:[369,307],radius:[32,25],pin:true},
{key:'X',name:T('Axila'),group:T('Membros'),view:'body',xy:[384,391],radius:[17,23]},
{key:'C',name:T('Braço'),group:T('Membros'),view:'body',xy:[346,448],radius:[32,67],pin:true},
{key:'V',name:T('Cotovelo'),group:T('Membros'),view:'body',xy:[324,525],radius:[28,25],pin:true},
{key:'B',name:T('Antebraço'),group:T('Membros'),view:'body',xy:[294,608],radius:[31,65],pin:true},
{key:'N',name:T('Punho'),group:T('Membros'),view:'body',xy:[260,710],radius:[25,18],pin:true},
{key:'M',name:T('Perna'),group:T('Membros'),view:'body',xy:[416,1112],radius:[55,319],pin:true,note:T('Referência à perna no mapa. O destaque representa uma área ampla, não um ponto exato de contato.')}
];
let activePoint=anatomyPoints.find(p=>p.key==='H'),contactLevel=0;
const aSelect=document.querySelector('#anatomy-select');
for(const group of [T('Cabeça'),T('Tronco'),T('Membros')]){const optgroup=document.createElement('optgroup');optgroup.label=group;for(const p of anatomyPoints.filter(p=>p.group===group)){const o=document.createElement('option');o.value=p.key;o.textContent=p.name+' · '+p.key;optgroup.append(o)}aSelect.append(optgroup)}
function anatomySequence(){return (contactLevel?"'"+contactLevel:'')+activePoint.key}
function setAnatomy(key,level=0){const p=anatomyPoints.find(p=>p.key===key);if(!p||!Number.isInteger(level)||level<0||level>3||p.baseOnly&&level||p.key==='K'&&level===1)throw new Error('Ponto ou contato indisponível neste teste.');activePoint=p;contactLevel=level;renderAnatomy();return {region:p.name,entry:anatomySequence(),contact:level}}
function renderAnatomy(){const p=activePoint,face=p.view==='face',view=face?[340,15,340,340]:[0,0,1024,1536];aSelect.value=p.key;const stage=document.querySelector('#anatomy-stage');stage.classList.toggle('face',face);document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===p.view)));const region=document.querySelector('#anatomy-region');region.style.left=((p.xy[0]-view[0])/view[2]*100)+'%';region.style.top=((p.xy[1]-view[1])/view[3]*100)+'%';region.style.width=(p.radius[0]*2/view[2]*100)+'%';region.style.height=(p.radius[1]*2/view[3]*100)+'%';region.className=(contactLevel?'contact':'')+(p.spatial?' spatial':'');
const pins=document.querySelector('#anatomy-pins');pins.replaceChildren();for(const point of anatomyPoints.filter(pt=>pt.view===p.view&&pt.pin)){const b=document.createElement('button');b.type='button';b.className='anatomy-pin';const mark=document.createElement('span');mark.className='elis';mark.textContent=point.key===p.key?anatomySequence():point.key;mark.setAttribute('aria-hidden','true');b.append(mark);b.title=point.name+' · '+point.key;b.setAttribute('aria-label',T('Localizar {0}',point.name));b.setAttribute('aria-pressed',String(point.key===p.key));b.style.left=((point.xy[0]-view[0])/view[2]*100)+'%';b.style.top=((point.xy[1]-view[1])/view[3]*100)+'%';b.addEventListener('click',()=>setAnatomy(point.key));pins.append(b)}
document.querySelector('#anatomy-name').textContent=p.name;document.querySelector('#anatomy-group').textContent=T('PONTO DE ARTICULAÇÃO / {0}',p.group);document.querySelector('#anatomy-key').textContent=anatomySequence();const glyph=document.querySelector('#anatomy-glyph');glyph.textContent=anatomySequence();glyph.setAttribute('aria-label',T('Glifo {0}, {1}',p.name,contactLevel?T('{0} traço(s) de contato',contactLevel):T('forma base')));document.querySelector('#anatomy-meaning').textContent=p.note||T('Localização aproximada de {0}. A referência anatômica e a indicação de contato são informações distintas.',p.name.toLowerCase());
for(const r of document.querySelectorAll('input[name="contact"]')){r.checked=Number(r.value)===contactLevel;r.disabled=Boolean(p.baseOnly&&Number(r.value)>0||p.key==='K'&&r.value==='1')}
document.querySelector('#contact-explanation').textContent=[T('Forma base, sem acrescentar sublinhado. O local, sozinho, não descreve um sinal completo.'),T('Um traço: contato simples ou de passagem na região indicada.'),T('Dois traços: dois toques no ponto de articulação.'),T('Três traços: três toques ou mais no ponto de articulação.')][contactLevel];document.querySelector('#anatomy-caveat').textContent=p.key==='K'?T('Tórax: a reunião do projeto exclui o sublinhado simples. A fonte contém a combinação, mas este teste não a apresenta como uso linguístico validado.'):p.baseOnly?T('Para esta referência ampla ou espacial, o teste oferece apenas a forma base.'):'';}
aSelect.addEventListener('change',()=>setAnatomy(aSelect.value));document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setAnatomy(b.dataset.view==='face'?'O':'H')));document.querySelectorAll('input[name="contact"]').forEach(r=>r.addEventListener('change',()=>setAnatomy(activePoint.key,Number(r.value))));document.querySelector('#anatomy-insert').addEventListener('click',()=>{insert(anatomySequence());if(!document.querySelector('.lab').classList.contains('is-pinned'))document.querySelector('#experimentar').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});input.focus({preventScroll:true})});renderAnatomy();
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'explore_elis_articulation',title:'Explorar ponto de articulação',description:'Seleciona uma referência de cabeça, tronco ou membros e seu contato no explorador visual. Não insere no texto nem traduz palavras.',inputSchema:{type:'object',properties:{key:{type:'string',enum:anatomyPoints.map(p=>p.key)},contact:{type:'integer',minimum:0,maximum:3}},required:['key'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(args){if(!args||typeof args.key!=='string'||Object.keys(args).some(k=>!['key','contact'].includes(k)))throw new Error('Parâmetros inválidos');return setAnatomy(args.key,args.contact??0)}})).catch(()=>{})}catch{}}
