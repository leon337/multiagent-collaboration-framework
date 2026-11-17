"use strict";
/* MCF Pet — proposals are planning drafts ONLY, never execution gates.
 * Every list/review operation uses the protected per-tab Pet session. */
(() => {
  const root=document.getElementById("petProposalZone");
  const list=document.getElementById("petProposalList");
  const status=document.getElementById("petProposalStatus");
  const count=document.getElementById("petProposalCount");
  const refreshButton=document.getElementById("petProposalRefresh");
  if(!root||!list||!status||!count||!refreshButton)return;
  const label=(tag,klass,text)=>{
    const e=document.createElement(tag);
    if(klass)e.className=klass;
    e.textContent=String(text??"");
    return e;
  };
  let busy=false;
  const messages={
    pending_review:"Aguardando revisão",
    reviewed_for_planning:"Revisada para planejamento",
    rejected:"Rejeitada",
  };
  function notice(text,bad=false){
    status.textContent=text;
    status.dataset.level=bad?"error":"info";
  }
  async function request(endpoint,data){
    const auth=window.McfPetAuth;
    if(typeof auth?.request!=="function")throw Error("Sessão do painel indisponível.");
    const path=endpoint.startsWith("mission-bridge/")?endpoint:"proposals/"+endpoint;
    const response=await auth.request(path,{
      method:"POST",cache:"no-store",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(data)
    });
    const result=await response.json().catch(()=>({}));
    if(!response.ok||result.ok!==true)
      throw Error(String(result.error||"Consulta indisponível.").slice(0,90));
    return result;
  }
  async function review(proposal,decision,note){
    if(busy)return;
    const humanText=decision==="reviewed_for_planning"
      ?"Marcar como revisada PARA PLANEJAMENTO? Isso NÃO autoriza execução, merge, deploy ou HUMAN_GATE."
      :"Rejeitar esta proposta? A decisão será registrada.";
    if(!window.confirm(humanText))return;
    busy=true; refreshButton.disabled=true;
    notice("Registrando revisão da proposta…");
    try{
      await request("review",{
        proposal_id:proposal.id,
        decision,
        version:proposal.version,
        note:note.trim().slice(0,280)
      });
      await refresh();
    }catch(e){
      notice("A revisão não foi registrada: "+e.message,true);
    }finally{
      busy=false;refreshButton.disabled=false;
    }
  }
  function displayProposal(proposal){
    const entry=label("article","pet-proposal-card","");
    entry.dataset.proposalId=String(proposal.id);
    const heading=label("div","pet-proposal-heading","");
    heading.append(label("strong","",proposal.title));
    const badge=label("span","pet-proposal-badge",messages[proposal.status]||"Estado desconhecido");
    badge.dataset.status=String(proposal.status);
    heading.append(badge);
    entry.append(heading);
    const meta=label("p","pet-proposal-meta",
      "Prioridade estimada: "+String(proposal.priority||"não definida")+
      " · Criada: "+String(proposal.created_at||"indisponível")+
      " · Versão: "+String(proposal.version??"?"));
    entry.append(meta);
    for(const [name,value] of [
      ["Objetivo",proposal.objective],
      ["Justificativa",proposal.summary],
      ["Riscos",proposal.risks],
      ["Reversão proposta",proposal.rollback]
    ]){
      const row=label("section","pet-proposal-field","");
      row.append(label("b","",name));
      row.append(label("p","",value));
      entry.append(row);
    }
    const steps=label("section","pet-proposal-field","");
    steps.append(label("b","","Etapas sugeridas (não executadas)"));
    const ordered=document.createElement("ol");
    for(const step of Array.isArray(proposal.steps)?proposal.steps:[]){
      ordered.append(label("li","",step));
    }
    steps.append(ordered);
    entry.append(steps);
    const evidence=Array.isArray(proposal.evidence_refs)?proposal.evidence_refs:[];
    entry.append(label("p","pet-proposal-evidence",evidence.length
      ? "Evidências instrumentais: "+evidence.map(v=>String(v).slice(0,25)).join(", ")
      : "Sem comprovantes instrumentais vinculados; informações ainda precisam ser verificadas."));
    entry.append(label("p","pet-proposal-guard",
      "Proposta gerada por IA, sujeita a revisão. Nenhuma decisão aqui executa ações ou aprova HUMAN_GATE."));
    if(proposal.status==="pending_review"){
      const field=label("label","pet-proposal-note","");
      field.append(label("span","","Observação da revisão (opcional)"));
      const textarea=document.createElement("textarea");
      textarea.maxLength=280;textarea.rows=2;
      textarea.placeholder="Observações para um eventual planejamento posterior…";
      field.append(textarea);
      entry.append(field);
      const actions=label("div","pet-proposal-actions","");
      const reviewButton=label("button","","Marcar revisada para planejamento");
      reviewButton.type="button";
      reviewButton.addEventListener("click",()=>review(proposal,"reviewed_for_planning",textarea.value));
      const rejectButton=label("button","pet-proposal-reject","Rejeitar");
      rejectButton.type="button";
      rejectButton.addEventListener("click",()=>review(proposal,"rejected",textarea.value));
      actions.append(reviewButton,rejectButton);
      entry.append(actions);
    }else if(proposal.reviewed_at){
      entry.append(label("p","pet-proposal-meta",
        "Revisão registrada em "+proposal.reviewed_at+
        (proposal.review_note?" · Nota: "+proposal.review_note:"")));
      if(proposal.status==="reviewed_for_planning"){
        const handoffButton=label("button","pet-proposal-handoff",
          "Preparar rascunho de missão MCF");
        handoffButton.type="button";
        handoffButton.addEventListener("click",async()=>{
          if(!window.confirm("Preparar um CONTRATO LOCAL para envio futuro ao MCF? "+
              "Não cria missão no runtime e NÃO autoriza execução."))return;
          handoffButton.disabled=true;
          try{
            const result=await request("mission-bridge/export",{
              proposal_id:proposal.id,expected_version:proposal.version
            });
            const handoff=result.handoff||{};
            const receipt=label("p","pet-proposal-guard",
              "Rascunho local "+String(handoff.handoff_id||"").slice(0,32)+
              ". Aguardando sessão humana autenticada e gates do MCF. "+
              "Nenhuma missão foi criada no runtime.");
            entry.append(receipt);
            notice("Contrato local preparado. Não enviado ao MissionRuntime.");
          }catch(e){
            notice("Exportação local recusada: "+e.message,true);
          }finally{handoffButton.disabled=false}
        });
        entry.append(handoffButton);
      }
    }
    return entry;
  }
  async function refresh(){
    try{
      const result=await request("list",{});
      const proposals=Array.isArray(result.proposals)?result.proposals:[];
      const fragment=document.createDocumentFragment();
      for(const proposal of proposals)fragment.append(displayProposal(proposal));
      list.replaceChildren(fragment);
      if(!proposals.length)list.append(label("p","pet-proposal-empty",
        "Nenhuma proposta registrada. No Gemini Live, habilite consultas e propostas, depois peça um plano ao MESTRE."));
      count.textContent=String(proposals.filter(p=>p.status==="pending_review").length)+" aguardando revisão";
      notice("Fila atualizada. A revisão não concede execução.");
      return proposals;
    }catch(e){
      notice("Fila indisponível: "+e.message,true);
      return [];
    }
  }
  const observeButton=label("button","pet-proposal-handoff",
    "Verificar missão canônica");
  observeButton.type="button";
  observeButton.addEventListener("click",async()=>{
    try{
      const r=await request("mission-bridge/status",{});
      const observation=r.snapshot||{};
      if(observation.ready===true && observation.canonical===true){
        notice("Missão canônica: "+String(observation.mission?.title||"").slice(0,130)+
          " · "+String(observation.mission?.state||"")+
          ". Fonte: MCF MissionRuntime.");
      }else{
        notice("Leitura canônica indisponível: "+
          String(observation.status||"UNKNOWN")+
          ". Não significa ausência de missões.",true);
      }
    }catch(e){notice("Falha ao verificar runtime: "+e.message,true)}
  });
  root.append(observeButton);
  refreshButton.addEventListener("click",()=>refresh());
  window.McfPetProposals=Object.freeze({refresh});
  refresh();
})();
