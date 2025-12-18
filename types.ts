
export interface PwaMetadata {
  url: string;
  name: string;
  shortName: string;
  themeColor: string;
  icons: { src: string; sizes: string; type: string }[];
  manifestUrl: string;
  isValid: boolean;
}

export interface AppConfig {
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  orientation: 'portrait' | 'landscape' | 'any';
  minSdk: number;
  iconUrl: string;
  splashColor: string;
}

export enum BuildStep {
  WELCOME,
  URL_INPUT,
  APP_CONFIG,
  COMPLIANCE,
  BUILDING,
  EXPORT
}

export interface BuildResult {
  apkId: string;
  aabId: string;
  manifestXml: string;
  gradleConfig: string;
  assetLinksJson: string;
  timestamp: string;
}
