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

/**
 * 类似 lodash.groupBy 的实现.
 * * @param array 要迭代的数组.
 * @param iteratee 用于生成 key 的迭代函数 (或属性名).
 * @returns 返回一个 Record<string | number, T[]>.
 */
export function groupBy<T>(
  array: T[],
  iteratee: keyof T | ((item: T) => string | number),
): Record<string | number, T[]> {
  // 确定是使用函数还是属性名来获取 key
  const getKey =
    typeof iteratee === 'function'
      ? iteratee
      : (item: T) => item[iteratee] as string | number;

  return array.reduce(
    (acc, item) => {
      // 1. 获取当前项的 key
      const key = getKey(item);

      // 2. 检查 accumulator (acc) 中是否已存在该 key
      if (!acc[key]) {
        // 3. 如果不存在，初始化一个空数组
        acc[key] = [];
      }

      // 4. 将当前项推入对应的数组
      acc[key].push(item);

      // 5. 返回更新后的 accumulator
      return acc;
    },
    {} as Record<string | number, T[]>,
  );
}

/**
 * 将一个数组（array）拆分成多个指定大小（size）的块，
 * 并返回一个包含这些块的新数组。
 * 如果数组不能被平均分割，最后的块将包含剩余的元素。
 *
 * @param array 需要处理的数组
 * @param size 每个块的长度
 * @returns 返回一个包含块的新数组
 */
export function chunk<T>(array: T[], size: number = 10): T[][] {
  // 确保 size 是一个正整数
  size = Math.max(Math.floor(size), 1);

  if (!array || array.length === 0) {
    return [];
  }

  const result: T[][] = [];
  let index = 0;

  while (index < array.length) {
    // 使用 slice 方法截取从 index 开始，到 index + size 结束的子数组
    result.push(array.slice(index, index + size));
    // 更新下一个块的起始索引
    index += size;
  }

  return result;
}
