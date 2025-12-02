import React, { useState, useRef } from 'react';
import { Upload, FileAudio, Play, BarChart3, CheckCircle } from 'lucide-react';
import { AudioProcessor } from '../utils/audioProcessor';
import { EmotionModel } from '../utils/emotionModel';
import { useAudio } from '../contexts/AudioContext';

export default function AudioFileUpload() {
  const { addRecording, isModelTrained } = useAudio();
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [audioProcessor] = useState(new AudioProcessor());
  const [emotionModel] = useState(() => {
    const model = new EmotionModel();
    // Try to load trained model from localStorage
    const savedModel = localStorage.getItem('emotionModel');
    if (savedModel) {
      try {
        model.importModel(JSON.parse(savedModel));
      } catch (error) {
        console.error('Error loading saved model:', error);
      }
    }
    return model;
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      alert('Please select an audio file');
      return;
    }

    setUploadedFile(file);
    setAudioUrl(URL.createObjectURL(file));
    setIsProcessing(true);
    setPredictionResult(null);

    try {
      // Process the audio file
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Extract features
      const mfccFeatures = await audioProcessor.extractMFCC(audioBuffer);
      const spectralFeatures = audioProcessor.extractSpectralFeatures(audioBuffer);
      const prosodicFeatures = audioProcessor.extractProsodicFeatures(audioBuffer);
      
      // Average MFCC features across time
      const avgMFCC = mfccFeatures[0] ? mfccFeatures[0].map((_, i) => 
        mfccFeatures.reduce((sum, frame) => sum + frame[i], 0) / mfccFeatures.length
      ) : Array(13).fill(0);
      
      // Combine all features
      const combinedFeatures = [...spectralFeatures, ...prosodicFeatures, ...avgMFCC];
      
      // Predict emotion
      const prediction = emotionModel.predict(combinedFeatures);
      
      // Generate waveform for visualization
      const channelData = audioBuffer.getChannelData(0);
      const waveform = Array.from({ length: 100 }, (_, i) => {
        const sampleIndex = Math.floor((i / 100) * channelData.length);
        return Math.abs(channelData[sampleIndex] || 0);
      });

      const result = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        duration: audioBuffer.duration,
        emotion: prediction.emotion,
        confidence: prediction.confidence,
        probabilities: prediction.probabilities,
        audioUrl,
        waveform,
        modelUsed: emotionModel.getModelInfo().name + ' ' + emotionModel.getModelInfo().version,
        fileName: file.name,
        fileSize: file.size
      };

      setPredictionResult(result);
      addRecording(result);
      
    } catch (error) {
      console.error('Error processing audio file:', error);
      alert('Error processing audio file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  const EmotionPieChart = ({ probabilities }: { probabilities: number[] }) => {
    const emotions = ['neutral', 'calm', 'happy', 'sad', 'angry', 'fearful', 'disgust', 'surprised'];
    const colors = ['#6B7280', '#14B8A6', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899', '#F59E0B'];
    
    let cumulativePercentage = 0;
    
    return (
      <div className="flex items-center justify-center space-x-8">
        <div className="relative w-40 h-40">
          <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
            {probabilities.map((prob, index) => {
              const percentage = prob * 100;
              if (percentage < 1) return null;
              
              const strokeDasharray = `${percentage} ${100 - percentage}`;
              const strokeDashoffset = -cumulativePercentage;
              cumulativePercentage += percentage;
              
              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r="15.915"
                  fill="transparent"
                  stroke={colors[index]}
                  strokeWidth="6"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-white font-bold text-lg capitalize">{predictionResult?.emotion}</p>
              <p className="text-gray-400 text-sm">{(predictionResult?.confidence * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          {emotions.map((emotion, index) => (
            <div key={emotion} className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: colors[index] }}
              ></div>
              <span className="text-gray-300 text-sm capitalize w-16">{emotion}</span>
              <span className="text-gray-400 text-sm font-mono">
                {(probabilities[index] * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center space-x-3 mb-6">
        <FileAudio className="text-purple-500" size={24} />
        <h2 className="text-xl font-bold text-white">Audio File Upload & Prediction</h2>
      </div>

      {/* File Upload */}
      <div className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isProcessing
              ? 'border-blue-500 bg-blue-500/10'
              : predictionResult
              ? 'border-green-500 bg-green-500/10'
              : 'border-gray-600 bg-gray-700/50 hover:border-purple-500 hover:bg-purple-500/5'
          }`}
        >
          <div className="flex flex-col items-center space-y-3">
            {isProcessing ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            ) : predictionResult ? (
              <CheckCircle className="text-green-500" size={48} />
            ) : (
              <Upload className="text-gray-400" size={48} />
            )}

            <div>
              <p className="text-white font-medium">
                {isProcessing 
                  ? 'Processing Audio...' 
                  : predictionResult
                  ? 'Audio Processed Successfully!'
                  : 'Upload Audio File for Emotion Prediction'
                }
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {isProcessing 
                  ? 'Analyzing audio features and predicting emotion...' 
                  : 'Supports WAV, MP3, M4A, and other audio formats'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Model Status */}
        <div className={`p-3 rounded-lg border ${
          isModelTrained 
            ? 'border-green-500/30 bg-green-500/10' 
            : 'border-orange-500/30 bg-orange-500/10'
        }`}>
          <p className={`text-sm ${
            isModelTrained ? 'text-green-400' : 'text-orange-400'
          }`}>
            {isModelTrained 
              ? '✓ Using trained neural network for prediction'
              : '⚠ Using rule-based prediction - Upload RAVDESS dataset for better accuracy'
            }
          </p>
        </div>

        {/* Uploaded File Info */}
        {uploadedFile && (
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileAudio className="text-purple-500" size={20} />
                <div>
                  <p className="text-white font-medium">{uploadedFile.name}</p>
                  <p className="text-gray-400 text-sm">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={playAudio}
                className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                <Play size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Prediction Results */}
        {predictionResult && (
          <div className="space-y-6">
            <div className="bg-gray-700/50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-6 flex items-center space-x-2">
                <BarChart3 size={20} />
                <span>Emotion Prediction Results</span>
              </h3>
              
              <EmotionPieChart probabilities={predictionResult.probabilities} />
            </div>

            {/* Waveform Visualization */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Audio Waveform</h4>
              <div className="flex items-end space-x-1 h-20 bg-gray-900 rounded p-2">
                {predictionResult.waveform.map((amplitude: number, index: number) => (
                  <div
                    key={index}
                    className="bg-purple-500 w-1 rounded-t transition-all duration-300"
                    style={{ height: `${Math.max(4, amplitude * 100)}%` }}
                  ></div>
                ))}
              </div>
            </div>

            {/* Model Information */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-400 text-sm">
                <strong>Model:</strong> {predictionResult.modelUsed}<br/>
                <strong>Processing:</strong> Real-time feature extraction and neural network prediction<br/>
                <strong>Features:</strong> MFCC (13), Spectral (4), Prosodic (3) = 20 total features<br/>
                <strong>Duration:</strong> {predictionResult.duration.toFixed(2)} seconds
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}