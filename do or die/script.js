"use strict";
const $=(s,r=document)=>r.querySelector(s);
const KEY="focusflow.tasks.v1",LOG="focusflow.log.v1",page=document.body.dataset.page,PRI=["high","med","low"];
const rd=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const wr=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(error){console.error(`Unable to save ${k} in local storage.`,error);return false}};
const day=(o=0)=>{const d=new Date();d.setDate(d.getDate()-o);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const validDate=value=>{if(typeof value!=="string"||! /^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(`${value}T00:00:00`);return Number.isFinite(d.getTime())&&dayFromDate(d)===value};
const dayFromDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2);
const taskData=rd(KEY,[]),rawLog=rd(LOG,{}),rawCfg=rd("focusflow.cfg.v1",{});
let tasks=(Array.isArray(taskData)?taskData:[]).filter(t=>t&&typeof t.id==="string"&&typeof t.title==="string").map(t=>({id:t.id.replace(/[^\w-]/g,""),title:t.title.slice(0,120),completed:t.completed===true,pri:PRI.includes(t.pri)?t.pri:"med",due:validDate(t.due)?t.due:day(),subj:typeof t.subj==="string"?t.subj.slice(0,60):"",notes:typeof t.notes==="string"?t.notes.slice(0,1000):"",scheduled:t.scheduled===true,awarded:t.awarded===true||(t.completed===true&&t.scheduled!==true)}));
let log=Object.assign({days:{},focus:0,games:0,badges:[]},rawLog&&typeof rawLog==="object"&&!Array.isArray(rawLog)?rawLog:{});
if(!log.days||typeof log.days!=="object"||Array.isArray(log.days))log.days={};
log.days=Object.fromEntries(Object.entries(log.days).filter(([date,count])=>validDate(date)&&Number.isFinite(Number(count))&&Number(count)>=0).map(([date,count])=>[date,Number(count)]));
if(!log.fmin||typeof log.fmin!=="object"||Array.isArray(log.fmin))log.fmin={};
log.fmin=Object.fromEntries(Object.entries(log.fmin).filter(([date,minutes])=>validDate(date)&&Number.isFinite(Number(minutes))&&Number(minutes)>=0).map(([date,minutes])=>[date,Number(minutes)]));
log.focus=Number.isFinite(Number(log.focus))&&Number(log.focus)>=0?Number(log.focus):0;
log.games=Number.isFinite(Number(log.games))&&Number(log.games)>=0?Number(log.games):0;
log.badges=Array.isArray(log.badges)?log.badges.filter(Number.isInteger):[];
const cfg=Object.assign({subjects:["General","Mathematics","Science","Languages"],cursor:true,fx:true},rawCfg&&typeof rawCfg==="object"&&!Array.isArray(rawCfg)?rawCfg:{});
cfg.subjects=Array.isArray(cfg.subjects)?[...new Set(cfg.subjects.filter(subject=>typeof subject==="string"&&subject.trim()).map(subject=>subject.trim().slice(0,60)))]:["General","Mathematics","Science","Languages"];

/* ---------- stats, badges, toasts ---------- */
function stats(){const total=Object.values(log.days).reduce((a,b)=>a+b,0);let streak=0,o=log.days[day()]?0:1;while(log.days[day(o)]){streak++;o++}
const xp=total*10+log.focus*25+(log.games||0)*5;return{games:log.games||0,total,today:log.days[day()]||0,streak,xp,level:Math.floor(xp/100)+1,focus:log.focus,perfect:(()=>{const T=tasks.filter(t=>t.due===day());return T.length>=3&&T.every(t=>t.completed)})()}}
const BADGES=[["1","First task","Complete your first task",s=>s.total>=1],["3","Three in a day","Complete 3 tasks in one day",s=>s.today>=3],["5","Five in a day","Complete 5 tasks in one day",s=>s.today>=5],["100%","Clear list","Finish a list of 3 or more tasks",s=>s.perfect],["3d","3-day streak","Study on 3 days in a row",s=>s.streak>=3],["FS","Focus session","Finish a focus session",s=>s.focus>=1],["L5","Level 5","Reach level 5",s=>s.level>=5],["25","25 tasks","Complete 25 tasks in total",s=>s.total>=25],["10","10 puzzles","Solve 10 brain puzzles",s=>s.games>=10],["50","50 puzzles","Solve 50 brain puzzles",s=>s.games>=50]];
function toast(m){const t=document.createElement("div");t.className="toast";t.setAttribute("role","status");t.textContent=m;document.body.append(t);setTimeout(()=>t.remove(),3500)}
function commit(){const saved=wr(KEY,tasks);const s=stats();BADGES.forEach((b,i)=>{if(b[3](s)&&!log.badges.includes(i)){log.badges.push(i);toast("Achievement unlocked: "+b[1])}});return wr(LOG,log)&&saved}
for(const task of tasks){if(task.scheduled&&task.completed&&!task.awarded&&task.due<=day()){task.awarded=true;log.days[task.due]=(log.days[task.due]||0)+1;wr(KEY,tasks);wr(LOG,log)}}
function burst(x,y){for(let i=0;i<22;i++){const p=document.createElement("i"),a=Math.random()*6.28,d=60+Math.random()*90;p.className="confetti";p.style.cssText=`left:${x}px;top:${y}px;background:hsl(${240+Math.random()*80},90%,72%)`;document.body.append(p);p.animate([{transform:"none",opacity:1},{transform:`translate(${Math.cos(a)*d}px,${Math.sin(a)*d+50}px) rotate(${Math.random()*540}deg) scale(.4)`,opacity:0}],{duration:900,easing:"cubic-bezier(.2,.8,.3,1)"}).onfinish=()=>p.remove()}}

/* ---------- shared sidebar + date ---------- */
const NAV=[["index.html","overview","Overview","nav-icon-grid"],["study.html","study","Study","nav-icon-book"],["tasks.html","tasks","Tasks","nav-icon-check"],["schedule.html","schedule","Schedule","nav-icon-calendar"],["syllabus.html","syllabus","Syllabus","nav-icon-book"],["achievements.html","achievements","Achievements","nav-icon-star"],["calculator.html","calc","Calculator","nav-icon-calc"],["games.html","games","Games","nav-icon-game"],["flashcards.html","cards","Flashcards","nav-icon-cards"],["settings.html","settings","Settings","nav-icon-cog"],["focusflow_sign_in_register.html","auth","Sign in","nav-icon-user"]];
const side=document.createElement("aside");side.className="sidebar";side.setAttribute("aria-label","Main navigation");
side.innerHTML=`<a class="brand" href="index.html" aria-label="FocusFlow home"><span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span><span>focusflow<span class="brand-period">.</span></span></a><div class="sidebar-section-label">Workspace</div><nav class="navigation" aria-label="Workspace">${NAV.map(n=>`<a class="nav-link${n[1]===page?" is-current":""}" href="${n[0]}"${n[1]===page?' aria-current="page"':""}><span class="nav-icon ${n[3]}" aria-hidden="true"></span><span>${n[2]}</span></a>`).join("")}</nav><div class="sidebar-footer"><span class="online-dot" aria-hidden="true"></span> Saved on this device</div>`;
$(".app-shell").prepend(side);
$("#today-label").textContent=new Intl.DateTimeFormat(undefined,{weekday:"long",month:"long",day:"numeric"}).format(new Date());

/* ---------- cursor tracker, starfield, 3D cube ---------- */
const fine=matchMedia("(hover:hover) and (pointer:fine)").matches&&cfg.cursor!==false,calm=matchMedia("(prefers-reduced-motion:reduce)").matches||cfg.fx===false;document.body.classList.toggle("fx-off",calm);
let mx=innerWidth/2,my=innerHeight/2,rx=mx,ry=my,spin=0;
const dot=document.createElement("div"),ring=document.createElement("div");dot.className="cursor-dot";ring.className="cursor-ring";
if(fine){document.body.classList.add("has-cursor");document.body.append(dot,ring)}
addEventListener("mousemove",e=>{mx=e.clientX;my=e.clientY;dot.style.opacity=ring.style.opacity=1;dot.style.transform=`translate(${mx}px,${my}px)`;
ring.classList.toggle("is-hover",!!e.target.closest("a,button,input,select,label,.tilt"));
const c=e.target.closest(".tilt");if(c){const r=c.getBoundingClientRect(),px=(mx-r.left)/r.width,py=(my-r.top)/r.height;c.style.setProperty("--mx",px*100+"%");c.style.setProperty("--my",py*100+"%");if(!calm){c.style.setProperty("--tx",(.5-py)*3+"deg");c.style.setProperty("--ty",(px-.5)*3+"deg")}}});
document.addEventListener("mouseout",e=>{const c=e.target.closest(".tilt");if(c){c.style.setProperty("--tx","0deg");c.style.setProperty("--ty","0deg")}});
const cv=document.createElement("canvas");cv.id="stars";cv.setAttribute("aria-hidden","true");document.body.prepend(cv);
const cx=cv.getContext("2d"),stars=Array.from({length:80},()=>({x:Math.random(),y:Math.random(),z:Math.random()*.9+.1})),cube=$(".cube");
const fit=()=>{cv.width=innerWidth;cv.height=innerHeight};fit();addEventListener("resize",fit);
(function frame(){rx+=(mx-rx)*.15;ry+=(my-ry)*.15;ring.style.transform=`translate(${rx}px,${ry}px)`;
if(!calm){const ox=mx/innerWidth-.5,oy=my/innerHeight-.5;cx.clearRect(0,0,cv.width,cv.height);
for(const s of stars){s.y=(s.y+s.z*.0002)%1;const x=((s.x*cv.width-ox*s.z*60)%cv.width+cv.width)%cv.width;cx.fillStyle=`rgba(150,205,255,${.2+s.z*.6})`;cx.beginPath();cx.arc(x,s.y*cv.height-oy*s.z*60,s.z*1.5,0,6.3);cx.fill()}
if(cube){spin+=.5;cube.style.transform=`rotateX(${-20+oy*60}deg) rotateY(${spin+ox*90}deg)`}}
requestAnimationFrame(frame)})();

/* ---------- shared progress summary ---------- */
function renderSummary(){const T=tasks.filter(t=>t.due===day()||(!t.completed&&t.due<day())),done=T.filter(t=>t.completed).length,n=T.length,p=n?Math.round(done/n*100):0;
$("#progress-count").textContent=`${done} of ${n} complete`;$("#progress-percent").textContent=p+"%";$("#progress-bar").setAttribute("aria-valuenow",p);$("#progress-fill").style.width=p+"%";
$("#progress-caption").textContent=!n?"A fresh page, ready when you are.":done===n?"You made it through today's list. Nicely done.":`${n-done} ${n-done===1?"task":"tasks"} left to focus on.`}

/* ---------- Overview ---------- */
if(page==="overview"){const s=stats();renderSummary();
$("#st-level").textContent=s.level;$("#st-streak").textContent=s.streak;$("#st-today").textContent=s.today;$("#st-xp").textContent=s.xp;
const next=tasks.filter(t=>!t.completed).sort((a,b)=>a.due<b.due?-1:a.due>b.due?1:PRI.indexOf(a.pri)-PRI.indexOf(b.pri)).slice(0,4),ul=$("#next");
ul.replaceChildren(...(next.length?next:[{title:"Nothing queued. Add a task to get started.",pri:""}]).map(t=>{const li=document.createElement("li");li.className="task-item";li.innerHTML='<span class="task-title"></span>'+(t.pri?`<span class="pri pri-${t.pri}">${t.pri==="med"?"Medium":t.pri[0].toUpperCase()+t.pri.slice(1)}</span>`:"");li.firstChild.textContent=t.title;const m=t.id&&meta(t);if(m)li.firstChild.after(m);return li}))}

/* ---------- Tasks page ---------- */
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function meta(t){const bits=[t.subj,!t.completed&&t.due<day()?"Overdue":t.due>day()?new Date(t.due+"T00:00").toLocaleDateString(undefined,{month:"short",day:"numeric"}):""].filter(Boolean);if(!bits.length)return null;const s=document.createElement("span");s.className="meta"+(bits.includes("Overdue")?" late":"");s.textContent=bits.join(" · ");return s}
function weekDays(){const m=new Date();m.setDate(m.getDate()-(m.getDay()+6)%7);return Array.from({length:7},(_,i)=>{const d=new Date(m);d.setDate(m.getDate()+i);return{k:d.toLocaleDateString("en-CA"),n:d.toLocaleDateString(undefined,{weekday:"long"}),s:d.toLocaleDateString(undefined,{month:"short",day:"numeric"})}})}
function iso(x,y,w,h,c,tip){const t=y-h,s=`<title>${esc(tip)}</title>`;if(h<2)return`<polygon points="${x},${y} ${x+w},${y} ${x+w+6},${y-3} ${x+6},${y-3}" fill="#ffffff18">${s}</polygon>`;
return`<g>${s}<rect x="${x}" y="${t}" width="${w}" height="${h}" fill="${c[0]}"/><polygon points="${x+w},${t} ${x+w+6},${t-3} ${x+w+6},${y-3} ${x+w},${y}" fill="${c[1]}"/><polygon points="${x},${t} ${x+6},${t-3} ${x+w+6},${t-3} ${x+w},${t}" fill="${c[2]}"/></g>`}
function weekly(){const W=weekDays(),today=day(),fm=log.fmin||{},rows=W.map(d=>{const T=tasks.filter(t=>t.due===d.k&&d.k<=today);return{...d,done:T.filter(t=>t.completed),open:T.filter(t=>!t.completed),m:fm[d.k]||0}});
const li=(a,c)=>a.length?`<ul class="${c}">${a.map(t=>`<li>${esc(t.title)}${t.subj?` <small>${esc(t.subj)}</small>`:""}</li>`).join("")}</ul>`:'<span class="none">None</span>';
$("#wk-body").innerHTML=rows.map(r=>{const n=r.done.length+r.open.length,p=n?Math.round(r.done.length/n*100):null;return`<tr${r.k===today?' class="today"':""}><th scope="row">${r.n}<small>${r.s}</small></th><td><div class="pbar"><i style="width:${p||0}%"></i></div>${p===null?"No tasks":p+"% · "+r.done.length+"/"+n}</td><td>${r.m} min</td><td>${li(r.done,"ok")}</td><td>${li(r.open,r.k<today?"no":"")}</td></tr>`}).join("");
const mt=Math.max(3,...rows.map(r=>r.done.length+r.open.length)),mf=Math.max(60,...rows.map(r=>r.m)),lab=(x,r)=>`<text x="${x}" y="172" text-anchor="middle">${r.n.slice(0,3)}</text>`,base='<line x1="10" y1="150" x2="410" y2="150" stroke="#ffffff22"/>';
$("#ch-tasks").innerHTML=`<svg viewBox="0 0 420 180" role="img" aria-label="Tasks done and not done per day this week">${base}${rows.map((r,i)=>{const x=22+i*57;return iso(x,150,16,r.done.length/mt*120,["#4f9bff","#2f6fe8","#8cc8ff"],r.n+": "+r.done.length+" done")+iso(x+20,150,16,r.open.length/mt*120,["#6f84a8","#52668a","#9db0cf"],r.n+": "+r.open.length+" not done")+lab(x+18,r)}).join("")}</svg>`;
$("#ch-focus").innerHTML=`<svg viewBox="0 0 420 180" role="img" aria-label="Focus minutes per day this week">${base}${rows.map((r,i)=>{const x=26+i*57;return iso(x,150,22,r.m/mf*120,["#4fd0ff","#2a95d6","#9be6ff"],r.n+": "+r.m+" min focused")+lab(x+14,r)}).join("")}</svg>`}
if(page==="tasks"){let f="all",mode="focus",dur=Math.min(180,Math.max(1,log.focusMin||25)),left=dur*60,tm=null;
const list=$("#task-list"),input=$("#task-input"),msg=$("#form-message"),pt=$("#pomo-time"),go=$("#pomo-start");
$("#task-subj").append(...["",...cfg.subjects].map(s=>new Option(s||"No subject",s)));$("#task-due").value=day();
function render(){const today=day(),inView=t=>t.due===today||(!t.completed&&t.due<today),v=tasks.filter(t=>inView(t)&&(f==="all"||(f==="active")!==t.completed)).sort((a,b)=>PRI.indexOf(a.pri)-PRI.indexOf(b.pri));
list.replaceChildren(...v.map(t=>{const li=document.createElement("li");li.className="task-item"+(t.completed?" is-completed":"");
li.innerHTML=`<input class="task-checkbox" type="checkbox" data-id="${t.id}"${t.completed?" checked":""}><span class="task-title"></span><span class="pri pri-${t.pri}">${t.pri}</span><button class="delete-button" type="button" data-id="${t.id}">×</button>`;
li.children[1].textContent=t.title;li.children[0].setAttribute("aria-label","Toggle completed: "+t.title);li.children[3].setAttribute("aria-label","Delete task: "+t.title);const m=meta(t);if(m)li.children[1].after(m);return li}));
const n=tasks.filter(inView).length;$("#task-count").textContent=n;$("#empty-state").hidden=v.length>0;list.hidden=!v.length;
$("#empty-title").textContent=!n?"Nothing planned for today":f==="completed"?"No completed tasks yet":"Nothing left to do";
$("#empty-description").textContent=!n?"Add a task above. Choose a later due date to plan ahead.":f==="completed"?"Completed tasks will appear here.":"Everything on today's list is done.";
renderSummary();weekly()}
$("#task-form").addEventListener("submit",e=>{e.preventDefault();const title=input.value.trim(),due=$("#task-due").value;if(!title||!/^\d{4}-\d\d-\d\d$/.test(due)){msg.textContent="Enter a task name and a due date.";return}
tasks.push({id:uid().replace(/[^\w-]/g,""),title,completed:false,pri:$("#task-pri").value,due,subj:$("#task-subj").value,awarded:false});msg.textContent="";e.target.reset();$("#task-due").value=day();commit();render();input.focus()});
document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{f=b.dataset.filter;document.querySelectorAll("[data-filter]").forEach(x=>{x.classList.toggle("is-selected",x===b);x.setAttribute("aria-pressed",x===b)});render()}));
list.addEventListener("change",e=>{const t=tasks.find(x=>x.id===e.target.dataset.id);if(!t)return;t.completed=e.target.checked;if(t.completed&&!t.awarded){t.awarded=true;const k=day();log.days[k]=(log.days[k]||0)+1;const r=e.target.getBoundingClientRect();burst(r.left+8,r.top+8)}commit();render()});
list.addEventListener("click",e=>{const b=e.target.closest(".delete-button");if(!b)return;tasks=tasks.filter(t=>t.id!==b.dataset.id);commit();render()});
addEventListener("keydown",e=>{if(e.key==="/"&&!/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();input.focus()}});
const ft=s=>String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");
const show=()=>{pt.textContent=ft(left);$("#pomo-mode").textContent=mode==="break"?"Break":"Focus";$("#logged").textContent=((log.fmin||{})[day()]||0)+" min focused today";document.title=tm?ft(left)+" | FocusFlow":"FocusFlow | Tasks"};
function setDur(m,md="focus"){clearInterval(tm);tm=null;go.textContent="Start";mode=md;dur=Math.min(180,Math.max(1,Math.round(m)||25));if(md==="focus"){log.focusMin=dur;wr(LOG,log)}left=dur*60;$("#pomo-min").value=dur;
document.querySelectorAll("[data-min]").forEach(b=>b.classList.toggle("is-selected",+b.dataset.min===dur&&(b.dataset.mode||"focus")===md));show()}
go.onclick=()=>{if(tm){clearInterval(tm);tm=null;go.textContent="Resume"}else{go.textContent="Pause";tm=setInterval(()=>{if(--left<=0){if(mode==="focus"){log.fmin=log.fmin||{};log.fmin[day()]=(log.fmin[day()]||0)+dur;if(dur>=5)log.focus++;commit();toast(dur>=5?"Focus session complete. +25 XP":"Session logged.");weekly();setDur(dur)}else{toast("Break over.");setDur(log.focusMin||25)}return}show()},1000)}show()};
$("#pomo-reset").onclick=()=>setDur(dur,mode);$("#pomo-plus").onclick=()=>{left+=300;show()};$("#pomo-min").onchange=e=>setDur(+e.target.value);
document.querySelectorAll("[data-min]").forEach(b=>b.onclick=()=>setDur(+b.dataset.min,b.dataset.mode||"focus"));
setDur(dur);render()}

