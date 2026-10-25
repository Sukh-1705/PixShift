import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, FolderUp, Layers } from 'lucide-react';
import { ImageFileItem } from '../types';

interface DropzoneProps {
  onFilesAdded: (files: File[]) => void;
  onAddSample: () => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesAdded, onAddSample }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        const files: File[] = [];
        for (let i = 0; i < e.clipboardData.files.length; i++) {
          const file = e.clipboardData.files[i];
          if (file.type.startsWith('image/')) {
            files.push(file);
          }
        }
        if (files.length > 0) {
          onFilesAdded(files);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onFilesAdded]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files: File[] = Array.from(e.dataTransfer.files);
      onFilesAdded(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdded(Array.from(e.target.files));
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`dropzone-container ${isDragOver ? 'is-dragover' : ''}`}
      style={{
        padding: '52px 32px',
        textAlign: 'center',
        cursor: 'pointer',
        margin: '0 auto',
        maxWidth: '900px',
        width: '100%',
      }}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        accept="image/*,.qoi,.ico,.psd,.pdf,.cr2,.nef,.arw,.dng,.heic,.heif,.jxl,.tiff,.tif"
        style={{ display: 'none' }}
      />

      {/* Floating Animated Icon Ring */}
      <div style={{
        width: '84px',
        height: '84px',
        margin: '0 auto 22px',
        borderRadius: '26px',
        background: 'var(--accent-gradient)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isDragOver ? '0 0 45px rgba(99, 102, 241, 0.7)' : '0 10px 30px rgba(99, 102, 241, 0.35)',
        transform: isDragOver ? 'scale(1.1) rotate(5deg)' : 'scale(1)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <UploadCloud size={40} color="#ffffff" />
      </div>

      <h2 style={{
        fontSize: '1.65rem',
        fontWeight: 700,
        marginBottom: '10px',
        letterSpacing: '-0.02em',
      }}>
        Drag and drop images here, or paste from clipboard
      </h2>

      <p style={{
        color: 'var(--text-secondary)',
        fontSize: '0.95rem',
        maxWidth: '560px',
        margin: '0 auto 26px',
        lineHeight: 1.5,
      }}>
        Zero cloud uploads. Multi-core parallel processing. Supports batches of up to thousands of photos with 100% offline privacy.
      </p>

      {/* Action buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
        <button
          className="btn btn-primary"
          onClick={() => fileInputRef.current?.click()}
          style={{ padding: '12px 24px', fontSize: '0.95rem' }}
        >
          <FolderUp size={18} />
          <span>Browse Files or Folder</span>
        </button>

        <button
          className="btn btn-secondary"
          onClick={onAddSample}
          style={{ padding: '12px 22px', fontSize: '0.95rem' }}
          title="Load high-res procedural sample image to test lossless workflow"
        >
          <Sparkles size={18} color="#a855f7" />
          <span>Try Sample Image</span>
        </button>
      </div>

      {/* Format Support Badges */}
      <div style={{
        marginTop: '36px',
        paddingTop: '20px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginRight: '6px' }}>Supported:</span>
        {['PNG', 'JPEG', 'WebP', 'AVIF', 'TIFF', 'BMP', 'GIF', 'ICO', 'QOI', 'SVG', 'PDF', 'HEIC', 'RAW'].map((fmt) => (
          <span
            key={fmt}
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '6px',
              background: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {fmt}
          </span>
        ))}
      </div>
    </div>
  );
};
