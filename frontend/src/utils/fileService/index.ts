import { FileService } from './FileService';
import electronFileService from './ElectronFileService';
import webFileService from './WebFileService';
import capacitorFileService from './CapacitorFileService';
import { isCapacitor, isElectron } from '../env';

export type Runtime = 'capacitor' | 'electron' | 'web';

export function getRuntime(): Runtime {
  return isElectron() ? 'electron' :
  isCapacitor() ? 'capacitor' :
  'web'
}

let fileService: FileService;
const runtime = getRuntime();
console.log(`Detected runtime: ${runtime}`);
switch (getRuntime()) {
  case 'electron':
    fileService = electronFileService;
    break;
  case 'capacitor':
    fileService = capacitorFileService;
    break;
  case 'web':
  default:
    fileService = webFileService;
    break;
}

export default fileService;
