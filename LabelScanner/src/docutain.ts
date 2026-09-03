import DocutainSDK from '@docutain/react-native-docutain-sdk';
import {ScanResultData} from './types';

const LICENSE_KEY = 'edff22dbcc244bd0b709d7e632ce12e5';

let initialized = false;

export async function initDocutain(): Promise<boolean> {
  if (initialized) {
    return true;
  }
  try {
    const result = await DocutainSDK.initSDK(LICENSE_KEY);
    if (!result) {
      const error = await DocutainSDK.getLastError();
      console.error('Docutain init failed:', error);
      return false;
    }
    initialized = true;
    return true;
  } catch (error) {
    console.error('Docutain init error:', error);
    return false;
  }
}

export async function scanLabel(): Promise<void> {
  await DocutainSDK.scanDocument({});
}

export async function extractAddress(): Promise<ScanResultData | null> {
  try {
    const analyzeData: string = await DocutainSDK.analyze();
    if (analyzeData) {
      const parsed = JSON.parse(analyzeData) as ScanResultData;
      return parsed;
    }
    return null;
  } catch (error) {
    console.error('Data extraction failed:', error);
    return null;
  }
}

export async function getRawText(): Promise<string> {
  try {
    const text: string = await DocutainSDK.getText();
    return text || '';
  } catch (error) {
    console.error('Text detection failed:', error);
    return '';
  }
}
