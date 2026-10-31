const $ = id => document.getElementById(id);
let state = {tasks:[false,false,false,false], applications:[]};

async function api(url, options={}) {
  const response = await fetch(url, {headers:{"Content-Type":"application/json"}, ...options});
  if (!response.ok) throw new Error("Request failed");
  return response.json();
}
async function saveState(){
  try { await api("/api/progress",{method:"POST",body:JSON.stringify(state)}); } catch(e) { console.warn(e); }
}
function renderProgress(){
  const done=state.tasks.filter(Boolean).length;
  $("task-count").textContent=done;
  $("app-count").textContent=state.applications.length;
  $("progress-percent").textContent=Math.round(done/4*100)+"%";
  $("check-progress").textContent=`${done} / 4 complete`;
  $("progress-fill").style.width=(done/4*100)+"%";
  document.querySelectorAll("#checklist input").forEach((el,i)=>el.checked=!!state.tasks[i]);
}
function renderApplications(){
  const body=$("application-rows");
  body.innerHTML="";
  if(!state.applications.length){body.innerHTML='<tr><td colspan="4" class="empty-cell">No applications yet.</td></tr>';}
  state.applications.forEach((app,index)=>{
    const tr=document.createElement("tr");
    [app.company,app.role,app.outcome].forEach(value=>{const td=document.createElement("td");td.textContent=value;tr.appendChild(td);});
    const action=document.createElement("td"), btn=document.createElement("button");
    btn.textContent="Remove";btn.onclick=()=>{state.applications.splice(index,1);renderApplications();renderProgress();saveState();};
    action.appendChild(btn);tr.appendChild(action);body.appendChild(tr);
  });
  const interviews=state.applications.filter(a=>a.outcome==="Interview"||a.outcome==="Offer").length;
  $("application-insight").textContent=state.applications.length
    ? `${interviews} of ${state.applications.length} tracked applications reached an interview or offer stage. Compare the roles and skills in those applications to spot patterns.`
    : "Add outcomes to spot which role types are getting responses.";
}
document.querySelectorAll("#checklist input").forEach((el,i)=>el.addEventListener("change",()=>{
  state.tasks[i]=el.checked;renderProgress();saveState();
}));
$("analyze-btn").addEventListener("click",()=>{
  const jd=$("job-description").value.toLowerCase();
  const skills=$("skills").value.split(",").map(s=>s.trim()).filter(Boolean);
  const known=skills.map(s=>s.toLowerCase());
  const common=["python","javascript","html","css","sql","react","communication","problem solving","data analysis","git","java","machine learning","cloud","testing","leadership"];
  const required=common.filter(word=>jd.includes(word));
  const gaps=required.filter(word=>!known.some(k=>k.includes(word)));
  $("gap-summary").textContent=jd.trim()
    ? `Found ${required.length} common skill keywords in the job description. ${gaps.length} are not listed in your current skills.`
    : "Paste a job description to compare its skill keywords with your current skills.";
  $("gap-tags").innerHTML="";
  (gaps.length?gaps:["Add a job description to see suggested gaps"]).forEach(word=>{
    const tag=document.createElement("span");tag.className="tag";tag.textContent=word;$("gap-tags").appendChild(tag);
  });
  $("gap-result").classList.remove("hidden");
});
$("make-plan").addEventListener("click",async()=>{
  const result=await api("/api/plan",{method:"POST",body:JSON.stringify({target:$("target").value,skills:$("skills").value})});
  const list=$("roadmap-list");list.innerHTML="";
  result.weeks.forEach((week,i)=>{
    const card=document.createElement("article");card.className="week-card";
    const label=document.createElement("span");label.textContent=`STEP 0${i+1}`;
    const title=document.createElement("h3");title.textContent=week[0];
    const desc=document.createElement("p");desc.textContent=week[1];
    card.append(label,title,desc);list.appendChild(card);
  });
});
$("score-answer").addEventListener("click",()=>{
  const answer=$("answer").value.trim();
  if(!answer){$("score-result").textContent="Write a practice answer first."; $("score-result").classList.remove("hidden");return;}
  const words=answer.split(/\s+/).length;
  const hasExample=/project|example|built|created|learned|experience/i.test(answer);
  const hasRole=/role|company|team|developer|analyst|engineer/i.test(answer);
  const score=Math.min(10,Math.max(2,Math.round(words/18)+(hasExample?3:0)+(hasRole?2:0)));
  $("score-result").textContent=`Practice score: ${score}/10. Rubric: clarity, relevant example, and connection to the role. ${words<45?"Try adding a specific example and explaining your contribution.":"Good length. Make sure your answer includes a clear example and measurable result."}`;
  $("score-result").classList.remove("hidden");
});
$("add-application").addEventListener("click",()=>{
  const company=$("company").value.trim(),role=$("role").value.trim();
  if(!company||!role){alert("Please enter both company and role.");return;}
  state.applications.push({company,role,outcome:$("outcome").value});
  $("company").value="";$("role").value="";
  renderApplications();renderProgress();saveState();
});
$("export-data").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="pivotpath-progress.json";a.click();URL.revokeObjectURL(url);
});
(async()=>{
  try{const saved=await api("/api/progress");state={...state,...saved};}catch(e){}
  renderProgress();renderApplications();
})();
