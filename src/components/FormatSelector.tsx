import React from 'react';
import { ImageFormat } from '../types';
import { 
  FileCode, 
  Globe, 
  Camera, 
  Sparkles, 
  Archive, 
  Monitor, 
  Film, 
  AppWindow, 
  Zap, 
  FileText, 
  Layers,
  Smartphone
} from 'lucide-react';

interface FormatSelectorProps {
  selectedFormat: ImageFormat;
  onSelectFormat: (format: ImageFormat) => void;
  isLosslessMode: boolean;
}

interface FormatMeta {
  id: ImageFormat;
  name: string;
  badge: 'Lossless' | 'Near-lossless' | 'Lossy';
  desc: string;
  icon: React.ReactNode;
  category: 'Popular' | 'Archival' | 'Utility';
}

const FORMATS: FormatMeta[] = [
  {
    id: 'png',
    name: 'PNG',
    badge: 'Lossless',
    desc: 'True lossless raster, full alpha transparency, universal support',
    icon: <FileCode size={22} color="#34d399" />,
    category: 'Popular',
  },
  {
    id: 'webp',
    name: 'WebP',
    badge: 'Lossless',
    desc: 'Next-gen web format. 30% smaller than JPEG with lossless toggle',
    icon: <Globe size={22} color="#60a5fa" />,
    category: 'Popular',
  },
  {
    id: 'jpeg',
    name: 'JPEG',
    badge: 'Lossy',
    desc: 'MozJPEG tuned for high perceptual quality and universal display',
    icon: <Camera size={22} color="#f59e0b" />,
    category: 'Popular',
  },
  {
    id: 'avif',
    name: 'AVIF',
    badge: 'Lossless',
    desc: 'State-of-the-art AV1 codec with incredible compression ratios',
    icon: <Sparkles size={22} color="#c084fc" />,
    category: 'Popular',
  },
  {
    id: 'heic',
    name: 'HEIC',
    badge: 'Near-lossless',
    desc: 'High Efficiency container for Apple iPhone and mobile ecosystems',
    icon: <Smartphone size={22} color="#ec4899" />,
    category: 'Popular',
  },
  {
    id: 'tiff',
    name: 'TIFF',
    badge: 'Lossless',
    desc: 'Deflate-compressed lossless format for professional printing & archival',
    icon: <Archive size={22} color="#38bdf8" />,
    category: 'Archival',
  },
  {
    id: 'bmp',
    name: 'BMP',
    badge: 'Lossless',
    desc: 'Uncompressed raw bitmap for Windows system and legacy compatibility',
    icon: <Monitor size={22} color="#94a3b8" />,
    category: 'Archival',
  },
  {
    id: 'gif',
    name: 'GIF',
    badge: 'Lossless',
    desc: 'Palette-based format preserving animations and transparency',
    icon: <Film size={22} color="#f472b6" />,
    category: 'Utility',
  },
  {
    id: 'ico',
    name: 'ICO',
    badge: 'Lossless',
    desc: 'Multi-resolution Windows application & website favicon package',
    icon: <AppWindow size={22} color="#fbbf24" />,
    category: 'Utility',
  },
  {
    id: 'qoi',
    name: 'QOI',
    badge: 'Lossless',
    desc: 'Quite OK Image: 50x faster lossless compression than PNG',
    icon: <Zap size={22} color="#22c55e" />,
    category: 'Utility',
  },
  {
    id: 'pdf',
    name: 'PDF',
    badge: 'Lossless',
    desc: 'Single-page document encapsulating high-fidelity image raster',
    icon: <FileText size={22} color="#ef4444" />,
    category: 'Utility',
  },
  {
    id: 'svg',
    name: 'SVG',
    badge: 'Lossless',
    desc: 'Scalable vector container with losslessly embedded raster image',
    icon: <Layers size={22} color="#818cf8" />,
    category: 'Utility',
  },
];

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  selectedFormat,
  onSelectFormat,
  isLosslessMode,
}) => {
  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
      }}>
        <h3 style={{
          fontSize: '1.1rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>Choose Target Format</span>
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)',
            fontWeight: 400,
          }}>
            ({FORMATS.length} available)
          </span>
        </h3>
      </div>

      {/* Grid of visual cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '12px',
      }}>
        {FORMATS.map((fmt) => {
          const isSelected = selectedFormat === fmt.id;
          const dynamicBadge = (fmt.id === 'webp' || fmt.id === 'avif')
            ? (isLosslessMode ? 'Lossless' : 'Near-lossless')
            : fmt.badge;

          return (
            <div
              key={fmt.id}
              onClick={() => onSelectFormat(fmt.id)}
              className={`format-card ${isSelected ? 'is-selected' : ''}`}
              style={{
                minHeight: '130px',
                position: 'relative',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'var(--bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-subtle)',
                }}>
                  {fmt.icon}
                </div>

                <span className={`badge ${
                  dynamicBadge === 'Lossless'
                    ? 'badge-lossless'
                    : dynamicBadge === 'Near-lossless'
                    ? 'badge-near-lossless'
                    : 'badge-lossy'
                }`}>
                  {dynamicBadge}
                </span>
              </div>

              <div>
                <div style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-display)',
                  marginBottom: '4px',
                  color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                }}>
                  {fmt.name}
                </div>
                <div style={{
                  fontSize: '0.73rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.35,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {fmt.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
