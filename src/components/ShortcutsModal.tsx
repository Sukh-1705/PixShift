import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '⌘ / Ctrl + K', desc: 'Open Command Palette & Quick Search' },
    { key: 'Enter', desc: 'Convert All images in the batch queue' },
    { key: '⌘ / Ctrl + V', desc: 'Paste image directly from clipboard' },
    { key: 'Esc', desc: 'Close dialogs, menus, or cancel conversion' },
    { key: '?', desc: 'Toggle this Keyboard Shortcuts cheat sheet' },
    { key: 'T', desc: 'Toggle between Dark and Light mode' },
    { key: 'H', desc: 'Open Conversion History modal' },
    { key: 'W', desc: 'Open Watch-Folder automation settings' },
    { key: '1 - 6', desc: 'Quick select target format (PNG, WebP, JPEG, AVIF, TIFF, QOI)' },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Keyboard size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Keyboard Shortcuts</h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '6px',
                background: 'var(--bg-tertiary)',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {sc.desc}
              </span>
              <kbd style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)',
                fontWeight: 600,
              }}>
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
