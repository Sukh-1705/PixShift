# Pixshift

High-fidelity, local-first image conversion suite with cryptographic pixel verification, multi-threaded batch processing, and a native desktop interface.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node: >=18.0.0](https://img.shields.io/badge/Node-%3E%3D18.0.0-emerald.svg)](https://nodejs.org/)
[![Status: Production](https://img.shields.io/badge/Status-Production%20Ready-indigo.svg)](https://github.com/Sukh-1705/PixShift)
[![Offline: 100%](https://img.shields.io/badge/Telemetry-Zero%20Egress-purple.svg)](https://github.com/Sukh-1705/PixShift)

---

## Overview

Pixshift is designed for engineers, photographers, and creators who need absolute control over image encoding without sacrificing speed or privacy. It operates entirely on-device, streaming and memory-mapping large files to maintain low RAM overhead while utilizing all available CPU cores.

Whenever the destination format allows, conversions run through a true lossless pipeline without color resampling or spatial quantization. When targeting lossy formats, Pixshift utilizes dedicated encoders (MozJPEG, libwebp, libavif) with granular quality controls, paired with an interactive split comparison viewer and honest fidelity badges.

---

## Core Capabilities

- **Strict Offline Operation**: Zero network egress, telemetry, or external dependencies. All processing occurs locally on the client system.
- **Cryptographic Pixel Verification**: For lossless formats, raw 32-bit RGBA buffers are extracted before and after encoding. SHA-256 hashes are computed to guarantee byte-for-byte pixel identity.
- **Interactive Before / After Split Viewer**: Direct comparison slider with 1x, 2x, and 4x magnification, side-by-side technical metadata, PSNR calculations, and maximum channel delta tracking.
- **Multi-Core Worker Pool**: Scales linearly across all available CPU cores with real-time per-file status, global progress tracking, and batch controls (pause, resume, retry, cancel).
- **HEIC and HEIF Ecosystem**: Comprehensive bidirectional support for Apple iPhone and mobile HEIC files, decoding directly into lossless RGBA and encoding to high-efficiency containers.
- **Dedicated Lossy Encoders**: MozJPEG with optional 4:4:4 full chroma subsampling, progressive scans, and target file size constraints (binary search quality matching).
- **Automation and CLI**: Background watch-folder daemon (`chokidar`) and standalone terminal executable (`bin/pixshift.js`) sharing the exact same conversion pipeline.
- **Keyboard-First Design**: Built-in command palette (`Ctrl/Cmd+K`) and dedicated shortcuts for rapid operation.

---

## Format Matrix

| Format | Extension | Lossless Support | Alpha Transparency | Animation | Color Depth | Primary Use Case |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **PNG** | `.png` | Yes (Deflate) | Yes (RGBA) | Yes (APNG) | 8 / 16-bit | Screenshots, graphic assets, transparency |
| **WebP** | `.webp` | Yes & Lossy | Yes (RGBA) | Yes | 8-bit | High-efficiency modern web delivery |
| **JPEG** | `.jpg`, `.jpeg` | No (MozJPEG) | Matte fill | No | 8-bit | Photographic imagery, legacy compatibility |
| **AVIF** | `.avif` | Yes (AV1) & Lossy | Yes (RGBA) | Yes | 8 / 10 / 12-bit | Next-generation HDR and high compression |
| **HEIC** | `.heic`, `.heif` | Near-Lossless & Lossy | Yes (RGBA) | No | 8 / 10-bit | Apple iPhone photos and mobile media |
| **TIFF** | `.tif`, `.tiff` | Yes (Deflate / LZW) | Yes (RGBA) | No | 8 / 16-bit | Print publishing, archival, scientific |
| **BMP** | `.bmp` | Yes (Uncompressed) | Yes (RGBA) | No | 8-bit | Windows legacy systems, uncompressed raw |
| **GIF** | `.gif` | Yes (Palette) | Yes (1-bit) | Yes | 8-bit | Animated clips, retro graphics |
| **ICO** | `.ico` | Yes (Multi-layer PNG) | Yes (RGBA) | No | 8-bit | Windows applications and website favicons |
| **QOI** | `.qoi` | Yes (Native QOI) | Yes (RGBA) | No | 8-bit | Fast lossless runtime texture streaming |
| **PDF** | `.pdf` | Yes (Raster stream) | Matte fill | No | 8-bit | Single-page document presentation |
| **SVG** | `.svg` | Yes (Raster wrapper) | Yes (RGBA) | No | 8-bit | Vector encapsulation for design systems |
| **Camera RAW** | `.dng, .cr2, .nef` | Read-only | Yes (RGBA) | No | 12 / 14 / 16-bit | Professional camera sensor captures |

---

## Architecture

```text
[ Browser / Desktop UI ]
  |-- React 19 + TypeScript + Vite
  |-- Custom CSS Design System (Dark / Light themes)
  |-- Interactive Split Canvas Viewer
  `-- Command Palette (Ctrl+K)
        |
        v [HTTP / Local REST API]
[ Local Server & Watch Daemon ]
  |-- Express REST Bridge (Port 4567)
  |-- Chokidar Directory Monitor
  `-- Multi-Core Task Scheduler
        |
        +-------------------------+-------------------------+
        |                                                   |
        v                                                   v
[ libvips / Sharp Pipeline ]                       [ Specialized Codecs ]
  |-- MozJPEG (4:4:4 / Progressive)                 |-- heic-decode (WASM libheif)
  |-- libwebp (Lossless / Lossy)                    |-- Pure JS QOI Engine
  |-- libavif (AV1 Codec)                           |-- Multi-Layer ICO Generator
  `-- Metadata / ICC / DPI Manager                  `-- PDF Raster Encapsulator
        |
        v
[ Cryptographic Fidelity Verifier ]
  `-- Raw RGBA Extraction -> SHA-256 Hash Comparison -> PSNR Evaluation
```

---

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Sukh-1705/PixShift.git
   cd PixShift
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the automated test suite:
   ```bash
   npm test
   ```

4. Launch the application:
   ```bash
   npm start
   ```

The frontend client will be available at `http://localhost:5173` and the backend engine at `http://localhost:4567`.

---

## Command Line Interface

Pixshift includes a standalone CLI that executes using the exact same underlying engine:

```bash
# Convert an iPhone HEIC photo to lossless PNG with verification
node bin/pixshift.js photo.heic -o png --lossless

# Batch convert a directory to WebP at 85% quality
node bin/pixshift.js ./photos/*.jpg -o webp -q 85 --out-dir ./dist

# Convert to ultra-fast lossless QOI
node bin/pixshift.js texture.png -o qoi

# Encode MozJPEG with 4:4:4 full chroma subsampling
node bin/pixshift.js artwork.png -o jpeg -q 90

# Constrain longest edge to 1920px using Lanczos3 interpolation
node bin/pixshift.js banner.png -o avif -r 1920

# Run a background watch-folder daemon
node bin/pixshift.js -w "C:/Users/Pictures/Dropzone" -o png --lossless
```

### CLI Flags

| Flag | Parameter | Description |
| :--- | :--- | :--- |
| `-o, --output-format` | `<format>` | Target format (png, webp, jpeg, avif, heic, tiff, bmp, gif, ico, qoi, pdf, svg) |
| `-d, --out-dir` | `<directory>` | Destination folder (defaults to same folder as source) |
| `-l, --lossless` | Flag | Enforces true lossless encoding where supported |
| `-q, --quality` | `<1-100>` | Quality setting for lossy codecs (default: 90) |
| `-m, --metadata` | `<mode>` | Metadata retention: `keep`, `strip`, or `strip-geo` |
| `-r, --resize` | `<spec>` | Resize specification: percentage (`50%`), dimensions (`1920x1080`), or edge (`1920`) |
| `--bg` | `<hex>` | Background color when flattening alpha channels (default: `#FFFFFF`) |
| `-w, --watch` | `<directory>` | Starts watch-folder automation on specified folder |
| `--verify` | Flag | Computes pixel buffer SHA-256 hashes and displays verification badge |

---

## Advanced Options

### Metadata Governance

- **Keep all metadata**: Retains EXIF, XMP, IPTC, ICC color profiles, DPI, and orientation tags.
- **Strip metadata (privacy)**: Completely purges all metadata headers to reduce file size and protect privacy.
- **Strip location only**: Removes GPS latitude/longitude coordinates while preserving camera settings and color management.

### Color Space Management

Pixshift preserves wide-gamut Display P3 and Adobe RGB color spaces by embedding their respective ICC profiles into output containers. Users may also toggle `Convert to sRGB` to standardize output assets for legacy web browsers.

### Target File Size Constraint

When enabled, the engine performs an iterative binary search across encoder quality parameters to produce the smallest possible file that fits strictly beneath a user-specified ceiling (e.g. `< 500 KB`).

---

## Test Suite

The automated test suite in `tests/engine.test.js` runs across all core format paths:

- Byte-for-byte lossless roundtrips (`PNG -> TIFF -> PNG` and `PNG -> QOI -> PNG`)
- WebP lossless pixel identity
- MozJPEG perceptual quality and alpha flattening
- Multi-size Windows ICO layer validation
- PDF document encapsulation
- Target file size constraint satisfaction
- HEIC / HEIF container encoding and inspection
- Graceful error recovery on corrupted buffers
- 12-Megapixel performance benchmarking

Execute tests using:
```bash
npm test
```

---

## Deployment

### Docker Deployment

A containerized build can be deployed to any cloud provider (e.g. Render, Railway, AWS ECS):

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build
EXPOSE 4567 5173
CMD ["npm", "start"]
```

### Static Web Client (Vercel / Netlify)

The client application compiles into static HTML, CSS, and JavaScript within the `dist/` folder:

```bash
npm run build
```

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