/* ---------- Schedule ---------- */
if(page==="schedule"){
const form=$("#schedule-form"),title=$("#schedule-title"),subject=$("#schedule-subject"),date=$("#schedule-date"),priority=$("#schedule-priority"),notes=$("#schedule-notes"),message=$("#schedule-message"),list=$("#schedule-list");
let view="today",editingId="";
date.min=day();date.value=day();
function setMessage(text,isError=false){message.textContent=text;message.classList.toggle("is-error",isError);message.classList.toggle("is-success",!!text&&!isError)}
function setSubjectOptions(select,selected=""){
const values=[...new Set([...cfg.subjects,...tasks.map(task=>task.subj).filter(Boolean)])];
select.replaceChildren(new Option("No subject", ""));
values.forEach(value=>select.add(new Option(value,value)));
select.value=values.includes(selected)?selected:""
}
function refreshSubjectFilter(){
const filter=$("#schedule-filter-subject"),selected=filter.value,values=[...new Set(tasks.map(task=>task.subj).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
filter.replaceChildren(new Option("All subjects",""),...values.map(value=>new Option(value,value)));
filter.value=values.includes(selected)?selected:""
}
function isInView(task,today,tomorrow){
if(view==="today")return task.due===today||task.due<today&&!task.completed;
if(view==="tomorrow")return task.due===tomorrow;
if(view==="upcoming")return task.due>tomorrow;
return true
}
function taskDateLabel(value,today,tomorrow){
if(value<today)return`Overdue · ${new Date(`${value}T00:00:00`).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}`;
if(value===today)return"Due today";
if(value===tomorrow)return"Due tomorrow";
return`Due ${new Date(`${value}T00:00:00`).toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric",year:"numeric"})}`
}
function makeAction(label,action,className="add-button ghost"){
const button=document.createElement("button");button.type="button";button.className=className;button.textContent=label;button.setAttribute("aria-label",action+" scheduled task");return button
}
function render(){
const today=day(),tomorrow=day(-1),subjectFilter=$("#schedule-filter-subject").value,statusFilter=$("#schedule-filter-status").value;
const visible=tasks.filter(task=>isInView(task,today,tomorrow)&&(!subjectFilter||task.subj===subjectFilter)&&(statusFilter==="all"||(statusFilter==="completed")===task.completed)).sort((a,b)=>a.due.localeCompare(b.due)||PRI.indexOf(a.pri)-PRI.indexOf(b.pri)||a.title.localeCompare(b.title));
$("#schedule-count").textContent=visible.length;
$("#schedule-empty").hidden=visible.length>0;
list.hidden=visible.length===0;
list.replaceChildren(...visible.map(task=>{
const item=document.createElement("li");item.className="task-item schedule-item"+(task.completed?" is-completed":"")+(!task.completed&&task.due<today?" is-overdue":"");
const checkbox=document.createElement("input");checkbox.type="checkbox";checkbox.className="task-checkbox";checkbox.checked=task.completed;checkbox.setAttribute("aria-label",`${task.completed?"Mark incomplete":"Mark complete"}: ${task.title}`);
checkbox.addEventListener("change",()=>{
task.completed=checkbox.checked;
if(task.completed&&!task.awarded&&task.due<=day()){task.awarded=true;log.days[day()]=(log.days[day()]||0)+1}
if(!commit()){setMessage("Could not save this change. Check browser storage settings and try again.",true);return}
render()
});
const content=document.createElement("div");content.className="schedule-task-content";
const name=document.createElement("strong");name.className="task-title";name.textContent=task.title;
const metaLine=document.createElement("p");metaLine.className="schedule-task-meta";metaLine.textContent=[taskDateLabel(task.due,today,tomorrow),task.subj||"No subject",`${task.pri==="med"?"Medium":task.pri[0].toUpperCase()+task.pri.slice(1)} priority`].join(" · ");
if(!task.completed&&task.due<today)metaLine.classList.add("late");
content.append(name,metaLine);
if(task.notes){const detail=document.createElement("p");detail.className="schedule-task-notes";detail.textContent=task.notes;content.append(detail)}
const actions=document.createElement("div");actions.className="schedule-task-actions";
const moveLabel=document.createElement("label");moveLabel.className="visually-hidden";moveLabel.textContent=`Move date for ${task.title}`;
const moveDate=document.createElement("input");moveDate.type="date";moveDate.className="schedule-move-date";moveDate.value=task.due;moveDate.min=today;moveDate.setAttribute("aria-label",`New due date for ${task.title}`);
const move=makeAction("Move","Move");move.addEventListener("click",()=>{
if(!validDate(moveDate.value)||moveDate.value<day()){setMessage("Choose a valid date from today onward to move this task.",true);moveDate.focus();return}
task.due=moveDate.value;task.scheduled=true;
if(task.completed&&!task.awarded&&task.due<=day()){task.awarded=true;log.days[day()]=(log.days[day()]||0)+1}
if(!commit()){setMessage("Could not save this change. Check browser storage settings and try again.",true);return}
setMessage("Task date updated.");refreshSubjectFilter();render()
});
const edit=makeAction("Edit","Edit");edit.addEventListener("click",()=>{
editingId=task.id;title.value=task.title;setSubjectOptions(subject,task.subj);date.value=task.due;priority.value=task.pri;notes.value=task.notes;$("#schedule-form-title").textContent="Edit scheduled task";$("#schedule-submit").textContent="Save changes";$("#schedule-cancel").hidden=false;setMessage("");title.focus();form.scrollIntoView({behavior:"smooth",block:"center"})
});
const remove=makeAction("Delete","Delete","delete-button");remove.addEventListener("click",()=>{
tasks=tasks.filter(item=>item.id!==task.id);
if(!commit()){setMessage("Could not save this change. Check browser storage settings and try again.",true);return}
if(editingId===task.id)resetForm();refreshSubjectFilter();render()
});
moveLabel.append(moveDate);actions.append(moveLabel,move,edit,remove);item.append(checkbox,content,actions);return item
}))
}
function resetForm(){
editingId="";form.reset();date.value=day();date.min=day();setSubjectOptions(subject);$("#schedule-form-title").textContent="Add a scheduled task";$("#schedule-submit").textContent="Add task";$("#schedule-cancel").hidden=true
}
setSubjectOptions(subject);refreshSubjectFilter();
form.addEventListener("submit",event=>{
event.preventDefault();
const taskTitle=title.value.trim(),due=date.value;
if(!taskTitle){setMessage("Enter a task title before saving.",true);title.focus();return}
if(!validDate(due)||due<day()){setMessage("Choose a valid date from today onward.",true);date.focus();return}
if(editingId){
const task=tasks.find(item=>item.id===editingId);
if(!task){setMessage("This task no longer exists. Refresh the schedule and try again.",true);resetForm();render();return}
task.title=taskTitle;task.subj=subject.value;task.due=due;task.pri=PRI.includes(priority.value)?priority.value:"med";task.notes=notes.value.trim().slice(0,1000);task.scheduled=true
}else tasks.push({id:uid().replace(/[^\w-]/g,""),title:taskTitle,completed:false,pri:PRI.includes(priority.value)?priority.value:"med",due,subj:subject.value,notes:notes.value.trim().slice(0,1000),scheduled:true,awarded:false});
if(!commit()){setMessage("Could not save this task. Check browser storage settings and try again.",true);return}
resetForm();setMessage("Task saved.");refreshSubjectFilter();render()
});
$("#schedule-cancel").addEventListener("click",()=>{resetForm();setMessage("")});
document.querySelectorAll("[data-schedule-view]").forEach(button=>button.addEventListener("click",()=>{
view=button.dataset.scheduleView;document.querySelectorAll("[data-schedule-view]").forEach(item=>{const active=item===button;item.classList.toggle("is-selected",active);item.setAttribute("aria-pressed",String(active))});render()
}));
$("#schedule-filter-subject").addEventListener("change",render);$("#schedule-filter-status").addEventListener("change",render);
render()
}

/* ---------- Syllabus profiles and chapter tracker ---------- */
if(page==="syllabus"){
const STORAGE_KEY="focusflow.syllabus.v1",statusNames=["not-started","in-progress","completed"],examNames=["unverified","included","excluded","manual-included","manual-excluded"];
const classSelect=$("#syllabus-class"),boardSelect=$("#syllabus-board"),streamSelect=$("#syllabus-stream"),sessionSelect=$("#syllabus-session");
let syllabusData=null,store=readSyllabusStore(),profileKey="";
function readSyllabusStore(){
try{
const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
if(!parsed||typeof parsed!=="object"||!parsed.profiles||typeof parsed.profiles!=="object")return{activeProfile:"",profiles:Object.create(null)};
const profiles=Object.create(null);
for(const[key,value]of Object.entries(parsed.profiles)){
if(!value||typeof value!=="object"||!value.settings||!Array.isArray(value.selectedSubjects))continue;
const chapters=Object.create(null);
if(value.chapters&&typeof value.chapters==="object")for(const[subject,items]of Object.entries(value.chapters)){
if(!Array.isArray(items))continue;
chapters[subject]=items.filter(chapter=>chapter&&typeof chapter.id==="string"&&typeof chapter.title==="string").map(chapter=>({id:chapter.id.slice(0,80),title:chapter.title.trim().slice(0,160),order:Number.isInteger(chapter.order)&&chapter.order>0?chapter.order:1,status:statusNames.includes(chapter.status)?chapter.status:"not-started",examStatus:examNames.includes(chapter.examStatus)?chapter.examStatus:"unverified",revision:chapter.revision==="revised"?"revised":"not-revised",notes:typeof chapter.notes==="string"?chapter.notes.slice(0,500):"",source:chapter.source==="official"?"official":"manual"})).filter(chapter=>chapter.title)
}
profiles[key]={settings:value.settings,selectedSubjects:[...new Set(value.selectedSubjects.filter(subject=>typeof subject==="string").map(subject=>subject.slice(0,60)))],customSubjects:Array.isArray(value.customSubjects)?[...new Set(value.customSubjects.filter(subject=>typeof subject==="string").map(subject=>subject.trim().slice(0,60)).filter(Boolean))]:[],chapters}
}
return{activeProfile:typeof parsed.activeProfile==="string"?parsed.activeProfile:"",profiles}
}catch(error){console.error("Unable to read the saved syllabus profiles.",error);return{activeProfile:"",profiles:Object.create(null)}}
}
function saveSyllabusStore(){
store.activeProfile=profileKey;
if(wr(STORAGE_KEY,store))return true;
$("#syllabus-profile-note").textContent="Your syllabus changes could not be saved. Check browser storage settings and try again.";
return false
}
function selection(){
return{grade:Number(classSelect.value),board:boardSelect.value,stream:Number(classSelect.value)>=11?streamSelect.value:"",session:sessionSelect.value}
}
function keyFor(settings){return[settings.grade,settings.board,settings.stream,settings.session].join("|")}
function suggestedSubjects(settings){
const presets=syllabusData&&syllabusData.subjectPresets;
const gradePresets=presets&&presets[String(settings.grade)];
if(Array.isArray(gradePresets))return gradePresets;
if(gradePresets&&Array.isArray(gradePresets[settings.stream]))return gradePresets[settings.stream];
if(settings.grade===12||settings.grade===11){
return{
"Science PCM":["Physics","Chemistry","Mathematics","English","Computer Science"],
"Science PCB":["Physics","Chemistry","Biology","English"],
"Commerce":["Accountancy","Business Studies","Economics","English"],
"Humanities":["English","History","Political Science","Geography"]
}[settings.stream]||[]
}
return["Mathematics","Science","Social Science","English","Hindi"]
}
function ensureProfile(settings){
const key=keyFor(settings);
if(!store.profiles[key]){
store.profiles[key]={settings,selectedSubjects:suggestedSubjects(settings),customSubjects:[],chapters:Object.create(null)}
}
return key
}
function currentProfile(){return store.profiles[profileKey]}
function switchProfile(){
streamSelect.parentElement.hidden=Number(classSelect.value)<11;
const settings=selection();profileKey=ensureProfile(settings);
store.activeProfile=profileKey;
const profile=currentProfile();
classSelect.value=String(settings.grade);boardSelect.value=settings.board;if(settings.stream)streamSelect.value=settings.stream;sessionSelect.value=settings.session;
renderSubjectChoices();renderChapterSubjectOptions();renderChapters();
const streamText=settings.stream?` · ${settings.stream}`:"";
$("#syllabus-profile-note").textContent=`Profile saved: Class ${settings.grade} · ${settings.board}${streamText} · ${settings.session}. Other class, stream and session profiles remain saved separately.`;
saveSyllabusStore()
}
function renderSubjectChoices(){
const profile=currentProfile(),settings=selection(),container=$("#syllabus-subject-choices");
const options=[...new Set([...suggestedSubjects(settings),...profile.customSubjects,...profile.selectedSubjects])];
container.replaceChildren(...options.map((name,index)=>{
const label=document.createElement("label");label.className="syllabus-subject-option";
const checkbox=document.createElement("input");checkbox.type="checkbox";checkbox.checked=profile.selectedSubjects.includes(name);checkbox.value=name;checkbox.id=`syllabus-subject-${index}`;
checkbox.addEventListener("change",()=>{
const previous=[...profile.selectedSubjects],wasSelected=previous.includes(name);
if(checkbox.checked&&!profile.selectedSubjects.includes(name))profile.selectedSubjects.push(name);
if(!checkbox.checked)profile.selectedSubjects=profile.selectedSubjects.filter(subject=>subject!==name);
if(!saveSyllabusStore()){profile.selectedSubjects=previous;checkbox.checked=wasSelected;return}
renderChapterSubjectOptions();renderChapters()
});
const text=document.createElement("span");text.textContent=name;label.htmlFor=checkbox.id;label.append(checkbox,text);return label
}))
}
function renderChapterSubjectOptions(selected=""){
const profile=currentProfile(),select=$("#chapter-subject"),names=profile.selectedSubjects;
select.replaceChildren(...names.map(name=>new Option(name,name)));select.disabled=names.length===0;
select.value=names.includes(selected)?selected:(names[0]||"")
}
function matchingVerifiedData(){
if(!syllabusData||syllabusData.status!=="verified"||!Array.isArray(syllabusData.verifiedSyllabi))return null;
const settings=selection();
return syllabusData.verifiedSyllabi.find(entry=>entry.class===settings.grade&&entry.board===settings.board&&entry.academicSession===settings.session&&(!entry.stream||entry.stream===settings.stream))||null
}
function renderSyllabusReferences(){
const container=$("#syllabus-reference-list");
container.replaceChildren();
if(!syllabusData||!Array.isArray(syllabusData.sources))return;
for(const source of syllabusData.sources){
if(!source||typeof source.name!=="string"||typeof source.url!=="string"||!/^https:\/\//i.test(source.url))continue;
const wrapper=document.createElement("div");wrapper.className="syllabus-source-item";
const link=document.createElement("a");link.className="add-button ghost";link.href=source.url;link.target="_blank";link.rel="noopener noreferrer";link.textContent=source.name+" ↗";
wrapper.append(link);
if(typeof source.provides==="string"){const description=document.createElement("p");description.textContent=source.provides;wrapper.append(description)}
container.append(wrapper)
}
}
function seedVerifiedChapters(){
const entry=matchingVerifiedData();if(!entry||!Array.isArray(entry.subjects))return;
const profile=currentProfile();
for(const subject of profile.selectedSubjects){
if((profile.chapters[subject]||[]).length)continue;
const official=entry.subjects.find(item=>item.name===subject);
if(!official||!Array.isArray(official.chapters))continue;
profile.chapters[subject]=official.chapters.filter(item=>item&&typeof item.title==="string").map((chapter,index)=>({id:uid().replace(/[^\w-]/g,""),title:chapter.title.trim().slice(0,160),order:Number.isInteger(chapter.order)&&chapter.order>0?chapter.order:index+1,status:"not-started",examStatus:examNames.includes(chapter.examStatus)?chapter.examStatus:"unverified",revision:"not-revised",notes:"",source:"official"}))
}
}
function updateProgress(){
const chapters=currentProfile().selectedSubjects.flatMap(subject=>currentProfile().chapters[subject]||[]);
const completed=chapters.filter(chapter=>chapter.status==="completed").length,percent=chapters.length?Math.round(completed/chapters.length*100):0;
$("#syllabus-progress-title").textContent=`${completed} of ${chapters.length} chapters complete`;
$("#syllabus-overall-percent").textContent=percent+"%";$("#syllabus-overall-bar").setAttribute("aria-valuenow",percent);$("#syllabus-overall-fill").style.width=percent+"%"
}
function renderChapters(){
seedVerifiedChapters();
const profile=currentProfile(),container=$("#syllabus-subject-list"),filter=$("#chapter-filter").value;
container.replaceChildren(...profile.selectedSubjects.map(subject=>{
const chapters=[...(profile.chapters[subject]||[])].sort((a,b)=>a.order-b.order||a.title.localeCompare(b.title));
const completed=chapters.filter(chapter=>chapter.status==="completed").length,percent=chapters.length?Math.round(completed/chapters.length*100):0;
const section=document.createElement("section");section.className="syllabus-subject glass";
const header=document.createElement("div");header.className="syllabus-subject-header";
const heading=document.createElement("div"),name=document.createElement("h3"),count=document.createElement("p");name.textContent=subject;count.textContent=`${completed} of ${chapters.length} chapters complete`;heading.append(name,count);
const value=document.createElement("strong");value.textContent=percent+"%";header.append(heading,value);
const bar=document.createElement("div");bar.className="progress-track";bar.setAttribute("role","progressbar");bar.setAttribute("aria-label",`${subject} progress`);bar.setAttribute("aria-valuemin","0");bar.setAttribute("aria-valuemax","100");bar.setAttribute("aria-valuenow",String(percent));const fill=document.createElement("span");fill.className="progress-fill";fill.style.width=percent+"%";bar.append(fill);
const chapterList=document.createElement("ol");chapterList.className="chapter-list";
const shown=chapters.filter(chapter=>filter==="all"||chapter.status===filter);
if(!shown.length){const empty=document.createElement("li");empty.className="chapter-empty";empty.textContent=chapters.length?"No chapters match this status filter.":"No chapters added yet. Add them from the official textbook index below.";chapterList.append(empty)}
for(const chapter of shown){
const row=document.createElement("li");row.className="chapter-row"+(chapter.status==="completed"?" is-completed":"");
const chapterName=document.createElement("div");chapterName.className="chapter-name";
const titleNode=document.createElement("strong");titleNode.textContent=chapter.title;
const orderNode=document.createElement("small");orderNode.textContent=`Textbook order ${chapter.order} · ${chapter.source==="official"?"From bundled official dataset":"Manual entry"}`;
const examNode=document.createElement("small");examNode.className="chapter-exam-status";examNode.textContent=chapter.source==="official"&&chapter.examStatus==="included"?"Exam status: included (verified dataset)":chapter.source==="official"&&chapter.examStatus==="excluded"?"Exam status: not included (verified dataset)":chapter.examStatus==="manual-included"?"Exam status: marked included by you":chapter.examStatus==="manual-excluded"?"Exam status: marked not included by you":"Exam status: not checked against the current board syllabus";
chapterName.append(titleNode,orderNode,examNode);
if(chapter.notes){const note=document.createElement("small");note.className="chapter-note";note.textContent=chapter.notes;chapterName.append(note)}
const controls=document.createElement("div");controls.className="chapter-controls";
const state=document.createElement("select");state.id=`chapter-status-${chapter.id}`;state.setAttribute("aria-label",`${chapter.title} progress status`);[["not-started","Not started"],["in-progress","In progress"],["completed","Completed"]].forEach(([value,label])=>state.add(new Option(label,value)));state.value=chapter.status;state.addEventListener("change",()=>{const previous=chapter.status;chapter.status=state.value;if(!saveSyllabusStore()){chapter.status=previous;state.value=previous;return}renderChapters();document.getElementById(state.id)?.focus()});
const revision=document.createElement("select");revision.setAttribute("aria-label",`${chapter.title} revision status`);revision.add(new Option("Not revised","not-revised"));revision.add(new Option("Revised","revised"));revision.value=chapter.revision;revision.addEventListener("change",()=>{const previous=chapter.revision;chapter.revision=revision.value;if(!saveSyllabusStore()){chapter.revision=previous;revision.value=previous}});
const edit=document.createElement("button");edit.type="button";edit.className="add-button ghost";edit.textContent="Edit";edit.addEventListener("click",()=>beginChapterEdit(subject,chapter));
const remove=document.createElement("button");remove.type="button";remove.className="delete-button";remove.textContent="×";remove.setAttribute("aria-label",`Delete chapter ${chapter.title}`);remove.addEventListener("click",()=>{const previous=profile.chapters[subject];profile.chapters[subject]=chapters.filter(item=>item.id!==chapter.id);if(!saveSyllabusStore()){profile.chapters[subject]=previous;renderChapters();return}renderChapters()});
controls.append(state,revision,edit,remove);row.append(chapterName,controls);chapterList.append(row)
}
const addButton=document.createElement("button");addButton.type="button";addButton.className="add-button ghost";addButton.textContent="Add chapter";addButton.disabled=profile.selectedSubjects.length===0;addButton.addEventListener("click",()=>{renderChapterSubjectOptions(subject);$("#chapter-title").focus();$("#chapter-form").scrollIntoView({behavior:"smooth",block:"center"})});
section.append(header,bar,chapterList,addButton);return section
}));
updateProgress();
const matched=matchingVerifiedData(),warning=$("#syllabus-source-warning");
warning.textContent=matched?`Verified chapter data is available for Class ${selection().grade}, ${selection().board}, ${selection().session}. Check the listed sources for current exam changes.`:`No verified NCERT chapter index and board examination-syllabus mapping is bundled for Class ${selection().grade}, ${selection().board}, ${selection().session}. Chapter names, order and exam inclusion are not assumed. Add them manually after checking the official sources below.`;
$("#syllabus-data-note").textContent=syllabusData?`Dataset checked ${syllabusData.lastReviewed||"date not provided"} · Dataset session ${syllabusData.academicSession||"not specified"} · Manual entries are saved only on this device.`:"The syllabus data file could not be loaded. Manual chapter tracking remains available; dataset source metadata is unavailable."
renderSyllabusReferences()
}
function beginChapterEdit(subject,chapter=null){
renderChapterSubjectOptions(subject);
$("#chapter-title").value=chapter?.title||"";
$("#chapter-order").value=chapter?.order||((currentProfile().chapters[subject]||[]).reduce((max,item)=>Math.max(max,item.order),0)+1);
$("#chapter-exam-status").value=chapter?.examStatus==="included"||chapter?.examStatus==="manual-included"?"included":chapter?.examStatus==="excluded"||chapter?.examStatus==="manual-excluded"?"excluded":"unverified";
$("#chapter-notes").value=chapter?.notes||"";
$("#chapter-edit-id").value=chapter?.id||"";
$("#chapter-submit").textContent=chapter?"Save chapter":"Add chapter";$("#chapter-cancel").hidden=!chapter
}
classSelect.addEventListener("change",switchProfile);boardSelect.addEventListener("change",switchProfile);streamSelect.addEventListener("change",switchProfile);sessionSelect.addEventListener("change",switchProfile);
$("#custom-subject-form").addEventListener("submit",event=>{
event.preventDefault();const input=$("#custom-subject"),name=input.value.trim();
if(!name){input.focus();return}
const profile=currentProfile(),existing=[...suggestedSubjects(selection()),...profile.customSubjects];
if(existing.some(subject=>subject.toLocaleLowerCase()===name.toLocaleLowerCase())){$("#syllabus-profile-note").textContent="That subject is already in your subject list.";input.focus();return}
const added=name.slice(0,60);profile.customSubjects.push(added);profile.selectedSubjects.push(added);
if(!saveSyllabusStore()){profile.customSubjects=profile.customSubjects.filter(subject=>subject!==added);profile.selectedSubjects=profile.selectedSubjects.filter(subject=>subject!==added);renderSubjectChoices();renderChapters();return}
input.value="";renderSubjectChoices();renderChapterSubjectOptions(added);renderChapters()
});
$("#chapter-filter").addEventListener("change",renderChapters);
$("#chapter-form").addEventListener("submit",event=>{
event.preventDefault();const subject=$("#chapter-subject").value,title=$("#chapter-title").value.trim(),order=Number($("#chapter-order").value),editId=$("#chapter-edit-id").value;
if(!subject||!currentProfile().selectedSubjects.includes(subject)){$("#chapter-form-message").textContent="Choose a subject before adding a chapter.";return}
if(!title){$("#chapter-form-message").textContent="Enter a chapter title.";$("#chapter-title").focus();return}
if(!Number.isInteger(order)||order<1||order>999){$("#chapter-form-message").textContent="Enter a textbook order from 1 to 999.";$("#chapter-order").focus();return}
const profile=currentProfile(),chapters=profile.chapters[subject]||[],previous=chapters.map(chapter=>({...chapter}));
if(editId){
const chapter=chapters.find(item=>item.id===editId);
if(!chapter){$("#chapter-form-message").textContent="This chapter no longer exists.";return}
chapter.title=title.slice(0,160);chapter.order=order;chapter.examStatus=$("#chapter-exam-status").value==="included"?"manual-included":$("#chapter-exam-status").value==="excluded"?"manual-excluded":"unverified";chapter.notes=$("#chapter-notes").value.trim().slice(0,500);chapter.source="manual"
}else chapters.push({id:uid().replace(/[^\w-]/g,""),title:title.slice(0,160),order,status:"not-started",examStatus:$("#chapter-exam-status").value==="included"?"manual-included":$("#chapter-exam-status").value==="excluded"?"manual-excluded":"unverified",revision:"not-revised",notes:$("#chapter-notes").value.trim().slice(0,500),source:"manual"});
profile.chapters[subject]=chapters;
if(!saveSyllabusStore()){profile.chapters[subject]=previous;renderChapters();$("#chapter-form-message").textContent="Could not save this chapter. Check browser storage settings and try again.";return}
$("#chapter-form").reset();$("#chapter-edit-id").value="";$("#chapter-order").value="1";$("#chapter-submit").textContent="Add chapter";$("#chapter-cancel").hidden=true;$("#chapter-form-message").textContent="Chapter saved to this profile.";renderChapterSubjectOptions(subject);renderChapters()
});
$("#chapter-cancel").addEventListener("click",()=>{$("#chapter-form").reset();$("#chapter-edit-id").value="";$("#chapter-submit").textContent="Add chapter";$("#chapter-cancel").hidden=true;$("#chapter-form-message").textContent="";$("#chapter-order").value="1"});
$("#chapter-subject").addEventListener("change",()=>{$("#chapter-order").value=String((currentProfile().chapters[$("#chapter-subject").value]||[]).reduce((max,item)=>Math.max(max,item.order),0)+1)});
const savedProfile=store.profiles[store.activeProfile];
if(savedProfile&&savedProfile.settings){
const settings=savedProfile.settings,grade=Number(settings.grade);
const validGrade=[9,10,11,12].includes(grade);
const validBoard=[...boardSelect.options].some(option=>option.value===settings.board);
const validSession=[...sessionSelect.options].some(option=>option.value===settings.session);
const validStream=grade<11||[...streamSelect.options].some(option=>option.value===settings.stream);
if(validGrade&&validBoard&&validSession&&validStream){
classSelect.value=String(grade);boardSelect.value=settings.board;sessionSelect.value=settings.session;
if(grade>=11)streamSelect.value=settings.stream
}
}
switchProfile();
fetch("syllabus-data.json").then(response=>{if(!response.ok)throw new Error(`Syllabus data request failed (${response.status}).`);return response.json()}).then(data=>{
if(!data||!Array.isArray(data.sources)||!Array.isArray(data.chapters)||typeof data.status!=="string")throw new Error("The syllabus data file has an invalid structure.");
syllabusData=data;
if(Array.isArray(data.availableSessions)){
const savedSession=sessionSelect.value,sessions=[...new Set(data.availableSessions.filter(value=>typeof value==="string"&&/^\d{4}-\d{2}$/.test(value)))];
if(!sessions.length)throw new Error("The syllabus data file has no valid academic sessions.");
if(/^\d{4}-\d{2}$/.test(savedSession)&&!sessions.includes(savedSession))sessions.push(savedSession);
const session=sessions.includes(savedSession)?savedSession:(sessions.includes(data.academicSession)?data.academicSession:sessions[0]);
sessionSelect.replaceChildren(...sessions.map(value=>new Option(value,value)));sessionSelect.value=session
}
}).catch(error=>{console.error("Unable to load syllabus source metadata.",error);syllabusData=null}).finally(()=>{renderSubjectChoices();renderChapterSubjectOptions();renderChapters()})
}

/* ---------- Achievements page ---------- */
if(page==="achievements"){const s=stats(),xpIn=s.xp%100;
$("#ring").style.setProperty("--p",xpIn+"%");$("#lvl").textContent=s.level;$("#xp-text").textContent=`${xpIn} / 100 XP to reach level ${s.level+1}`;
$("#a-streak").textContent=s.streak;$("#a-total").textContent=s.total;$("#a-focus").textContent=s.focus;$("#a-xp").textContent=s.xp;
const days=Array.from({length:7},(_,i)=>day(6-i)),top=Math.max(1,...days.map(d=>log.days[d]||0));
$("#week").innerHTML=days.map(d=>`<div class="bar"><span>${log.days[d]||0}</span><i style="height:${Math.max(3,(log.days[d]||0)/top*70)}px"></i><span>${new Date(d+"T00:00").toLocaleDateString(undefined,{weekday:"short"})}</span></div>`).join("");
$("#quests").innerHTML=[["Complete a task",Math.min(1,s.today),1],["Complete 3 tasks today",Math.min(3,s.today),3],["Clear your whole list",s.perfect?1:0,1]].map(q=>`<div class="quest tilt${q[1]>=q[2]?" done":""}"><strong>${q[0]}</strong><span>${q[1]} / ${q[2]}</span><div class="progress-track"><span class="progress-fill" style="width:${q[1]/q[2]*100}%"></span></div></div>`).join("");
$("#badges").innerHTML=BADGES.map((b,i)=>`<div class="badge tilt${log.badges.includes(i)?" on":""}"><span class="ic" aria-hidden="true">${b[0]}</span><h3>${b[1]}</h3><p>${b[2]}${log.badges.includes(i)?"":" (locked)"}</p></div>`).join("")}

/* ---------- Overview extras: greeting, clock, tip ---------- */
if(page==="overview"){const h=new Date().getHours(),T=["Break big goals into 25-minute focus blocks.","Do the hardest task first, while your mind is fresh.","Explaining a topic out loud shows what you don't know yet.","Sleep is a study tool. Protect it before exams.","Test yourself instead of rereading. Recall builds memory."];
$("#greet").textContent=h<12?"Good morning.":h<18?"Good afternoon.":"Good evening.";$("#tip").textContent=T[new Date().getDate()%T.length];
const tick=()=>$("#clock").textContent=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});tick();setInterval(tick,15000)}

/* ---------- Calculator ---------- */
function evalExpr(source,isRadian=false){
	const text=source.replace(/[×]/g,"*").replace(/[÷]/g,"/").replace(/[−]/g,"-").replace(/[π]/g,"pi").replace(/\s+/g,"");
	let index=0;
	const fail=()=>{throw new Error("Invalid mathematical expression")};
	const peek=()=>text[index]||"";
	const number=()=>{const match=/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(text.slice(index));if(!match)return null;index+=match[0].length;return Number(match[0])};
	const expression=()=>{let value=term();while(peek()==="+"||peek()==="-"){const op=text[index++],right=term();value=op==="+"?value+right:value-right}return value};
	const term=()=>{let value=unary();while(true){const op=peek();if(op==="*"||op==="/"){index++;const right=unary();value=op==="*"?value*right:value/right;continue}if(startsPrimary()){value*=unary();continue}break}return value};
	const unary=()=>{if(peek()==="+"){index++;return unary()}if(peek()==="-"){index++;return -unary()}return power()};
	const power=()=>{let value=postfix();if(peek()==="^"){index++;value=value**unary()}return value};
	const postfix=()=>{let value=primary();while(peek()==="%"||peek()==="!"){const op=text[index++];if(op==="%"){value/=100;continue}if(value<0||!Number.isInteger(value)||value>170)fail();let result=1;for(let n=2;n<=value;n++)result*=n;value=result}return value};
	const startsPrimary=()=>{const c=peek();return !!c&&(c==="("||c==="."||/\d/.test(c)||/[A-Za-zπ√]/.test(c))};
	const primary=()=>{
		const value=number();if(value!==null)return value;
		if(peek()==="("){index++;const result=expression();if(text[index++]!==")")fail();return result}
		if(peek()==="√"){index++;return callFunction("sqrt",readArguments())}
		if(/[A-Za-z]/.test(peek())){const match=/^[A-Za-z]+/.exec(text.slice(index));const name=match[0].toLowerCase();index+=match[0].length;if(name==="pi")return Math.PI;if(name==="e")return Math.E;if(peek()!=="(")fail();return callFunction(name,readArguments())}
		fail();
	};
	const readArguments=()=>{if(text[index++]!=="(")fail();const args=[];if(peek()!==")"){args.push(expression());while(peek()===","){index++;args.push(expression())}}if(text[index++]!==")")fail();return args};
	const angle=value=>isRadian?value:value*Math.PI/180;
	const callFunction=(name,args)=>{
		if(name==="root"){if(args.length!==2||args[0]===0)fail();const [degree,radicand]=args;if(radicand<0&&Number.isInteger(degree)&&Math.abs(degree%2)===1)return -((-radicand)**(1/degree));return radicand**(1/degree)}
		if(args.length!==1)fail();
		const value=args[0];
		switch(name){
			case "sqrt":return Math.sqrt(value);
			case "cbrt":return Math.cbrt(value);
			case "sin":return Math.sin(angle(value));
			case "cos":return Math.cos(angle(value));
			case "tan":return Math.tan(angle(value));
			case "asin":return isRadian?Math.asin(value):Math.asin(value)*180/Math.PI;
			case "acos":return isRadian?Math.acos(value):Math.acos(value)*180/Math.PI;
			case "atan":return isRadian?Math.atan(value):Math.atan(value)*180/Math.PI;
			case "ln":return Math.log(value);
			case "log":return Math.log10(value);
			case "abs":return Math.abs(value);
			case "exp":return Math.exp(value);
			case "floor":return Math.floor(value);
			case "ceil":return Math.ceil(value);
			case "round":return Math.round(value);
			default:fail()
		}
	};
	const result=expression();if(index!==text.length||!Number.isFinite(result))fail();return result;
}
if(page==="calc"){
	let ex="",ans="0",memory=0,isRadian=false;
	const ee=$("#expr"),rs=$("#res"),hl=$("#hist"),angleButton=$("#toggle-angle-mode"),angleStatus=$("#angle-status"),memIndicator=$("#mem-indicator");
	const stored=rd("focusflow.calc.v1",[]),hist=Array.isArray(stored)?stored.filter(item=>typeof item==="string").slice(0,8):[];
	const KEYS=[["MC","func","mc"],["MR","func","mr"],["M+","func","m-add"],["M−","func","m-sub"],["AC","danger","clear"],["sin","sci","sin("],["cos","sci","cos("],["tan","sci","tan("],["xʸ","sci","^"],["⌫","danger-sub","back"],["ln","sci","ln("],["log","sci","log("],["√","sci","sqrt("],["n!","sci","!"],["÷","op","/"],["π","sci","pi"],["7","num","7"],["8","num","8"],["9","num","9"],["×","op","*"],["e","sci","e"],["4","num","4"],["5","num","5"],["6","num","6"],["−","op","-"],["(", "sci","("],["1","num","1"],["2","num","2"],["3","num","3"],["+","op","+"],[")","sci",")"],["±","sci","negate"],["0","num","0"],[".","num","."],["=","equal","calculate"],["root","sci","root("],[",","sci",","],["cbrt","sci","cbrt("],["asin","sci","asin("],["acos","sci","acos("],["atan","sci","atan("],["abs","sci","abs("],["exp","sci","exp("],["floor","sci","floor("],["ceil","sci","ceil("],["%","op","%"]];
	const fmt=value=>{const rounded=Number(value.toPrecision(12));return String(Object.is(rounded,-0)?0:rounded)};
	const show=()=>{ee.textContent=ex||" ";try{rs.textContent=ex?fmt(evalExpr(ex,isRadian)):ans}catch{rs.textContent=ex?"…":ans}};
	const updateMode=()=>{const label=isRadian?"RAD":"DEG";angleButton.textContent=label;angleStatus.textContent=label};
	const drawHistory=()=>{
		if(!hist.length){hl.innerHTML="<p class=\"empty-state\">No calculations yet</p>";return}
		hl.replaceChildren(...hist.map(item=>{const button=document.createElement("button");button.type="button";button.className="hist-item";button.textContent=item;button.addEventListener("click",()=>{const result=item.slice(item.lastIndexOf(" = ")+3);ex=result;show()});return button}))
	};
	const currentValue=()=>ex?evalExpr(ex,isRadian):Number(ans);
	const press=action=>{
		if(action==="clear"){ex="";show();return}
		if(action==="back"){ex=ex.slice(0,-1);show();return}
		if(action==="mc"){memory=0;memIndicator.classList.remove("active");return}
		if(action==="mr"){ex+=fmt(memory);show();return}
		if(action==="m-add"||action==="m-sub"){try{memory+=(action==="m-add"?1:-1)*currentValue();memIndicator.classList.toggle("active",memory!==0)}catch{toast("Enter a valid value before using memory.");}return}
		if(action==="negate"){ex=ex?`-(${ex})`:"-";show();return}
		if(action==="calculate"){
			if(!ex)return;
			try{const result=fmt(evalExpr(ex,isRadian));hist.unshift(`${ex} = ${result}`);hist.length=Math.min(hist.length,8);wr("focusflow.calc.v1",hist);ans=result;ex="";drawHistory()}
			catch{toast("That expression isn't valid. Check the function, brackets and operators.");return}
			show();return
		}
		ex+=action;show()
	};
	$("#keys").append(...KEYS.map(([label,type,action])=>{const button=document.createElement("button");button.type="button";button.className=`key ${type}-key`;button.textContent=label;button.setAttribute("aria-label",label==="="?"Calculate":label);button.addEventListener("click",()=>press(action));return button}));
	angleButton.addEventListener("click",()=>{isRadian=!isRadian;updateMode();show()});
	$("#clear-hist").addEventListener("click",()=>{hist.length=0;wr("focusflow.calc.v1",hist);drawHistory()});
	addEventListener("keydown",event=>{
		if(event.ctrlKey||event.metaKey||event.altKey||/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName))return;
		const keys={"*":"*","/":"/","-":"-","Enter":"calculate","=":"calculate","Backspace":"back","Escape":"clear"};
		const key=keys[event.key]||event.key;
		if("0123456789.+(),%^".includes(key)||["*","/","+","-","calculate","back","clear"].includes(key)){event.preventDefault();press(key)}
	});
	updateMode();drawHistory();show()
}

