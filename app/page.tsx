'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';

interface FileInfo {
  name: string;
  size: number;
  path: string;
}

// Type declarations for File System API
interface FileSystemEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath: string;
}

interface FileSystemFileEntry extends FileSystemEntry {
  file(callback: (file: File) => void): void;
}

interface FileSystemDirectoryEntry extends FileSystemEntry {
  createReader(): FileSystemDirectoryReader;
}

interface FileSystemDirectoryReader {
  readEntries(callback: (entries: FileSystemEntry[]) => void): void;
}

interface ExtendedHTMLInputElement extends Omit<HTMLInputElement, 'webkitdirectory'> {
  webkitdirectory?: boolean;
  directory?: boolean;
}

interface ExtendedFile extends Omit<File, 'webkitRelativePath'> {
  webkitRelativePath?: string;
}

export default function Home() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    setProgress(0);

    const fileInfoArray: FileInfo[] = [];
    const batchSize = 100; // Process in batches to avoid blocking UI
    
    // Process files in batches
    for (let i = 0; i < fileList.length; i += batchSize) {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          const end = Math.min(i + batchSize, fileList.length);
          
          for (let j = i; j < end; j++) {
            const file = fileList[j] as ExtendedFile;
            const relativePath = file.webkitRelativePath || file.name;
            
            fileInfoArray.push({
              name: file.name,
              size: file.size,
              path: relativePath,
            });
          }

          // Update progress
          setProgress(Math.round((end / fileList.length) * 100));
          resolve();
        });
      });
    }

    setFiles(fileInfoArray);
    setUploading(false);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const items = e.dataTransfer.items;
    const files: File[] = [];

    const processEntry = async (entry: FileSystemEntry): Promise<void> => {
      return new Promise((resolve) => {
        if (entry.isFile) {
          (entry as FileSystemFileEntry).file((file: File) => {
            files.push(file);
            resolve();
          });
        } else if (entry.isDirectory) {
          const reader = (entry as FileSystemDirectoryEntry).createReader();
          reader.readEntries(async (entries: FileSystemEntry[]) => {
            for (const entry of entries) {
              await processEntry(entry);
            }
            resolve();
          });
        } else {
          resolve();
        }
      });
    };

    (async () => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const entry = item.webkitGetAsEntry();
        if (entry) {
          await processEntry(entry);
        }
      }

      // Create a FileList-like object
      const dataTransfer = new DataTransfer();
      files.forEach(file => dataTransfer.items.add(file));
      handleFiles(dataTransfer.files);
    })();
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getTotalSize = (): string => {
    const total = files.reduce((sum, file) => sum + file.size, 0);
    return formatFileSize(total);
  };

  const clearFiles = () => {
    setFiles([]);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-gray-800 dark:text-white">
          NERVIA
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Importation de Gros Dossiers
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-6">
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef as React.RefObject<ExtendedHTMLInputElement>}
              type="file"
              onChange={handleChange}
              className="hidden"
              multiple
              {...({ webkitdirectory: '', directory: '' } as any)}
            />
            
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
              Glissez-déposez un dossier ici, ou
            </p>
            
            <button
              onClick={handleButtonClick}
              className="mt-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              disabled={uploading}
            >
              Sélectionner un Dossier
            </button>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Supporte les dossiers de toute taille avec tous types de fichiers
            </p>
          </div>

          {uploading && (
            <div className="mt-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Traitement en cours...
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {files.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Fichiers Importés
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {files.length} fichier{files.length > 1 ? 's' : ''} • Taille totale: {getTotalSize()}
                </p>
              </div>
              <button
                onClick={clearFiles}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                Effacer
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto border dark:border-gray-700 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Chemin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Taille
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {files.map((file, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {file.path}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
