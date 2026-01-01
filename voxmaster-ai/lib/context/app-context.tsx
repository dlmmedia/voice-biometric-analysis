"use client";

import * as React from "react";
import { AnalysisResponse, VoiceSignature } from "@/lib/api";

interface AnalysisResult extends AnalysisResponse {
  id: string;
}

interface AppContextType {
  // Current analysis result
  currentAnalysis: AnalysisResult | null;
  setCurrentAnalysis: (analysis: AnalysisResult | null) => void;
  
  // Voice signatures cache
  voiceSignatures: VoiceSignature[];
  setVoiceSignatures: (signatures: VoiceSignature[]) => void;
  refreshSignatures: () => Promise<void>;
  
  // API configuration
  apiUrl: string;
  isBackendConnected: boolean;
  setBackendConnected: (connected: boolean) => void;
  
  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const AppContext = React.createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentAnalysis, setCurrentAnalysis] = React.useState<AnalysisResult | null>(null);
  const [voiceSignatures, setVoiceSignatures] = React.useState<VoiceSignature[]>([]);
  const [isBackendConnected, setBackendConnected] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  
  // Check backend connection on mount
  React.useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/health`);
        if (response.ok) {
          setBackendConnected(true);
        }
      } catch (error) {
        console.warn("Backend not connected:", error);
        setBackendConnected(false);
      }
    };
    
    checkConnection();
    // Recheck every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [apiUrl]);
  
  // Refresh voice signatures
  const refreshSignatures = React.useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/biometrics/signatures`);
      if (response.ok) {
        const data = await response.json();
        setVoiceSignatures(data.signatures || []);
      }
    } catch (error) {
      console.error("Failed to fetch signatures:", error);
    }
  }, [apiUrl]);
  
  // Load signatures on mount if connected
  React.useEffect(() => {
    if (isBackendConnected) {
      refreshSignatures();
    }
  }, [isBackendConnected, refreshSignatures]);
  
  const value: AppContextType = {
    currentAnalysis,
    setCurrentAnalysis,
    voiceSignatures,
    setVoiceSignatures,
    refreshSignatures,
    apiUrl,
    isBackendConnected,
    setBackendConnected,
    isLoading,
    setIsLoading,
  };
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = React.useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

