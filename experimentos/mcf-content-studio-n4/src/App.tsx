import {LabShell} from './lab/LabShell';
import {labEntries} from './registry/registry';

export const App=()=> <LabShell entries={labEntries}/>;
