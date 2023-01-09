import { AppContext } from '../api/createApp';

export interface AppConfig {
  globalProperties: Record<string, any>; // 全局属性
}

export const genAppConfig = (): AppConfig => {
  return {
    globalProperties: {}
  } as AppConfig;
};

export const createAppConfigHandler = (context: AppContext) => {
  const AppConfigHandler = {
    get config() {
      return context.config;
    },
    set config(v) {
      console.warn(`app.config is readonly`);
    }
  };

  return AppConfigHandler;
};
