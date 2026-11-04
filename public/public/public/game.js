const $ = id => document.getElementById(id);
const LETTERS = "ABCDEFGHIJKLMNOPRSTUV".split("");
const BANK = {
  "ANIMAIS": ["abelha","anta","aranha","arara","atum","baleia","borboleta","boto","cachorro","cavalo","cobra","coelho","coruja","dinossauro","elefante","ema","foca","formiga","gato","girafa","golfinho","hamster","hipopótamo","iguana","jacaré","leão","lagarta","macaco","morcego","onça","ovelha","pato","papagaio","peixe","pinguim","porco","rato","raposa","sapo","tartaruga","tigre","urso","vaca","zebra"],
  "COMIDAS": ["abacate","abacaxi","acarajé","açaí","arroz","azeitona","banana","batata","biscoito","bolo","brigadeiro","caju","canjica","carne","cenoura","chocolate","coxinha","doce","empada","esfiha","feijão","farofa","goiabada","hambúrguer","lasanha","limão","macarrão","maçã","melancia"," milho","ovo"," pão","queijo","quiabo","salada","sopa","tomate","uva"],
  "OBJETOS": ["agenda","anel","apito","armário","avião","balde","bola","bolsa","borracha"," cadeira","caderno","caneta","celular","chave","colher","computador","copo","dado","escova","espelho","faca","garfo","guitarra","janela","lápis","livro","mesa","mochila","monitor","óculos","panela","papel","porta","quadro","rádio","relógio","sapato","sofá","teclado","telefone","tesoura","ventilador"],
  "LUGARES": ["Alemanha","Argentina","Bahia","Brasil","Canadá","Chile","China","Egito","Espanha","França","Grécia","Índia","Itália","Japão","México","Noruega","Portugal","Rússia","Suécia","Turquia","Uruguai"]
};
const normalize = s => String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/\s+/g," ");
let round = 0, seconds = 30, totalSeconds = 30, timer = null, answers = new Map(), players = new Map(), used = new Set();
let category = "ANIMAIS", letter = "A";
const seenEvents = new Set();
const ringLength = 270.2;
function chooseRound(){
  const cats = Object.keys(BANK);
  for(let tries=0;tries<100;tries++){
    const c = cats[Math.floor(Math.random()*cats.length)];
    const l = LETTERS[Math.floor(Math.random()*LETTERS.length)];
    const key = c+"-"+l;
    const options = BANK[c].filter(w=>normalize(w).startsWith(l.toLowerCase()));
    if(options.length && !used.has(key)){ used.add(key); category=c; letter=l; return; }
  }
  used.clear(); category=cats[Math.floor(Math.random()*cats.length)]; letter=LETTERS[Math.floor(Math.random()*LETTERS.length)];
}
function startRound(){
  round++; answers.clear(); chooseRound(); seconds=totalSeconds;
  $("roundLabel").textContent="RODADA "+String(round).padStart(2,"0");
  $("categoryLabel").textContent=category; $("letter").textContent=letter;
  $("prompt").textContent=`Fale ${category==="ANIMAIS"?"um animal":category==="COMIDAS"?"uma comida":category==="OBJETOS"?"um objeto":"um lugar"} com ${letter}`;
  $("answers").innerHTML='<div class="empty"><span>✦</span><b>Aguardando as primeiras respostas...</b><small>Participe pelo chat da live!</small></div>';
  updateCounts(); updateTimer();
}
function updateTimer(){
  $("timer").textContent=seconds;
  $("timerArc").style.strokeDashoffset=String(ringLength*(1-seconds/totalSeconds));
}
function tick(){
  seconds--; updateTimer();
  if(seconds<=0){ addFeed("⏱️","Rodada encerrada. Próximo desafio chegando."); startRound(); }
}
function addFeed(icon,msg){
  const p=document.createElement("p"); p.innerHTML=`<strong>${icon}</strong> ${escapeHtml(msg)}`;
  $("feed").prepend(p); while($("feed").children.length>5) $("feed").lastElementChild.remove();
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function updateCounts(){
  $("answerCount").textContent=answers.size;
  $("progressBar").style.width=Math.min(100,answers.size*10)+"%";
  $("playerCount").textContent=players.size+" JOGADORES";
  renderRanking();
}
function renderRanking(){
  const top=[...players.entries()].sort((a,b)=>b[1].score-a[1].score).slice(0,8);
  $("ranking").innerHTML=top.length?top.map(([name,p],i)=>`<div class="rank-row"><span class="rank-num">${i+1}</span><span class="rank-name">${escapeHtml(name)}</span><span class="rank-score">${p.score} pts</span></div>`).join(""):'<p class="muted">O ranking aparece quando chegarem jogadores.</p>';
}
function validAnswer(word){
  const candidate=normalize(word);
  return BANK[category].some(w=>normalize(w)===candidate && normalize(w).startsWith(letter.toLowerCase()));
}
function receiveComment(e){
  const username=String(e.username||"Visitante").slice(0,32);
  const comment=String(e.comment||"").trim();
  const key=normalize(comment);
  if(!key || !validAnswer(comment)) { addFeed("💬",`${username}: ${comment}`); return; }
  const answerKey=round+":"+key;
  if(answers.has(answerKey)) return;
  answers.set(answerKey,username);
  const player=players.get(username)||{score:0};
  player.score+=10; players.set(username,player);
  if($("answers").querySelector(".empty")) $("answers").innerHTML="";
  const card=document.createElement("div"); card.className="answer-card";
  const initials=username.slice(0,2).toUpperCase();
  card.innerHTML=`<div class="avatar">${escapeHtml(initials)}</div><div class="answer-info"><b>${escapeHtml(username)}</b><small>${escapeHtml(comment)}</small></div><span class="valid">+10</span>`;
  $("answers").prepend(card); updateCounts(); addFeed("✓",`${username} acertou: ${comment} (+10 pontos)`);
}
function receiveGift(e){
  const username=String(e.username||"Visitante").slice(0,32);
  const name=String(e.giftName||"Presente");
  const count=Math.max(1,Math.min(99,Number(e.giftCount)||1));
  const player=players.get(username)||{score:0};
  const bonus=name.toLowerCase().includes("rosa")?5:10;
  player.score+=bonus*count; players.set(username,player);
  updateCounts(); addFeed("🎁",`${username} enviou ${count}x ${name} e ganhou ${bonus*count} pontos!`);
}
function handleEvent(e){
  if(!e || !e.type) return;
  if(e.eventId){if(seenEvents.has(e.eventId))return;seenEvents.add(e.eventId);if(seenEvents.size>500)seenEvents.delete(seenEvents.values().next().value);}
  if(e.type==="comment") receiveComment(e);
  if(e.type==="gift") receiveGift(e);
}
function connect(){
  const protocol=location.protocol==="https:"?"wss:":"ws:";
  const ws=new WebSocket(`${protocol}//${location.host}`);
  ws.onopen=()=>{$("connection").textContent="CONECTADO";$("connection").parentElement.style.borderColor="#39745f";};
  ws.onmessage=ev=>{try{handleEvent(JSON.parse(ev.data));}catch{}};
  ws.onclose=()=>{$("connection").textContent="RECONectando".toUpperCase();$("connection").parentElement.style.borderColor="#725c32";setTimeout(connect,1800);};
  ws.onerror=()=>ws.close();
}
startRound(); timer=setInterval(tick,1000); connect();
