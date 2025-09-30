import React, { useState, useRef, useCallback } from 'react';
import { uploadImage } from '@/datasource/image';
import { useStore } from '@nanostores/react';
import { $currentProjectName } from '@/store';
import { mutate } from 'swr';

// Local state type for a file being uploaded
interface UploadFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  key?: string;
}

interface IProps {}

export const PicUploader: React.FC<IProps> = ({}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentProjectName = useStore($currentProjectName);

  const uploadFile = useCallback(
    async (fileData: UploadFile) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileData.id ? { ...f, status: 'uploading', progress: 0 } : f,
        ),
      );

      try {
        const { key } = await uploadImage(fileData.file, {
          projectName: currentProjectName,
          onProgress: (progress) => {
            setFiles((prev) =>
              prev.map((f) => (f.id === fileData.id ? { ...f, progress } : f)),
            );
          },
        });

        mutate([`/api/images`, currentProjectName]);

        // 上传成功后，清理预览URL并从files数组中移除该文件
        URL.revokeObjectURL(fileData.preview);
        setFiles((prev) => prev.filter((f) => f.id !== fileData.id));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Upload failed';
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? { ...f, status: 'error', error: errorMessage }
              : f,
          ),
        );
      }
    },
    [currentProjectName],
  );

  const handleFiles = useCallback(
    (selectedFiles: FileList) => {
      const imageFiles = Array.from(selectedFiles).filter((file) =>
        file.type.startsWith('image/'),
      );

      const newFiles: UploadFile[] = imageFiles.map((file) => ({
        id: `${file.name}-${file.lastModified}`,
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: 'pending',
      }));

      setFiles((prev) => {
        const updatedFiles = [...prev, ...newFiles];
        // Immediately start uploading new files
        newFiles.forEach((file) => uploadFile(file));
        return updatedFiles;
      });
    },
    [uploadFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles],
  );

  const hasFiles = files.length > 0;

  return (
    <div className="p-3">
      <div className="w-full max-w-2xl mx-auto p-3 bg-white">
        {/* 上传区域 */}
        <div
          className={`
          relative border-1 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${
            isDragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }
          
        `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="space-y-4">
            <div className="text-6xl text-gray-400">📸</div>
            <div>
              <p className="text-lg font-medium text-gray-700">
                拖拽图片到此处或点击选择
              </p>
              <p className="text-sm text-gray-500 mt-1">
                支持 JPG、PNG、GIF 等格式，可批量上传
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 文件列表 */}
      {hasFiles && (
        <div className="pt-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {files.map((fileData) => (
            <div
              key={fileData.id}
              className="relative bg-white overflow-hidden"
            >
              {/* 图片预览 */}
              <div className="aspect-square bg-white">
                <img
                  src={fileData.preview}
                  alt={fileData.file.name}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* 文件信息 */}
              <div className="p-3">
                {/* 进度条 */}
                {fileData.status === 'uploading' && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${fileData.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {fileData.progress}%
                    </p>
                  </div>
                )}

                {/* 状态显示 */}
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className={`
                    text-xs px-2 py-1 rounded-full
                    ${fileData.status === 'pending' ? 'bg-gray-100 text-gray-600' : ''}
                    ${fileData.status === 'uploading' ? 'bg-blue-100 text-blue-600' : ''}
                    ${fileData.status === 'success' ? 'bg-green-100 text-green-600' : ''}
                    ${fileData.status === 'error' ? 'bg-red-100 text-red-600' : ''}
                  `}
                  >
                    {fileData.status === 'pending' && '待上传'}
                    {fileData.status === 'uploading' && '上传中'}
                    {fileData.status === 'success' && '已完成'}
                    {fileData.status === 'error' && '失败'}
                  </span>
                </div>

                {/* 错误信息 */}
                {fileData.status === 'error' && fileData.error && (
                  <p
                    className="text-xs text-red-500 mt-1 truncate"
                    title={fileData.error}
                  >
                    {fileData.error}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
