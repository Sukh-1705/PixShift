import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, CheckCircle, FolderOpen, Download, RotateCcw, Zap } from 'lucide-react';

interface SuccessBannerProps {
  convertedCount: number;
  totalSavedBytes: number;
  totalTimeMs: number;
  onDownloadAll: () => void;
  onConvertMore: () => void;
  onRevealFolder?: () => void;
}

export const SuccessBanner: React.FC<SuccessBannerProps> = ({
  convertedCount,
  totalSavedBytes,
  totalTimeMs,
  onDownloadAll,
  onConvertMore,
  onRevealFolder,
}) => {
  useEffect(() => {
    // Fire confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#a855f7', '#34d399', '#38bdf8'],
      });
    } catch (e) {
      // Ignored if canvas not ready
    }
  }, []);

  const savedMb = (totalSavedBytes / (1024 * 1024)).toFixed(2);
  const avgTime = convertedCount > 0 ? Math.round(totalTimeMs / convertedCount) : 0;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)',
      border: '1px solid rgba(99, 102, 241, 0.3)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px 32px',
      marginTop: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '20px',
      boxShadow: '0 10px 35px rgba(99, 102, 241, 0.15)',
    }}>
      {/* Metrics Summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '16px',
          background: 'var(--accent-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.5)',
        }}>
          <CheckCircle size={28} color="#ffffff" />
        </div>

        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px' }}>
            Batch Conversion Complete!
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
          }}>
            <span><strong>{convertedCount}</strong> images processed</span>
            <span>•</span>
            <span style={{ color: '#34d399', fontWeight: 600 }}>
              {totalSavedBytes > 0 ? `Saved ${savedMb} MB` : '100% Fidelity Preserved'}
            </span>
            <span>•</span>
            <span>Avg {avgTime} ms/file</span>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onDownloadAll}
          className="btn btn-primary"
          style={{ padding: '10px 20px', fontSize: '0.9rem' }}
        >
          <Download size={16} />
          <span>Download All Converted</span>
        </button>

        <button
          onClick={onConvertMore}
          className="btn btn-secondary"
          style={{ padding: '10px 18px', fontSize: '0.9rem' }}
        >
          <RotateCcw size={16} />
          <span>Convert More</span>
        </button>
      </div>
    </div>
  );
};
