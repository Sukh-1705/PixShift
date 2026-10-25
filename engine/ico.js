import sharp from 'sharp';

/**
 * Encodes an image into a multi-resolution Windows .ico container
 * using standard PNG-encoded icon frames (16x16, 32x32, 48x48, 64x64, 128x128, 256x256).
 * 
 * @param {Buffer|sharp.Sharp} input - Source image buffer or Sharp instance
 * @param {number[]} [sizes=[16, 32, 48, 64, 128, 256]] - Array of target dimensions
 * @returns {Promise<Buffer>} Valid .ico buffer
 */
export async function encodeICO(input, sizes = [16, 32, 48, 64, 128, 256]) {
  const sharpInstance = (input && typeof input.clone === 'function') ? input : sharp(input);

  // Generate PNG buffers for each size
  const frames = [];
  for (const size of sizes) {
    const pngBuffer = await sharpInstance
      .clone()
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    frames.push({ size, buffer: pngBuffer });
  }

  // Calculate header and directory sizes
  const headerSize = 6;
  const dirEntrySize = 16;
  const count = frames.length;
  const totalDirSize = headerSize + (count * dirEntrySize);

  let currentOffset = totalDirSize;
  const entries = [];

  for (const frame of frames) {
    const bWidth = frame.size >= 256 ? 0 : frame.size;
    const bHeight = frame.size >= 256 ? 0 : frame.size;
    entries.push({
      bWidth,
      bHeight,
      bColorCount: 0,
      bReserved: 0,
      wPlanes: 1,
      wBitCount: 32,
      dwBytesInRes: frame.buffer.length,
      dwImageOffset: currentOffset,
      buffer: frame.buffer,
    });
    currentOffset += frame.buffer.length;
  }

  // Allocate final ICO buffer
  const out = Buffer.alloc(currentOffset);
  let p = 0;

  // ICONDIR header
  out.writeUInt16LE(0, p); p += 2; // Reserved
  out.writeUInt16LE(1, p); p += 2; // Type = 1 (Icon)
  out.writeUInt16LE(count, p); p += 2; // Image count

  // ICONDIRENTRY array
  for (const entry of entries) {
    out.writeUInt8(entry.bWidth, p++);
    out.writeUInt8(entry.bHeight, p++);
    out.writeUInt8(entry.bColorCount, p++);
    out.writeUInt8(entry.bReserved, p++);
    out.writeUInt16LE(entry.wPlanes, p); p += 2;
    out.writeUInt16LE(entry.wBitCount, p); p += 2;
    out.writeUInt32LE(entry.dwBytesInRes, p); p += 4;
    out.writeUInt32LE(entry.dwImageOffset, p); p += 4;
  }

  // Write image frame payloads
  for (const entry of entries) {
    entry.buffer.copy(out, entry.dwImageOffset);
  }

  return out;
}
