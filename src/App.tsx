import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Dropzone } from './components/Dropzone';
import { FormatSelector } from './components/FormatSelector';
import { AdvancedPanel } from './components/AdvancedPanel';
import { CompareSlider } from './components/CompareSlider';
import { BatchQueue } from './components/BatchQueue';
import { SuccessBanner } from './components/SuccessBanner';
import { CommandPalette } from './components/CommandPalette';
import { HistoryModal } from './components/HistoryModal';
import { WatchFolderModal } from './components/WatchFolderModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ImageFileItem, ImageFormat, ConversionOptions, QualityPreset, ConversionResult } from './types';

const DEFAULT_OPTIONS: ConversionOptions = {
  format: 'png',
  quality: 90,
  lossless: true,
  metadataMode: 'keep',
  backgroundColor: '#FFFFFF',
  convertToSrgb: false,
  chromaSubsampling: '4:4:4',
  progressive: true,
  namingTemplate: '{name}',
  resize: { mode: 'none' },
};

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [queue, setQueue] = useState<ImageFileItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [options, setOptions] = useState<ConversionOptions>(DEFAULT_OPTIONS);
  const [presets, setPresets] = useState<QualityPreset[]>([]);
  const [cpuCount, setCpuCount] = useState(8);
  const [isWatchActive, setIsWatchActive] = useState(false);
  const [batchFinished, setBatchFinished] = useState(false);

  // Modals state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const isCancelledRef = useRef(false);

  // Initialize theme, system health, and presets
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const fetchHealthAndPresets = async () => {
      try {
        const [healthRes, presetsRes] = await Promise.all([
          fetch('/api/health').catch(() => null),
          fetch('/api/presets').catch(() => null),
        ]);

        if (healthRes && healthRes.ok) {
          const h = await healthRes.json();
          if (h.cpus) setCpuCount(h.cpus);
        }
        if (presetsRes && presetsRes.ok) {
          const p = await presetsRes.json();
          setPresets(p);
        }
      } catch (e) {
        console.warn('Backend server connecting...');
      }
    };
    fetchHealthAndPresets();
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 't') {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
      } else if (e.key.toLowerCase() === 'h') {
        setIsHistoryOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 'w') {
        setIsWatchModalOpen((prev) => !prev);
      } else if (e.key === 'Enter' && queue.length > 0 && !isConverting) {
        startConversion();
      } else if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        const map: Record<string, ImageFormat> = {
          '1': 'png',
          '2': 'webp',
          '3': 'jpeg',
          '4': 'avif',
          '5': 'tiff',
          '6': 'qoi',
        };
        const newFmt = map[e.key];
        if (newFmt) {
          handleSelectFormat(newFmt);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [queue, isConverting]);

  // Add Files handler
  const handleFilesAdded = (files: File[]) => {
    const newItems: ImageFileItem[] = files.map((file) => ({
      id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl: URL.createObjectURL(file),
      status: 'idle',
      progress: 0,
    }));

    setQueue((prev) => [...prev, ...newItems]);
    if (!selectedItemId && newItems.length > 0) {
      setSelectedItemId(newItems[0].id);
    }
    setBatchFinished(false);
  };

  // Add Sample procedural test image
  const handleAddSample = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw rich test pattern
      const grad = ctx.createLinearGradient(0, 0, 600, 600);
      grad.addColorStop(0, '#6366f1');
      grad.addColorStop(0.5, '#ec4899');
      grad.addColorStop(1, '#3b82f6');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 600);

      // Transparency cutout & geometric elements
      ctx.clearRect(150, 150, 300, 300);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(300, 300, 120, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 28px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Pixshift Studio', 300, 290);
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText('Lossless 100% Fidelity Test', 300, 325);

      canvas.toBlob((blob) => {
        if (blob) {
          const sampleFile = new File([blob], 'pixshift_lossless_test.png', { type: 'image/png' });
          handleFilesAdded([sampleFile]);
        }
      }, 'image/png');
    }
  };

  // Format selection
  const handleSelectFormat = (fmt: ImageFormat) => {
    const isLosslessDefault = ['png', 'tiff', 'bmp', 'qoi'].includes(fmt);
    setOptions((prev) => ({
      ...prev,
      format: fmt,
      lossless: isLosslessDefault ? true : prev.lossless,
    }));
  };

  // Preset handlers
  const handleApplyPreset = (preset: QualityPreset) => {
    setOptions((prev) => ({
      ...prev,
      format: preset.format,
      quality: preset.quality,
      lossless: preset.lossless,
      metadataMode: preset.metadataMode,
      chromaSubsampling: preset.chromaSubsampling || prev.chromaSubsampling,
    }));
  };

  const handleSavePreset = async (presetName: string) => {
    const newPreset: QualityPreset = {
      id: `preset_${Date.now()}`,
      name: presetName,
      format: options.format,
      quality: options.quality,
      lossless: options.lossless,
      metadataMode: options.metadataMode,
      chromaSubsampling: options.chromaSubsampling,
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    try {
      await fetch('/api/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presets: updated }),
      });
    } catch (e) {
      console.error('Failed to save preset:', e);
    }
  };

  // Core conversion execution
  const convertSingleItem = async (item: ImageFileItem): Promise<ConversionResult> => {
    // Fetch blob from previewUrl
    const resp = await fetch(item.previewUrl);
    const blob = await resp.blob();

    const formData = new FormData();
    formData.append('file', blob, item.name);
    formData.append('format', options.format);
    formData.append('quality', String(options.quality));
    formData.append('lossless', String(options.lossless));
    formData.append('metadataMode', options.metadataMode);
    formData.append('backgroundColor', options.backgroundColor);
    formData.append('convertToSrgb', String(options.convertToSrgb));
    formData.append('chromaSubsampling', options.chromaSubsampling);
    formData.append('progressive', String(options.progressive));
    formData.append('namingTemplate', options.namingTemplate);
    if (options.maxFileSizeKb) formData.append('maxFileSizeKb', String(options.maxFileSizeKb));
    if (options.resize && options.resize.mode !== 'none') {
      formData.append('resize', JSON.stringify(options.resize));
    }
    if (options.rotate) formData.append('rotate', String(options.rotate));
    if (options.flip) formData.append('flip', String(options.flip));
    if (options.flop) formData.append('flop', String(options.flop));

    const apiRes = await fetch('/api/convert', {
      method: 'POST',
      body: formData,
    });

    if (!apiRes.ok) {
      const errJson = await apiRes.json().catch(() => ({}));
      throw new Error(errJson.error || `Server responded with ${apiRes.status}`);
    }

    const data: ConversionResult = await apiRes.json();
    return data;
  };

  const startConversion = async () => {
    if (queue.length === 0 || isConverting) return;
    setIsConverting(true);
    setIsPaused(false);
    isCancelledRef.current = false;
    setBatchFinished(false);

    // Filter items needing conversion
    const itemsToProcess = queue.filter((i) => i.status !== 'completed');

    // Run parallel worker pool (concurrency: 4)
    const concurrency = 4;
    let index = 0;

    const worker = async () => {
      while (index < itemsToProcess.length) {
        if (isCancelledRef.current) break;

        // Check paused
        while (isPausedRef.current) {
          await new Promise((r) => setTimeout(r, 200));
          if (isCancelledRef.current) break;
        }

        const currentItem = itemsToProcess[index++];
        if (!currentItem) break;

        // Update item state to converting
        setQueue((prev) =>
          prev.map((i) => (i.id === currentItem.id ? { ...i, status: 'converting', progress: 30 } : i))
        );

        try {
          const result = await convertSingleItem(currentItem);
          setQueue((prev) =>
            prev.map((i) =>
              i.id === currentItem.id
                ? {
                    ...i,
                    status: 'completed',
                    progress: 100,
                    convertedResult: result,
                    sourceMeta: result.sourceMeta,
                  }
                : i
            )
          );
        } catch (err: any) {
          setQueue((prev) =>
            prev.map((i) =>
              i.id === currentItem.id
                ? { ...i, status: 'error', progress: 0, error: err.message || 'Conversion failed' }
                : i
            )
          );
        }
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, itemsToProcess.length) }, () => worker());
    await Promise.all(workers);

    setIsConverting(false);
    setBatchFinished(true);
  };

  const handlePauseResume = () => {
    setIsPaused((prev) => !prev);
  };

  const handleCancelConversion = () => {
    isCancelledRef.current = true;
    setIsConverting(false);
    setIsPaused(false);
  };

  const handleClearQueue = () => {
    setQueue([]);
    setSelectedItemId(null);
    setBatchFinished(false);
  };

  const handleRemoveItem = (id: string) => {
    setQueue((prev) => prev.filter((i) => i.id !== id));
    if (selectedItemId === id) {
      setSelectedItemId(null);
    }
  };

  const handleRetryItem = async (id: string) => {
    const item = queue.find((i) => i.id === id);
    if (!item) return;

    setQueue((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'converting', progress: 30, error: undefined } : i))
    );

    try {
      const result = await convertSingleItem(item);
      setQueue((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, status: 'completed', progress: 100, convertedResult: result, sourceMeta: result.sourceMeta }
            : i
        )
      );
    } catch (err: any) {
      setQueue((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'error', progress: 0, error: err.message } : i))
      );
    }
  };

  const downloadBlob = (base64Data: string, filename: string) => {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadItem = (item: ImageFileItem) => {
    if (item.convertedResult) {
      downloadBlob(item.convertedResult.base64, item.convertedResult.fileName);
    }
  };

  const handleDownloadAll = () => {
    const completedItems = queue.filter((i) => i.status === 'completed' && i.convertedResult);
    completedItems.forEach((item, idx) => {
      setTimeout(() => {
        if (item.convertedResult) {
          downloadBlob(item.convertedResult.base64, item.convertedResult.fileName);
        }
      }, idx * 150);
    });
  };

  // Selected item for Before/After compare
  const selectedItem = queue.find((i) => i.id === selectedItemId);
  const selectedResult = selectedItem?.convertedResult;

  const totalSavedBytes = queue.reduce((acc, i) => acc + (i.convertedResult?.outputMeta.bytesSaved || 0), 0);
  const totalTimeMs = queue.reduce((acc, i) => acc + (i.convertedResult?.timeTakenMs || 0), 0);
  const completedCount = queue.filter((i) => i.status === 'completed').length;

  return (
    <div className="app-container">
      {/* Background glow effects */}
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />

      {/* Main Header */}
      <Header
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        cpuCount={cpuCount}
        isWatchActive={isWatchActive}
        onOpenWatchModal={() => setIsWatchModalOpen(true)}
        onOpenHistoryModal={() => setIsHistoryOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Content Area */}
      <main style={{
        maxWidth: '1240px',
        width: '100%',
        margin: '0 auto',
        padding: '32px 24px 64px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Dropzone Area (shows when queue is empty or as an add more zone) */}
        {queue.length === 0 ? (
          <Dropzone
            onFilesAdded={handleFilesAdded}
            onAddSample={handleAddSample}
          />
        ) : null}

        {/* Format Selector Bar */}
        <FormatSelector
          selectedFormat={options.format}
          onSelectFormat={handleSelectFormat}
          isLosslessMode={options.lossless}
        />

        {/* Collapsible Advanced Options Panel */}
        <AdvancedPanel
          options={options}
          onChangeOptions={(updated) => setOptions((prev) => ({ ...prev, ...updated }))}
          presets={presets}
          onApplyPreset={handleApplyPreset}
          onSavePreset={handleSavePreset}
        />

        {/* Success Banner on Batch Finish */}
        {batchFinished && completedCount > 0 && (
          <SuccessBanner
            convertedCount={completedCount}
            totalSavedBytes={totalSavedBytes}
            totalTimeMs={totalTimeMs}
            onDownloadAll={handleDownloadAll}
            onConvertMore={() => {
              setBatchFinished(false);
              setQueue([]);
              setSelectedItemId(null);
            }}
          />
        )}

        {/* Before / After Inspection & Compare Slider */}
        {selectedItem && selectedResult && (
          <CompareSlider
            item={selectedItem}
            result={selectedResult}
            onDownload={() => handleDownloadItem(selectedItem)}
          />
        )}

        {/* Batch Queue List / Grid */}
        {queue.length > 0 && (
          <BatchQueue
            items={queue}
            isConverting={isConverting}
            isPaused={isPaused}
            selectedItemId={selectedItemId}
            onSelectItem={(id) => setSelectedItemId(id)}
            onStartConversion={startConversion}
            onPauseResume={handlePauseResume}
            onCancelConversion={handleCancelConversion}
            onClearQueue={handleClearQueue}
            onRemoveItem={handleRemoveItem}
            onRetryItem={handleRetryItem}
            onDownloadItem={handleDownloadItem}
            onDownloadAll={handleDownloadAll}
          />
        )}
      </main>

      {/* Floating Modals */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectFormat={handleSelectFormat}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        onOpenWatchModal={() => { setIsCommandPaletteOpen(false); setIsWatchModalOpen(true); }}
        onOpenHistoryModal={() => { setIsCommandPaletteOpen(false); setIsHistoryOpen(true); }}
        onClearQueue={handleClearQueue}
        onConvertAll={startConversion}
        onAddSample={handleAddSample}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      <WatchFolderModal
        isOpen={isWatchModalOpen}
        onClose={() => setIsWatchModalOpen(false)}
        isWatchActive={isWatchActive}
        onWatchStateChange={setIsWatchActive}
        defaultFormat={options.format}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
};

export default App;
