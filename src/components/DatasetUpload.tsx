import React, { useState, useRef } from 'react';
import { Upload, Folder, FileAudio, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { AudioProcessor } from '../utils/audioProcessor';
import { EmotionModel } from '../utils/emotionModel';

interface DatasetFile {
  name: string;
  path: string;
  actor: string;
  emotion: string;
  intensity: string;
  statement: string;
  repetition: string;
  size: number;
}

interface DatasetUploadProps {
  onDatasetUploaded: (files: DatasetFile[]) => void;
}

export default function DatasetUpload({ onDatasetUploaded }: DatasetUploadProps) {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadedFiles, setUploadedFiles] = useState<DatasetFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioProcessor = new AudioProcessor();
  const emotionModel = new EmotionModel();

  // RAVDESS emotion mapping
  const emotionMap: Record<string, string> = {
    '01': 'neutral',
    '02': 'calm',
    '03': 'happy',
    '04': 'sad',
    '05': 'angry',
    '06': 'fearful',
    '07': 'disgust',
    '08': 'surprised'
  };

  const intensityMap: Record<string, string> = {
    '01': 'normal',
    '02': 'strong'
  };

  const statementMap: Record<string, string> = {
    '01': 'Kids are talking by the door',
    '02': 'Dogs are sitting by the door'
  };

  const parseRAVDESSFilename = (filename: string): Partial<DatasetFile> => {
    // RAVDESS format: Modality-VocalChannel-Emotion-EmotionalIntensity-Statement-Repetition-Actor.wav
    const parts = filename.replace('.wav', '').split('-');
    
    if (parts.length === 7) {
      return {
        emotion: emotionMap[parts[2]] || 'unknown',
        intensity: intensityMap[parts[3]] || 'unknown',
        statement: statementMap[parts[4]] || 'unknown',
        repetition: parts[5],
        actor: `Actor_${parts[6].padStart(2, '0')}`
      };
    }
    
    return {};
  };

  const processAudioFile = async (file: File): Promise<number[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // Extract features
          const mfccFeatures = await audioProcessor.extractMFCC(audioBuffer);
          const spectralFeatures = audioProcessor.extractSpectralFeatures(audioBuffer);
          const prosodicFeatures = audioProcessor.extractProsodicFeatures(audioBuffer);
          
          // Average MFCC features across time
          const avgMFCC = mfccFeatures[0].map((_, i) => 
            mfccFeatures.reduce((sum, frame) => sum + frame[i], 0) / mfccFeatures.length
          );
          
          // Combine all features
          const combinedFeatures = [...spectralFeatures, ...prosodicFeatures, ...avgMFCC];
          resolve(combinedFeatures);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadStatus('uploading');
    setUploadProgress(0);

    const processedFiles: DatasetFile[] = [];
    const trainingData: { features: number[]; emotion: string }[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check if it's an audio file
      if (file.type.startsWith('audio/') || file.name.endsWith('.wav')) {
        const parsedData = parseRAVDESSFilename(file.name);
        
        const datasetFile: DatasetFile = {
          name: file.name,
          path: file.webkitRelativePath || file.name,
          size: file.size,
          ...parsedData,
          actor: parsedData.actor || 'Unknown',
          emotion: parsedData.emotion || 'unknown',
          intensity: parsedData.intensity || 'unknown',
          statement: parsedData.statement || 'unknown',
          repetition: parsedData.repetition || 'unknown'
        };

        processedFiles.push(datasetFile);
        
        // Process audio for training if it's a valid emotion
        if (parsedData.emotion && parsedData.emotion !== 'unknown') {
          try {
            const features = await processAudioFile(file);
            trainingData.push({
              features,
              emotion: parsedData.emotion
            });
          } catch (error) {
            console.error('Error processing audio file:', file.name, error);
          }
        }
      }

      setUploadProgress(((i + 1) / totalFiles) * 100);
    }

    if (processedFiles.length > 0) {
      setUploadedFiles(processedFiles);
      setUploadStatus('success');
      onDatasetUploaded(processedFiles);
      
      // Start training the model
      if (trainingData.length > 0) {
        setIsTraining(true);
        setTrainingProgress(0);
        
        try {
          await emotionModel.trainModel(trainingData);
          setIsTraining(false);
          setTrainingProgress(100);
          
          // Save trained model to localStorage
          localStorage.setItem('emotionModel', JSON.stringify(emotionModel.exportModel()));
          
          alert(`Model training completed! Trained on ${trainingData.length} audio samples.`);
        } catch (error) {
          console.error('Training error:', error);
          setIsTraining(false);
          alert('Model training failed. Using rule-based prediction.');
        }
      }
    } else {
      setUploadStatus('error');
    }
  };

  const handleFolderUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getActorStats = () => {
    const actorCounts = uploadedFiles.reduce((acc, file) => {
      acc[file.actor] = (acc[file.actor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(actorCounts).sort();
  };

  const getEmotionStats = () => {
    const emotionCounts = uploadedFiles.reduce((acc, file) => {
      acc[file.emotion] = (acc[file.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(emotionCounts).sort(([, a], [, b]) => b - a);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center space-x-3 mb-6">
        <Database className="text-blue-500" size={24} />
        <h2 className="text-xl font-bold text-white">RAVDESS Dataset Upload</h2>
      </div>

      {/* Upload Area */}
      <div className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          webkitdirectory=""
          directory=""
          accept="audio/*,.wav"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div
          onClick={handleFolderUpload}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            uploadStatus === 'uploading' || isTraining
              ? 'border-blue-500 bg-blue-500/10'
              : uploadStatus === 'success'
              ? 'border-green-500 bg-green-500/10'
              : uploadStatus === 'error'
              ? 'border-red-500 bg-red-500/10'
              : 'border-gray-600 bg-gray-700/50 hover:border-blue-500 hover:bg-blue-500/5'
          }`}
        >
          <div className="flex flex-col items-center space-y-3">
            {uploadStatus === 'uploading' || isTraining ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            ) : uploadStatus === 'success' ? (
              <CheckCircle className="text-green-500" size={48} />
            ) : uploadStatus === 'error' ? (
              <AlertCircle className="text-red-500" size={48} />
            ) : (
              <Folder className="text-gray-400" size={48} />
            )}

            <div>
              <p className="text-white font-medium">
                {isTraining
                  ? 'Training Model...'
                  : uploadStatus === 'uploading'
                  ? 'Processing Dataset...'
                  : uploadStatus === 'success'
                  ? 'Dataset Uploaded Successfully!'
                  : uploadStatus === 'error'
                  ? 'Upload Failed'
                  : 'Upload RAVDESS Dataset Folder'}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {uploadStatus === 'idle' && 'Select the RAVDESS folder containing Actor_01 to Actor_24 subfolders'}
                {isTraining && `Training Progress: ${trainingProgress.toFixed(0)}%`}
                {uploadStatus === 'uploading' && !isTraining && `Processing: ${uploadProgress.toFixed(0)}%`}
                {uploadStatus === 'success' && `${uploadedFiles.length} audio files processed`}
                {uploadStatus === 'error' && 'Please select a valid RAVDESS dataset folder'}
              </p>
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {(uploadStatus === 'uploading' || isTraining) && (
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${isTraining ? trainingProgress : uploadProgress}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* Dataset Statistics */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-medium text-white">Dataset Overview</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Actor Distribution */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3 flex items-center space-x-2">
                <FileAudio size={16} />
                <span>Actors ({getActorStats().length})</span>
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {getActorStats().map(([actor, count]) => (
                  <div key={actor} className="flex justify-between text-sm">
                    <span className="text-gray-300">{actor}</span>
                    <span className="text-gray-400">{count} files</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Emotion Distribution */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">Emotion Distribution</h4>
              <div className="space-y-2">
                {getEmotionStats().map(([emotion, count]) => (
                  <div key={emotion} className="flex justify-between text-sm">
                    <span className="text-gray-300 capitalize">{emotion}</span>
                    <span className="text-gray-400">{count} samples</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-400 text-sm">
              <strong>Dataset Ready:</strong> {uploadedFiles.length} audio files from {getActorStats().length} actors 
              covering {getEmotionStats().length} different emotions. 
              {isTraining ? ' Model is currently training...' : ' Model training completed!'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}