import React from 'react';
import { useAnalysis } from '../contexts/AnalysisContext';
import { Mic, Video, FileText, Brain } from 'lucide-react';

export default function RealTimeAnalysis() {
  const { currentAnalysis, isAnalyzing } = useAnalysis();

  const modalities = [
    {
      name: 'Audio Analysis',
      icon: Mic,
      data: currentAnalysis?.audio,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30'
    },
    {
      name: 'Video Analysis',
      icon: Video,
      data: currentAnalysis?.video,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30'
    },
    {
      name: 'Text Analysis',
      icon: FileText,
      data: currentAnalysis?.text,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30'
    }
  ];

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Brain className="text-blue-500" size={24} />
          <span>Real-Time Multimodal Analysis</span>
        </h2>
        <div className={`px-3 py-1 rounded-full text-sm ${
          isAnalyzing 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-gray-600/50 text-gray-400'
        }`}>
          {isAnalyzing ? 'Live' : 'Paused'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {modalities.map((modality, index) => (
          <div key={index} className={`p-4 rounded-lg border ${modality.bgColor} ${modality.borderColor}`}>
            <div className="flex items-center space-x-3 mb-3">
              <modality.icon className={modality.color} size={20} />
              <h3 className="font-medium text-white">{modality.name}</h3>
            </div>
            {modality.data ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 capitalize">{modality.data.emotion}</span>
                  <span className="text-sm text-gray-400">
                    {(modality.data.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      modality.color.replace('text-', 'bg-')
                    }`}
                    style={{ width: `${modality.data.confidence * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-400">
                  Intensity: {(modality.data.intensity * 100).toFixed(0)}%
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">No data</div>
            )}
          </div>
        ))}
      </div>

      {/* Overall Sentiment */}
      {currentAnalysis && (
        <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300 font-medium">Overall Sentiment</span>
            <span className={`text-sm ${
              currentAnalysis.overallSentiment > 0.2 ? 'text-green-400' :
              currentAnalysis.overallSentiment < -0.2 ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {currentAnalysis.overallSentiment > 0.2 ? 'Positive' :
               currentAnalysis.overallSentiment < -0.2 ? 'Negative' : 'Neutral'}
            </span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-3 relative">
            <div className="absolute left-1/2 w-0.5 h-3 bg-white opacity-50"></div>
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                currentAnalysis.overallSentiment >= 0 ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ 
                width: `${Math.abs(currentAnalysis.overallSentiment) * 50}%`,
                marginLeft: currentAnalysis.overallSentiment >= 0 ? '50%' : `${50 - Math.abs(currentAnalysis.overallSentiment) * 50}%`
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}