// web services does not have a file service, they cannot access the files
import { FileService } from './FileService';

const webFileService: FileService = {
  async writeFile(): Promise<void> {
    console.warn('writeFile not supported in Web environment');
  },
  async readFile(): Promise<string> {
    console.warn('readFile not supported in Web environment');
    return ""
  },
  async deleteFile(): Promise<void> {
    console.warn('deleteFile not supported in Web environment');
  },
  async createFile(): Promise<void> {
    console.warn('createFile not supported in Web environment');
  },
  async getFiles(): Promise<string[]> {
    console.warn('getFiles not supported in Web environment');
    return []
  },
  async existsFile(): Promise<boolean> {
    return false;
  }
}

export default webFileService;