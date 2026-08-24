'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  Link as LinkIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  validateBannerImageDimensions,
  BannerDimensionResult,
} from '@/lib/utils/banner-image-validator';
import { uploadMediaImage } from '@/lib/api/media-api';
import { toast } from 'sonner';

export interface BannerPreset {
  id: string;
  name: string;
  title: string;
  description: string;
  url: string;
  targetUrl: string;
}

export const SAMPLE_BANNER_PRESETS: BannerPreset[] = [
  {
    id: 'preset-coffee',
    name: '☕ Buy 1 Get 1 Kopi',
    title: 'Buy 1 Get 1 Signature Espresso',
    description: 'Beli 1 gratis 1 untuk semua varian espresso setiap akhir pekan',
    url: '/banners/banner-coffee.jpg',
    targetUrl: '/menu?category=cat-coffee',
  },
  {
    id: 'preset-pastry',
    name: '🥐 Weekend Croissant',
    title: 'Sarapan Lezat Croissant & Pastry',
    description: 'Nikmati paket sarapan kopi + pastry hemat hingga 30%',
    url: '/banners/banner-pastry.jpg',
    targetUrl: '/menu?category=cat-pastry',
  },
  {
    id: 'preset-qris',
    name: '💳 Cashback 30% QRIS',
    title: 'Cashback 30% Pembayaran QRIS',
    description: 'Bayar non-tunai lebih praktis, cepat, dan hemat',
    url: '/banners/banner-qris.jpg',
    targetUrl: '/menu',
  },
];

interface BannerImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  onPresetSelect?: (preset: BannerPreset) => void;
  disabled?: boolean;
}

export function BannerImageUploader({
  value,
  onChange,
  onPresetSelect,
  disabled = false,
}: BannerImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [validationResult, setValidationResult] =
    useState<BannerDimensionResult | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'preset' | 'url'>('upload');

  const processFile = async (file: File) => {
    // 1. Client-side dimension and aspect ratio validation
    const validation = await validateBannerImageDimensions(file);
    setValidationResult(validation);

    if (!validation.isValid) {
      toast.error(validation.error || 'Dimensi banner tidak sesuai kriteria.');
      return;
    }

    // 2. Upload to backend
    setIsUploading(true);
    const result = await uploadMediaImage(file);
    setIsUploading(false);

    if (result.isLeft()) {
      toast.error(result.value.message || 'Gagal mengunggah gambar ke server.');
      return;
    }

    const uploadedUrl = result.value.url;
    onChange(uploadedUrl);
    toast.success('Gambar banner berhasil diunggah dan dikompresi ke WebP!');
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleApplyCustomUrl = async () => {
    if (!customUrlInput.trim()) return;

    const validation = await validateBannerImageDimensions(customUrlInput.trim());
    setValidationResult(validation);

    if (!validation.isValid) {
      toast.error(validation.error || 'Link gambar tidak valid.');
      return;
    }

    onChange(customUrlInput.trim());
    toast.success('Link gambar banner berhasil dipasang!');
  };

  const handleSelectPreset = (preset: BannerPreset) => {
    onChange(preset.url);
    if (onPresetSelect) {
      onPresetSelect(preset);
    }
    toast.success(`Preset "${preset.name}" terpilih!`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-stone-700 dark:text-zinc-300 flex items-center gap-1.5">
          <ImageIcon className="h-4 w-4 text-amber-600" />
          <span>Gambar Banner Promo (Rasio 16:9 Landscape)</span>
        </label>

        {/* Tab switchers */}
        <div className="flex items-center p-0.5 rounded-xl bg-stone-100 dark:bg-zinc-800 text-[11px] font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-zinc-700 font-bold shadow-xs text-stone-900 dark:text-white'
                : 'text-stone-500 hover:text-stone-800 dark:text-zinc-400'
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preset')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeTab === 'preset'
                ? 'bg-white dark:bg-zinc-700 font-bold shadow-xs text-stone-900 dark:text-white'
                : 'text-stone-500 hover:text-stone-800 dark:text-zinc-400'
            }`}
          >
            Contoh Preset
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeTab === 'url'
                ? 'bg-white dark:bg-zinc-700 font-bold shadow-xs text-stone-900 dark:text-white'
                : 'text-stone-500 hover:text-stone-800 dark:text-zinc-400'
            }`}
          >
            Paste URL
          </button>
        </div>
      </div>

      {/* Hidden native file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Content depending on Active Tab */}
      {activeTab === 'upload' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/20'
              : 'border-stone-200 dark:border-zinc-800 hover:border-amber-500 dark:hover:border-amber-500 bg-stone-50/50 dark:bg-zinc-800/40'
          } ${disabled || isUploading ? 'opacity-60 pointer-events-none' : ''}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-4 space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
              <p className="text-xs font-bold text-stone-700 dark:text-zinc-200">
                Mengompresi dan Mengunggah Gambar...
              </p>
              <p className="text-[11px] text-stone-400 dark:text-zinc-500">
                Otomatis dioptimasi ke WebP dengan Sharp
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold text-stone-800 dark:text-zinc-200">
                Klik untuk memilih file atau seret gambar banner ke sini
              </p>
              <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                Wajib <span className="font-semibold text-amber-600">Landscape 16:9</span> • Format PNG, JPG, WebP • Maks. 5 MB
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'preset' && (
        <div className="p-3.5 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-stone-50/60 dark:bg-zinc-800/40 space-y-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-600 dark:text-zinc-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>Pilih Sampel Banner Siap Pakai (1-Click Presets):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {SAMPLE_BANNER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-2.5 rounded-xl border text-left transition-all text-xs flex flex-col gap-1 cursor-pointer ${
                  value === preset.url
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 shadow-xs'
                    : 'border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-amber-400'
                }`}
              >
                <div className="w-full h-14 rounded-lg overflow-hidden bg-stone-200 relative mb-1">
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-bold text-stone-900 dark:text-zinc-100 text-[11px] truncate">
                  {preset.name}
                </span>
                <span className="text-[10px] text-stone-500 dark:text-zinc-400 line-clamp-1">
                  {preset.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'url' && (
        <div className="flex items-center gap-2 p-1">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
            <Input
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              className="h-10 pl-9 rounded-xl text-xs bg-stone-50 dark:bg-zinc-800"
            />
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleApplyCustomUrl}
            className="h-10 px-4 rounded-xl text-xs font-bold"
          >
            Terapkan
          </Button>
        </div>
      )}

      {/* Aspect Ratio Validation Feedback Banner */}
      {validationResult && !validationResult.isValid && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-start gap-2 animate-in fade-in duration-200">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Gambar Tidak Memenuhi Kriteria Banner</p>
            <p className="text-[11px] leading-relaxed">{validationResult.error}</p>
          </div>
        </div>
      )}

      {/* Active Thumbnail Preview */}
      {value && (
        <div className="relative rounded-2xl overflow-hidden border border-stone-200 dark:border-zinc-800 bg-stone-100 dark:bg-zinc-900 group shadow-sm">
          <div className="aspect-16/9 w-full relative overflow-hidden">
            <img
              src={value}
              alt="Banner Preview"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* Aspect Ratio Pill Overlay */}
            <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span>Rasio: 16:9 Landscape (Valid)</span>
            </div>

            {/* Remove preview button */}
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