/* ---------- Brain games ---------- */
if(page==="games"&&$("#tab-seq")){const savedBest=log.best&&typeof log.best==="object"&&!Array.isArray(log.best)?log.best:{},best=log.best={seq:0,mem:0,logic:0};Object.keys(best).forEach(key=>{if(Number.isFinite(savedBest[key])&&savedBest[key]>=0)best[key]=savedBest[key]});const box=$("#gboard"),tabs=[...document.querySelectorAll(".tab")];let mode="seq",sc=0,st=0,run=0,bag=[],timers=[];
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a,shuf=a=>{for(let i=a.length-1;i>0;i--){const j=rnd(0,i);[a[i],a[j]]=[a[j],a[i]]}return a};
const head=()=>`<div class="score"><span>Score<b>${sc}</b></span><span>Streak<b>${st}</b></span><span>Best<b>${best[mode]}</b></span></div>`;
function win(){sc++;st++;best[mode]=Math.max(best[mode],sc);log.games=(log.games||0)+1;commit()}
function later(callback,delay,my=run){const timer=setTimeout(()=>{timers=timers.filter(item=>item!==timer);if(my===run)callback()},delay);timers.push(timer)}
function pick(opts,ans,next){const w=box.querySelector(".opts"),my=run;opts.forEach(t=>{const b=document.createElement("button");b.className="key opt";b.type="button";b.textContent=t;
b.onclick=()=>{w.querySelectorAll("button").forEach(x=>{x.disabled=true;if(x.textContent===ans)x.classList.add("good")});
if(t===ans){const r=b.getBoundingClientRect();burst(r.left+r.width/2,r.top);win()}else{b.classList.add("bad");sc=0;st=0}
later(next,t===ans?800:1500,my)};w.append(b)})}
function seq(){const k=rnd(0,4),a=rnd(1,9),d=rnd(2,7),r=rnd(2,3),e=rnd(1,d-1),s=[];
for(let i=0;i<6;i++)s.push(k===0?a+i*d:k===1?a*r**i:k===2?(i+a)**2:k===3?(i<2?[a,d][i]:s[i-1]+s[i-2]):(i?s[i-1]+(i%2?d:-e):a));
const ans=s[5],o=new Set([ans]);while(o.size<4)o.add(ans+(rnd(-9,9)||10));
box.innerHTML=head()+`<p class="prompt">Which number comes next?</p><p class="seq">${s.slice(0,5).join(", ")}, ?</p><div class="opts"></div>`;pick(shuf([...o]).map(String),String(ans),seq)}
const Q=[["All Bloops are Razzies and all Razzies are Lazzies. Are all Bloops definitely Lazzies?",["Yes","No","Can't tell"],0],["A bat and a ball cost 110 cents. The bat costs 100 cents more than the ball. How many cents does the ball cost?",["10","5","1","15"],1],["5 machines make 5 widgets in 5 minutes. How many minutes do 100 machines need to make 100 widgets?",["100","20","5","1"],2],["Which one doesn't belong: circle, triangle, square, cube?",["Circle","Triangle","Square","Cube"],3],["You overtake the runner in second place. What place are you in now?",["First","Second","Third","Last"],1],["How many months have at least 28 days?",["1","2","6","12"],3],["A farmer has 17 sheep. All but 9 run away. How many are left?",["8","9","17","0"],1],["What letter comes next: J, F, M, A, M, J, J, ?",["A","S","J","O"],0],["If 3 cats catch 3 mice in 3 minutes, how many cats catch 9 mice in 9 minutes?",["3","9","6","1"],0],["Mary's father has 5 daughters: Nana, Nene, Nini, Nono. What is the fifth one's name?",["Nunu","Mary","Nina","Nono"],1]];
function logic(){if(!bag.length)bag=shuf(Q.map((_,i)=>i));const [q,o,a]=Q[bag.pop()];box.innerHTML=head()+'<p class="prompt"></p><div class="opts"></div>';box.querySelector(".prompt").textContent=q;pick(shuf([...o]),o[a],logic)}
function mem(len=3){const my=run;box.innerHTML=head()+'<p class="prompt" id="mp">Watch the pattern…</p><div class="grid3"></div>';
const g=box.querySelector(".grid3"),mp=$("#mp"),cs=Array.from({length:9},(_,n)=>{const c=document.createElement("button");c.className="key cell";c.type="button";c.disabled=true;c.setAttribute("aria-label","Tile "+(n+1));g.append(c);return c}),pat=Array.from({length:len},()=>rnd(0,8));let k=0;
const flash=(c,t)=>{c.classList.add("lit");later(()=>c.classList.remove("lit"),t,my)};
pat.forEach((n,j)=>later(()=>flash(cs[n],420),600+j*700,my));
later(()=>{mp.textContent="Your turn. Repeat the pattern.";cs.forEach((c,n)=>{c.disabled=false;c.onclick=()=>{flash(c,180);
if(n!==pat[k]){const cleared=sc;cs.forEach(x=>x.disabled=true);mp.textContent=`Sequence ended. You completed ${cleared} ${cleared===1?"pattern":"patterns"}.`;sc=0;st=0;later(()=>mem(3),1800,my);return}
if(++k===len){cs.forEach(x=>x.disabled=true);win();if(len>=12){mp.textContent="Excellent! You completed all 12 patterns. Choose a game tab to start again.";return}mp.textContent="Correct! The next one is longer.";later(()=>mem(len+1),900,my)}}})},600+len*700,my)}
const go={seq,mem,logic};
function start(m){if(!go[m])return;timers.forEach(clearTimeout);timers=[];mode=m;sc=st=0;run++;tabs.forEach(t=>{const selected=t.dataset.m===m;t.classList.toggle("is-selected",selected);t.setAttribute("aria-selected",String(selected));t.tabIndex=selected?0:-1});box.setAttribute("aria-labelledby",tabs.find(t=>t.dataset.m===m).id);go[m]()}
tabs.forEach((t,index)=>{t.onclick=()=>start(t.dataset.m);t.addEventListener("keydown",event=>{let next=index;if(event.key==="ArrowRight")next=(index+1)%tabs.length;else if(event.key==="ArrowLeft")next=(index+tabs.length-1)%tabs.length;else if(event.key==="Home")next=0;else if(event.key==="End")next=tabs.length-1;else return;event.preventDefault();tabs[next].focus();start(tabs[next].dataset.m)})});start("seq")}

