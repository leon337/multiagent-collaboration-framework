import {LabShell} from './lab/LabShell';
import {labEntries,labTemplates} from './registry/registry';

export const App=()=> <LabShell entries={labEntries} templates={labTemplates}/>;
