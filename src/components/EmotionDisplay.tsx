import React from 'react';
import { Brain, TrendingUp, BarChart3 } from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';

export default function EmotionDisplay() {
  const { 
    currentEmotion, 
    currentConfidence, 
    currentProbabilities,
    isAnalyzing, 
    recordings,
    isModelTrained 
  } = useAudio();

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

  const emotions = ['neutral', 'calm', 'happy', 'sad', 'angry', 'fearful', 'disgust', 'surprised'];
  const emotionChartColors = ['#6B7280', '#14B8A6', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899', '#F59E0B'];

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

  // Pie Chart Component
  const EmotionPieChart = ({ probabilities }: { probabilities: number[] }) => {
    let cumulativePercentage = 0;
    
    return (
      <div className="flex items-center justify-center">
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
                  stroke={emotionChartColors[index]}
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
              <p className="text-white font-bold text-lg capitalize">{currentEmotion}</p>
              <p className="text-gray-400 text-sm">{(currentConfidence * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Brain className="text-blue-500" size={24} />
          <span>Real-Time Emotion Analysis</span>
        </h2>
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full text-sm ${
            isAnalyzing 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-gray-600/50 text-gray-400'
          }`}>
            {isAnalyzing ? 'Live' : 'Paused'}
          </div>
          <div className={`px-3 py-1 rounded-full text-sm ${
            isModelTrained
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
          }`}>
            {isModelTrained ? 'Model Trained' : 'Rule-Based'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Detection */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white flex items-center space-x-2">
            <BarChart3 size={20} />
            <span>Current Detection</span>
          </h3>
          
          {currentEmotion && isAnalyzing && currentProbabilities.length > 0 ? (
            <div className="space-y-4">
              <EmotionPieChart probabilities={currentProbabilities} />
              
              {/* Emotion Probabilities List */}
              <div className="space-y-2">
                {emotions.map((emotion, index) => (
                  <div key={emotion} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: emotionChartColors[index] }}
                      ></div>
                      <span className="text-gray-300 capitalize text-sm">{emotion}</span>
                    </div>
                    <span className="text-gray-400 text-sm">
                      {((currentProbabilities[index] || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-32 h-32 mx-auto mb-4 border-4 border-dashed border-gray-600 rounded-full flex items-center justify-center">
                <Brain className="text-gray-500" size={32} />
              </div>
              <p className="text-gray-400">
                {isAnalyzing ? 'Listening for audio...' : 'Start analysis to detect emotions'}
              </p>
              {!isModelTrained && (
                <p className="text-orange-400 text-sm mt-2">
                  Upload RAVDESS dataset to train the model for better accuracy
                </p>
              )}
            </div>
          )}
        </div>

        {/* Emotion History */}
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