/* ---------- Flashcards ---------- */
if(page==="cards"){const CK="focusflow.cards.v1",INT=[0,1,3,7,14,30];let shown=false,cur=null;
let cards=rd(CK,[]).filter(c=>c&&typeof c.q==="string"&&typeof c.a==="string").map(c=>({id:String(c.id||uid()).replace(/[^\w-]/g,""),q:c.q.slice(0,300),a:c.a.slice(0,500),subj:typeof c.subj==="string"?c.subj.slice(0,30):"",box:Math.min(5,Math.max(0,c.box|0)),next:typeof c.next==="string"?c.next:day(),seen:+c.seen||0}));
const sv=()=>wr(CK,cards);$("#c-sel").append(...["",...cfg.subjects].map(s=>new Option(s||"No subject",s)));
function draw(){const d=cards.filter(c=>c.next<=day()).sort((a,b)=>a.seen-b.seen);cur=d[0]||null;
$("#c-total").textContent=cards.length;$("#c-due").textContent=d.length;$("#c-mast").textContent=cards.filter(c=>c.box>=4).length;
$("#card").hidden=!cur;$("#none").hidden=!!cur||!cards.length&&false;
if(cur){$("#c-side").textContent=shown?"Answer":"Question";$("#c-subj").textContent=cur.subj;$("#c-text").textContent=shown?cur.a:cur.q;$("#flip").hidden=shown;$("#rate").hidden=!shown}
$("#c-list").replaceChildren(...cards.map(c=>{const li=document.createElement("li");li.className="task-item";li.innerHTML='<span class="task-title"></span><button class="delete-button" type="button">×</button>';li.children[0].textContent=c.q+(c.subj?"  ·  "+c.subj:"");li.children[1].setAttribute("aria-label","Delete card: "+c.q);li.children[1].onclick=()=>{cards=cards.filter(x=>x.id!==c.id);sv();shown=false;draw()};return li}))}
$("#flip").onclick=()=>{shown=true;draw()};
document.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>{if(!cur)return;cur.box=b.dataset.r==="good"?Math.min(5,cur.box+1):0;const d=new Date();d.setDate(d.getDate()+INT[cur.box]);cur.next=d.toLocaleDateString("en-CA");cur.seen=Date.now();sv();shown=false;draw()});
$("#c-form").onsubmit=e=>{e.preventDefault();const q=$("#c-q").value.trim(),a=$("#c-a").value.trim();if(!q||!a)return;cards.push({id:uid().replace(/[^\w-]/g,""),q:q.slice(0,300),a:a.slice(0,500),subj:$("#c-sel").value,box:0,next:day(),seen:0});sv();e.target.reset();draw();$("#c-q").focus()};
draw()}

