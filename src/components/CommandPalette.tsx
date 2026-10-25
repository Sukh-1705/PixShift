import React, { useState, useEffect } from 'react';
import { 
  Search, 
  FileCode, 
  Globe, 
  Camera, 
  Sparkles, 
  Archive, 
  Zap, 
  FolderSync, 
  History, 
  Sun, 
  Moon, 
  Trash2,
  X,
  Smartphone
} from 'lucide-react';
import { ImageFormat } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFormat: (format: ImageFormat) => void;
  onToggleTheme: () => void;
  onOpenWatchModal: () => void;
  onOpenHistoryModal: () => void;
  onClearQueue: () => void;
  onConvertAll: () => void;
  onAddSample: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectFormat,
  onToggleTheme,
  onOpenWatchModal,
  onOpenHistoryModal,
  onClearQueue,
  onConvertAll,
  onAddSample,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          setQuery('');
          // open command palette
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { id: 'sample', label: 'Load High-Res Sample Image', icon: <Sparkles size={16} color="#a855f7" />, run: onAddSample },
    { id: 'convert', label: 'Convert All Images in Queue', icon: <Zap size={16} color="#34d399" />, run: onConvertAll },
    { id: 'png', label: 'Set Format: PNG (Lossless)', icon: <FileCode size={16} color="#34d399" />, run: () => onSelectFormat('png') },
    { id: 'webp', label: 'Set Format: WebP (Lossless/Web)', icon: <Globe size={16} color="#60a5fa" />, run: () => onSelectFormat('webp') },
    { id: 'jpeg', label: 'Set Format: JPEG (MozJPEG)', icon: <Camera size={16} color="#f59e0b" />, run: () => onSelectFormat('jpeg') },
    { id: 'avif', label: 'Set Format: AVIF (Next-Gen)', icon: <Sparkles size={16} color="#c084fc" />, run: () => onSelectFormat('avif') },
    { id: 'heic', label: 'Set Format: HEIC (Apple High Efficiency)', icon: <Smartphone size={16} color="#ec4899" />, run: () => onSelectFormat('heic') },
    { id: 'tiff', label: 'Set Format: TIFF (Archival)', icon: <Archive size={16} color="#38bdf8" />, run: () => onSelectFormat('tiff') },
    { id: 'qoi', label: 'Set Format: QOI (Fast Lossless)', icon: <Zap size={16} color="#22c55e" />, run: () => onSelectFormat('qoi') },
    { id: 'watch', label: 'Open Watch-Folder Settings', icon: <FolderSync size={16} color="#818cf8" />, run: onOpenWatchModal },
    { id: 'history', label: 'View Conversion History', icon: <History size={16} color="#94a3b8" />, run: onOpenHistoryModal },
    { id: 'theme', label: 'Toggle Light / Dark Theme', icon: <Sun size={16} color="#fbbf24" />, run: onToggleTheme },
    { id: 'clear', label: 'Clear Conversion Queue', icon: <Trash2 size={16} color="#ef4444" />, run: onClearQueue },
  ];

  const filtered = actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', padding: 0 }}>
        {/* Search Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <Search size={18} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Type a command or search formats (e.g. 'webp', 'sample', 'theme')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
            }}
            autoFocus
          />
          <kbd style={{
            fontSize: '0.7rem',
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-tertiary)',
          }}>
            ESC
          </kbd>
        </div>

        {/* Command list */}
        <div style={{ padding: '10px', maxHeight: '340px', overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
              No matching commands found.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  item.run();
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'var(--bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>
                  {item.label}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
