// capacitorFileService.ts
import { FileService } from './FileService';

const capacitorFileService: FileService = {
  async writeFile(): Promise<void> {
    throw new Error('writeFile not implemented for Capacitor yet');
  },
  async readFile(): Promise<string> {
    throw new Error('readFile not implemented for Capacitor yet');
  },
  async deleteFile(): Promise<void> {
    throw new Error('deleteFile not implemented for Capacitor yet');
  },
  async createFile(): Promise<void> {
    throw new Error('createFile not implemented for Capacitor yet');
  },
  async getFiles(): Promise<string[]> {
    throw new Error('getFiles not implemented for Capacitor yet');
  },
  async existsFile(): Promise<boolean> {
    throw new Error('existsFile not implemented for Capacitor yet');
  }
}

export default capacitorFileService