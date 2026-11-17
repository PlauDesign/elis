'use strict';
(()=>{
const dialog=document.querySelector('#key-dialog'),instructions=document.querySelector('#key-instructions'),copy=document.querySelector('#key-copy'),add=document.querySelector('#key-insert'),feedback=document.querySelector('#key-feedback');let entries=[],os='windows',selectedHex=null,trigger=null;copy.disabled=add.disabled=true;
function paragraph(text){const p=document.createElement('p');p.textContent=text;return p}
function step(title,text){const h=document.createElement('h3');h.textContent=title;instructions.append(h,paragraph(text))}
function update(){const entry=entries.find(e=>e.hex===selectedHex);if(!entry)return;feedback.textContent='';document.querySelector('#key-glyph').textContent=entry.char;document.querySelector('#key-entry').textContent=entryName(entry.char);document.querySelector('#key-unicode').textContent='U+'+entry.hex;instructions.replaceChildren();
const meta=metadata(entry.char),point=anatomyPoints.find(p=>p.key===entry.char);
document.querySelector('#key-dialog-title').textContent=meta.label||T('Glifo · {0}',entryLabel(entry));
document.querySelector('#key-classification').textContent=meta.category+' / '+meta.group;
let description=point?(point.note||T('Ponto de articulação na região {0}. A localização não indica contato por si só.',point.name.toLowerCase())):meta.label?(meta.group+': '+meta.label+'.'):meta.category===T('Complementares')?T('Este caractere está codificado na fonte, mas não tem uma classificação linguística indicada no mapa beta.'):(T('Classificado no mapa beta como {0}. O guia não atribui uma descrição individual a este desenho.',meta.group.toLowerCase()));
if(point?.key==='K')description+=T(' Para tórax, este guia oferece apenas os contatos de dois e três traços, além da forma base.');
if(point?.baseOnly)description+=T(' A exploração do corpo apresenta apenas a forma base para esta referência.');
document.querySelector('#key-description').textContent=description;
document.querySelector('#key-body-link').hidden=!point;
const letter=/^[a-zA-Z]$/.test(entry.char),number=/^[0-9]$/.test(entry.char);
if(letter||number||entry.char===' '){step(T('No teclado'),entry.char===' '?T('Pressione Espaço.'):/^[A-Z]$/.test(entry.char)?T('Pressione Shift + {0}. Confira se Caps Lock está desligado.',entry.char.toLowerCase()):T('Digite {0} diretamente, com Caps Lock desligado.',entry.char));}
if(os==='windows'){
if(entry.alt&&entry.char.codePointAt(0)>126)step(T('Com teclado numérico'),T('Alt + {0} – mantenha Alt pressionado e digite {0} no teclado numérico, com Num Lock ativo. Código Windows-1252; confira o resultado no seu aplicativo.',entry.alt));
step(T('No Word para Windows'),T('Digite {0}, selecione somente esses quatro caracteres e pressione Alt + X. Depois aplique a fonte ELiS. Esse atalho é do Word; não é um atalho geral do Windows.',entry.hex));
step(T('Em outros editores'),T('Copie a entrada aqui e cole com Ctrl + V, ou abra o Mapa de Caracteres, selecione ELiS e procure U+{0}.',entry.hex));
}else{step(T('Pelo Visualizador de Caracteres'),T('Pressione Control + Command + Espaço. Expanda o visualizador se necessário, pesquise {0} (Unicode), confira o caractere e insira-o. Depois aplique ELiS no editor.',entry.hex));step(T('Pelo seu layout de teclado'),T('Abra o Visualizador de Teclado e pressione Option, Shift ou ambos para localizar a entrada. A combinação muda entre layouts como Brasileiro, Português e EUA.'));step(T('Para usar agora'),T('Clique em Copiar entrada e cole com Command + V no editor. Aplique ELiS ao trecho colado.'));}}
for(const b of document.querySelectorAll('[data-os]'))b.addEventListener('click',()=>{os=b.dataset.os;document.querySelectorAll('[data-os]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));update()});
document.querySelector('#key-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{if(trigger)trigger.focus({preventScroll:true})});
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()}});
document.querySelector('#key-body-link').addEventListener('click',()=>{const entry=entries.find(e=>e.hex===selectedHex);if(!entry)return;dialog.close();setAnatomy(entry.char);document.querySelector('#corpo').scrollIntoView({behavior:'instant'})});
function metadata(ch){for(const cat of categories){for(const group of cat.groups){const i=Array.from(group.keys).indexOf(ch);if(i!==-1)return {category:cat.name,group:group.name,label:group.labels?.[i]||null}}}return {category:T('Complementares'),group:T('Outros caracteres'),label:null}}
function entryLabel(e){return entryName(e.char)}
window.openKeyDetails=(char,button)=>{const e=entries.find(x=>x.char===char);if(!e)return false;selectedHex=e.hex;trigger=button;update();dialog.showModal();return true};
function addComplementary(){const known=new Set(categories.flatMap(c=>c.groups.flatMap(g=>Array.from(g.keys)))),keys=entries.map(e=>e.char).filter(c=>!known.has(c)).join('');if(!keys)return;const cat={id:'complementares',name:T('Complementares'),intro:T('Outros caracteres codificados na fonte, sem classificação linguística indicada.'),groups:[{name:T('Outros caracteres'),keys}]};categories.push(cat);addCategoryButton(cat)}
copy.addEventListener('click',async()=>{const e=entries.find(x=>x.hex===selectedHex);if(!e)return;try{await navigator.clipboard.writeText(e.char);feedback.textContent=T('Entrada copiada. Cole no seu editor e aplique ELiS.')}catch{feedback.textContent=T('A cópia automática não está disponível. Selecione e copie a entrada exibida acima.')}});
add.addEventListener('click',()=>{const e=entries.find(x=>x.hex===selectedHex);if(!e)return;insert(e.char);dialog.close()});
fetch('keyboard-data.json').then(r=>{if(!r.ok)throw new Error();return r.json()}).then(data=>{entries=data;copy.disabled=add.disabled=false;addComplementary()}).catch(()=>{toast(T('Não foi possível carregar os detalhes das teclas. Os cartões inserem direto no laboratório.'))});
})();
