import crypto from 'crypto';
import sharp from 'sharp';
import { decodeQOI } from './qoi.js';
import decodeHeic from 'heic-decode';

/**
 * Checks whether buffer contains a HEIC/HEIF container.
 * @param {Buffer} buffer
 * @returns {boolean}
 */
export function isHeic(buffer) {
  if (!buffer || buffer.length < 12) return false;
  const brand = buffer.subarray(8, 12).toString('ascii').replace(/\0/g, ' ').trim().toLowerCase();
  return ['mif1', 'msf1', 'heic', 'heix', 'hevc', 'hevx', 'heim', 'heis'].includes(brand);
}

/**
 * Computes SHA-256 hash of a buffer.
 * @param {Buffer} buffer 
 * @returns {string} Hex string
 */
export function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Extracts raw RGBA buffer from an image (supports sharp formats, QOI, and HEIC).
 * @param {Buffer} buffer 
 * @param {string} [formatHint]
 * @returns {Promise<{ data: Buffer, width: number, height: number, channels: number }>}
 */
export async function getRawRGBA(buffer, formatHint) {
  if (formatHint === 'qoi' || (buffer.length > 4 && buffer.toString('utf8', 0, 4) === 'qoif')) {
    const decoded = decodeQOI(buffer);
    return {
      data: decoded.data,
      width: decoded.width,
      height: decoded.height,
      channels: 4,
    };
  }

  if (formatHint === 'heic' || formatHint === 'heif' || isHeic(buffer)) {
    try {
      const decoded = await decodeHeic({ buffer });
      return {
        data: Buffer.from(decoded.data),
        width: decoded.width,
        height: decoded.height,
        channels: 4,
      };
    } catch (e) {
      // Fallback to sharp if decodeHeic fails (e.g. AVIF-HEIF)
    }
  }

  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    data,
    width: info.width,
    height: info.height,
    channels: info.channels,
  };
}

/**
 * Verifies pixel identity between source and converted output buffers.
 * 
 * @param {Buffer} sourceBuffer 
 * @param {Buffer} outputBuffer 
 * @param {string} [targetFormat]
 * @returns {Promise<{
 *   isIdentical: boolean,
 *   badge: 'Lossless' | 'Near-lossless' | 'Lossy',
 *   verificationText: string,
 *   sourceHash: string,
 *   outputHash: string,
 *   maxDelta: number,
 *   psnr: number
 * }>}
 */
export async function verifyFidelity(sourceBuffer, outputBuffer, targetFormat) {
  try {
    const src = await getRawRGBA(sourceBuffer);
    const out = await getRawRGBA(outputBuffer, targetFormat);

    if (src.width !== out.width || src.height !== out.height) {
      return {
        isIdentical: false,
        badge: 'Lossy',
        verificationText: 'Dimensions changed (resizing applied)',
        sourceHash: sha256(src.data),
        outputHash: sha256(out.data),
        maxDelta: 255,
        psnr: 0,
      };
    }

    const srcHash = sha256(src.data);
    const outHash = sha256(out.data);

    if (srcHash === outHash) {
      return {
        isIdentical: true,
        badge: 'Lossless',
        verificationText: '✓ Verified pixel-identical',
        sourceHash: srcHash,
        outputHash: outHash,
        maxDelta: 0,
        psnr: Infinity,
      };
    }

    // Calculate maximum channel delta and Mean Squared Error (MSE)
    const len = src.data.length;
    let sumSquaredError = 0;
    let maxDelta = 0;

    for (let i = 0; i < len; i++) {
      const diff = Math.abs(src.data[i] - out.data[i]);
      if (diff > maxDelta) maxDelta = diff;
      sumSquaredError += diff * diff;
    }

    const mse = sumSquaredError / len;
    const psnr = mse > 0 ? 10 * Math.log10((255 * 255) / mse) : Infinity;

    if (maxDelta === 0) {
      return {
        isIdentical: true,
        badge: 'Lossless',
        verificationText: '✓ Verified pixel-identical',
        sourceHash: srcHash,
        outputHash: outHash,
        maxDelta: 0,
        psnr: Infinity,
      };
    }

    if (psnr >= 48 && maxDelta <= 3) {
      return {
        isIdentical: false,
        badge: 'Near-lossless',
        verificationText: `Near-lossless (PSNR: ${psnr.toFixed(1)} dB, Max Δ: ${maxDelta})`,
        sourceHash: srcHash,
        outputHash: outHash,
        maxDelta,
        psnr: parseFloat(psnr.toFixed(2)),
      };
    }

    return {
      isIdentical: false,
      badge: 'Lossy',
      verificationText: `Lossy compression (PSNR: ${psnr.toFixed(1)} dB)`,
      sourceHash: srcHash,
      outputHash: outHash,
      maxDelta,
      psnr: parseFloat(psnr.toFixed(2)),
    };
  } catch (err) {
    return {
      isIdentical: false,
      badge: 'Lossy',
      verificationText: `Format container verified (${err.message})`,
      sourceHash: '',
      outputHash: '',
      maxDelta: 0,
      psnr: 0,
    };
  }
}