/* ---------- Study library ---------- */
if(page==="study"){
const classSelect=$("#study-class"),subjectSelect=$("#study-subject"),search=$("#study-search"),status=$("#study-status"),results=$("#study-results"),STUDY_KEY="focusflow.study.v1";
const saved=rd(STUDY_KEY,{});
function setStatus(message){status.textContent=message}
function saveSelection(){wr(STUDY_KEY,{class:classSelect.value,subject:subjectSelect.value})}
function showBooks(catalog){
results.replaceChildren();
if(!classSelect.value||!subjectSelect.value){setStatus("Select your class and subject to see NCERT books.");return}
const query=search.value.trim().toLocaleLowerCase();
const books=catalog.filter(book=>String(book.class)===classSelect.value&&book.subject===subjectSelect.value&&book.title&&(!query||book.title.toLocaleLowerCase().includes(query)));
if(!books.length){setStatus(query?"No book titles match your search. Try a different search.":"NCERT does not currently list a downloadable book for this subject.");return}
setStatus(`${books.length} ${books.length===1?"book":"books"} found. Open a title to view its chapter PDFs and complete-book download.`);
results.replaceChildren(...books.map(book=>{
const article=document.createElement("article");article.className="study-book";
const title=document.createElement("h3");title.textContent=book.title;
const language=document.createElement("p");language.textContent=book.subject+" · Class "+book.class;
const link=document.createElement("a");link.className="add-button";link.href=book.url;link.target="_blank";link.rel="noopener noreferrer";link.textContent="Chapters & PDFs ↗";
article.append(language,title,link);return article
}))
}
function loadCatalog(){
fetch("ncert-catalog.json").then(response=>{
if(!response.ok)throw new Error(`NCERT catalog request failed (${response.status}).`);
return response.json()
}).then(data=>{
if(!data||!Array.isArray(data.books))throw new Error("The NCERT catalog file is invalid.");
const catalog=data.books.filter(book=>book&&Number.isInteger(book.class)&&book.class>=1&&book.class<=12&&typeof book.subject==="string");
if(!catalog.length)throw new Error("The NCERT catalog contains no class and subject entries.");
classSelect.value=String(saved.class||"");
function updateSubjects(selected){
const subjects=[...new Set(catalog.filter(book=>String(book.class)===classSelect.value).map(book=>book.subject))].sort((a,b)=>a.localeCompare(b));
subjectSelect.replaceChildren(new Option(subjects.length?"Choose a subject":"No subjects listed", ""));
subjectSelect.disabled=!classSelect.value||!subjects.length;
subjects.forEach(subject=>subjectSelect.add(new Option(subject,subject)));
subjectSelect.value=subjects.includes(selected)?selected:"";
search.disabled=!subjectSelect.value
}
updateSubjects(saved.subject);
search.disabled=!subjectSelect.value;
classSelect.onchange=()=>{updateSubjects("");search.value="";saveSelection();showBooks(catalog)};
subjectSelect.onchange=()=>{search.value="";search.disabled=!subjectSelect.value;saveSelection();showBooks(catalog)};
search.oninput=()=>showBooks(catalog);
showBooks(catalog)
}).catch(error=>{
console.error("Unable to load the NCERT textbook catalog.",error);
setStatus("The NCERT book list could not be loaded. Please reload the page and try again.")
})
}
loadCatalog()
}

