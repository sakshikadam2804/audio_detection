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
  probabilities: number[];
  fileName?: string;
  fileSize?: number;
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
  currentProbabilities: number[];
  recordings: AudioRecording[];
  datasetFiles: DatasetFile[];
  isRecording: boolean;
  isAnalyzing: boolean;
  isModelTrained: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  addRecording: (recording: AudioRecording) => void;
  deleteRecording: (id: string) => void;
  setDatasetFiles: (files: DatasetFile[]) => void;
  startAnalysis: () => void;
  stopAnalysis: () => void;
  setCurrentEmotion: (emotion: string, confidence: number, probabilities: number[]) => void;
  setModelTrained: (trained: boolean) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

const STORAGE_KEYS = {
  RECORDINGS: 'audioEmotionRecordings',
  DATASET_FILES: 'audioEmotionDatasetFiles',
  MODEL_TRAINED: 'audioEmotionModelTrained'
};

export default function AudioContextProvider({ children }: { children: React.ReactNode }) {
  const [currentEmotion, setCurrentEmotionState] = useState<string | null>(null);
  const [currentConfidence, setCurrentConfidence] = useState(0);
  const [currentProbabilities, setCurrentProbabilities] = useState<number[]>([]);
  const [recordings, setRecordings] = useState<AudioRecording[]>([]);
  const [datasetFiles, setDatasetFilesState] = useState<DatasetFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isModelTrained, setIsModelTrained] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedRecordings = localStorage.getItem(STORAGE_KEYS.RECORDINGS);
    const savedDatasetFiles = localStorage.getItem(STORAGE_KEYS.DATASET_FILES);
    const savedModelTrained = localStorage.getItem(STORAGE_KEYS.MODEL_TRAINED);

    if (savedRecordings) {
      try {
        setRecordings(JSON.parse(savedRecordings));
      } catch (error) {
        console.error('Error loading recordings:', error);
      }
    }

    if (savedDatasetFiles) {
      try {
        setDatasetFilesState(JSON.parse(savedDatasetFiles));
      } catch (error) {
        console.error('Error loading dataset files:', error);
      }
    }

    if (savedModelTrained) {
      setIsModelTrained(JSON.parse(savedModelTrained));
    }
  }, []);

  // Save recordings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECORDINGS, JSON.stringify(recordings));
  }, [recordings]);

  // Save dataset files to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DATASET_FILES, JSON.stringify(datasetFiles));
  }, [datasetFiles]);

  // Save model trained status
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MODEL_TRAINED, JSON.stringify(isModelTrained));
  }, [isModelTrained]);

  const startRecording = () => {
    setIsRecording(true);
    setIsAnalyzing(false); // Stop analysis when recording starts
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const startAnalysis = () => {
    if (!isRecording) { // Only start analysis if not recording
      setIsAnalyzing(true);
    }
  };

  const stopAnalysis = () => {
    setIsAnalyzing(false);
    setCurrentEmotionState(null);
    setCurrentConfidence(0);
    setCurrentProbabilities([]);
  };

  const addRecording = (recording: AudioRecording) => {
    setRecordings(prev => [recording, ...prev]);
  };

  const deleteRecording = (id: string) => {
    setRecordings(prev => prev.filter(r => r.id !== id));
  };

  const setDatasetFiles = (files: DatasetFile[]) => {
    setDatasetFilesState(files);
  };

  const setCurrentEmotion = (emotion: string, confidence: number, probabilities: number[]) => {
    setCurrentEmotionState(emotion);
    setCurrentConfidence(confidence);
    setCurrentProbabilities(probabilities);
  };

  const setModelTrained = (trained: boolean) => {
    setIsModelTrained(trained);
  };

  return (
    <AudioContext.Provider value={{
      currentEmotion,
      currentConfidence,
      currentProbabilities,
      recordings,
      datasetFiles,
      isRecording,
      isAnalyzing,
      isModelTrained,
      startRecording,
      stopRecording,
      addRecording,
      deleteRecording,
      setDatasetFiles,
      startAnalysis,
      stopAnalysis,
      setCurrentEmotion,
      setModelTrained
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