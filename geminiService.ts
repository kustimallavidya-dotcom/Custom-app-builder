
import { GoogleGenAI, Type } from "@google/genai";
import { PwaMetadata, AppConfig, BuildResult } from "./types";

// Netlify वर process.env न मिळाल्यास ॲप क्रॅश होऊ नये म्हणून हा बदल
const getApiKey = () => {
  try {
    return process.env.API_KEY || "";
  } catch (e) {
    console.warn("API Key environment variable not found.");
    return "";
  }
};

export const analyzePwaUrl = async (url: string): Promise<PwaMetadata> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key उपलब्ध नाही. कृपया Netlify Settings मध्ये API_KEY सेट करा.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the PWA at this URL: ${url}. 
    Find the manifest.json content, icons, and theme colors. 
    Return the data in the following JSON schema.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          shortName: { type: Type.STRING },
          themeColor: { type: Type.STRING },
          manifestUrl: { type: Type.STRING },
          isValid: { type: Type.BOOLEAN },
          icons: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                src: { type: Type.STRING },
                sizes: { type: Type.STRING },
                type: { type: Type.STRING }
              }
            }
          }
        },
        required: ["name", "shortName", "themeColor", "isValid"]
      }
    }
  });

  const data = JSON.parse(response.text || "{}");
  return { ...data, url };
};

export const generateAndroidProject = async (config: AppConfig, pwa: PwaMetadata): Promise<BuildResult> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Create a Trusted Web Activity (TWA) Android project configuration for:
    URL: ${pwa.url}
    App Name: ${config.appName}
    Package Name: ${config.packageName}
    Version: ${config.versionName} (${config.versionCode})
    Orientation: ${config.orientation}
    
    Provide the AndroidManifest.xml, build.gradle (app), and assetlinks.json content.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          manifestXml: { type: Type.STRING },
          gradleConfig: { type: Type.STRING },
          assetLinksJson: { type: Type.STRING }
        }
      }
    }
  });

  const files = JSON.parse(response.text || "{}");
  return {
    ...files,
    apkId: `build-${Date.now()}-apk`,
    aabId: `build-${Date.now()}-aab`,
    timestamp: new Date().toISOString()
  };
};
