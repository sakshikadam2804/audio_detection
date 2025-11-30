import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AudioRecording {
  id: string;
  timestamp: number;
  duration: number;
  emotion: string;
  confidence: number;
  audioUrl: string;
  waveform: number[];
  modelUsed: string;
}

export interface DatasetFile {
  name: string;
  path: string;
  actor: string;
  emotion: string;
  intensity: string;
  statement: string;
  repetition: string;
  size: number;
}

interface AudioContextType {
  currentEmotion: string | null;
  currentConfidence: number;
  recordings: AudioRecording[];
  datasetFiles: DatasetFile[];
  isRecording: boolean;
  isAnalyzing: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  addRecording: (recording: AudioRecording) => void;
  deleteRecording: (id: string) => void;
  setDatasetFiles: (files: DatasetFile[]) => void;
  startAnalysis: () => void;
  stopAnalysis: () => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

const emotions = ['neutral', 'calm', 'happy', 'sad', 'angry', 'fearful', 'disgust', 'surprised'];

function generateMockEmotion() {
  const emotionWeights = {
    neutral: 25,
    calm: 20,
    happy: 15,
    sad: 12,
    angry: 8,
    fearful: 6,
    disgust: 5,
    surprised: 9
  };

  const totalWeight = Object.values(emotionWeights).reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (const [emotion, weight] of Object.entries(emotionWeights)) {
    random -= weight;
    if (random <= 0) {
      return {
        emotion,
        confidence: 0.65 + Math.random() * 0.3
      };
    }
  }

  return { emotion: 'neutral', confidence: 0.8 };
}

export default function AudioContextProvider({ children }: { children: React.ReactNode }) {
  const [currentEmotion, setCurrentEmotion] = useState<string | null>(null);
  const [currentConfidence, setCurrentConfidence] = useState(0);
  const [recordings, setRecordings] = useState<AudioRecording[]>([]);
  const [datasetFiles, setDatasetFiles] = useState<DatasetFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isAnalyzing) {
      interval = setInterval(() => {
        const prediction = generateMockEmotion();
        setCurrentEmotion(prediction.emotion);
        setCurrentConfidence(prediction.confidence);
      }, 1500);
    }

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const startRecording = () => setIsRecording(true);
  const stopRecording = () => setIsRecording(false);
  const startAnalysis = () => setIsAnalyzing(true);
  const stopAnalysis = () => setIsAnalyzing(false);

  const addRecording = (recording: AudioRecording) => {
    setRecordings(prev => [recording, ...prev]);
  };

  const deleteRecording = (id: string) => {
    setRecordings(prev => prev.filter(r => r.id !== id));
  };

  return (
    <AudioContext.Provider value={{
      currentEmotion,
      currentConfidence,
      recordings,
      datasetFiles,
      isRecording,
      isAnalyzing,
      startRecording,
      stopRecording,
      addRecording,
      deleteRecording,
      setDatasetFiles,
      startAnalysis,
      stopAnalysis
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioContextProvider');
  }
  return context;
}