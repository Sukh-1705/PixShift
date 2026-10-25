import React, { useState } from 'react';
import { 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  Shield, 
  Palette, 
  Maximize2, 
  RotateCw, 
  FileSignature, 
  Bookmark, 
  Sparkles,
  Layers,
  Crop
} from 'lucide-react';
import { ConversionOptions, QualityPreset, ImageFormat } from '../types';

interface AdvancedPanelProps {
  options: ConversionOptions;
  onChangeOptions: (updated: Partial<ConversionOptions>) => void;
  presets: QualityPreset[];
  onApplyPreset: (preset: QualityPreset) => void;
  onSavePreset: (presetName: string) => void;
}

export const AdvancedPanel: React.FC<AdvancedPanelProps> = ({
  options,
  onChangeOptions,
  presets,
  onApplyPreset,
  onSavePreset,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  const formatSupportsLosslessToggle = ['webp', 'avif'].includes(options.format);
  const formatHasAlpha = !['jpeg', 'jpg'].includes(options.format);

  const handleSavePresetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPresetName.trim()) {
      onSavePreset(newPresetName.trim());
      setNewPresetName('');
      setShowSavePreset(false);
    }
  };

  return (
    <div className="glass-panel" style={{ marginTop: '20px', overflow: 'hidden' }}>
      {/* Header bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          cursor: 'pointer',
          background: isOpen ? 'var(--bg-tertiary)' : 'transparent',
          borderBottom: isOpen ? '1px solid var(--border-subtle)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sliders size={18} color="var(--accent-primary)" />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
            Advanced Encoding & Transformations
          </span>
          <span style={{
            fontSize: '0.72rem',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}>
            {options.lossless ? 'Lossless Mode' : `Quality ${options.quality}%`}
            {options.resize?.mode !== 'none' ? ' • Resize Active' : ''}
          </span>
        </div>

        <button className="btn btn-ghost btn-icon">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Collapsible Content */}
      {isOpen && (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: Presets Bar */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                QUALITY PRESETS
              </span>
              <button
                className="btn btn-ghost"
                onClick={() => setShowSavePreset(!showSavePreset)}
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              >
                <Bookmark size={13} />
                <span>Save Current as Preset</span>
              </button>
            </div>

            {showSavePreset && (
              <form onSubmit={handleSavePresetSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="Preset name (e.g. My Ultra Sharp WebP)"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                  autoFocus
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                  Save
                </button>
              </form>
            )}

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onApplyPreset(preset)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                >
                  <Sparkles size={12} color="var(--accent-primary)" />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}>
            {/* Column A: Quality, Subsampling, & Lossless */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                ENCODER FIDELITY
              </div>

              {/* Lossless toggle */}
              {formatSupportsLosslessToggle && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>True Lossless Mode</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      Zero compression artifacts, pixel identical
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.lossless}
                    onChange={(e) => onChangeOptions({ lossless: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                  />
                </div>
              )}

              {/* Quality Slider (active if not lossless) */}
              {!options.lossless && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      Quality Level: <strong style={{ color: 'var(--accent-primary)' }}>{options.quality}%</strong>
                    </label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      {options.quality >= 90 ? 'Near-Lossless' : options.quality >= 75 ? 'Balanced' : 'High Compression'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={options.quality}
                    onChange={(e) => onChangeOptions({ quality: parseInt(e.target.value, 10) })}
                    style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                  />
                </div>
              )}

              {/* Chroma Subsampling */}
              {['jpeg', 'jpg', 'webp', 'avif'].includes(options.format) && (
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                    Chroma Subsampling
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => onChangeOptions({ chromaSubsampling: '4:4:4' })}
                      className={`btn ${options.chromaSubsampling === '4:4:4' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, padding: '6px', fontSize: '0.78rem' }}
                    >
                      4:4:4 (Crisp Text/Graphics)
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeOptions({ chromaSubsampling: '4:2:0' })}
                      className={`btn ${options.chromaSubsampling === '4:2:0' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, padding: '6px', fontSize: '0.78rem' }}
                    >
                      4:2:0 (Smaller Size)
                    </button>
                  </div>
                </div>
              )}

              {/* Max File Size Target */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                  Target File Size Ceiling (optional)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={options.maxFileSizeKb || ''}
                    onChange={(e) => onChangeOptions({ maxFileSizeKb: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                    }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>KB</span>
                </div>
              </div>
            </div>

            {/* Column B: Color, Metadata & Transparency */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                COLOR & METADATA
              </div>

              {/* Metadata Privacy Mode */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                  Metadata Handling (EXIF, IPTC, ICC, DPI)
                </label>
                <select
                  value={options.metadataMode}
                  onChange={(e) => onChangeOptions({ metadataMode: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="keep">Keep all metadata & color profiles</option>
                  <option value="strip">Strip all metadata (Maximum privacy)</option>
                  <option value="strip-geo">Strip location only (Remove GPS)</option>
                </select>
              </div>

              {/* Wide-gamut color management */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Convert to sRGB Color Space</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    Standardize Display P3 / Adobe RGB
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={options.convertToSrgb}
                  onChange={(e) => onChangeOptions({ convertToSrgb: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
              </div>

              {/* Alpha Matte Background Color */}
              {!formatHasAlpha && (
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                    Alpha Background Color (Matte fill)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="color"
                      value={options.backgroundColor}
                      onChange={(e) => onChangeOptions({ backgroundColor: e.target.value })}
                      style={{
                        width: '40px',
                        height: '36px',
                        padding: 0,
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: 'transparent',
                      }}
                    />
                    <input
                      type="text"
                      value={options.backgroundColor}
                      onChange={(e) => onChangeOptions({ backgroundColor: e.target.value })}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontFamily: 'var(--font-mono)',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Column C: Resize, Rotation & Naming */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                RESIZE & NAMING
              </div>

              {/* Resize Mode */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                  Resize (Lanczos3 filter)
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  {(['none', 'percent', 'pixels', 'longest-edge'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => onChangeOptions({
                        resize: { mode: m, percent: 50, longestEdge: 1920, width: 1920, height: 1080 }
                      })}
                      className={`btn ${options.resize?.mode === m ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, padding: '5px 8px', fontSize: '0.72rem' }}
                    >
                      {m === 'none' ? 'Off' : m === 'percent' ? '%' : m === 'pixels' ? 'W×H' : 'Max Edge'}
                    </button>
                  ))}
                </div>

                {options.resize?.mode === 'percent' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      value={options.resize.percent || 50}
                      onChange={(e) => onChangeOptions({
                        resize: { ...options.resize, percent: parseInt(e.target.value, 10) }
                      })}
                      style={{ flex: 1, accentColor: 'var(--accent-primary)' }}
                    />
                    <span style={{ fontSize: '0.82rem', width: '45px', textAlign: 'right' }}>
                      {options.resize.percent}%
                    </span>
                  </div>
                )}

                {options.resize?.mode === 'longest-edge' && (
                  <input
                    type="number"
                    placeholder="e.g. 1920"
                    value={options.resize.longestEdge || 1920}
                    onChange={(e) => onChangeOptions({
                      resize: { ...options.resize, longestEdge: parseInt(e.target.value, 10) }
                    })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                    }}
                  />
                )}
              </div>

              {/* Rotation & Flip */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                  Rotate & Flip
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[0, 90, 180, 270].map((deg) => (
                    <button
                      key={deg}
                      type="button"
                      onClick={() => onChangeOptions({ rotate: deg })}
                      className={`btn ${(options.rotate || 0) === deg ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, padding: '5px', fontSize: '0.75rem' }}
                    >
                      {deg}°
                    </button>
                  ))}
                </div>
              </div>

              {/* Smart Naming Template */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                  Smart Naming Template
                </label>
                <input
                  type="text"
                  value={options.namingTemplate}
                  onChange={(e) => onChangeOptions({ namingTemplate: e.target.value })}
                  placeholder="{name}_{format}"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)',
                  }}
                />
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  Variables: &#123;name&#125;, &#123;format&#125;, &#123;date&#125;
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
