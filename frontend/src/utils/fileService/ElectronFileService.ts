// eslint-disable

import { FileService } from "./FileService";

const electronFileSystem: FileService = {
  async writeFile(filePath: string, content: string): Promise<void> {
    const response = await window.electronApi.writeFile(filePath, content);
    if (!response.success) throw new Error(response.error || 'Failed to write file');
  },

  async readFile(filePath: string): Promise<string> {
    const response = await window.electronApi.readFile(filePath);
    if (response.success && typeof response.data === 'string') {
      return response.data;
    }
    throw new Error(response.error || 'Failed to read file');
  },

  async deleteFile(filePath: string): Promise<void> {
    const response = await window.electronApi.deleteFile(filePath);
    if (!response.success) throw new Error(response.error || 'Failed to delete file');
  },

  async createFile(filePath: string): Promise<void> {
    const response = await window.electronApi.createFile(filePath);
    // console.log("creata file", response)
    if (!response.success) throw new Error(response.error || 'Failed to create file');
  },

  async getFiles(directory: string): Promise<string[]> {
    const response = await window.electronApi.getFiles(directory);
    if (response.success && Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get files');
  },

  async existsFile(filePath: string): Promise<boolean> {
    const response = await window.electronApi.existsFile(filePath);
    // if (response.success && typeof response.data === 'boolean') {
    //   return response.data;
    // }
    // throw new Error(response.error || 'Failed to check file existence');
    return response.success // we dont throw an error here
  }
}

export default electronFileSystem;