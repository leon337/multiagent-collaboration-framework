import {AnimatedTimeline,FocusConcept,ProgressiveDiagram} from '../components';

export const LongFocusConceptQa=()=> <FocusConcept
  eyebrow="ARQUITETURA E GOVERNANÇA"
  title="Uma responsabilidade arquitetural com um título deliberadamente longo para testar quebra e safe area"
  body="Este texto existe como fixture de stress para verificar legibilidade sem invadir a área reservada a legendas e controles."
/>;

export const LongTimelineQa=()=> <AnimatedTimeline
  title="Sequência temporal com muitos eventos"
  items={['mensagem recebida','tool call com descrição longa','resultado estruturado','erro recuperável','checkpoint persistido','aprovação humana','artefato final']}
/>;

export const LongDiagramQa=()=> <ProgressiveDiagram
  title="Diagrama de stress"
  nodes={['Estado\ncontinuidade','Eventos\nevidência temporal','Artefatos\nproduto verificável','Aplicação\ngovernança']}
/>;
