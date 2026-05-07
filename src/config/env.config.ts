interface EnvConfig {
  key: string;
}

export default {
  [`dev`]: {
    key: import.meta.env.DEV_ENV_KEY || ``,
  },
} as Record<string, EnvConfig>;
