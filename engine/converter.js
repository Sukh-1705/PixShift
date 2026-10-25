import sharp from 'sharp';
import { encodeQOI, decodeQOI } from './qoi.js';
import { encodeICO } from './ico.js';
import { encodePDF } from './pdf.js';
import { verifyFidelity, isHeic } from './verifier.js';
import decodeHeic from 'heic-decode';

/**
 * Format capability descriptors
 */
export const FORMAT_INFO = {
  png: { name: 'PNG', lossless: true, supportsAlpha: true, canAnimate: true, desc: 'Portable Network Graphics (lossless, universal)' },
  webp: { name: 'WebP', lossless: true, supportsAlpha: true, canAnimate: true, desc: 'Modern web image with lossless & lossy modes' },
  jpeg: { name: 'JPEG', lossless: false, supportsAlpha: false, canAnimate: false, desc: 'Universal lossy format powered by MozJPEG' },
  jpg: { name: 'JPEG', lossless: false, supportsAlpha: false, canAnimate: false, desc: 'Universal lossy format powered by MozJPEG' },
  avif: { name: 'AVIF', lossless: true, supportsAlpha: true, canAnimate: true, desc: 'Next-gen AV1 format with extreme compression' },
  tiff: { name: 'TIFF', lossless: true, supportsAlpha: true, canAnimate: false, desc: 'Uncompressed / Deflate archival and print format' },
  bmp: { name: 'BMP', lossless: true, supportsAlpha: true, canAnimate: false, desc: 'Standard uncompressed Windows bitmap' },
  gif: { name: 'GIF', lossless: true, supportsAlpha: true, canAnimate: true, desc: 'Classic palette-based format with animation' },
  ico: { name: 'ICO', lossless: true, supportsAlpha: true, canAnimate: false, desc: 'Multi-resolution Windows application & web icon' },
  qoi: { name: 'QOI', lossless: true, supportsAlpha: true, canAnimate: false, desc: 'Quite OK Image: ultra-fast lossless raster format' },
  pdf: { name: 'PDF', lossless: true, supportsAlpha: true, canAnimate: false, desc: 'Single-page document with embedded image raster' },
  svg: { name: 'SVG', lossless: true, supportsAlpha: true, canAnimate: false, desc: 'Scalable vector container with embedded raster' },
  heic: { name: 'HEIC', lossless: false, supportsAlpha: true, canAnimate: false, desc: 'High Efficiency Image Container (Apple & modern mobile)' },
  heif: { name: 'HEIF', lossless: false, supportsAlpha: true, canAnimate: false, desc: 'High Efficiency Image File format container' },
};

/**
 * Normalizes format string
 */
export function normalizeFormat(fmt) {
  const clean = (fmt || '').toLowerCase().replace(/^\./, '').trim();
  if (clean === 'jpg') return 'jpeg';
  if (clean === 'tif') return 'tiff';
  if (clean === 'heif') return 'heic';
  return clean;
}

/**
 * Inspect image metadata from Buffer
 * @param {Buffer} buffer 
 * @param {string} [formatHint]
 * @returns {Promise<object>}
 */
export async function inspectImage(buffer, formatHint) {
  const norm = normalizeFormat(formatHint);

  if (norm === 'qoi' || (buffer.length > 4 && buffer.toString('utf8', 0, 4) === 'qoif')) {
    const qoi = decodeQOI(buffer);
    return {
      format: 'qoi',
      width: qoi.width,
      height: qoi.height,
      channels: qoi.channels,
      depth: 'uchar',
      space: qoi.colorspace === 0 ? 'srgb' : 'linear',
      hasAlpha: qoi.channels === 4,
      size: buffer.length,
      density: 72,
      isAnimated: false,
    };
  }

  if (norm === 'heic' || isHeic(buffer)) {
    try {
      const heic = await decodeHeic({ buffer });
      return {
        format: 'heic',
        width: heic.width,
        height: heic.height,
        channels: 4,
        depth: 'uchar',
        space: 'srgb',
        hasAlpha: true,
        size: buffer.length,
        density: 72,
        isAnimated: false,
      };
    } catch (e) {
      // Fallback to sharp
    }
  }

  const image = sharp(buffer, { animated: true });
  const meta = await image.metadata();

  return {
    format: meta.format,
    width: meta.width || 0,
    height: meta.height || 0,
    channels: meta.channels || 3,
    depth: meta.depth || 'uchar',
    space: meta.space || 'srgb',
    hasAlpha: meta.hasAlpha || false,
    size: buffer.length,
    density: meta.density || 72,
    orientation: meta.orientation,
    isAnimated: (meta.pages && meta.pages > 1) || false,
    pages: meta.pages || 1,
    hasProfile: !!meta.icc,
  };
}

