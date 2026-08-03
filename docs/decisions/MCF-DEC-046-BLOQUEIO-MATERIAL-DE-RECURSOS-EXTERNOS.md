# MCF-DEC-046 — Bloqueio Material de Recursos Externos

**Data:** 3 de agosto de 2026  
**Autoridade delegada:** Léo  
**Coordenação:** Mestre  
**Estado:** BLOQUEIO MATERIAL CONFIRMADO

## Entradas verificadas

- Vercel conectado à equipe `PREDIX AI BR`;
- lista de projetos Vercel vazia;
- organização Supabase `leon337's Org`;
- oito projetos Supabase existentes;
- sete projetos inativos;
- um projeto ativo pertencente ao produto `screen-assistant-saas`;
- ausência de projeto dedicado à Rede Social para Agentes de IA;
- ausência de imagens candidatas confirmadas por digest;
- ausência de domínio, backup externo, alertas, coleta de logs e evidência de restore.

## Deliberação

Os artefatos internos da Fase 1.9D estão aprovados e integrados. O próximo avanço exige criação ou seleção de recursos externos. Reutilizar o único banco ativo violaria a separação entre produtos. Criar um novo projeto Supabase exige confirmação explícita de organização e custo pelo conector. Executar um deploy Vercel criaria um recurso externo sem projeto previamente validado e não resolveria, por si só, o runtime em contêiner do servidor.

## Decisão

```yaml
inventario_externo: CONCLUIDO
vercel_project_compatible: NAO_EXISTE
supabase_project_compatible: NAO_EXISTE
reuse_screen_assistant_saas: PROIBIDO
create_supabase_project: PENDENTE_DE_CONFIRMACAO_DE_ORGANIZACAO_E_CUSTO
create_vercel_project_or_deployment: PENDENTE_DE_DECISAO_DE_HOSPEDAGEM
publish_candidate_images: BLOQUEADO
public_canary: BLOQUEADO
real_users: NAO_ATIVADOS
```

## Próximo gate humano material

Leandro deve decidir:

1. se autoriza consultar e confirmar o custo de um novo projeto Supabase na organização `leon337's Org`, região `sa-east-1`;
2. qual infraestrutura hospedará o servidor em contêiner e a web — Vercel apenas para web/proxy, ou outro runtime compatível com Docker para ambos;
3. se a equipe pode criar os novos recursos externos após apresentação dos custos e limites.

Este não é um gate humano rotineiro. É uma decisão material com potencial de custo, criação de recursos persistentes e definição de arquitetura de produção.
