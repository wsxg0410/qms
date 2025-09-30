// Cloudflare R2 配置
export const CF = {
  CF_ACCOUNT_ID: import.meta.env.CF_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: import.meta.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: import.meta.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME: import.meta.env.R2_BUCKET_NAME,
};

export const IMG_URL = import.meta.env.PUBLIC_IMG_URL;
