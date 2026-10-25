import React, { useState, useRef, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Sliders, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Hash, 
  FileCheck, 
  Layers, 
  ArrowRight,
  Download,
  FolderOpen
} from 'lucide-react';
import { ConversionResult, ImageFileItem } from '../types';

interface CompareSliderProps {
  item: ImageFileItem;
  result: ConversionResult;
  onDownload: () => void;
  onReveal?: (path: string) => void;
}

export const CompareSlider: React.FC<CompareSliderProps> = ({
  item,
  result,
  onDownload,
  onReveal,
}) => {
  const [sliderPos, setSliderPos] = useState(50); // 0 to 100 percent
  const [isDragging, setIsDragging] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showHashes, setShowHashes] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = () => {
    setIsDragging(true);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const updateSlider = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updateSlider(e.clientX);
  };

  useEffect(() => {
    const handleGlobalMove = (e: PointerEvent) => {
      if (isDragging) updateSlider(e.clientX);
    };
    const handleGlobalUp = () => setIsDragging(false);

    window.addEventListener('pointermove', handleGlobalMove);
    window.addEventListener('pointerup', handleGlobalUp);
    return () => {
      window.removeEventListener('pointermove', handleGlobalMove);
      window.removeEventListener('pointerup', handleGlobalUp);
    };
  }, [isDragging]);

  const originalSizeKb = (item.size / 1024).toFixed(1);
  const convertedSizeKb = (result.outputMeta.size / 1024).toFixed(1);
  const savedPercent = result.outputMeta.percentSaved;

  return (
    <div className="glass-panel" style={{ padding: '24px', marginTop: '24px' }}>
      {/* Title & Fidelity Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
            Fidelity Inspection & Compare
          </h3>
          <span className={`badge ${
            result.verification.badge === 'Lossless'
              ? 'badge-lossless'
              : result.verification.badge === 'Near-lossless'
              ? 'badge-near-lossless'
              : 'badge-lossy'
          }`} style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
            {result.verification.badge === 'Lossless' && <CheckCircle size={14} />}
            {result.verification.badge === 'Near-lossless' && <AlertCircle size={14} />}
            <span>{result.verification.verificationText}</span>
          </span>
        </div>

        {/* Zoom & Hash controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
            {[1, 2, 4].map((z) => (
              <button
                key={z}
                onClick={() => setZoomLevel(z)}
                className={`btn ${zoomLevel === z ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                {z}x
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowHashes(!showHashes)}
            className={`btn ${showHashes ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '5px' }}
            title="Inspect SHA-256 Pixel Buffers"
          >
            <Hash size={13} />
            <span>Hashes</span>
          </button>

          <button
            onClick={onDownload}
            className="btn btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.82rem', gap: '6px' }}
          >
            <Download size={14} />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* SHA-256 Hashes Display Drawer */}
      {showHashes && (
        <div style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px',
          marginBottom: '16px',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>SOURCE PIXEL SHA-256:</span>
            <span style={{ color: 'var(--text-primary)' }}>{result.verification.sourceHash || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>OUTPUT PIXEL SHA-256:</span>
            <span style={{ color: result.verification.isIdentical ? '#34d399' : 'var(--text-primary)' }}>
              {result.verification.outputHash || 'N/A'}
            </span>
          </div>
        </div>
      )}

      {/* Interactive Split Viewport */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="compare-container"
        style={{
          height: '420px',
          width: '100%',
          cursor: isDragging ? 'ew-resize' : 'default',
          position: 'relative',
        }}
      >
        {/* Left Side: Original Image */}
        <div style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img
            src={item.previewUrl}
            alt="Original"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.2s ease',
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: '#ffffff',
            fontWeight: 600,
            pointerEvents: 'none',
          }}>
            ORIGINAL ({item.name})
          </div>
        </div>

        {/* Right Side: Converted Image with Clip-Path */}
        <div style={{
          position: 'absolute',
          inset: 0,
          clipPath: `polygon(${sliderPos}% 0%, 100% 0%, 100% 100%, ${sliderPos}% 100%)`,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img
            src={result.base64}
            alt="Converted"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.2s ease',
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            background: 'rgba(99, 102, 241, 0.85)',
            backdropFilter: 'blur(8px)',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: '#ffffff',
            fontWeight: 600,
            pointerEvents: 'none',
          }}>
            CONVERTED ({result.format.toUpperCase()})
          </div>
        </div>

        {/* Draggable Divider Handle */}
        <div
          className="compare-handle"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="compare-knob">
            <Sliders size={16} />
          </div>
        </div>
      </div>

      {/* Side-by-side Technical Specs Comparison Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginTop: '18px',
      }}>
        {/* Source Spec */}
        <div style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '14px 18px',
        }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '10px' }}>
            SOURCE FILE PROPERTIES
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.82rem' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Format: </span>
              <strong>{(result.sourceMeta?.format || 'IMAGE').toUpperCase()}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Dimensions: </span>
              <strong>{result.sourceMeta?.width || item.previewUrl ? `${result.sourceMeta?.width || 0}×${result.sourceMeta?.height || 0}` : 'Auto'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>File Size: </span>
              <strong>{originalSizeKb} KB</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Alpha Channel: </span>
              <strong>{result.sourceMeta?.hasAlpha ? 'Present (RGBA)' : 'None (RGB)'}</strong>
            </div>
          </div>
        </div>

        {/* Converted Spec */}
        <div style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '14px 18px',
        }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '10px' }}>
            CONVERTED OUTPUT PROPERTIES
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.82rem' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Format: </span>
              <strong style={{ color: 'var(--accent-primary)' }}>{result.format.toUpperCase()}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Dimensions: </span>
              <strong>{result.outputMeta.width}×{result.outputMeta.height}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>File Size: </span>
              <strong>{convertedSizeKb} KB</strong>{' '}
              <span style={{
                color: savedPercent >= 0 ? '#34d399' : '#f59e0b',
                fontWeight: 600,
                fontSize: '0.78rem',
              }}>
                ({savedPercent >= 0 ? `-${savedPercent}%` : `+${Math.abs(savedPercent)}%`})
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Conversion Speed: </span>
              <strong style={{ color: '#34d399' }}>{result.timeTakenMs} ms</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
