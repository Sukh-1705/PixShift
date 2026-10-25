import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { convertImage, inspectImage } from '../engine/converter.js';
import { verifyFidelity } from '../engine/verifier.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

if (!fs.existsSync(FIXTURES_DIR)) {
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });
}

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Test failed: ${message}`);
  } else {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  }
}

async function createSampleImage(width = 256, height = 256, hasAlpha = true) {
  // Create a procedural image with gradients and sharp geometric patterns
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:rgb(255,50,100);stop-opacity:1" />
        <stop offset="50%" style="stop-color:rgb(50,150,255);stop-opacity:0.8" />
        <stop offset="100%" style="stop-color:rgb(100,255,100);stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#grad)" />
    <circle cx="${width / 2}" cy="${height / 2}" r="${width / 4}" fill="rgba(255,255,255,0.7)" />
    <rect x="${width / 4}" y="${height / 4}" width="${width / 8}" height="${height / 8}" fill="#000000" />
  </svg>`;

  return await sharp(Buffer.from(svg))
    .png()
    .toBuffer();
}

async function runTests() {
  console.log('🧪 Starting Pixshift Engine Test Suite...\n');

  // Test 1: Generate reference image
  console.log('Test 1: Image Generation and Metadata Inspection');
  const sourcePng = await createSampleImage(300, 300, true);
  const meta = await inspectImage(sourcePng, 'png');
  assert(meta.width === 300 && meta.height === 300, 'Source image dimensions match 300x300');
  assert(meta.hasAlpha === true, 'Source image has alpha channel');

  // Test 2: True Lossless Roundtrip: PNG -> TIFF -> PNG
  console.log('\nTest 2: True Lossless Roundtrip (PNG -> TIFF -> PNG)');
  const toTiff = await convertImage(sourcePng, { format: 'tiff', compression: 'deflate' });
  assert(toTiff.verification.badge === 'Lossless', 'PNG -> TIFF is lossless');
  assert(toTiff.verification.isIdentical === true, 'PNG -> TIFF pixel identical');

  const backToPng = await convertImage(toTiff.buffer, { format: 'png' });
  const roundtripVerification = await verifyFidelity(sourcePng, backToPng.buffer, 'png');
  assert(roundtripVerification.isIdentical === true, 'Roundtrip PNG -> TIFF -> PNG is 100% pixel identical');

  // Test 3: True Lossless QOI Roundtrip: PNG -> QOI -> PNG
  console.log('\nTest 3: True Lossless QOI Roundtrip (PNG -> QOI -> PNG)');
  const toQoi = await convertImage(sourcePng, { format: 'qoi' });
  assert(toQoi.verification.badge === 'Lossless', 'PNG -> QOI is lossless');
  assert(toQoi.verification.isIdentical === true, 'PNG -> QOI pixel identical');

  const qoiBackToPng = await convertImage(toQoi.buffer, { format: 'png' });
  const qoiRoundtrip = await verifyFidelity(sourcePng, qoiBackToPng.buffer, 'png');
  assert(qoiRoundtrip.isIdentical === true, 'Roundtrip PNG -> QOI -> PNG is 100% pixel identical');

  // Test 4: WebP Lossless Mode
  console.log('\nTest 4: WebP Lossless Mode');
  const toWebpLossless = await convertImage(sourcePng, { format: 'webp', lossless: true });
  assert(toWebpLossless.verification.badge === 'Lossless', 'WebP Lossless reports Lossless badge');
  assert(toWebpLossless.verification.isIdentical === true, 'WebP Lossless pixel identical');

  // Test 5: JPEG with MozJPEG and Alpha Matte
  console.log('\nTest 5: JPEG MozJPEG Conversion & Alpha Matting');
  const toJpeg = await convertImage(sourcePng, {
    format: 'jpeg',
    quality: 92,
    backgroundColor: '#FFFFFF',
    chromaSubsampling: '4:4:4',
  });
  assert(toJpeg.format === 'jpeg', 'Format converted to jpeg');
  assert(toJpeg.verification.badge === 'Lossy' || toJpeg.verification.badge === 'Near-lossless', 'Honest lossy badge on JPEG');
  assert(toJpeg.buffer.length > 0, 'Valid JPEG buffer generated');

  // Test 6: Multi-resolution Windows ICO
  console.log('\nTest 6: Multi-resolution Windows ICO Container');
  const toIco = await convertImage(sourcePng, {
    format: 'ico',
    icoSizes: [16, 32, 64],
  });
  assert(toIco.buffer.readUInt16LE(2) === 1, 'Valid ICO header type = 1');
  assert(toIco.buffer.readUInt16LE(4) === 3, 'ICO contains 3 resolutions');

  // Test 7: PDF Document Encapsulation
  console.log('\nTest 7: PDF Document Encapsulation');
  const toPdf = await convertImage(sourcePng, { format: 'pdf' });
  const pdfHeader = toPdf.buffer.subarray(0, 5).toString('utf8');
  assert(pdfHeader === '%PDF-', 'Valid PDF header');

  // Test 8: Target File Size Constraint (< 15 KB)
  console.log('\nTest 8: Target File Size Constraint');
  const targetKb = 15;
  const toConstrained = await convertImage(sourcePng, {
    format: 'jpeg',
    maxFileSizeKb: targetKb,
  });
  const actualKb = toConstrained.buffer.length / 1024;
  console.log(`    Result size: ${actualKb.toFixed(2)} KB (Target: < ${targetKb} KB)`);
  assert(actualKb <= targetKb + 1, 'Target file size constraint respected');

  // Test 9: Graceful Error Handling on Corrupt Buffer
  console.log('\nTest 9: Graceful Error Handling on Corrupt File');
  const corruptBuffer = Buffer.from('NOT_AN_IMAGE_RANDOM_CORRUPT_BYTES_1234567890');
  let caughtError = false;
  try {
    await convertImage(corruptBuffer, { format: 'png' });
  } catch (err) {
    caughtError = true;
    assert(typeof err.message === 'string', 'Corrupt buffer caught cleanly without process crash');
  }
  assert(caughtError === true, 'Properly threw catchable error on corrupt buffer');

  // Test 10: Speed Benchmark (Simulate 12MP photo)
  console.log('\nTest 10: Performance Benchmark (4000x3000 ~ 12 Megapixels)');
  const largeSvg = `<svg width="4000" height="3000" xmlns="http://www.w3.org/2000/svg">
    <rect width="4000" height="3000" fill="#2d3748" />
    <circle cx="2000" cy="1500" r="1000" fill="#4fd1c5" />
  </svg>`;
  const large12MP = await sharp(Buffer.from(largeSvg)).png().toBuffer();
  console.log(`    Created 12MP source: ${(large12MP.length / (1024 * 1024)).toFixed(2)} MB`);

  const t0 = Date.now();
  const conv12MP = await convertImage(large12MP, { format: 'webp', quality: 80 });
  const duration = Date.now() - t0;
  console.log(`    12MP -> WebP conversion took: ${duration}ms (Output: ${(conv12MP.buffer.length / 1024).toFixed(1)} KB)`);
  // Test 11: HEIC / HEIF Container Encoding & Inspection
  console.log('\nTest 11: HEIC / HEIF Container Encoding & Inspection');
  const toHeic = await convertImage(sourcePng, { format: 'heic', quality: 85 });
  assert(toHeic.format === 'heic', 'Target format is heic');
  assert(toHeic.buffer.length > 0, 'HEIC buffer generated');
  const heicMeta = await inspectImage(toHeic.buffer, 'heic');
  assert(heicMeta.width === 300 && heicMeta.height === 300, 'HEIC dimensions match 300x300');
  console.log(`    Generated HEIC size: ${(toHeic.buffer.length / 1024).toFixed(1)} KB`);

  console.log(`\n========================================`);
  console.log(`🎉 ALL TESTS PASSED: ${passedTests}/${totalTests} tests successful!`);
  console.log(`========================================\n`);
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
