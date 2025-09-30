import type { Image } from '@/db/schema';
import type { CreateImageInput } from '@/dto/image.dto';

export const saveImageRecord = async (
  data: CreateImageInput,
): Promise<Image> => {
  const response = await fetch('/api/images', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!result?.success) {
    throw new Error(`Failed to save image record: ${result?.error}`);
  }

  return result?.data;
};

export const getPresignedUrl = async (
  file: File,
): Promise<{
  signedUrl: string;
  key: string;
}> => {
  const presignedUrlResponse = await fetch('/api/r2/presigned-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filename: file.name, // Use filename (lowercase)
      fileType: file.type, // Use fileType (lowercase)
    }),
  });

  if (!presignedUrlResponse.ok) {
    throw new Error('Failed to get presigned URL');
  }

  const rs = await presignedUrlResponse.json(); // Expect uploadUrl and key

  if (!rs.success) throw new Error(`Failed to get presigned URL`);

  return rs.data;
};

export async function uploadImage(
  file: File,
  {
    projectName,
    onProgress,
  }: { projectName?: string; onProgress?: (progress: number) => void } = {},
): Promise<{ key: string }> {
  // 1. Get presigned URL from backend

  const { signedUrl, key } = await getPresignedUrl(file);

  // 2. Upload file to presigned URL with progress tracking
  const rs = await new Promise<{ key: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('PUT', signedUrl);
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ key });
      } else {
        reject(
          new Error(
            `Upload failed with status ${xhr.status}: ${xhr.statusText}`,
          ),
        );
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during upload.'));
    };

    xhr.send(file);
  });

  if (!rs.key) {
    throw new Error('Failed to upload image');
  }

  await saveImageRecord({
    keyPath: rs.key,
    projectName,
  });

  return rs;
}

export const getImages = async ({
  projectName = ``,
  limit = 50,
}: {
  projectName?: string;
  limit?: number;
} = {}): Promise<Image[]> => {
  const queryParams = new URLSearchParams({
    projectName,
    limit: limit.toString(),
  });

  const response = await fetch(`/api/images?${queryParams.toString()}`);

  if (!response.ok) throw new Error('Failed to get images');

  const result = await response.json();

  return result?.data || [];
};
