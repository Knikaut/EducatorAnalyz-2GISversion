declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    VITE_APIFY_TOKEN: string;
    [key: string]: string | undefined;
  }
}
