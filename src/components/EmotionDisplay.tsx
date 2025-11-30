import React from 'react';
import { Brain, TrendingUp } from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';

export default function EmotionDisplay() {
  const { currentEmotion, currentConfidence, isAnalyzing, recordings } = useAudio();

  const emotionColors = {
    neutral: 'text-gray-400 bg-gray-500/20',
    calm: 'text-teal-400 bg-teal-500/20',
    happy: 'text-green-400 bg-green-500/20',
    sad: 'text-blue-400 bg-blue-500/20',
    angry: 'text-red-400 bg-red-500/20',
    fearful: 'text-purple-400 bg-purple-500/20',
    disgust: 'text-pink-400 bg-pink-500/20',
    surprised: 'text-yellow-400 bg-yellow-500/20'
  };

  const getEmotionStats = () => {
    const emotionCounts = recordings.reduce((acc, recording) => {
      acc[recording.emotion] = (acc[recording.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  const avgConfidence = recordings.length > 0 
    ? recordings.reduce((acc, curr) => acc + curr.confidence, 0) / recordings.length
    : 0;

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Brain className="text-blue-500" size={24} />
          <span>Real-Time Emotion Analysis</span>
        </h2>
        <div className={`px-3 py-1 rounded-full text-sm ${
          isAnalyzing 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-gray-600/50 text-gray-400'
        }`}>
          {isAnalyzing ? 'Live' : 'Paused'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Emotion */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Current Detection</h3>
          {currentEmotion && isAnalyzing ? (
            <div className="space-y-4">
              <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-lg font-medium ${
                emotionColors[currentEmotion as keyof typeof emotionColors] || 'text-gray-400 bg-gray-500/20'
              }`}>
                <span className="capitalize">{currentEmotion}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Confidence</span>
                  <span className="text-white font-medium">
                    {(currentConfidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="h-3 bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${currentConfidence * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">
                {isAnalyzing ? 'Listening for audio...' : 'Start analysis to detect emotions'}
              </p>
            </div>
          )}
        </div>

        {/* Emotion Statistics */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white flex items-center space-x-2">
            <TrendingUp size={20} />
            <span>Emotion History</span>
          </h3>
          
          {getEmotionStats().length > 0 ? (
            <div className="space-y-3">
              {getEmotionStats().map(([emotion, count]) => {
                const percentage = (count / recordings.length) * 100;
                return (
                  <div key={emotion} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 capitalize">{emotion}</span>
                      <span className="text-gray-400 text-sm">{count} recordings</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              
              <div className="mt-4 pt-4 border-t border-gray-600">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Average Confidence</span>
                  <span className="text-white font-medium">
                    {(avgConfidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No recordings yet</p>
              <p className="text-gray-500 text-sm mt-2">Start recording to see emotion patterns</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}