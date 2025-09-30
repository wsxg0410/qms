import React, { useState } from 'react';
import useSWR from 'swr';

import { IMG_URL } from '@/config/app.config';
import { getImages } from '@/datasource/image';
import { joinUrl } from '@/lib/helper';
import { $currentProjectName } from '@/store';
import { useStore } from '@nanostores/react';

interface IProps {}

export const PicList: React.FC<IProps> = ({}) => {
  const currentProjectName = useStore($currentProjectName);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedKind, setCopiedKind] = useState<'url' | 'md' | null>(null);

  const { data, error, isLoading } = useSWR(
    currentProjectName === undefined
      ? null
      : [`/api/images`, currentProjectName],
    ([, projectName]) => getImages({ projectName }),
  );

  const handleCopyImageUrl = async (item: any) => {
    try {
      await navigator.clipboard.writeText(item.keyPath);
      setCopiedId(item.id);
      setCopiedKind('url');

      // 清除复制成功提示
      setTimeout(() => {
        setCopiedId(null);
        setCopiedKind(null);
      }, 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleCopyMarkdown = async (item: any) => {
    try {
      const keyPath = item.keyPath;
      // 使用文件名或空字符串作为 alt 文本
      const alt = item.name || item.filename || '';
      const md = `![${alt}](${keyPath})`;
      await navigator.clipboard.writeText(md);
      setCopiedId(item.id);
      setCopiedKind('md');

      setTimeout(() => {
        setCopiedId(null);
        setCopiedKind(null);
      }, 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  return (
    <div>
      {isLoading && <div className=" text-center text-3xl p-5">Loading...</div>}

      <ul className=" grid grid-cols-2 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {data?.map((item) => (
          <li key={item.id}>
            <div
              className="aspect-square bg-gray-100 cursor-pointer relative group"
              onClick={() => handleCopyImageUrl(item)}
            >
              <img
                src={joinUrl(IMG_URL, item.keyPath)}
                data-key={item.keyPath}
                alt={``}
                className="w-full h-full object-contain"
              />

              {/* 悬停时显示 Key 按钮（复制 KeyPath）*/}
              <button
                type="button"
                className="hidden group-hover:flex absolute top-8 right-1.5 px-2 py-0.5 text-xs rounded bg-black/60 text-white backdrop-blur-sm cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyImageUrl(item);
                }}
                title="Copy Key"
              >
                KEY
              </button>

              {/* 悬停时显示 MD 按钮（复制 Markdown 语法）*/}
              <button
                type="button"
                className="hidden group-hover:flex absolute top-1.5 right-1.5 px-2 py-0.5 text-xs rounded bg-black/60 text-white backdrop-blur-sm cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyMarkdown(item);
                }}
                title="Copy Markdown"
              >
                MD
              </button>

              {/* 复制成功提示 */}
              {copiedId === item.id && (
                <div className="absolute bg-black/60 inset-0 flex items-center justify-center">
                  <span className="text-sm font-medium text-green-500">
                    {copiedKind === 'md' ? 'Markdown Copied ✓' : 'Key Copied ✓'}
                  </span>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
