const professionalId="00000000-0000-0000-0000-000000000201";
const state={professionalId,localDate:"2026-10-05",patients:[],services:[]};
const $=id=>document.getElementById(id);
async function api(path,options={}){
  const r=await fetch(path,{...options,headers:{"content-type":"application/json",...(options.headers||{})}});
  const j=await r.json(); if(!r.ok) throw new Error(j.error?.message||"Não foi possível concluir a operação."); return j.data;
}
async function load(){
  try{
    const results=await Promise.all([
      api("/api/v1/schedule?professionalId="+state.professionalId+"&localDate="+state.localDate),
      api("/api/v1/patients"),api("/api/v1/services"),api("/api/v1/professionals")
    ]);
    const schedule=results[0]; state.patients=results[1]; state.services=results[2];
    $("professionals").textContent=results[3].length; $("patients").textContent=state.patients.length; $("services").textContent=state.services.length;
    render(schedule); fillOptions();
  }catch(e){$("scheduleMeta").textContent=e.message;showToast(e.message)}
}
function render(items){
  $("countToday").textContent=items.length;
  $("countConfirmed").textContent=items.filter(x=>x.status==="CONFIRMED").length;
  $("scheduleMeta").textContent=items.length+" atendimento(s) · horário local America/Recife";
  const byHour=new Map(items.map(x=>[new Date(x.start_at_utc).toISOString().slice(11,13),x]));
  $("timeline").innerHTML=Array.from({length:10},(_,i)=>{
    const h=8+i,item=byHour.get(String(h).padStart(2,"0"));
    return '<div class="slot"><div class="slot-time">'+String(h).padStart(2,"0")+':00</div><div>'+(item?appointmentCard(item):'<span class="empty">Disponível</span>')+'</div></div>';
  }).join("");
}
function appointmentCard(a){
  const patient=state.patients.find(x=>x.id===a.patient_id)?.name||"Paciente";
  const service=state.services.find(x=>x.id===a.service_id)?.name||"Atendimento";
  const time=new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Recife",hour:"2-digit",minute:"2-digit"}).format(new Date(a.start_at_utc));
  let action="";
  if(a.status==="SCHEDULED") action='<button class="mini" data-confirm="'+a.id+'">Confirmar</button>';
  if(a.status==="CONFIRMED") action='<button class="mini" data-complete="'+a.id+'">Concluir</button>';
  const reschedule=!["CANCELLED","COMPLETED"].includes(a.status)?'<button class="mini" data-reschedule="'+a.id+'">Reagendar</button>':"";
  const cancel=!["CANCELLED","COMPLETED"].includes(a.status)?'<button class="mini" data-cancel="'+a.id+'">Cancelar</button>':"";
  return '<div class="appointment"><div><b>'+time+' · '+patient+'</b><small>'+service+' · '+a.status+'</small></div><div class="appointment-actions">'+action+reschedule+cancel+'</div></div>';
}
function fillOptions(){
  $("patient").innerHTML=state.patients.map(x=>'<option value="'+x.id+'">'+x.name+"</option>").join("");
  $("service").innerHTML=state.services.map(x=>'<option value="'+x.id+'">'+x.name+" · "+x.duration_minutes+" min</option>").join("");
}
function showToast(message){const t=$("toast");t.textContent=message;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2800)}
function closeModal(){$("modal").close()}
$("refresh").onclick=load;
$("newAppointment").onclick=()=>{$("formError").textContent="";$("modal").showModal()};
$("closeModal").onclick=closeModal;$("cancelModal").onclick=closeModal;
$("appointmentForm").onsubmit=async e=>{
  e.preventDefault(); $("formError").textContent="";
  try{
    const local=$("start").value; const start=local+":00-03:00";
    await api("/api/v1/appointments",{method:"POST",body:JSON.stringify({professionalId:state.professionalId,patientId:$("patient").value,serviceId:$("service").value,startAt:start})});
    closeModal(); showToast("Agendamento criado."); await load();
  }catch(err){$("formError").textContent=err.message}
};
$("timeline").onclick=async e=>{
  const b=e.target.closest("button");if(!b)return;
  try{
    if(b.dataset.confirm)await api("/api/v1/appointments/"+b.dataset.confirm+"/confirm",{method:"POST"});
    if(b.dataset.complete)await api("/api/v1/appointments/"+b.dataset.complete+"/complete",{method:"POST"});
    if(b.dataset.reschedule){
      const next=prompt("Novo horário local (YYYY-MM-DDTHH:mm)",state.localDate+"T10:00");
      if(next)await api("/api/v1/appointments/"+b.dataset.reschedule+"/reschedule",{method:"POST",body:JSON.stringify({newStartAt:next+":00-03:00"})});
    }
    if(b.dataset.cancel)await api("/api/v1/appointments/"+b.dataset.cancel+"/cancel",{method:"POST",body:JSON.stringify({reason:"Cancelado pela operação"})});
    showToast("Agenda atualizada.");await load();
  }catch(err){showToast(err.message)}
};
load();