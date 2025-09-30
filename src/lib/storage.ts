export const getLs = (
  key: string,
  defaultValue: any = null,
  namespace: string = '__app',
) => {
  if (typeof window === 'undefined') return defaultValue;

  let __app: any = window.localStorage.getItem(namespace);
  if (!__app) return defaultValue;
  __app = JSON.parse(__app);
  return __app[key] !== undefined ? __app[key] : defaultValue;
};

export const setLs = (
  key: string,
  value: any,
  { namespace = '__app' }: { namespace?: string } = {},
) => {
  if (typeof window === 'undefined') return;

  let __app: any = window.localStorage.getItem(namespace);
  __app = __app || '{}';
  __app = JSON.parse(__app);
  __app[key] = value;
  __app = JSON.stringify(__app);
  window.localStorage.setItem(namespace, __app);
};
