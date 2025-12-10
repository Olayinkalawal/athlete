"use client";

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export async function loadFFmpeg(onProgress?: (message: string) => void): Promise<FFmpeg> {
  if (ffmpeg && ffmpeg.loaded) {
    return ffmpeg;
  }

  ffmpeg = new FFmpeg();

  ffmpeg.on('log', ({ message }) => {
    console.log('[FFmpeg]', message);
  });

  ffmpeg.on('progress', ({ progress }) => {
    if (onProgress) {
      onProgress(`Compressing: ${Math.round(progress * 100)}%`);
    }
  });

  onProgress?.('Loading video compressor...');

  // Load FFmpeg with WASM from CDN
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return ffmpeg;
}

export interface CompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export async function compressVideo(
  file: File,
  targetSizeMB: number = 45,
  onProgress?: (message: string) => void
): Promise<CompressionResult> {
  const ff = await loadFFmpeg(onProgress);

  const inputName = 'input.mp4';
  const outputName = 'output.mp4';

  onProgress?.('Preparing video...');
  
  // Write input file to FFmpeg virtual filesystem
  await ff.writeFile(inputName, await fetchFile(file));

  // Calculate target bitrate based on video duration and target size
  // We'll use a conservative approach: target 40MB to have buffer room
  const targetBytes = targetSizeMB * 1024 * 1024;
  
  // Estimate duration (rough: assume 2 mins if we can't detect)
  // For better accuracy, we could read video metadata first
  const estimatedDurationSecs = 120; // 2 minutes default
  
  // Calculate bitrate in kbps (reserving some for audio)
  const audioBitrate = 64; // 64 kbps for audio
  const videoBitrate = Math.floor((targetBytes * 8) / (estimatedDurationSecs * 1000)) - audioBitrate;
  
  // Clamp bitrate to reasonable ranges
  const finalVideoBitrate = Math.max(200, Math.min(2000, videoBitrate));

  onProgress?.('Compressing video...');

  // Run FFmpeg compression command
  // -crf 28: Good quality with compression
  // -preset fast: Balance between speed and compression
  // -vf scale: Reduce resolution if needed
  await ff.exec([
    '-i', inputName,
    '-c:v', 'libx264',
    '-crf', '28',
    '-preset', 'fast',
    '-vf', 'scale=720:-2', // Scale to 720p width, maintain aspect ratio
    '-c:a', 'aac',
    '-b:a', '64k',
    '-movflags', '+faststart',
    outputName
  ]);

  onProgress?.('Finalizing...');

  // Read the output file
  const data = await ff.readFile(outputName);
  const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: 'video/mp4' });

  // Cleanup
  await ff.deleteFile(inputName);
  await ff.deleteFile(outputName);

  const originalSize = file.size;
  const compressedSize = blob.size;
  const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

  return {
    blob,
    originalSize,
    compressedSize,
    compressionRatio
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
