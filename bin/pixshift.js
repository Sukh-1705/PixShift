#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { convertImage, normalizeFormat, FORMAT_INFO } from '../engine/converter.js';
import chokidar from 'chokidar';

const program = new Command();

program
  .name('pixshift')
  .description('Ultra-fast, local-first image conversion suite with lossless verification')
  .version('1.0.0')
  .argument('[files...]', 'Input image file paths or glob patterns')
  .option('-o, --output-format <format>', 'Target format (png, webp, jpeg, avif, tiff, bmp, gif, ico, qoi, pdf, svg)', 'png')
  .option('-d, --out-dir <directory>', 'Output directory (default: same as source)')
  .option('-l, --lossless', 'Enable lossless pipeline mode')
  .option('-q, --quality <number>', 'Quality level (1-100)', (val) => parseInt(val, 10), 90)
  .option('-m, --metadata <mode>', 'Metadata mode: keep, strip, strip-geo', 'keep')
  .option('-r, --resize <spec>', 'Resize specification (e.g., "50%", "1920x1080", "1200")')
  .option('--bg <color>', 'Background color for flattening alpha (e.g., #FFFFFF)', '#FFFFFF')
  .option('-w, --watch <folder>', 'Watch folder mode: automatically convert incoming images')
  .option('--verify', 'Strictly verify pixel identity after conversion', true);

program.parse(process.argv);
const options = program.opts();
const files = program.args;

function parseResize(spec) {
  if (!spec) return undefined;
  if (spec.endsWith('%')) {
    return { percent: parseFloat(spec) };
  }
  if (spec.includes('x')) {
    const [w, h] = spec.split('x').map((s) => parseInt(s, 10));
    return { width: w, height: h };
  }
  const maxDim = parseInt(spec, 10);
  if (!isNaN(maxDim)) {
    return { longestEdge: maxDim };
  }
  return undefined;
}

async function processFile(filePath, targetFormat, opts) {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      return;
    }

    const inputBuffer = await fs.promises.readFile(filePath);
    const fileName = path.basename(filePath, path.extname(filePath));
    const targetDir = opts.outDir ? path.resolve(opts.outDir) : path.dirname(path.resolve(filePath));

    if (!fs.existsSync(targetDir)) {
      await fs.promises.mkdir(targetDir, { recursive: true });
    }

    const normFmt = normalizeFormat(targetFormat);
    const outPath = path.join(targetDir, `${fileName}.${normFmt}`);

    console.log(`\n⏳ Converting [${path.basename(filePath)}] -> ${normFmt.toUpperCase()}...`);

    const result = await convertImage(inputBuffer, {
      format: normFmt,
      lossless: opts.lossless,
      quality: opts.quality,
      metadataMode: opts.metadata,
      resize: parseResize(opts.resize),
      backgroundColor: opts.bg,
    });

    await fs.promises.writeFile(outPath, result.buffer);

    const origKb = (inputBuffer.length / 1024).toFixed(1);
    const outKb = (result.buffer.length / 1024).toFixed(1);
    const deltaPercent = result.info.percentSaved;
    const sign = deltaPercent >= 0 ? `-${deltaPercent}%` : `+${Math.abs(deltaPercent)}%`;

    console.log(`✓ Completed: ${outPath}`);
    console.log(`  Size: ${origKb} KB -> ${outKb} KB (${sign}) | Time: ${result.timeTakenMs}ms`);
    console.log(`  Fidelity: [${result.verification.badge.toUpperCase()}] ${result.verification.verificationText}`);
  } catch (err) {
    console.error(`❌ Error converting ${filePath}:`, err.message);
  }
}

async function run() {
  if (options.watch) {
    const watchDir = path.resolve(options.watch);
    console.log(`\n👀 Pixshift Watch-Folder Active: ${watchDir}`);
    console.log(`Target format: ${options.outputFormat.toUpperCase()} | Lossless: ${!!options.lossless}`);

    const watcher = chokidar.watch(watchDir, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
    });

    watcher.on('add', (filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff', '.bmp', '.gif', '.ico', '.qoi', '.svg'].includes(ext)) {
        processFile(filePath, options.outputFormat, options);
      }
    });

    return;
  }

  if (files.length === 0) {
    console.log('No input files specified. Use --help to see usage instructions.');
    program.help();
    return;
  }

  console.log(`🚀 Pixshift CLI: Processing ${files.length} file(s)...`);
  for (const file of files) {
    await processFile(file, options.outputFormat, options);
  }
  console.log('\n✨ All conversions completed.');
}

run();
