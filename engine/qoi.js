/**
 * Quite OK Image (QOI) specification compliant encoder and decoder.
 * Pure JavaScript, zero external dependencies.
 * Reference: https://qoiformat.org/qoi-specification.pdf
 */

const QOI_MAGIC = 0x716f6966; // 'qoif'
const QOI_HEADER_SIZE = 14;
const QOI_PADDING = [0, 0, 0, 0, 0, 0, 0, 1];

const QOI_OP_INDEX = 0x00; // 00xxxxxx
const QOI_OP_DIFF  = 0x40; // 01xxxxxx
const QOI_OP_LUMA  = 0x80; // 10xxxxxx
const QOI_OP_RUN   = 0xc0; // 11xxxxxx
const QOI_OP_RGB   = 0xfe; // 11111110
const QOI_OP_RGBA  = 0xff; // 11111111
const QOI_MASK_2   = 0xc0;

function colorHash(r, g, b, a) {
  return ((r * 3 + g * 5 + b * 7 + a * 11) % 64 + 64) % 64;
}

/**
 * Encodes RGBA Buffer into QOI format Buffer.
 * @param {Buffer} data - Raw RGBA pixel buffer (width * height * 4 bytes)
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} [channels=4] - 3 for RGB, 4 for RGBA
 * @param {number} [colorspace=0] - 0 for sRGB, 1 for linear
 * @returns {Buffer} Encoded QOI buffer
 */
export function encodeQOI(data, width, height, channels = 4, colorspace = 0) {
  const maxOutSize = QOI_HEADER_SIZE + (width * height * (channels + 1)) + 8;
  const out = Buffer.alloc(maxOutSize);
  let p = 0;

  // Header: 'qoif'
  out.writeUInt32BE(QOI_MAGIC, p); p += 4;
  out.writeUInt32BE(width, p); p += 4;
  out.writeUInt32BE(height, p); p += 4;
  out[p++] = channels;
  out[p++] = colorspace;

  const index = new Array(64 * 4).fill(0);
  let pxR = 0, pxG = 0, pxB = 0, pxA = 255;
  let run = 0;

  const totalPixels = width * height;
  const inChannels = 4; // Assuming input buffer is RGBA

  for (let pxPos = 0; pxPos < totalPixels * inChannels; pxPos += inChannels) {
    const r = data[pxPos];
    const g = data[pxPos + 1];
    const b = data[pxPos + 2];
    const a = channels === 4 ? data[pxPos + 3] : 255;

    if (r === pxR && g === pxG && b === pxB && a === pxA) {
      run++;
      if (run === 62 || pxPos + inChannels === totalPixels * inChannels) {
        out[p++] = QOI_OP_RUN | (run - 1);
        run = 0;
      }
    } else {
      if (run > 0) {
        out[p++] = QOI_OP_RUN | (run - 1);
        run = 0;
      }

      const indexPos = colorHash(r, g, b, a) * 4;

      if (
        index[indexPos] === r &&
        index[indexPos + 1] === g &&
        index[indexPos + 2] === b &&
        index[indexPos + 3] === a
      ) {
        out[p++] = QOI_OP_INDEX | (indexPos / 4);
      } else {
        index[indexPos] = r;
        index[indexPos + 1] = g;
        index[indexPos + 2] = b;
        index[indexPos + 3] = a;

        if (a === pxA) {
          const vr = r - pxR;
          const vg = g - pxG;
          const vb = b - pxB;

          const vgR = vr - vg;
          const vgB = vb - vg;

          if (vr > -3 && vr < 2 && vg > -3 && vg < 2 && vb > -3 && vb < 2) {
            out[p++] = QOI_OP_DIFF | ((vr + 2) << 4) | ((vg + 2) << 2) | (vb + 2);
          } else if (vgR > -9 && vgR < 8 && vg > -33 && vg < 32 && vgB > -9 && vgB < 8) {
            out[p++] = QOI_OP_LUMA | (vg + 32);
            out[p++] = ((vgR + 8) << 4) | (vgB + 8);
          } else {
            out[p++] = QOI_OP_RGB;
            out[p++] = r;
            out[p++] = g;
            out[p++] = b;
          }
        } else {
          out[p++] = QOI_OP_RGBA;
          out[p++] = r;
          out[p++] = g;
          out[p++] = b;
          out[p++] = a;
        }
      }

      pxR = r;
      pxG = g;
      pxB = b;
      pxA = a;
    }
  }

  // End padding
  for (let i = 0; i < QOI_PADDING.length; i++) {
    out[p++] = QOI_PADDING[i];
  }

  return out.subarray(0, p);
}

/**
 * Decodes QOI buffer to raw RGBA Buffer and metadata.
 * @param {Buffer} buffer - QOI encoded buffer
 * @returns {{ data: Buffer, width: number, height: number, channels: number, colorspace: number }}
 */
export function decodeQOI(buffer) {
  if (buffer.length < QOI_HEADER_SIZE + 8) {
    throw new Error('Invalid QOI file: buffer too small');
  }

  let p = 0;
  const magic = buffer.readUInt32BE(p); p += 4;
  if (magic !== QOI_MAGIC) {
    throw new Error('Invalid QOI magic header');
  }

  const width = buffer.readUInt32BE(p); p += 4;
  const height = buffer.readUInt32BE(p); p += 4;
  const channels = buffer[p++];
  const colorspace = buffer[p++];

  const totalPixels = width * height;
  const out = Buffer.alloc(totalPixels * 4);
  let outPos = 0;

  const index = new Array(64 * 4).fill(0);
  let r = 0, g = 0, b = 0, a = 255;
  let run = 0;

  const chunksLen = buffer.length - 8;

  for (let px = 0; px < totalPixels; px++) {
    if (run > 0) {
      run--;
    } else if (p < chunksLen) {
      const b1 = buffer[p++];

      if (b1 === QOI_OP_RGB) {
        r = buffer[p++];
        g = buffer[p++];
        b = buffer[p++];
      } else if (b1 === QOI_OP_RGBA) {
        r = buffer[p++];
        g = buffer[p++];
        b = buffer[p++];
        a = buffer[p++];
      } else if ((b1 & QOI_MASK_2) === QOI_OP_INDEX) {
        const indexPos = (b1 & 0x3f) * 4;
        r = index[indexPos];
        g = index[indexPos + 1];
        b = index[indexPos + 2];
        a = index[indexPos + 3];
      } else if ((b1 & QOI_MASK_2) === QOI_OP_DIFF) {
        r = (r + ((b1 >> 4) & 0x03) - 2) & 0xff;
        g = (g + ((b1 >> 2) & 0x03) - 2) & 0xff;
        b = (b + (b1 & 0x03) - 2) & 0xff;
      } else if ((b1 & QOI_MASK_2) === QOI_OP_LUMA) {
        const b2 = buffer[p++];
        const vg = (b1 & 0x3f) - 32;
        r = (r + vg - 8 + ((b2 >> 4) & 0x0f)) & 0xff;
        g = (g + vg) & 0xff;
        b = (b + vg - 8 + (b2 & 0x0f)) & 0xff;
      } else if ((b1 & QOI_MASK_2) === QOI_OP_RUN) {
        run = b1 & 0x3f;
      }

      const indexPos = colorHash(r, g, b, a) * 4;
      index[indexPos] = r;
      index[indexPos + 1] = g;
      index[indexPos + 2] = b;
      index[indexPos + 3] = a;
    }

    out[outPos++] = r;
    out[outPos++] = g;
    out[outPos++] = b;
    out[outPos++] = a;
  }

  return { data: out, width, height, channels, colorspace };
}
