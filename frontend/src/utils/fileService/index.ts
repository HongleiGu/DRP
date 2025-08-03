import { FileService } from './FileService';
import electronFileService from './ElectronFileService';
import webFileService from './WebFileService';
import capacitorFileService from './CapacitorFileService';

const getRuntime = (): 'electron' | 'capacitor' | 'web' => {
  if (typeof window !== 'undefined') {
    if ('electronApi' in window) return 'electron';
    if ('Capacitor' in window) return 'capacitor';
  }
  return 'web';
};

let fileService: FileService;

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
