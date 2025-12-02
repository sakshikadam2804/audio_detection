import React, { useState, useRef } from 'react';
import { Mic, MicOff, Square, Play } from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';
import { AudioProcessor } from '../utils/audioProcessor';
import { EmotionModel } from '../utils/emotionModel';

export default function AudioRecorder() {
  const { 
    isRecording, 
    startRecording, 
    stopRecording, 
    addRecording,
    isModelTrained 
  } = useAudio();
  
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
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

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setRecordingDuration((Date.now() - recordingStartTime) / 1000);
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording, recordingStartTime]);

  const getEmotionPrediction = async (audioBlob: Blob): Promise<{ emotion: string; confidence: number; probabilities: number[] }> => {
    try {
      setIsProcessing(true);
      const arrayBuffer = await audioBlob.arrayBuffer();
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
      
      // Predict emotion using the trained model
      const prediction = emotionModel.predict(combinedFeatures);
      return prediction;
    } catch (error) {
      console.error('Error in emotion prediction:', error);
      // Fallback to neutral emotion
      return { 
        emotion: 'neutral', 
        confidence: 0.5,
        probabilities: [0.5, 0.1, 0.1, 0.1, 0.1, 0.05, 0.025, 0.025]
      };
    } finally {
      setIsProcessing(false);
    }
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(blob);
        const duration = (Date.now() - recordingStartTime) / 1000;
        
        // Get emotion prediction
        const prediction = await getEmotionPrediction(blob);
        
        // Generate waveform visualization
        const waveform = Array.from({ length: 100 }, (_, i) => {
          const baseAmplitude = Math.sin(i * 0.1) * 0.5 + 0.5;
          const noise = (Math.random() - 0.5) * 0.3;
          return Math.max(0, Math.min(1, baseAmplitude + noise));
        });

        const recording = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          duration,
          emotion: prediction.emotion,
          confidence: prediction.confidence,
          probabilities: prediction.probabilities,
          audioUrl,
          waveform,
          modelUsed: emotionModel.getModelInfo().name + ' ' + emotionModel.getModelInfo().version,
          fileSize: blob.size
        };

        addRecording(recording);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        setRecordingDuration(0);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecordingStartTime(Date.now());
      startRecording();
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Error accessing microphone. Please ensure microphone permissions are granted.');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setMediaRecorder(null);
    }
    stopRecording();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center space-x-3 mb-6">
        <Mic className="text-green-500" size={24} />
        <h2 className="text-xl font-bold text-white">Audio Recording</h2>
      </div>

      <div className="space-y-6">
        {/* Recording Controls */}
        <div className="text-center space-y-4">
          <div className={`w-32 h-32 mx-auto rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
            isRecording 
              ? 'border-red-500 bg-red-500/20 animate-pulse' 
              : isProcessing
              ? 'border-blue-500 bg-blue-500/20'
              : 'border-green-500 bg-green-500/20 hover:bg-green-500/30'
          }`}>
            <button
              onClick={isRecording ? stopAudioRecording : startAudioRecording}
              disabled={isProcessing}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : isProcessing
                  ? 'bg-blue-600'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              ) : isRecording ? (
                <Square size={32} />
              ) : (
                <Mic size={32} />
              )}
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-white font-medium">
              {isProcessing 
                ? 'Analyzing Audio...' 
                : isRecording 
                ? 'Recording...' 
                : 'Click to start recording'
              }
            </p>
            {isRecording && (
              <p className="text-green-400 text-lg font-mono">
                {formatDuration(recordingDuration)}
              </p>
            )}
          </div>
        </div>

        {/* Recording Status */}
        <div className={`p-4 rounded-lg border-2 border-dashed transition-all ${
          isProcessing
            ? 'border-blue-500 bg-blue-500/10'
            : isRecording 
            ? 'border-red-500 bg-red-500/10' 
            : 'border-gray-600 bg-gray-700/50'
        }`}>
          <div className="flex items-center justify-center space-x-2">
            {isProcessing ? (
              <>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-blue-400 text-sm">Processing audio for emotion analysis</span>
              </>
            ) : isRecording ? (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-400 text-sm">Recording audio for emotion analysis</span>
              </>
            ) : (
              <>
                <MicOff className="text-gray-400" size={16} />
                <span className="text-gray-400 text-sm">Ready to record</span>
              </>
            )}
          </div>
        </div>

        {/* Model Status */}
        <div className={`p-4 rounded-lg border ${
          isModelTrained 
            ? 'border-green-500/30 bg-green-500/10' 
            : 'border-orange-500/30 bg-orange-500/10'
        }`}>
          <h3 className={`font-medium mb-2 ${
            isModelTrained ? 'text-green-400' : 'text-orange-400'
          }`}>
            {isModelTrained ? 'Neural Network Model Active' : 'Rule-Based Prediction Active'}
          </h3>
          <p className={`text-sm ${
            isModelTrained ? 'text-green-300' : 'text-orange-300'
          }`}>
            {isModelTrained 
              ? 'Using trained neural network for accurate emotion prediction'
              : 'Upload RAVDESS dataset to train the neural network for better accuracy'
            }
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <h3 className="font-medium text-blue-400 mb-2">Recording Tips</h3>
          <ul className="text-blue-300 text-sm space-y-1">
            <li>• Speak clearly and naturally for 3-10 seconds</li>
            <li>• Express emotions naturally for better detection</li>
            <li>• Ensure minimal background noise</li>
            <li>• Wait for analysis to complete before recording again</li>
          </ul>
        </div>
      </div>
    </div>
  );
}