interface ImportMetaEnv {
  readonly VITE_APIFY_TOKEN: string;
  readonly API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
