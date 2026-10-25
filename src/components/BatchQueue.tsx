import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  X, 
  RotateCcw, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Download, 
  Layers, 
  Grid, 
  List,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ImageFileItem } from '../types';

interface BatchQueueProps {
  items: ImageFileItem[];
  isConverting: boolean;
  isPaused: boolean;
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
  onStartConversion: () => void;
  onPauseResume: () => void;
  onCancelConversion: () => void;
  onClearQueue: () => void;
  onRemoveItem: (id: string) => void;
  onRetryItem: (id: string) => void;
  onDownloadItem: (item: ImageFileItem) => void;
  onDownloadAll: () => void;
}

export const BatchQueue: React.FC<BatchQueueProps> = ({
  items,
  isConverting,
  isPaused,
  selectedItemId,
  onSelectItem,
  onStartConversion,
  onPauseResume,
  onCancelConversion,
  onClearQueue,
  onRemoveItem,
  onRetryItem,
  onDownloadItem,
  onDownloadAll,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const completedCount = items.filter((i) => i.status === 'completed').length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const totalOriginalBytes = items.reduce((acc, i) => acc + i.size, 0);
  const totalConvertedBytes = items.reduce((acc, i) => acc + (i.convertedResult?.outputMeta.size || i.size), 0);
  const totalSavedBytes = totalOriginalBytes - totalConvertedBytes;

  return (
    <div className="glass-panel" style={{ padding: '20px 24px', marginTop: '24px' }}>
      {/* Top Header & Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '16px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Batch Queue ({items.length} image{items.length === 1 ? '' : 's'})
            </h3>
            {completedCount > 0 && (
              <span className="badge badge-lossless">
                {completedCount}/{items.length} Done
              </span>
            )}
          </div>
          {totalSavedBytes > 0 && completedCount > 0 && (
            <div style={{ fontSize: '0.8rem', color: '#34d399', marginTop: '3px' }}>
              Saved {(totalSavedBytes / (1024 * 1024)).toFixed(2)} MB total across batch
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* View mode toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
            <button
              onClick={() => setViewMode('list')}
              className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '4px 8px' }}
              title="List View"
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '4px 8px' }}
              title="Grid View"
            >
              <Grid size={14} />
            </button>
          </div>

          {/* Start / Convert All button */}
          {!isConverting && completedCount < items.length && (
            <button
              onClick={onStartConversion}
              className="btn btn-primary"
              style={{ padding: '8px 18px', fontSize: '0.88rem' }}
            >
              <Play size={16} />
              <span>Convert All ({items.length})</span>
            </button>
          )}

          {/* Pause / Resume */}
          {isConverting && (
            <button
              onClick={onPauseResume}
              className="btn btn-secondary"
              style={{ padding: '8px 14px' }}
            >
              {isPaused ? <Play size={15} /> : <Pause size={15} />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
          )}

          {/* Cancel */}
          {isConverting && (
            <button
              onClick={onCancelConversion}
              className="btn btn-secondary"
              style={{ padding: '8px 14px', color: '#ef4444' }}
            >
              <X size={15} />
              <span>Cancel</span>
            </button>
          )}

          {/* Download All if any completed */}
          {completedCount > 0 && (
            <button
              onClick={onDownloadAll}
              className="btn btn-secondary"
              style={{ padding: '8px 14px' }}
            >
              <Download size={15} />
              <span>Download Completed</span>
            </button>
          )}

          {/* Clear Queue */}
          <button
            onClick={onClearQueue}
            disabled={isConverting}
            className="btn btn-ghost btn-icon"
            title="Clear Queue"
            style={{ opacity: isConverting ? 0.4 : 1 }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Global Progress Bar */}
      {isConverting || completedCount > 0 ? (
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            marginBottom: '6px',
          }}>
            <span>Processing batch queue: {progressPercent}%</span>
            <span>{completedCount} of {items.length} converted</span>
          </div>
          <div style={{
            height: '6px',
            width: '100%',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: 'var(--accent-gradient)',
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.25s ease-out',
            }} />
          </div>
        </div>
      ) : null}

      {/* Item List or Grid */}
      {viewMode === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
          {items.map((item) => {
            const isSelected = selectedItemId === item.id;
            const res = item.convertedResult;
            const sizeKb = (item.size / 1024).toFixed(1);

            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? 'var(--bg-elevated)' : 'var(--bg-tertiary)',
                  border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Thumbnail & Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '6px',
                      objectFit: 'cover',
                      background: '#000',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-tertiary)' }}>
                      {sizeKb} KB
                      {res && (
                        <span>
                          {' '}→ <strong style={{ color: 'var(--text-primary)' }}>{(res.outputMeta.size / 1024).toFixed(1)} KB</strong>
                          {' '}({res.outputMeta.percentSaved >= 0 ? `-${res.outputMeta.percentSaved}%` : `+${Math.abs(res.outputMeta.percentSaved)}%`})
                          {' '}• {res.timeTakenMs}ms
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  {item.status === 'idle' && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Ready</span>
                  )}
                  {item.status === 'converting' && (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.75rem',
                      color: 'var(--accent-primary)',
                      fontWeight: 600,
                    }}>
                      <span className="spin" style={{ display: 'inline-block' }}>⟳</span>
                      Converting...
                    </span>
                  )}
                  {item.status === 'completed' && res && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${
                        res.verification.badge === 'Lossless'
                          ? 'badge-lossless'
                          : res.verification.badge === 'Near-lossless'
                          ? 'badge-near-lossless'
                          : 'badge-lossy'
                      }`} style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                        {res.verification.badge}
                      </span>
                      <CheckCircle2 size={16} color="#34d399" />
                    </div>
                  )}
                  {item.status === 'error' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#ef4444' }} title={item.error}>
                        Failed
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onRetryItem(item.id); }}
                        className="btn btn-ghost btn-icon"
                        title="Retry"
                        style={{ width: '28px', height: '28px' }}
                      >
                        <RotateCcw size={13} />
                      </button>
                    </div>
                  )}

                  {res && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDownloadItem(item); }}
                      className="btn btn-ghost btn-icon"
                      title="Download converted file"
                      style={{ width: '28px', height: '28px' }}
                    >
                      <Download size={14} />
                    </button>
                  )}

                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }}
                    className="btn btn-ghost btn-icon"
                    title="Remove from queue"
                    style={{ width: '28px', height: '28px', color: 'var(--text-tertiary)' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Grid Thumbnail View */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '12px',
          maxHeight: '360px',
          overflowY: 'auto',
        }}>
          {items.map((item) => {
            const isSelected = selectedItemId === item.id;
            const res = item.convertedResult;

            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(item.id)}
                style={{
                  borderRadius: 'var(--radius-sm)',
                  border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  background: 'var(--bg-tertiary)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ height: '90px', background: '#000', position: 'relative' }}>
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {item.status === 'completed' && (
                    <div style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      background: 'rgba(16, 185, 129, 0.9)',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <CheckCircle2 size={13} color="#fff" />
                    </div>
                  )}
                  {item.status === 'converting' && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '0.8rem',
                    }}>
                      <span className="spin">⟳</span>
                    </div>
                  )}
                </div>

                <div style={{ padding: '8px' }}>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                    {(item.size / 1024).toFixed(0)} KB
                    {res && <span> → {(res.outputMeta.size / 1024).toFixed(0)} KB</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
