import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';
import { convertImage, inspectImage, normalizeFormat, FORMAT_INFO } from '../engine/converter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, '.pixshift_data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const PRESETS_FILE = path.join(DATA_DIR, 'presets.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure data files exist
if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, '[]', 'utf8');
if (!fs.existsSync(PRESETS_FILE)) {
  const defaultPresets = [
    { id: 'best-quality', name: 'Best Quality', format: 'png', quality: 100, lossless: true, metadataMode: 'keep', chromaSubsampling: '4:4:4' },
    { id: 'balanced', name: 'Balanced', format: 'webp', quality: 85, lossless: false, metadataMode: 'strip-geo', chromaSubsampling: '4:2:0' },
    { id: 'smallest-size', name: 'Smallest Size', format: 'avif', quality: 65, lossless: false, metadataMode: 'strip', chromaSubsampling: '4:2:0' },
    { id: 'web-optimized', name: 'Web-Optimized', format: 'webp', quality: 80, lossless: false, metadataMode: 'strip', smartSubsample: true },
  ];
  fs.writeFileSync(PRESETS_FILE, JSON.stringify(defaultPresets, null, 2), 'utf8');
}
if (!fs.existsSync(SETTINGS_FILE)) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify({
    outputMode: 'download', // 'download' | 'folder' | 'source'
    outputFolder: '',
    namingTemplate: '{name}',
    conflictHandling: 'auto-rename', // 'overwrite' | 'skip' | 'auto-rename'
    theme: 'dark',
  }, null, 2), 'utf8');
}

const app = express();
const PORT = process.env.PORT || 4567;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 250 * 1024 * 1024 }, // 250MB per file
});

// Watch folder state
let activeWatcher = null;
let activeWatchDir = null;
let watchTargetFormat = 'png';
let watchOptions = {};

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    platform: os.platform(),
    cpus: os.cpus().length,
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
    },
    supportedFormats: FORMAT_INFO,
  });
});

// --- Convert Image Endpoint ---
app.post('/api/convert', upload.single('file'), async (req, res) => {
  try {
    let inputBuffer;
    let originalName = 'image';

    if (req.file) {
      inputBuffer = req.file.buffer;
      originalName = req.file.originalname;
    } else if (req.body.base64) {
      const b64Data = req.body.base64.replace(/^data:image\/\w+;base64,/, '');
      inputBuffer = Buffer.from(b64Data, 'base64');
      originalName = req.body.name || 'image';
    } else if (req.body.filePath && fs.existsSync(req.body.filePath)) {
      inputBuffer = await fs.promises.readFile(req.body.filePath);
      originalName = path.basename(req.body.filePath);
    } else {
      return res.status(400).json({ error: 'No image provided. Pass a file, base64 string, or filePath.' });
    }

    const options = {
      format: req.body.format || 'png',
      quality: req.body.quality !== undefined ? parseInt(req.body.quality, 10) : 90,
      lossless: req.body.lossless === 'true' || req.body.lossless === true,
      metadataMode: req.body.metadataMode || 'keep',
      backgroundColor: req.body.backgroundColor || '#FFFFFF',
      convertToSrgb: req.body.convertToSrgb === 'true' || req.body.convertToSrgb === true,
      chromaSubsampling: req.body.chromaSubsampling || '4:4:4',
      progressive: req.body.progressive !== undefined ? (req.body.progressive === 'true' || req.body.progressive === true) : true,
      maxFileSizeKb: req.body.maxFileSizeKb ? parseInt(req.body.maxFileSizeKb, 10) : undefined,
    };

    if (req.body.resize) {
      options.resize = typeof req.body.resize === 'string' ? JSON.parse(req.body.resize) : req.body.resize;
    }
    if (req.body.rotate) options.rotate = parseInt(req.body.rotate, 10);
    if (req.body.flip) options.flip = req.body.flip === 'true' || req.body.flip === true;
    if (req.body.flop) options.flop = req.body.flop === 'true' || req.body.flop === true;

    const sourceMeta = await inspectImage(inputBuffer, path.extname(originalName));
    const result = await convertImage(inputBuffer, options);

    // Build output filename based on naming template
    const parsedBase = path.basename(originalName, path.extname(originalName));
    const template = req.body.namingTemplate || '{name}';
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    let outFileName = template
      .replace('{name}', parsedBase)
      .replace('{format}', result.format)
      .replace('{date}', dateStr);
    outFileName += `.${result.format}`;

    // Optionally save directly to folder if requested
    let savedPath = null;
    if (req.body.saveToFolder && fs.existsSync(req.body.saveToFolder)) {
      savedPath = path.join(req.body.saveToFolder, outFileName);
      await fs.promises.writeFile(savedPath, result.buffer);
    }

    // Save entry to history
    try {
      const historyRaw = await fs.promises.readFile(HISTORY_FILE, 'utf8');
      const history = JSON.parse(historyRaw);
      history.unshift({
        id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        originalName,
        outputName: outFileName,
        sourceFormat: sourceMeta.format,
        targetFormat: result.format,
        originalSize: inputBuffer.length,
        convertedSize: result.buffer.length,
        bytesSaved: result.info.bytesSaved,
        percentSaved: result.info.percentSaved,
        timeTakenMs: result.timeTakenMs,
        badge: result.verification.badge,
        verificationText: result.verification.verificationText,
        savedPath,
      });
      // Keep last 100 entries
      await fs.promises.writeFile(HISTORY_FILE, JSON.stringify(history.slice(0, 100), null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to append to history:', e.message);
    }

    // Return response with base64 data for live preview / browser download
    const mimeMap = {
      png: 'image/png',
      webp: 'image/webp',
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      avif: 'image/avif',
      heic: 'image/heic',
      heif: 'image/heif',
      tiff: 'image/tiff',
      bmp: 'image/bmp',
      gif: 'image/gif',
      ico: 'image/x-icon',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
      qoi: 'application/octet-stream',
    };
    const mime = mimeMap[result.format] || 'application/octet-stream';

    res.json({
      success: true,
      fileName: outFileName,
      format: result.format,
      mime,
      base64: `data:${mime};base64,${result.buffer.toString('base64')}`,
      sourceMeta,
      outputMeta: result.info,
      verification: result.verification,
      timeTakenMs: result.timeTakenMs,
      savedPath,
    });
  } catch (err) {
    console.error('Conversion failed:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Conversion failed',
      fixSuggestion: 'Check if the image is corrupt or try converting to PNG/WebP first.',
    });
  }
});

// --- Reveal File in OS Explorer / Finder ---
app.post('/api/reveal', (req, res) => {
  const { filePath } = req.body;
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File path does not exist' });
  }

  const platform = os.platform();
  let cmd = '';

  if (platform === 'win32') {
    cmd = `explorer.exe /select,"${path.resolve(filePath)}"`;
  } else if (platform === 'darwin') {
    cmd = `open -R "${path.resolve(filePath)}"`;
  } else {
    cmd = `xdg-open "${path.dirname(path.resolve(filePath))}"`;
  }

  exec(cmd, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- Watch Folder Management ---
app.get('/api/watch/status', (req, res) => {
  res.json({
    active: activeWatcher !== null,
    watchDir: activeWatchDir,
    targetFormat: watchTargetFormat,
  });
});

app.post('/api/watch/start', (req, res) => {
  const { folderPath, targetFormat, options = {} } = req.body;

  if (!folderPath || !fs.existsSync(folderPath)) {
    return res.status(400).json({ error: 'Folder does not exist' });
  }

  if (activeWatcher) {
    activeWatcher.close();
  }

  activeWatchDir = folderPath;
  watchTargetFormat = normalizeFormat(targetFormat || 'png');
  watchOptions = options;

  activeWatcher = chokidar.watch(folderPath, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 800, pollInterval: 150 },
  });

  activeWatcher.on('add', async (filePath) => {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff', '.bmp', '.gif', '.ico', '.qoi', '.svg'];
      if (!validExts.includes(ext)) return;

      const buffer = await fs.promises.readFile(filePath);
      const res = await convertImage(buffer, {
        format: watchTargetFormat,
        ...watchOptions,
      });

      const parsed = path.parse(filePath);
      const outPath = path.join(parsed.dir, `${parsed.name}_converted.${watchTargetFormat}`);
      await fs.promises.writeFile(outPath, res.buffer);
      console.log(`[Watch] Auto-converted: ${filePath} -> ${outPath}`);
    } catch (err) {
      console.error('[Watch] Conversion error:', err.message);
    }
  });

  res.json({ success: true, watchDir: activeWatchDir, targetFormat: watchTargetFormat });
});

