import React, { useState, useEffect } from 'react';
import { History, X, Trash2, RotateCcw, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { HistoryEntry } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReRunItem?: (entry: HistoryEntry) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  onReRunItem,
}) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      await fetch('/api/history', { method: 'DELETE' });
      setHistory([]);
    } catch (e) {
      console.error('Failed to clear history:', e);
    }
  };

  const undoFile = async (entry: HistoryEntry) => {
    if (!entry.savedPath) return;
    try {
      await fetch('/api/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePaths: [entry.savedPath] }),
      });
      loadHistory();
    } catch (e) {
      console.error('Failed to undo file:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Conversion History</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              ({history.length} records)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="btn btn-ghost"
                style={{ fontSize: '0.75rem', color: '#ef4444', padding: '4px 8px' }}
                title="Clear History"
              >
                <Trash2 size={13} />
                <span>Clear All</span>
              </button>
            )}
            <button onClick={onClose} className="btn btn-ghost btn-icon">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '16px 24px', maxHeight: '450px', overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
              No conversions recorded yet. Converted files will appear here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {history.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                        {entry.originalName}
                      </span>
                      <ArrowRight size={12} color="var(--text-tertiary)" />
                      <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.88rem' }}>
                        {entry.outputName}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '0.73rem',
                      color: 'var(--text-tertiary)',
                    }}>
                      <span>{(entry.originalSize / 1024).toFixed(1)} KB → {(entry.convertedSize / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span style={{ color: entry.percentSaved >= 0 ? '#34d399' : '#f59e0b', fontWeight: 600 }}>
                        {entry.percentSaved >= 0 ? `-${entry.percentSaved}%` : `+${Math.abs(entry.percentSaved)}%`}
                      </span>
                      <span>•</span>
                      <span>{entry.timeTakenMs}ms</span>
                      <span>•</span>
                      <span>{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge ${
                      entry.badge === 'Lossless' ? 'badge-lossless' : entry.badge === 'Near-lossless' ? 'badge-near-lossless' : 'badge-lossy'
                    }`} style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                      {entry.badge}
                    </span>

                    {entry.savedPath && (
                      <button
                        onClick={() => undoFile(entry)}
                        className="btn btn-ghost"
                        style={{ fontSize: '0.72rem', color: '#ef4444', padding: '4px 8px' }}
                        title="Delete output file from disk"
                      >
                        Undo
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
