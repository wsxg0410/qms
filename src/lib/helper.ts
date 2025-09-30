import md5Lib from 'blueimp-md5';

// 生成更安全的唯一ID
export const generateId = async (len: number = 16): Promise<string> => {
  // 组合时间戳 + 随机数
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36);

  // 使用Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(`${timestamp}${randomPart}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // 将ArrayBuffer转换为hex字符串
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return hashHex.slice(0, len);
};

export const getExtNameByContentType = (contentType: string): string => {
  const mimeToExt: { [key: string]: string } = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'image/svg+xml': 'svg',
  };

  const ext = mimeToExt[contentType.toLowerCase()];

  if (ext) return ext;

  return contentType.split('/')?.[1]?.split(/\W/)?.[0] || '';
};

export const getImgExtName = ({
  fileName,
  contentType,
}: {
  fileName?: string;
  contentType?: string;
} = {}): string => {
  if (fileName) {
    // 首先尝试从URL中获取扩展名
    const urlExtension = fileName
      .split('.')
      .pop()
      ?.split('?')[0]
      ?.split('#')[0];

    // 常见的图片扩展名
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];

    if (urlExtension && validExtensions.includes(urlExtension.toLowerCase())) {
      return urlExtension.toLowerCase();
    }
  }

  if (contentType) {
    return getExtNameByContentType(contentType);
  }

  return '';
};

export const joinUrl = (...rest: string[]): string => {
  rest = rest.filter((n) => !!n).map((n) => n.replace(/^\/|\/$/g, ''));
  return rest.join('/');
};

export const md5 = (str: string, len: number = 32): string => {
  return md5Lib(str).slice(0, len);
};
