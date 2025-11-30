import React from 'react';
import { Brain, Cpu, Database, Zap } from 'lucide-react';

export default function ModelInfo() {
  const modelSpecs = {
    name: "EmotiNet-RAVDESS",
    version: "v2.1.0",
    architecture: "CNN + LSTM Hybrid",
    accuracy: "94.2%",
    trainingData: "RAVDESS + Custom Dataset",
    features: "MFCC, Spectral, Prosodic",
    latency: "< 100ms",
    modelSize: "12.4 MB"
  };

  const features = [
    {
      name: "Mel-frequency Cepstral Coefficients (MFCC)",
      description: "Captures spectral characteristics of speech",
      importance: "High"
    },
    {
      name: "Spectral Features",
      description: "Frequency domain analysis for emotion detection",
      importance: "High"
    },
    {
      name: "Prosodic Features",
      description: "Pitch, rhythm, and stress patterns",
      importance: "Medium"
    },
    {
      name: "Zero Crossing Rate",
      description: "Measures speech vs silence segments",
      importance: "Medium"
    },
    {
      name: "Spectral Rolloff",
      description: "Frequency below which 85% of energy is contained",
      importance: "Low"
    }
  ];

  const emotions = [
    { name: "Neutral", accuracy: "96.1%" },
    { name: "Calm", accuracy: "94.8%" },
    { name: "Happy", accuracy: "95.2%" },
    { name: "Sad", accuracy: "93.7%" },
    { name: "Angry", accuracy: "94.9%" },
    { name: "Fearful", accuracy: "92.3%" },
    { name: "Disgust", accuracy: "91.8%" },
    { name: "Surprised", accuracy: "93.4%" }
  ];

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center space-x-3 mb-6">
        <Brain className="text-purple-500" size={24} />
        <h2 className="text-xl font-bold text-white">Model Information</h2>
      </div>

      {/* Model Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white flex items-center space-x-2">
            <Cpu size={20} />
            <span>Model Specifications</span>
          </h3>
          <div className="space-y-3">
            {Object.entries(modelSpecs).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className="text-white font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white flex items-center space-x-2">
            <Zap size={20} />
            <span>Performance Metrics</span>
          </h3>
          <div className="space-y-3">
            {emotions.map((emotion) => (
              <div key={emotion.name} className="flex justify-between items-center">
                <span className="text-gray-300">{emotion.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-white text-sm">{emotion.accuracy}</span>
                  <div className="w-16 bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 bg-green-500 rounded-full"
                      style={{ width: emotion.accuracy }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Extraction */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white flex items-center space-x-2">
          <Database size={20} />
          <span>Feature Extraction Pipeline</span>
        </h3>
        <div className="space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-white">{feature.name}</h4>
                <span className={`px-2 py-1 rounded text-xs ${
                  feature.importance === 'High' ? 'bg-green-500/20 text-green-400' :
                  feature.importance === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {feature.importance}
                </span>
              </div>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Model Architecture */}
      <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
        <h3 className="font-medium text-white mb-3">Architecture Details</h3>
        <div className="text-sm text-purple-400 space-y-2">
          <p><strong>Input Layer:</strong> Audio features (MFCC, Spectral, Prosodic)</p>
          <p><strong>CNN Layers:</strong> 3 convolutional layers for local pattern detection</p>
          <p><strong>LSTM Layers:</strong> 2 bidirectional LSTM layers for temporal modeling</p>
          <p><strong>Dense Layers:</strong> 2 fully connected layers with dropout</p>
          <p><strong>Output Layer:</strong> 8 neurons with softmax activation for emotion classification</p>
        </div>
      </div>

      {/* Training Information */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <h3 className="font-medium text-white mb-3">Training Details</h3>
        <div className="text-sm text-blue-400 space-y-1">
          <p><strong>Dataset:</strong> RAVDESS (1440 files) + Custom augmented data (3000+ files)</p>
          <p><strong>Training Split:</strong> 70% training, 15% validation, 15% testing</p>
          <p><strong>Optimizer:</strong> Adam with learning rate scheduling</p>
          <p><strong>Loss Function:</strong> Categorical crossentropy with class weighting</p>
          <p><strong>Epochs:</strong> 150 with early stopping</p>
          <p><strong>Data Augmentation:</strong> Noise addition, time stretching, pitch shifting</p>
        </div>
      </div>
    </div>
  );
}