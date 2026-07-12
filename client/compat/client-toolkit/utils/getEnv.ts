interface WindowWithEnv {
  BOE?: string;
  APP_ENV?: string;
  ENV?: string;
}

export const getEnv = (): string => {
  if (typeof window !== 'undefined') {
    const windowEnv = (window as Window & WindowWithEnv);
    if (typeof windowEnv.BOE === 'string' && windowEnv.BOE.length > 0) {
      return windowEnv.BOE;
    }
    if (typeof windowEnv.APP_ENV === 'string' && windowEnv.APP_ENV.length > 0) {
      return windowEnv.APP_ENV;
    }
    if (typeof windowEnv.ENV === 'string' && windowEnv.ENV.length > 0) {
      return windowEnv.ENV;
    }
  }

  const viteEnvValue =
    (import.meta as { env?: Record<string, string> }).env?.VITE_APP_ENV ||
    (import.meta as { env?: Record<string, string> }).env?.VITE_BOE;
  if (viteEnvValue && viteEnvValue.length > 0) {
    return viteEnvValue;
  }

  if (typeof process !== 'undefined') {
    const processEnvValue = (process as { env?: Record<string, string> }).env?.APP_ENV;
    if (processEnvValue && processEnvValue.length > 0) {
      return processEnvValue;
    }
  }

  return '';
};
