import {describe,expect,it} from 'vitest';
import bridgeFixture from '../adobe/mcf-video-engine.bridge.json';
import registry from '../registry/registry.json';
import type {AdobeExpressBridgeSpec} from '../src/adobe/bridge';
import {toN4Handoff,validateAdobeExpressBridge} from '../src/adobe/bridge';

const spec=bridgeFixture as AdobeExpressBridgeSpec;

describe('Adobe Express -> N4 governed bridge',()=>{
  it('preserves source provenance without claiming unavailable introspection',()=>{
    expect(validateAdobeExpressBridge(spec)).toEqual([]);
    expect(spec.inspection.nodeIntrospection).toBe(false);
    expect(spec.inspection.tokenIntrospection).toBe(false);
    expect(spec.source.temporaryDocument).toBe(true);
  });

  it('hands off into an existing approved N4 component',()=>{
    const handoff=toN4Handoff(spec);
    const entry=registry.components.find((component)=>component.id===handoff.componentId);
    expect(entry?.status).toBe('APPROVED');
    expect(entry?.supportedAspects).toContain(handoff.aspect);
    expect(handoff.props).toMatchObject({
      title:'MCF VIDEO ENGINE',
      subtitle:'Templates · Components · Motion · Assets',
    });
  });

  it('keeps visual parity as an explicit non-claim',()=>{
    expect(spec.evidence.nonClaims).toContain('pixel-perfect parity');
  });
});