/**
 * Core image converter function
 * 
 * @param {Buffer} inputBuffer - Input raw image buffer
 * @param {object} options - Conversion options
 * @returns {Promise<{
 *   buffer: Buffer,
 *   format: string,
 *   info: object,
 *   verification: object,
 *   timeTakenMs: number
 * }>}
 */
export async function convertImage(inputBuffer, options = {}) {
  const startTime = Date.now();
  const targetFormat = normalizeFormat(options.format || 'png');
  const metadataMode = options.metadataMode || 'keep'; // 'keep' | 'strip' | 'strip-geo'
  const quality = Math.max(1, Math.min(100, options.quality !== undefined ? options.quality : 90));
  const lossless = options.lossless !== undefined ? !!options.lossless : (targetFormat === 'png' || targetFormat === 'qoi');
  const backgroundColor = options.backgroundColor || '#FFFFFF';
  const convertToSrgb = !!options.convertToSrgb;

  let sharpInstance;
  let inputMeta;

  // Handle QOI input
  if (inputBuffer.length > 4 && inputBuffer.toString('utf8', 0, 4) === 'qoif') {
    const qoi = decodeQOI(inputBuffer);
    sharpInstance = sharp(qoi.data, {
      raw: {
        width: qoi.width,
        height: qoi.height,
        channels: 4,
      },
    });
    inputMeta = {
      format: 'qoi',
      width: qoi.width,
      height: qoi.height,
      channels: 4,
      hasAlpha: true,
      size: inputBuffer.length,
    };
  } else if (isHeic(inputBuffer)) {
    try {
      const heic = await decodeHeic({ buffer: inputBuffer });
      sharpInstance = sharp(Buffer.from(heic.data), {
        raw: {
          width: heic.width,
          height: heic.height,
          channels: 4,
        },
      });
      inputMeta = {
        format: 'heic',
        width: heic.width,
        height: heic.height,
        channels: 4,
        hasAlpha: true,
        size: inputBuffer.length,
      };
    } catch (e) {
      sharpInstance = sharp(inputBuffer, { animated: true });
      inputMeta = await sharpInstance.metadata();
    }
  } else {
    sharpInstance = sharp(inputBuffer, { animated: true });
    inputMeta = await sharpInstance.metadata();
  }

  // Handle color management
  if (convertToSrgb) {
    sharpInstance = sharpInstance.toColorspace('srgb');
  }

  // Handle transformations: rotation, flip, flop
  if (options.rotate) {
    sharpInstance = sharpInstance.rotate(options.rotate);
  }
  if (options.flip) {
    sharpInstance = sharpInstance.flip();
  }
  if (options.flop) {
    sharpInstance = sharpInstance.flop();
  }

  // Handle resize
  if (options.resize) {
    const resizeOpts = {
      kernel: sharp.kernel.lanczos3,
      fit: options.resize.fit || 'inside',
      withoutEnlargement: options.resize.withoutEnlargement || false,
    };

    if (options.resize.percent) {
      const scale = options.resize.percent / 100;
      const w = Math.round((inputMeta.width || 800) * scale);
      const h = Math.round((inputMeta.height || 600) * scale);
      sharpInstance = sharpInstance.resize(w, h, resizeOpts);
    } else if (options.resize.longestEdge) {
      const maxDim = options.resize.longestEdge;
      if ((inputMeta.width || 0) >= (inputMeta.height || 0)) {
        sharpInstance = sharpInstance.resize(maxDim, null, resizeOpts);
      } else {
        sharpInstance = sharpInstance.resize(null, maxDim, resizeOpts);
      }
    } else if (options.resize.width || options.resize.height) {
      sharpInstance = sharpInstance.resize(options.resize.width, options.resize.height, resizeOpts);
    }
  }

  // Handle alpha channel removal if target format does not support transparency
  const targetInfo = FORMAT_INFO[targetFormat] || {};
  if (!targetInfo.supportsAlpha || options.flatten) {
    sharpInstance = sharpInstance.flatten({ background: backgroundColor });
  }

  // Handle metadata
  if (metadataMode === 'keep') {
    sharpInstance = sharpInstance.withMetadata();
  } else if (metadataMode === 'strip-geo') {
    // Preserve orientation and ICC profile while clearing GPS
    sharpInstance = sharpInstance.withMetadata({
      orientation: inputMeta.orientation,
    });
  } // if 'strip', simply do not call .withMetadata()

  let outputBuffer;
  let finalInfo = {};

  // Route to specialized or standard sharp encoders
  if (targetFormat === 'qoi') {
    const { data, info } = await sharpInstance
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    outputBuffer = encodeQOI(data, info.width, info.height, 4, 0);
    finalInfo = {
      format: 'qoi',
      width: info.width,
      height: info.height,
      channels: 4,
      size: outputBuffer.length,
    };
  } else if (targetFormat === 'ico') {
    outputBuffer = await encodeICO(sharpInstance, options.icoSizes);
    finalInfo = {
      format: 'ico',
      width: inputMeta.width,
      height: inputMeta.height,
      size: outputBuffer.length,
    };
  } else if (targetFormat === 'pdf') {
    outputBuffer = await encodePDF(sharpInstance);
    finalInfo = {
      format: 'pdf',
      width: inputMeta.width,
      height: inputMeta.height,
      size: outputBuffer.length,
    };
  } else if (targetFormat === 'svg') {
    // Raster-embedded SVG encapsulation
    const pngBuffer = await sharpInstance.png({ compressionLevel: 9 }).toBuffer();
    const meta = await sharp(pngBuffer).metadata();
    const b64 = pngBuffer.toString('base64');
    const svgStr = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${meta.width}" height="${meta.height}" viewBox="0 0 ${meta.width} ${meta.height}">
  <image width="${meta.width}" height="${meta.height}" xlink:href="data:image/png;base64,${b64}"/>
</svg>`;
    outputBuffer = Buffer.from(svgStr, 'utf8');
    finalInfo = {
      format: 'svg',
      width: meta.width,
      height: meta.height,
      size: outputBuffer.length,
    };
  } else if (targetFormat === 'png') {
    const res = await sharpInstance
      .png({
        compressionLevel: options.compressionLevel !== undefined ? options.compressionLevel : 9,
        palette: !!options.palette,
        quality: quality,
      })
      .toBuffer({ resolveWithObject: true });
    outputBuffer = res.data;
    finalInfo = res.info;
  } else if (targetFormat === 'webp') {
    const res = await sharpInstance
      .webp({
        lossless: lossless,
        quality: lossless ? 100 : quality,
        effort: options.effort !== undefined ? options.effort : 6,
        smartSubsample: options.smartSubsample !== undefined ? options.smartSubsample : true,
      })
      .toBuffer({ resolveWithObject: true });
    outputBuffer = res.data;
    finalInfo = res.info;
  } else if (targetFormat === 'jpeg' || targetFormat === 'jpg') {
    const res = await sharpInstance
      .jpeg({
        quality: quality,
        progressive: options.progressive !== undefined ? options.progressive : true,
        chromaSubsampling: options.chromaSubsampling || '4:4:4',
        mozjpeg: options.mozjpeg !== undefined ? options.mozjpeg : true,
      })
      .toBuffer({ resolveWithObject: true });
    outputBuffer = res.data;
    finalInfo = res.info;
  } else if (targetFormat === 'avif') {
    const res = await sharpInstance
      .avif({
        lossless: lossless,
        quality: lossless ? 100 : quality,
        effort: options.effort !== undefined ? options.effort : 6,
        chromaSubsampling: options.chromaSubsampling || '4:4:4',
      })
      .toBuffer({ resolveWithObject: true });
    outputBuffer = res.data;
    finalInfo = res.info;
  } else if (targetFormat === 'tiff') {
    const tiffOpts = {
      compression: options.compression || 'deflate',
      quality: quality,
    };
    if (options.bitdepth && [1, 2, 4].includes(options.bitdepth)) {
      tiffOpts.bitdepth = options.bitdepth;
    }
    const res = await sharpInstance
      .tiff(tiffOpts)
      .toBuffer({ resolveWithObject: true });
    outputBuffer = res.data;
    finalInfo = res.info;
  } else if (targetFormat === 'gif') {
    const res = await sharpInstance
      .gif({
        reuse: true,
        effort: 7,
      })
      .toBuffer({ resolveWithObject: true });
    outputBuffer = res.data;
    finalInfo = res.info;
  } else if (targetFormat === 'bmp') {
    // Sharp provides bmp output format
    const res = await sharpInstance
      .toFormat('bmp')
      .toBuffer({ resolveWithObject: true });
    outputBuffer = res.data;
    finalInfo = res.info;
  } else if (targetFormat === 'heic' || targetFormat === 'heif') {
    let res;
    try {
      res = await sharpInstance
        .heif({
          compression: 'hevc',
          quality: quality,
        })
        .toBuffer({ resolveWithObject: true });
    } catch (e) {
      res = await sharpInstance
        .heif({
          compression: 'av1',
          quality: quality,
        })
        .toBuffer({ resolveWithObject: true });
    }
    outputBuffer = res.data;
    finalInfo = {
      ...res.info,
      format: 'heic',
    };
  } else {
    // Fallback standard sharp format
    const res = await sharpInstance
      .toFormat(targetFormat, { quality })
      .toBuffer({ resolveWithObject: true });
    outputBuffer = res.data;
    finalInfo = res.info;
  }

  // Handle Target File Size compression ("compress to under X KB")
  if (options.maxFileSizeKb && options.maxFileSizeKb > 0 && outputBuffer.length > options.maxFileSizeKb * 1024) {
    if (targetFormat === 'jpeg' || targetFormat === 'webp' || targetFormat === 'avif') {
      let low = 10;
      let high = quality;
      let bestBuffer = outputBuffer;
      let bestQuality = quality;

      for (let iter = 0; iter < 4; iter++) {
        const midQuality = Math.floor((low + high) / 2);
        let testInstance = sharp(inputBuffer);
        if (!targetInfo.supportsAlpha) testInstance = testInstance.flatten({ background: backgroundColor });

        let testBuffer;
        if (targetFormat === 'jpeg') {
          testBuffer = await testInstance.jpeg({ quality: midQuality, mozjpeg: true }).toBuffer();
        } else if (targetFormat === 'webp') {
          testBuffer = await testInstance.webp({ quality: midQuality }).toBuffer();
        } else if (targetFormat === 'avif') {
          testBuffer = await testInstance.avif({ quality: midQuality }).toBuffer();
        }

        if (testBuffer.length <= options.maxFileSizeKb * 1024) {
          bestBuffer = testBuffer;
          bestQuality = midQuality;
          low = midQuality + 1;
        } else {
          high = midQuality - 1;
        }
      }

      outputBuffer = bestBuffer;
      finalInfo.size = outputBuffer.length;
      finalInfo.adjustedQuality = bestQuality;
    }
  }

  // Verify fidelity and pixel identity
  const verification = await verifyFidelity(inputBuffer, outputBuffer, targetFormat);

  const timeTakenMs = Date.now() - startTime;

  return {
    buffer: outputBuffer,
    format: targetFormat,
    info: {
      ...finalInfo,
      originalSize: inputBuffer.length,
      convertedSize: outputBuffer.length,
      bytesSaved: inputBuffer.length - outputBuffer.length,
      percentSaved: Math.round(((inputBuffer.length - outputBuffer.length) / inputBuffer.length) * 100),
    },
    verification,
    timeTakenMs,
  };
}
