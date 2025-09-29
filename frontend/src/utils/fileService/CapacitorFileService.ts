// capacitorFileService.ts
import { FileService } from './FileService';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

const capacitorFileService: FileService = {
  async writeFile(filePath: string, content: string): Promise<void> {
    await Filesystem.writeFile({
      path: filePath,
      data: content,
      directory: Directory.Data,
      encoding: Encoding.UTF8
    });
  },

  async readFile(filePath: string): Promise<string> {
    const result = await Filesystem.readFile({
      path: filePath,
      directory: Directory.Data,
      encoding: Encoding.UTF8
    });
    return result.data as string; // in capacitor, this may return a blob, but currently we dont need to handle pictures
  },

  async deleteFile(filePath: string): Promise<void> {
    await Filesystem.deleteFile({
      path: filePath,
      directory: Directory.Data
    });
  },

  async createFile(filePath: string): Promise<void> {
    await Filesystem.writeFile({
      path: filePath,
      data: '',
      directory: Directory.Data,
      encoding: Encoding.UTF8,
      recursive: true
    });
  },

  async getFiles(directory: string): Promise<string[]> {
    const result = await Filesystem.readdir({
      path: directory,
      directory: Directory.Data
    });
    return result.files.map(it => it.name);
  },

  async existsFile(filePath: string): Promise<boolean> {
    try {
      const info = await Filesystem.stat({
        path: filePath,
        directory: Directory.Data
      });
      if (!info) {
        throw new Error("the file does not exist")
      }
      return true;
    } catch {
      return false;
    }
  }
};

export default capacitorFileService;
