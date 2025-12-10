"use client";

import { Play, SkipForward, Volume2, VolumeX, PictureInPicture2, Maximize, Pause, RotateCcw, Upload, Sparkles, Loader2, ChevronDown, ChevronUp, History, Film, Check, Trash2 } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { NoVideosEmpty, NoAnalysesEmpty } from "@/components/ui/empty-state";
import { toast } from "sonner";
import VideoUploader from "./video-uploader";
import { CustomDrillsGenerator } from "./CustomDrillsGenerator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface VideoAnalysis {
  id?: string;
  analysis_text: string;
  created_at?: string;
  frame_count?: number;
}

interface UserVideo {
  id: string;
  title: string;
  url: string;
  created_at: string;
  discipline?: string;
}

interface VideoPlayerProps {
  discipline?: string;
  initialVideoId?: string;
  initialAnalysisId?: string;
  onDrillsGenerated?: () => void;
}

export default function VideoPlayer({ discipline = 'football', initialVideoId, initialAnalysisId, onDrillsGenerated }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.67);
  const [isHD, setIsHD] = useState(true);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [posterSrc, setPosterSrc] = useState<string>("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [hasUserVideo, setHasUserVideo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingStage, setAnalyzingStage] = useState<string>('Extracting frames...');
  const [currentAnalysis, setCurrentAnalysis] = useState<VideoAnalysis | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<VideoAnalysis[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Video library state
  const [videoLibrary, setVideoLibrary] = useState<UserVideo[]>([]);
  const [showVideoSelector, setShowVideoSelector] = useState(false);
  const [deleteVideoTarget, setDeleteVideoTarget] = useState<UserVideo | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch videos for this discipline on mount
  useEffect(() => {
    const fetchVideos = async () => {
        setIsLoading(true);
        try {
            // Fetch all videos for dropdown
            const allRes = await fetch(`/api/videos?discipline=${discipline}&all=true`);
            if (allRes.ok) {
                const allData = await allRes.json();
                setVideoLibrary(allData.videos || []);
                
                // If initialVideoId provided, find and select that video
                if (initialVideoId && allData.videos?.length > 0) {
                    const targetVideo = allData.videos.find((v: UserVideo) => v.id === initialVideoId);
                    if (targetVideo) {
                        setVideoSrc(targetVideo.url);
                        setVideoId(targetVideo.id);
                        setHasUserVideo(true);
                        return;
                    }
                }
                
                // Otherwise set latest video as current
                if (allData.videos && allData.videos.length > 0) {
                    const latest = allData.videos[0];
                    setVideoSrc(latest.url);
                    setVideoId(latest.id);
                    setHasUserVideo(true);
                } else {
                    setHasUserVideo(false);
                    setVideoSrc(null);
                }
            }
        } catch (error) {
            console.error("Failed to load videos:", error);
            setHasUserVideo(false);
        } finally {
            setIsLoading(false);
        }
    };
    fetchVideos();
  }, [discipline, initialVideoId]);

  // Handler to select a different video from library
  const handleSelectVideo = (video: UserVideo) => {
    setVideoSrc(video.url);
    setVideoId(video.id);
    setPosterSrc("");
    setCurrentAnalysis(null);
    setShowVideoSelector(false);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  // Handler to open delete confirmation dialog
  const handleDeleteVideo = (e: React.MouseEvent, video: UserVideo) => {
    e.stopPropagation(); // Prevent selecting the video
    setDeleteVideoTarget(video);
    setShowVideoSelector(false); // Close dropdown
  };

  // Actual delete after confirmation
  const confirmDelete = async () => {
    if (!deleteVideoTarget) return;
    
    const video = deleteVideoTarget;
    setDeleteVideoTarget(null); // Close dialog immediately
    
    try {
      toast.loading("Deleting video...", { id: "delete" });
      
      const res = await fetch(`/api/videos?id=${video.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      // Remove from local library
      setVideoLibrary(prev => prev.filter(v => v.id !== video.id));
      
      // If this was the current video, switch to first remaining or clear
      if (video.id === videoId) {
        const remaining = videoLibrary.filter(v => v.id !== video.id);
        if (remaining.length > 0) {
          handleSelectVideo(remaining[0]);
        } else {
          setVideoSrc(null);
          setVideoId(null);
          setHasUserVideo(false);
          setCurrentAnalysis(null);
        }
      }

      toast.success("Video deleted successfully", { id: "delete" });
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(`Failed to delete: ${error.message}`, { id: "delete" });
    }
  };

  // Fetch analysis history when videoId changes
  useEffect(() => {
    const fetchAnalysisHistory = async () => {
      if (!videoId) {
        setAnalysisHistory([]);
        return;
      }
      
      setIsLoadingHistory(true);
      try {
        const res = await fetch(`/api/analyze-video?videoId=${videoId}`);
        if (res.ok) {
          const data = await res.json();
          setAnalysisHistory(data.analyses || []);
          
          // If initialAnalysisId provided, find and select that specific analysis
          if (initialAnalysisId && data.analyses?.length > 0) {
            const targetAnalysis = data.analyses.find((a: VideoAnalysis) => a.id === initialAnalysisId);
            if (targetAnalysis) {
              setCurrentAnalysis(targetAnalysis);
              setShowAnalysis(true);
              return;
            }
          }
          
          // Otherwise set current analysis to the most recent if we don't have one
          if (!currentAnalysis && data.analyses?.length > 0) {
            setCurrentAnalysis(data.analyses[0]);
          }
        }
      } catch (error) {
        console.error("Failed to load analysis history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchAnalysisHistory();
  }, [videoId, initialAnalysisId]);

  // Capture first frame as poster when video metadata loads
  const handleVideoLoaded = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      // Seek to first frame
      video.currentTime = 0.1;
    }
  };

  // Capture the frame after seeking completes
  const handleSeeked = () => {
    if (videoRef.current && canvasRef.current && !posterSrc) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx && video.videoWidth && video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
          const frameDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setPosterSrc(frameDataUrl);
        } catch (e) {
          // CORS issue - can't capture frame, that's okay
          console.log("Could not capture first frame (CORS)");
        }
      }
    }
  };

  // Extract frames from video at specific timestamps
  const extractFrames = async (count: number = 8): Promise<string[]> => {
    if (!videoRef.current || !canvasRef.current) return [];
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    const videoDuration = video.duration;
    if (!videoDuration) return [];

    const frames: string[] = [];
    const wasPlaying = !video.paused;
    
    if (wasPlaying) video.pause();

    // Calculate frame timestamps - evenly distributed across video
    // Skip first and last 5% to avoid black frames
    const startPercent = 0.05;
    const endPercent = 0.95;
    const range = endPercent - startPercent;
    
    const timestamps: number[] = [];
    for (let i = 0; i < count; i++) {
      const percent = startPercent + (range * (i / (count - 1)));
      timestamps.push(videoDuration * percent);
    }

    for (const timestamp of timestamps) {
      video.currentTime = timestamp;
      await new Promise(resolve => {
        video.onseeked = resolve;
      });
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Use slightly lower quality for larger frame count to stay within limits
      const frameDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      frames.push(frameDataUrl);
    }

    // Restore video position
    video.currentTime = currentTime;
    if (wasPlaying) video.play();

    return frames;
  };

  // Analyze video with AI + Pose Detection
  const handleAnalyzeVideo = async () => {
    if (!videoRef.current) {
      toast.error("No video loaded");
      return;
    }

    setIsAnalyzing(true);

    try {
      // Step 1: Extract frames - 8 frames evenly distributed
      setAnalyzingStage('Extracting frames from video...');
      const frames = await extractFrames(8);
      
      if (frames.length === 0) {
        throw new Error("Failed to extract frames from video");
      }

      // Step 2: Run pose detection on frames
      setAnalyzingStage('Running pose detection on frames...');
      
      // Convert frame data URLs to canvas elements for pose processing
      const canvasFrames = await Promise.all(
        frames.map(async (frameDataUrl, index) => {
          return new Promise<{canvas: HTMLCanvasElement, timestamp: number, frameNumber: number}>((resolve) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
              }
              resolve({
                canvas,
                timestamp: index * (videoRef.current!.duration / (frames.length - 1)),
                frameNumber: index
              });
            };
            img.src = frameDataUrl;
          });
        })
      );

      // Import pose processor dynamically
      const { processPoseData, formatPoseDataForAI } = await import('@/utils/video/poseProcessor');
      
      // Process pose data from frames
      const poseData = await processPoseData(canvasFrames, (current, total) => {
        setAnalyzingStage(`Analyzing technique... frame ${current}/${total}`);
      });

      // Step 3: Send to AI with both visual frames and pose data
      setAnalyzingStage('Coach Nova is reviewing your form...');
      
      const response = await fetch('/api/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: videoSrc,
          videoId: videoId,
          frameUrls: frames,
          discipline: discipline,
          poseDataFormatted: poseData.length > 0 ? formatPoseDataForAI(poseData, discipline) : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setCurrentAnalysis({
        analysis_text: data.analysis,
        created_at: new Date().toISOString(),
        frame_count: data.frameCount
      });
      setShowAnalysis(true);
      
      // Success notification
      toast.success(
        poseData.length > 0 
          ? `Analysis complete with pose detection! 🎯`
          : "Analysis complete!"
      );

    } catch (error: any) {
      console.error("Analysis error:", error);
      toast.error(error.message || "Failed to analyze video");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoUpload = (url: string, id?: string) => {
    setVideoSrc(url);
    setVideoId(id || null);
    setShowUploader(false);
    setIsPlaying(false);
    setCurrentAnalysis(null);
    setHasUserVideo(true);
    // Reset poster to capture new first frame
    setPosterSrc("");
    if(videoRef.current) {
        videoRef.current.load();
    }
    // Note: Toast is already shown by video-uploader component
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
        const current = videoRef.current.currentTime;
        const dur = videoRef.current.duration;
        setCurrentTime(current);
        if (dur) {
            setDuration(dur);
            setProgress((current / dur) * 100);
        }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && duration) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const percent = x / width;
        const newTime = percent * duration;
        videoRef.current.currentTime = newTime;
        setProgress(percent * 100);
    }
  };

  const handleSkip = () => {
    if (videoRef.current) {
        videoRef.current.currentTime += 10;
        toast.info("Skipped forward 10s");
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const newVolume = Math.max(0, Math.min(1, x / width));
        videoRef.current.volume = newVolume;
        setVolume(newVolume);
        if (newVolume === 0) setIsMuted(true);
        else setIsMuted(false);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
        if (!document.fullscreenElement) {
            videoRef.current.parentElement?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
  };

  const togglePiP = async () => {
    if (videoRef.current) {
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await videoRef.current.requestPictureInPicture();
            }
        } catch (err) {
            toast.error("Picture-in-Picture not supported");
        }
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="space-y-4">
      {/* Video Library Header - Above the player */}
      {videoLibrary.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="relative">
            <button
              onClick={() => setShowVideoSelector(!showVideoSelector)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-zinc-700 dark:text-white text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-700"
            >
              <Film size={16} className="text-indigo-500" />
              <span>My {discipline.charAt(0).toUpperCase() + discipline.slice(1)} Videos</span>
              <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                {videoLibrary.length}
              </span>
              <ChevronDown size={16} className={`text-zinc-400 transition-transform ${showVideoSelector ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown Menu */}
            {showVideoSelector && (
              <>
                {/* Backdrop to close on click outside */}
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setShowVideoSelector(false)}
                />
                <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-30">
                  <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="flex items-center gap-2">
                      <Film size={14} className="text-indigo-500" />
                      <span className="text-sm font-semibold text-zinc-800 dark:text-white capitalize">{discipline} Training Videos</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">Select a video to view its analyses</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {videoLibrary.map((video, index) => (
                      <button
                        key={video.id}
                        onClick={() => handleSelectVideo(video)}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 ${
                          video.id === videoId ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          video.id === videoId 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                        }`}>
                          {video.id === videoId ? <Check size={14} /> : index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${video.id === videoId ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-800 dark:text-white'}`}>
                            {video.title}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {new Date(video.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        {video.id === videoId && (
                          <span className="text-[10px] px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full font-medium">Playing</span>
                        )}
                        <button
                          onClick={(e) => handleDeleteVideo(e, video)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          title="Delete video"
                        >
                          <Trash2 size={14} />
                        </button>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Upload Button */}
          <button
            onClick={() => setShowUploader(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm font-medium transition-colors"
          >
            <Upload size={16} />
            <span>Upload New</span>
          </button>
        </div>
      )}

      <ScrollReveal className="relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-black overflow-hidden group shadow-xl shadow-black/20 dark:shadow-black/50 ring-1 ring-zinc-200 dark:ring-white/5" >
        {/* Hidden canvas for frame extraction */}
        <canvas ref={canvasRef} className="hidden" />
        
        <div 
          className="aspect-video w-full bg-zinc-200 dark:bg-zinc-900 relative"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {showUploader && (
              <VideoUploader 
                  onUploadComplete={handleVideoUpload}
                  onCancel={() => setShowUploader(false)}
                  discipline={discipline}
              />
          )}

          {/* Video Element */}
          {videoSrc ? (
            <video 
                ref={videoRef}
                className="w-full h-full object-cover"
                src={videoSrc}
                poster={posterSrc || undefined}
                onLoadedData={handleVideoLoaded}
                onSeeked={handleSeeked}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnded}
                playsInline
                crossOrigin="anonymous"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900">
              {isLoading ? (
                <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
              ) : (
                <NoVideosEmpty onUpload={() => setShowUploader(true)} />
              )}
            </div>
          )}

          {/* Overlay Gradients */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 pointer-events-none transition-opacity duration-300 ${isPlaying && !isHovering ? 'opacity-0' : 'opacity-100'}`}></div>
          
          {/* Center Play Button */}
          {videoSrc && !isPlaying && !showUploader && !isAnalyzing && (
              <button 
                  onClick={togglePlay}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-16 w-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:scale-110 hover:bg-white/20 transition-all z-10"
              >
                  <Play className="ml-1 text-3xl" strokeWidth={2} />
              </button>
          )}
          
          {/* AI Analyzing Overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-20">
              <div className="relative">
                {/* Pulsing rings */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border-2 border-indigo-500/30 animate-ping" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-2 border-purple-500/40 animate-ping" style={{ animationDelay: '0.3s' }} />
                </div>
                
                {/* Center icon */}
                <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/50">
                  <Sparkles className="w-8 h-8 text-white animate-pulse" />
                </div>
              </div>
              
              <div className="mt-6 text-center max-w-md px-4">
                <p className="text-white font-semibold text-sm">{analyzingStage}</p>
                
                {/* Animated dots */}
                <div className="flex items-center justify-center gap-1 mt-3">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          )}
          
          {/* Top Overlay Info */}
          <div className={`absolute top-4 left-4 right-4 z-10 transition-opacity duration-300 ${isPlaying && !isHovering ? 'opacity-0' : 'opacity-100'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-black/60 backdrop-blur border border-zinc-700 text-[10px] font-semibold text-zinc-200 uppercase tracking-wider">Training Video</span>
                <button 
                    onClick={() => setShowUploader(true)}
                    className="px-2.5 py-1 rounded bg-indigo-600/80 hover:bg-indigo-600 backdrop-blur border border-indigo-500/50 text-[10px] font-semibold text-white uppercase tracking-wider flex items-center gap-1 transition-colors"
                >
                    <Upload size={10} />
                    Upload
                </button>
              </div>
              
              {/* Analyze Button */}
              <button 
                  onClick={handleAnalyzeVideo}
                  disabled={isAnalyzing}
                  className="px-3 py-1.5 rounded bg-emerald-600/80 hover:bg-emerald-600 disabled:bg-zinc-700 backdrop-blur border border-emerald-500/50 disabled:border-zinc-600 text-[10px] font-semibold text-white uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:cursor-not-allowed"
              >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} />
                      AI Analyze
                    </>
                  )}
              </button>
            </div>
          </div>
          
          {/* Video Controls Overlay */}
          <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-300 z-20 ${isPlaying && !isHovering ? 'opacity-0' : 'opacity-100'}`}>
            <div className="space-y-3">
              {/* Progress Bar */}
              <div 
                  className="relative group/progress h-1 bg-zinc-700 rounded-full cursor-pointer hover:h-1.5 transition-all"
                  onClick={handleSeek}
              >
                <div 
                  className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                ></div>
                <div 
                  className="absolute top-1/2 h-3 w-3 bg-white rounded-full transform -translate-y-1/2 opacity-0 group-hover/progress:opacity-100 shadow-md transition-opacity"
                  style={{ left: `${progress}%` }}
                ></div>
              </div>
              
              {/* Button Row */}
              <div className="flex items-center justify-between text-zinc-200 gap-4">
                <div className="flex items-center gap-4">
                  <button onClick={togglePlay} className="hover:text-white transition-colors">
                      {isPlaying ? <Pause size={20} strokeWidth={2} /> : <Play size={20} strokeWidth={2} />}
                  </button>
                  <button onClick={handleSkip} className="hover:text-white active:scale-95 transition-transform"><SkipForward size={20} strokeWidth={2} /></button>
                  <div className="flex items-center gap-2 group/vol">
                    <button onClick={toggleMute} className="hover:text-white transition-colors">
                      {isMuted ? <VolumeX size={20} strokeWidth={2} /> : <Volume2 size={20} strokeWidth={2} />}
                    </button>
                    <div className="w-0 overflow-hidden group-hover/vol:w-16 transition-all duration-300">
                      <div 
                          className="h-1 bg-zinc-600 rounded-full w-14 ml-2 cursor-pointer relative"
                          onClick={handleVolumeChange}
                      >
                          <div className="h-full bg-white rounded-full" style={{ width: `${volume * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                      {formatTime(currentTime)} / {formatTime(duration || 0)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                      onClick={() => { setIsHD(!isHD); toast.info(isHD ? 'Switched to SD quality' : 'Switched to HD quality'); }}
                      className={`text-xs font-medium hover:text-white px-2 py-0.5 rounded border ${isHD ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-white/10 text-zinc-400 border-white/5'}`}
                  >
                      {isHD ? 'HD' : 'SD'}
                  </button>
                  <button onClick={togglePiP} className="hover:text-white"><PictureInPicture2 size={20} strokeWidth={2} /></button>
                  <button onClick={toggleFullscreen} className="hover:text-white"><Maximize size={20} strokeWidth={2} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Analysis Results Panel */}
      {(currentAnalysis || analysisHistory.length > 0) && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
          {/* Header with Tabs */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-500/10 to-transparent border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-500" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">AI Coach Analysis</span>
            </div>
            
            {/* Tab Buttons */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg p-0.5">
              <button
                onClick={() => setShowHistory(false)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  !showHistory 
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                Current
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                  showHistory 
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <History size={12} />
                History
                {analysisHistory.length > 0 && (
                  <span className="bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-[10px] px-1.5 rounded-full">
                    {analysisHistory.length}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          {/* Content Area */}
          <div className="p-4">
            {!showHistory ? (
              // Current Analysis View
              currentAnalysis ? (
                <div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                      {currentAnalysis.analysis_text}
                    </div>
                  </div>
                  {currentAnalysis.created_at && (
                    <p className="text-[10px] text-zinc-400 mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                      <span>Analyzed {new Date(currentAnalysis.created_at).toLocaleString()}</span>
                      {currentAnalysis.frame_count && (
                        <span className="bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded">
                          {currentAnalysis.frame_count} frames
                        </span>
                      )}
                    </p>
                  )}
                  
                  {/* Generate Custom Drills Button */}
                  <CustomDrillsGenerator 
                    analysisText={currentAnalysis.analysis_text}
                    discipline={discipline}
                    onDrillsGenerated={onDrillsGenerated}
                  />
                </div>
              ) : (
                <NoAnalysesEmpty />
              )
            ) : (
              // History View
              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                {isLoadingHistory ? (
                  <div className="text-center py-6 text-zinc-500">
                    <Loader2 className="w-6 h-6 mx-auto animate-spin mb-2" />
                    <p className="text-xs">Loading history...</p>
                  </div>
                ) : analysisHistory.length === 0 ? (
                  <NoAnalysesEmpty />
                ) : (
                  analysisHistory.map((analysis, index) => (
                    <button
                      key={analysis.id || index}
                      onClick={() => {
                        setCurrentAnalysis(analysis);
                        setShowHistory(false);
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                        currentAnalysis?.id === analysis.id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          {analysis.created_at 
                            ? new Date(analysis.created_at).toLocaleDateString(undefined, { 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : `Analysis ${index + 1}`
                          }
                        </span>
                        {analysis.frame_count && (
                          <span className="text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                            {analysis.frame_count} frames
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                        {analysis.analysis_text.slice(0, 100)}...
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteVideoTarget} onOpenChange={(open) => !open && setDeleteVideoTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteVideoTarget?.title}&quot;? This will permanently remove the video and all its AI analyses. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Video
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
