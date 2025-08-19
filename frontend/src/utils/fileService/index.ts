import { FileService } from './FileService';
import electronFileService from './ElectronFileService';
import webFileService from './WebFileService';
import capacitorFileService from './CapacitorFileService';

export type Runtime = 'capacitor' | 'electron' | 'web';

export function getRuntime(): Runtime {
  // Check for Capacitor (native Android/iOS or Capacitor web)
  if (
    typeof window !== 'undefined' &&
    typeof window.Capacitor !== 'undefined' &&
    typeof window.Capacitor.isNativePlatform === 'function' &&
    window.Capacitor.isNativePlatform()
  ) {
    return 'capacitor';
  }

  // Check for Electron
  if (typeof process !== 'undefined' && process.versions?.electron) {
    return 'electron';
  }

  // Check for Web (browser)
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return 'web';
  }

  // Fallback (Node.js or unknown)
  return 'web';
}

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
