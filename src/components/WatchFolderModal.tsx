import React, { useState, useEffect } from 'react';
import { FolderSync, X, Play, Square, CheckCircle2, AlertCircle, Folder } from 'lucide-react';
import { ImageFormat } from '../types';

interface WatchFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  isWatchActive: boolean;
  onWatchStateChange: (active: boolean) => void;
  defaultFormat: ImageFormat;
}

export const WatchFolderModal: React.FC<WatchFolderModalProps> = ({
  isOpen,
  onClose,
  isWatchActive,
  onWatchStateChange,
  defaultFormat,
}) => {
  const [folderPath, setFolderPath] = useState('');
  const [targetFormat, setTargetFormat] = useState<ImageFormat>(defaultFormat);
  const [activeDir, setActiveDir] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/watch/status');
      if (res.ok) {
        const data = await res.json();
        onWatchStateChange(data.active);
        setActiveDir(data.watchDir);
        if (data.watchDir && !folderPath) setFolderPath(data.watchDir);
        if (data.targetFormat) setTargetFormat(data.targetFormat);
      }
    } catch (e) {
      console.error('Failed to get watch status:', e);
    }
  };

  const startWatch = async () => {
    if (!folderPath.trim()) {
      setStatusMessage('Please enter a valid directory path.');
      return;
    }

    try {
      const res = await fetch('/api/watch/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: folderPath.trim(), targetFormat }),
      });
      const data = await res.json();
      if (data.success) {
        onWatchStateChange(true);
        setActiveDir(data.watchDir);
        setStatusMessage(`Active! Monitoring: ${data.watchDir}`);
      } else {
        setStatusMessage(data.error || 'Failed to start watch folder.');
      }
    } catch (e: any) {
      setStatusMessage(e.message || 'Error communicating with server.');
    }
  };

  const stopWatch = async () => {
    try {
      await fetch('/api/watch/stop', { method: 'POST' });
      onWatchStateChange(false);
      setActiveDir(null);
      setStatusMessage('Watch-folder monitoring stopped.');
    } catch (e: any) {
      console.error('Failed to stop watch:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FolderSync size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Watch-Folder Mode</h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Automatically convert any image dropped into a monitored folder. The converted output is saved in the same directory instantly.
          </p>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              MONITORED FOLDER PATH
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="e.g. C:\Users\Username\Pictures\AutoConvert"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                disabled={isWatchActive}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-mono)',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              TARGET AUTO-CONVERT FORMAT
            </label>
            <select
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value as ImageFormat)}
              disabled={isWatchActive}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
              }}
            >
              <option value="png">PNG (Lossless, Universal)</option>
              <option value="webp">WebP (Modern, High Compression)</option>
              <option value="jpeg">JPEG (MozJPEG Universal)</option>
              <option value="avif">AVIF (Next-Gen AV1)</option>
              <option value="tiff">TIFF (Print & Archival)</option>
              <option value="qoi">QOI (Ultra-Fast Lossless)</option>
              <option value="ico">ICO (Windows & Favicon)</option>
              <option value="pdf">PDF (Document Raster)</option>
            </select>
          </div>

          {statusMessage && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: isWatchActive ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-tertiary)',
              border: `1px solid ${isWatchActive ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
              fontSize: '0.82rem',
              color: isWatchActive ? '#34d399' : 'var(--text-secondary)',
            }}>
              {statusMessage}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            {isWatchActive ? (
              <button onClick={stopWatch} className="btn btn-secondary" style={{ color: '#ef4444' }}>
                <Square size={15} />
                <span>Stop Monitoring</span>
              </button>
            ) : (
              <button onClick={startWatch} className="btn btn-primary">
                <Play size={15} />
                <span>Start Monitoring</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
