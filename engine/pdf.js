import sharp from 'sharp';

/**
 * Creates a single-page PDF document encapsulating the provided image.
 * 
 * @param {Buffer|sharp.Sharp} input - Source image buffer or Sharp instance
 * @returns {Promise<Buffer>} Valid PDF buffer
 */
export async function encodePDF(input) {
  const sharpInstance = (input && typeof input.clone === 'function') ? input : sharp(input);
  const metadata = await sharpInstance.metadata();

  const width = metadata.width || 800;
  const height = metadata.height || 600;

  // Use JPEG encoding for photo PDF embedding or FlateDecode PNG
  const jpegBuffer = await sharpInstance
    .clone()
    .removeAlpha()
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toBuffer();

  const objects = [];
  const addObj = (content) => {
    objects.push(content);
    return objects.length;
  };

  // Obj 1: Catalog
  addObj('<< /Type /Catalog /Pages 2 0 R >>');
  // Obj 2: Pages
  addObj('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  // Obj 3: Page
  addObj(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Contents 4 0 R /Resources << /XObject << /Im1 5 0 R >> >> >>`);

  // Obj 4: Content stream (scale and draw image)
  const streamContent = `q ${width} 0 0 ${height} 0 0 cm /Im1 Do Q`;
  addObj(`<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream`);

  // Obj 5: Image XObject
  const imgHeader = `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBuffer.length} >>\nstream\n`;
  const imgFooter = '\nendstream';

  const parts = [];
  let offset = 0;
  const xrefOffsets = [0];

  const pushString = (str) => {
    const buf = Buffer.from(str, 'binary');
    parts.push(buf);
    offset += buf.length;
  };

  const pushBuffer = (buf) => {
    parts.push(buf);
    offset += buf.length;
  };

  pushString('%PDF-1.4\n%âãÏÓ\n');

  for (let i = 0; i < objects.length; i++) {
    xrefOffsets.push(offset);
    pushString(`${i + 1} 0 obj\n${objects[i]}\nendobj\n`);
  }

  // Obj 5 with raw binary stream
  xrefOffsets.push(offset);
  pushString(`5 0 obj\n${imgHeader}`);
  pushBuffer(jpegBuffer);
  pushString(`${imgFooter}\nendobj\n`);

  // Xref table
  const startXref = offset;
  const totalObjs = xrefOffsets.length;
  let xrefStr = `xref\n0 ${totalObjs}\n0000000000 65535 f \n`;

  for (let i = 1; i < totalObjs; i++) {
    xrefStr += `${xrefOffsets[i].toString().padStart(10, '0')} 00000 n \n`;
  }

  xrefStr += `trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
  pushString(xrefStr);

  return Buffer.concat(parts);
}
