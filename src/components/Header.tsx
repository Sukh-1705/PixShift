import React from 'react';
import { Sparkles, ShieldCheck, Cpu, FolderSync, History, Sun, Moon, Keyboard, Search } from 'lucide-react';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  cpuCount: number;
  isWatchActive: boolean;
  onOpenWatchModal: () => void;
  onOpenHistoryModal: () => void;
  onOpenShortcutsModal: () => void;
  onOpenCommandPalette: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  cpuCount,
  isWatchActive,
  onOpenWatchModal,
  onOpenHistoryModal,
  onOpenShortcutsModal,
  onOpenCommandPalette,
}) => {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 28px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Brand & Tagline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '11px',
          background: 'var(--accent-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(99, 102, 241, 0.45)',
        }}>
          <Sparkles size={20} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.3rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #ffffff 30%, var(--text-secondary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: theme === 'dark' ? 'transparent' : 'var(--text-primary)',
            }}>
              Pixshift
            </span>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '6px',
              background: 'var(--border-subtle)',
              color: 'var(--text-tertiary)',
              border: '1px solid var(--border-subtle)',
            }}>
              v1.0
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            Studio Grade High-Fidelity Image Suite
          </div>
        </div>

        {/* Status badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.72rem',
            padding: '3px 8px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.25)',
          }}>
            <ShieldCheck size={12} />
            <span>100% Offline</span>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.72rem',
            padding: '3px 8px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}>
            <Cpu size={12} />
            <span>{cpuCount || 8} Cores Active</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Command Palette trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="btn btn-secondary"
          style={{
            padding: '6px 12px',
            fontSize: '0.8rem',
            gap: '8px',
            color: 'var(--text-secondary)',
          }}
          title="Command Palette (Ctrl/Cmd+K)"
        >
          <Search size={14} />
          <span>Search</span>
          <kbd style={{
            background: 'var(--bg-primary)',
            padding: '2px 5px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)',
          }}>
            ⌘K
          </kbd>
        </button>

        {/* Watch Folder Toggle */}
        <button
          onClick={onOpenWatchModal}
          className={`btn ${isWatchActive ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '7px 12px', fontSize: '0.8rem' }}
          title="Watch-Folder Auto-Converter"
        >
          <FolderSync size={14} className={isWatchActive ? 'spin' : ''} />
          <span>{isWatchActive ? 'Watching' : 'Watch Folder'}</span>
        </button>

        {/* History */}
        <button
          onClick={onOpenHistoryModal}
          className="btn btn-secondary btn-icon"
          title="Conversion History"
        >
          <History size={16} />
        </button>

        {/* Keyboard Shortcuts */}
        <button
          onClick={onOpenShortcutsModal}
          className="btn btn-secondary btn-icon"
          title="Keyboard Shortcuts (?)"
        >
          <Keyboard size={16} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="btn btn-secondary btn-icon"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
};
