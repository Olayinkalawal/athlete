"use client";

import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, CheckCircle, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { compressVideo, formatFileSize } from '@/lib/video-compression';

interface VideoUploaderProps {
  onUploadComplete: (url: string, id?: string) => void;
  onCancel: () => void;
  discipline?: string;
}

export default function VideoUploader({ onUploadComplete, onCancel, discipline = 'football' }: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SUPABASE_LIMIT = 50 * 1024 * 1024; // 50MB Supabase free tier limit
  const COMPRESS_THRESHOLD = 40 * 1024 * 1024; // Compress files > 40MB

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file (MP4, MOV, etc.)');
      return;
    }

    if (!supabase) {
      toast.error('Storage not configured');
      return;
    }

    setIsProcessing(true);
    let fileToUpload: File | Blob = file;
    let finalFileName = file.name;

    try {
      // Check if compression is needed
      if (file.size > COMPRESS_THRESHOLD) {
        setIsCompressing(true);
        setStatusMessage('Loading compressor...');
        
        toast.info(`Video is ${formatFileSize(file.size)}. Compressing to fit 50MB limit...`);

        const result = await compressVideo(file, 45, (msg) => {
          setStatusMessage(msg);
        });

        fileToUpload = result.blob;
        finalFileName = file.name.replace(/\.[^.]+$/, '') + '_compressed.mp4';
        
        toast.success(
          `Compressed! ${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)} (${Math.round(result.compressionRatio)}% smaller)`
        );
        
        setIsCompressing(false);
      }

      // Final size check
      if (fileToUpload.size > SUPABASE_LIMIT) {
        toast.error(`Video is still ${formatFileSize(fileToUpload.size)}. Try a shorter clip.`);
        setIsProcessing(false);
        return;
      }

      setStatusMessage('Uploading...');
      
      const fileName = `${Date.now()}-${finalFileName.replace(/[^a-zA-Z0-9.]/g, '')}`;
      const userId = 'anonymous';

      const { data, error } = await supabase.storage
        .from('training-videos')
        .upload(`${userId}/${fileName}`, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('training-videos')
        .getPublicUrl(data.path);

      // Save to user_videos via API with discipline
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: finalFileName,
            url: urlData.publicUrl,
            size: fileToUpload.size,
            discipline: discipline
        })
      });

      const videoData = await response.json();

      toast.success(`Video saved to ${discipline} library!`);
      onUploadComplete(urlData.publicUrl, videoData?.id);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setIsCompressing(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`bg-zinc-900 border-2 border-dashed rounded-xl p-8 w-full max-w-md flex flex-col items-center justify-center text-center transition-all ${
          isDragging ? 'border-indigo-500 bg-zinc-800' : 'border-zinc-700'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <button 
          onClick={onCancel}
          disabled={isProcessing}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white disabled:opacity-50"
        >
          <X size={20} />
        </button>

        {isProcessing ? (
          <div className="space-y-4">
            {isCompressing ? (
              <Zap className="w-12 h-12 text-yellow-500 mx-auto animate-pulse" />
            ) : (
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
            )}
            <p className="text-zinc-300 font-medium">
              {statusMessage || 'Processing...'}
            </p>
            <p className="text-zinc-500 text-xs">
              {isCompressing ? 'This may take 30-60 seconds' : 'Please stay on this page'}
            </p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-400">
              <Upload size={32} />
            </div>
            
            <h3 className="text-lg font-semibold text-white mb-2">Upload Analysis Video</h3>
            <p className="text-zinc-400 text-sm mb-4 max-w-[250px]">
              Drag and drop your training video here, or click to browse.
            </p>
            
            <div className="flex items-center gap-2 text-emerald-400 text-xs mb-4">
              <Zap size={12} />
              <span>Large videos auto-compressed</span>
            </div>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-900/20"
            >
              Select Video
            </button>
            
            <input 
              ref={fileInputRef}
              type="file" 
              accept="video/*" 
              className="hidden"
              onChange={handleFileSelect}
            />
            
            <p className="text-zinc-500 text-xs mt-4">Any size • Auto-compresses to 50MB</p>
          </>
        )}
      </div>
    </div>
  );
}
