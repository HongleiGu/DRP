// The global FileService interface, as we need to develop this cross-platform-ly
export interface FileService {
  writeFile(filePath: string, content: string): Promise<void>;
  readFile(filePath: string): Promise<string>;
  deleteFile(filePath: string): Promise<void>;
  createFile(filePath: string): Promise<void>;
  getFiles(directory: string): Promise<string[]>;
  existsFile(filePath: string): Promise<boolean>;
}
