// eslint-disable 

import { ElectronResponse } from "@/types/datatypes";

export function writeFile(filePath: string, content: string): Promise<ElectronResponse> {
  return new Promise((resolve, reject) => {
    window.electronApi.writeFile(filePath, content)
      .then((response: ElectronResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to write file'));
        }
      })
      .catch((error: Error) => {
        reject(error);
      });
  });
}

export function readFile(filePath: string): Promise<ElectronResponse> {
  return new Promise((resolve, reject) => {
    window.electronApi.readFile(filePath)
      .then((response: ElectronResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to read file'));
        }
      })
      .catch((error: Error) => {
        reject(error);
      });
  });
}

export function deleteFile(filePath: string): Promise<ElectronResponse> {
  return new Promise((resolve, reject) => {
    window.electronApi.deleteFile(filePath)
      .then((response: ElectronResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to delete file'));
        }
      })
      .catch((error: Error) => {
        reject(error);
      });
  });
}

export function createFile(filePath: string): Promise<ElectronResponse> {
  return new Promise((resolve, reject) => {
    window.electronApi.createFile(filePath)
      .then((response: ElectronResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to create file'));
        }
      })
      .catch((error: Error) => {
        reject(error);
      });
  });
}

export function getFiles(directory: string): Promise<ElectronResponse> {
  return new Promise((resolve, reject) => {
    window.electronApi.getFiles(directory)
      .then((response: ElectronResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to get files'));
        }
      })
      .catch((error: Error) => {
        reject(error);
      });
  });
}