app.post('/api/watch/stop', (req, res) => {
  if (activeWatcher) {
    activeWatcher.close();
    activeWatcher = null;
    activeWatchDir = null;
  }
  res.json({ success: true, active: false });
});

// --- History API ---
app.get('/api/history', async (req, res) => {
  try {
    const raw = await fs.promises.readFile(HISTORY_FILE, 'utf8');
    res.json(JSON.parse(raw));
  } catch (err) {
    res.json([]);
  }
});

app.delete('/api/history', async (req, res) => {
  try {
    await fs.promises.writeFile(HISTORY_FILE, '[]', 'utf8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Presets API ---
app.get('/api/presets', async (req, res) => {
  try {
    const raw = await fs.promises.readFile(PRESETS_FILE, 'utf8');
    res.json(JSON.parse(raw));
  } catch (err) {
    res.json([]);
  }
});

app.post('/api/presets', async (req, res) => {
  try {
    const { presets } = req.body;
    await fs.promises.writeFile(PRESETS_FILE, JSON.stringify(presets, null, 2), 'utf8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Settings API ---
app.get('/api/settings', async (req, res) => {
  try {
    const raw = await fs.promises.readFile(SETTINGS_FILE, 'utf8');
    res.json(JSON.parse(raw));
  } catch (err) {
    res.json({});
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const settings = req.body;
    await fs.promises.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Undo / Delete Converted Files ---
app.post('/api/undo', async (req, res) => {
  const { filePaths } = req.body;
  if (!Array.isArray(filePaths)) {
    return res.status(400).json({ error: 'filePaths must be an array' });
  }

  const deleted = [];
  for (const fp of filePaths) {
    try {
      if (fs.existsSync(fp)) {
        await fs.promises.unlink(fp);
        deleted.push(fp);
      }
    } catch (e) {
      console.error(`Failed to delete ${fp}:`, e.message);
    }
  }

  res.json({ success: true, deletedCount: deleted.length });
});

// Start Server
app.listen(PORT, () => {
  console.log(`⚡ Pixshift Engine Server active on http://localhost:${PORT}`);
});