export function useAnalysis() {
  const { currentAnalysis, setCurrentAnalysis, apiUrl } = useApp();
  
  const analyzeAudio = React.useCallback(async (
    file: File,
    audioType: "spoken" | "sung",
    promptType: "sustained" | "passage" | "verse"
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("audio_type", audioType);
    formData.append("prompt_type", promptType);
    
    const response = await fetch(`${apiUrl}/api/analyze/`, {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Analysis failed");
    }
    
    const result = await response.json();
    setCurrentAnalysis(result);
    return result;
  }, [apiUrl, setCurrentAnalysis]);
  
  const getAnalysis = React.useCallback(async (analysisId: string) => {
    const response = await fetch(`${apiUrl}/api/analyze/${analysisId}`);
    
    if (!response.ok) {
      throw new Error("Analysis not found");
    }
    
    const result = await response.json();
    setCurrentAnalysis(result);
    return result;
  }, [apiUrl, setCurrentAnalysis]);
  
  const listAnalyses = React.useCallback(async (limit = 20) => {
    const response = await fetch(`${apiUrl}/api/analyze/?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch analyses");
    }
    
    const data = await response.json();
    return data.analyses || [];
  }, [apiUrl]);
  
  return {
    currentAnalysis,
    analyzeAudio,
    getAnalysis,
    listAnalyses,
    clearAnalysis: () => setCurrentAnalysis(null),
  };
}

export function useBiometrics() {
  const { voiceSignatures, refreshSignatures, apiUrl } = useApp();
  
  const enrollVoice = React.useCallback(async (
    files: File[],
    name: string,
    includeSinging = false
  ) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("name", name);
    formData.append("include_singing", String(includeSinging));
    
    const response = await fetch(`${apiUrl}/api/biometrics/enroll`, {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Enrollment failed");
    }
    
    const result = await response.json();
    await refreshSignatures();
    return result;
  }, [apiUrl, refreshSignatures]);
  
  const verifyVoice = React.useCallback(async (
    file: File,
    signatureId?: string
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    if (signatureId) {
      formData.append("signature_id", signatureId);
    }
    
    const response = await fetch(`${apiUrl}/api/biometrics/verify`, {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Verification failed");
    }
    
    return response.json();
  }, [apiUrl]);
  
  const deleteSignature = React.useCallback(async (signatureId: string) => {
    const response = await fetch(`${apiUrl}/api/biometrics/signatures/${signatureId}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      throw new Error("Failed to delete signature");
    }
    
    await refreshSignatures();
    return response.json();
  }, [apiUrl, refreshSignatures]);
  
  const getVerificationHistory = React.useCallback(async (limit = 20) => {
    const response = await fetch(`${apiUrl}/api/biometrics/verifications?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch verification history");
    }
    
    const data = await response.json();
    return data.verifications || [];
  }, [apiUrl]);
  
  return {
    voiceSignatures,
    refreshSignatures,
    enrollVoice,
    verifyVoice,
    deleteSignature,
    getVerificationHistory,
  };
}

export function useGeneration() {
  const { apiUrl, voiceSignatures } = useApp();
  
  const generateVoice = React.useCallback(async (params: {
    text: string;
    signatureId: string;
    voiceType: string;
    inflections?: string[];
    perceptualProfile: string;
    pitchVariance?: number;
    speakingRate?: number;
    expressiveness?: number;
  }) => {
    const response = await fetch(`${apiUrl}/api/generate/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: params.text,
        signature_id: params.signatureId,
        voice_type: params.voiceType,
        inflections: params.inflections || [],
        perceptual_profile: params.perceptualProfile,
        pitch_variance: params.pitchVariance || 50,
        speaking_rate: params.speakingRate || 50,
        expressiveness: params.expressiveness || 70,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Generation failed");
    }
    
    return response.json();
  }, [apiUrl]);
  
  return {
    voiceSignatures,
    generateVoice,
  };
}

export function useReports() {
  const { apiUrl } = useApp();
  
  const createReport = React.useCallback(async (analysisId: string, format = "pdf") => {
    const response = await fetch(`${apiUrl}/api/reports/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        analysis_id: analysisId,
        format,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Report generation failed");
    }
    
    return response.json();
  }, [apiUrl]);
  
  const listReports = React.useCallback(async (reportType?: string, limit = 50) => {
    const params = new URLSearchParams();
    if (reportType) params.append("report_type", reportType);
    params.append("limit", String(limit));
    
    const response = await fetch(`${apiUrl}/api/reports/?${params}`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch reports");
    }
    
    const data = await response.json();
    return data.reports || [];
  }, [apiUrl]);
  
  const downloadReport = React.useCallback(async (reportId: string) => {
    const response = await fetch(`${apiUrl}/api/reports/${reportId}/download`);
    
    if (!response.ok) {
      throw new Error("Failed to download report");
    }
    
    return response.blob();
  }, [apiUrl]);
  
  const deleteReport = React.useCallback(async (reportId: string) => {
    const response = await fetch(`${apiUrl}/api/reports/${reportId}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      throw new Error("Failed to delete report");
    }
    
    return response.json();
  }, [apiUrl]);
  
  return {
    createReport,
    listReports,
    downloadReport,
    deleteReport,
  };
}

export function useSettings() {
  const { apiUrl } = useApp();
  
  const getSettings = React.useCallback(async () => {
    const response = await fetch(`${apiUrl}/api/settings/`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch settings");
    }
    
    return response.json();
  }, [apiUrl]);
  
  const updateSettings = React.useCallback(async (settings: Record<string, unknown>) => {
    const response = await fetch(`${apiUrl}/api/settings/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    });
    
    if (!response.ok) {
      throw new Error("Failed to update settings");
    }
    
    return response.json();
  }, [apiUrl]);
  
  const saveApiKey = React.useCallback(async (keyType: string, apiKey: string) => {
    const response = await fetch(`${apiUrl}/api/settings/api-keys`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key_type: keyType,
        api_key: apiKey,
      }),
    });
    
    if (!response.ok) {
      throw new Error("Failed to save API key");
    }
    
    return response.json();
  }, [apiUrl]);
  
  const verifyApiKey = React.useCallback(async (keyType: string, apiKey: string) => {
    const response = await fetch(`${apiUrl}/api/settings/api-keys/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key_type: keyType,
        api_key: apiKey,
      }),
    });
    
    if (!response.ok) {
      throw new Error("Failed to verify API key");
    }
    
    return response.json();
  }, [apiUrl]);
  
  const deleteAllSignatures = React.useCallback(async () => {
    const response = await fetch(`${apiUrl}/api/settings/data/signatures`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      throw new Error("Failed to delete signatures");
    }
    
    return response.json();
  }, [apiUrl]);
  
  const exportData = React.useCallback(async () => {
    const response = await fetch(`${apiUrl}/api/settings/data/export`);
    
    if (!response.ok) {
      throw new Error("Failed to export data");
    }
    
    return response.blob();
  }, [apiUrl]);
  
  return {
    getSettings,
    updateSettings,
    saveApiKey,
    verifyApiKey,
    deleteAllSignatures,
    exportData,
  };
}
