"use client";

import * as React from "react";

interface UseAudioRecorderOptions {
  onRecordingComplete?: (blob: Blob) => void;
  onError?: (error: Error) => void;
  maxDuration?: number; // in seconds
}

interface UseAudioRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  audioLevel: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  recordedBlob: Blob | null;
  recordedUrl: string | null;
  hasPermission: boolean | null;
  requestPermission: () => Promise<boolean>;
  error: Error | null;
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}): UseAudioRecorderReturn {
  const { onRecordingComplete, onError, maxDuration = 30 } = options;
  
  const [isRecording, setIsRecording] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [recordingTime, setRecordingTime] = React.useState(0);
  const [audioLevel, setAudioLevel] = React.useState(0);
  const [recordedBlob, setRecordedBlob] = React.useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = React.useState<string | null>(null);
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const animationRef = React.useRef<number | null>(null);
  
  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    };
  }, [recordedUrl]);
  
  const requestPermission = React.useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      return true;
    } catch (err) {
      setHasPermission(false);
      setError(new Error("Microphone permission denied"));
      return false;
    }
  }, []);
  
  // Check permission on mount
  React.useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.permissions) {
      navigator.permissions.query({ name: "microphone" as PermissionName })
        .then(result => {
          setHasPermission(result.state === "granted");
        })
        .catch(() => {
          // Permissions API not supported, will check on first use
        });
    }
  }, []);
  
  const updateAudioLevel = React.useCallback(() => {
    if (!analyserRef.current || !isRecording || isPaused) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate average level
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    setAudioLevel(Math.min(100, (average / 128) * 100));
    
    animationRef.current = requestAnimationFrame(updateAudioLevel);
  }, [isRecording, isPaused]);
  
  const startRecording = React.useCallback(async () => {
    try {
      setError(null);
      setRecordedBlob(null);
      
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
        setRecordedUrl(null);
      }
      
      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      streamRef.current = stream;
      setHasPermission(true);
      
      // Setup audio analysis for level meter
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        
        onRecordingComplete?.(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Close audio context
        audioContext.close();
      };
      
      mediaRecorder.onerror = (event) => {
        const err = new Error("Recording failed");
        setError(err);
        onError?.(err);
      };
      
      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
      
      // Start audio level monitoring
      updateAudioLevel();
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to start recording");
      setError(error);
      setHasPermission(false);
      onError?.(error);
    }
  }, [maxDuration, onRecordingComplete, onError, recordedUrl, updateAudioLevel]);
  
  const stopRecording = React.useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    setIsRecording(false);
    setIsPaused(false);
    setAudioLevel(0);
  }, []);
  
  const pauseRecording = React.useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
  }, []);
  
  const resumeRecording = React.useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
      
      // Resume audio level monitoring
      updateAudioLevel();
    }
  }, [maxDuration, stopRecording, updateAudioLevel]);
  
  return {
    isRecording,
    isPaused,
    recordingTime,
    audioLevel,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    recordedBlob,
    recordedUrl,
    hasPermission,
    requestPermission,
    error,
  };
}

// Utility to convert Blob to File
export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}

// Format recording time as MM:SS
export function formatRecordingTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
