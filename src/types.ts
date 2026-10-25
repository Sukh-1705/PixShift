export type ImageFormat = 'png' | 'webp' | 'jpeg' | 'avif' | 'tiff' | 'bmp' | 'gif' | 'ico' | 'qoi' | 'pdf' | 'svg' | 'heic';

export interface ImageFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  buffer?: ArrayBuffer;
  previewUrl: string;
  status: 'idle' | 'converting' | 'completed' | 'error';
  progress: number;
  error?: string;
  convertedResult?: ConversionResult;
  sourceMeta?: ImageMetadata;
}

export interface ImageMetadata {
  format?: string;
  width?: number;
  height?: number;
  channels?: number;
  depth?: string;
  space?: string;
  hasAlpha?: boolean;
  size?: number;
  density?: number;
  orientation?: number;
  isAnimated?: boolean;
}

export interface ConversionResult {
  fileName: string;
  format: string;
  mime: string;
  base64: string;
  sourceMeta: ImageMetadata;
  outputMeta: {
    format: string;
    width: number;
    height: number;
    size: number;
    bytesSaved: number;
    percentSaved: number;
  };
  verification: {
    isIdentical: boolean;
    badge: 'Lossless' | 'Near-lossless' | 'Lossy';
    verificationText: string;
    sourceHash: string;
    outputHash: string;
    maxDelta: number;
    psnr: number;
  };
  timeTakenMs: number;
  savedPath?: string | null;
}

export interface QualityPreset {
  id: string;
  name: string;
  format: ImageFormat;
  quality: number;
  lossless: boolean;
  metadataMode: 'keep' | 'strip' | 'strip-geo';
  chromaSubsampling?: '4:4:4' | '4:2:0';
  smartSubsample?: boolean;
}

export interface ConversionOptions {
  format: ImageFormat;
  quality: number;
  lossless: boolean;
  metadataMode: 'keep' | 'strip' | 'strip-geo';
  backgroundColor: string;
  convertToSrgb: boolean;
  chromaSubsampling: '4:4:4' | '4:2:0';
  progressive: boolean;
  maxFileSizeKb?: number;
  namingTemplate: string;
  resize?: {
    mode: 'none' | 'percent' | 'pixels' | 'longest-edge';
    percent?: number;
    width?: number;
    height?: number;
    longestEdge?: number;
  };
  rotate?: number;
  flip?: boolean;
  flop?: boolean;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  originalName: string;
  outputName: string;
  sourceFormat: string;
  targetFormat: string;
  originalSize: number;
  convertedSize: number;
  bytesSaved: number;
  percentSaved: number;
  timeTakenMs: number;
  badge: 'Lossless' | 'Near-lossless' | 'Lossy';
  verificationText: string;
  savedPath?: string;
}