/* ---------- Settings ---------- */
if(page==="settings"){
const CONFIG_KEY="focusflow.cfg.v1",status=$("#settings-status"),dataStatus=$("#data-status"),setStatus=(element,message,type="")=>{element.textContent=message;element.classList.toggle("is-error",type==="error");element.classList.toggle("is-success",type==="success")};
const saveConfig=()=>wr(CONFIG_KEY,cfg);
$("#s-cursor").checked=cfg.cursor!==false;$("#s-fx").checked=cfg.fx!==false;$("#s-subj").value=cfg.subjects.join("\n");
$("#s-cursor").onchange=event=>{const previous=cfg.cursor;cfg.cursor=event.target.checked;if(!saveConfig()){cfg.cursor=previous;event.target.checked=previous;setStatus(status,"Could not save this setting. Check browser storage and try again.","error");return}setStatus(status,"Setting saved. Reload the page to apply it.","success")};
$("#s-fx").onchange=event=>{const previous=cfg.fx;cfg.fx=event.target.checked;if(!saveConfig()){cfg.fx=previous;event.target.checked=previous;setStatus(status,"Could not save this setting. Check browser storage and try again.","error");return}setStatus(status,"Setting saved. Reload the page to apply it.","success")};
$("#s-save").onclick=()=>{
const raw=$("#s-subj").value.split("\n").map(subject=>subject.trim()).filter(Boolean),unique=[];
for(const subject of raw){if(subject.length>30){setStatus(status,"Each subject must be 30 characters or fewer.","error");return}if(!unique.some(saved=>saved.toLocaleLowerCase()===subject.toLocaleLowerCase()))unique.push(subject)}
if(!unique.length){setStatus(status,"Enter at least one subject.","error");return}
if(unique.length>12){setStatus(status,"Use no more than 12 subjects.","error");return}
const previous=cfg.subjects;cfg.subjects=unique;
if(!saveConfig()){cfg.subjects=previous;setStatus(status,"Could not save subjects. Check browser storage and try again.","error");return}
$("#s-subj").value=unique.join("\n");setStatus(status,"Subjects saved. Reload pages to refresh their subject lists.","success")
};
$("#s-export").onclick=()=>{
try{
const backup={v:1,tasks,log,cfg,cards:rd("focusflow.cards.v1",[]),study:rd("focusflow.study.v1",{}),syllabus:rd("focusflow.syllabus.v1",{})};
const url=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:"application/json"})),link=document.createElement("a");
link.href=url;link.download="focusflow-backup-"+day()+".json";link.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
setStatus(dataStatus,"Backup exported. Sign-in credentials are not included.","success")
}catch(error){console.error("Unable to export the FocusFlow backup.",error);setStatus(dataStatus,"Could not export a backup. Check browser download permissions.","error")}
};
$("#s-import").onchange=async event=>{
const file=event.target.files&&event.target.files[0];event.target.value="";
if(!file)return;
try{
const data=JSON.parse(await file.text()),isRecord=value=>value&&typeof value==="object"&&!Array.isArray(value);
if(!isRecord(data)||data.v!==1||!Array.isArray(data.tasks)||!isRecord(data.log)||!isRecord(data.cfg)||
("cards"in data&&!Array.isArray(data.cards))||("study"in data&&!isRecord(data.study))||("syllabus"in data&&!isRecord(data.syllabus))||
("cfg"in data&&(!Array.isArray(data.cfg.subjects)||data.cfg.subjects.length>12||data.cfg.subjects.some(subject=>typeof subject!=="string"||subject.length>30)))) {
setStatus(dataStatus,"That file is not a valid FocusFlow backup.","error");return
}
const entries=[[KEY,data.tasks],[LOG,data.log],[CONFIG_KEY,data.cfg]];
if(Array.isArray(data.cards))entries.push(["focusflow.cards.v1",data.cards]);
if(isRecord(data.study))entries.push(["focusflow.study.v1",data.study]);
if(isRecord(data.syllabus))entries.push(["focusflow.syllabus.v1",data.syllabus]);
const previous=new Map(entries.map(([key])=>[key,localStorage.getItem(key)])),written=[];
try{
for(const[key,value]of entries){written.push(key);localStorage.setItem(key,JSON.stringify(value))}
}catch(error){
for(const key of written.reverse()){try{const value=previous.get(key);if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value)}catch(rollbackError){console.error(`Unable to restore ${key} after a failed backup import.`,rollbackError)}}
throw error
}
setStatus(dataStatus,"Backup restored. Reloading FocusFlow…","success");setTimeout(()=>location.reload(),700)
}catch(error){console.error("Unable to import the FocusFlow backup.",error);setStatus(dataStatus,"Backup import failed. The browser could not read or save the selected file.","error")}
};
$("#s-reset").onclick=()=>{
if(!confirm("Delete all FocusFlow tasks, settings, progress, local accounts, flashcards and syllabus profiles stored on this device?"))return;
try{
[KEY,LOG,CONFIG_KEY,"focusflow.cards.v1","focusflow.calc.v1","focusflow.study.v1","focusflow.syllabus.v1","focusflow_user_profile","focusflow.local_accounts.v1"].forEach(key=>localStorage.removeItem(key));
setStatus(dataStatus,"All FocusFlow data was deleted. Reloading…","success");setTimeout(()=>location.reload(),500)
}catch(error){console.error("Unable to delete all FocusFlow data.",error);setStatus(dataStatus,"Some data could not be deleted. Check browser storage permissions and try again.","error")}
}
}
