import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Recording {
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

export interface EmotionData {
  emotion: string;
  confidence: number;
  intensity: number;
}

export interface IntentData {
  intent: string;
  confidence: number;
  context: string;
}

export interface AnalysisData {
  timestamp: number;
  audio: EmotionData;
  video: EmotionData;
  text: EmotionData;
  intent: IntentData;
  overallSentiment: number; // -1 to 1
}

interface ContextType {
  currentAnalysis: AnalysisData | null;
  analysisHistory: AnalysisData[];
  recordings: Recording[];
  datasetFiles: DatasetFile[];
  isAnalyzing: boolean;
  currentContext: string;
  setCurrentContext: (context: string) => void;
  startAnalysis: () => void;
  stopAnalysis: () => void;
  addRecording: (recording: Recording) => void;
  deleteRecording: (id: string) => void;
  setDatasetFiles: (files: DatasetFile[]) => void;
}

const AnalysisContext = createContext<ContextType | null>(null);

const emotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'neutral', 'stress', 'confusion', 'hesitation'];
const intents = ['question', 'complaint', 'compliment', 'request', 'information', 'support', 'booking', 'cancellation'];
const contexts = ['customer-service', 'healthcare', 'education', 'retail', 'hospitality'];

function generateMockAnalysis(context: string): AnalysisData {
  const getRandomEmotion = () => ({
    emotion: emotions[Math.floor(Math.random() * emotions.length)],
    confidence: 0.6 + Math.random() * 0.4,
    intensity: Math.random()
  });

  const getRandomIntent = () => ({
    intent: intents[Math.floor(Math.random() * intents.length)],
    confidence: 0.7 + Math.random() * 0.3,
    context
  });

  return {
    timestamp: Date.now(),
    audio: getRandomEmotion(),
    video: getRandomEmotion(),
    text: getRandomEmotion(),
    intent: getRandomIntent(),
    overallSentiment: (Math.random() - 0.5) * 2
  };
}

export default function ContextProvider({ children }: { children: React.ReactNode }) {
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisData | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisData[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [datasetFiles, setDatasetFiles] = useState<DatasetFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentContext, setCurrentContext] = useState('customer-service');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isAnalyzing) {
      interval = setInterval(() => {
        const newAnalysis = generateMockAnalysis(currentContext);
        setCurrentAnalysis(newAnalysis);
        setAnalysisHistory(prev => [...prev.slice(-49), newAnalysis]);
      }, 2000);
    }

    return () => clearInterval(interval);
  }, [isAnalyzing, currentContext]);

  const startAnalysis = () => setIsAnalyzing(true);
  const stopAnalysis = () => setIsAnalyzing(false);

  const addRecording = (recording: Recording) => {
    setRecordings(prev => [recording, ...prev]);
  };

  const deleteRecording = (id: string) => {
    setRecordings(prev => prev.filter(r => r.id !== id));
  };

  return (
    <AnalysisContext.Provider value={{
      currentAnalysis,
      analysisHistory,
      recordings,
      datasetFiles,
      isAnalyzing,
      currentContext,
      setCurrentContext,
      startAnalysis,
      stopAnalysis,
      addRecording,
      deleteRecording,
      setDatasetFiles
    }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within ContextProvider');
  }
  return context;
}