import md5Lib from 'blueimp-md5';

export const md5 = (str: string, len: number = 32): string => {
  return md5Lib(str).slice(0, len);
};

