import React from 'react';
import { useAnalysis } from '../contexts/AnalysisContext';
import { TrendingUp } from 'lucide-react';

export default function EmotionCharts() {
  const { analysisHistory } = useAnalysis();

  const emotionCounts = analysisHistory.reduce((acc, analysis) => {
    [analysis.audio, analysis.video, analysis.text].forEach(data => {
      acc[data.emotion] = (acc[data.emotion] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topEmotions = Object.entries(emotionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const emotionColors = {
    joy: 'bg-green-500',
    sadness: 'bg-blue-500',
    anger: 'bg-red-500',
    fear: 'bg-purple-500',
    surprise: 'bg-yellow-500',
    disgust: 'bg-pink-500',
    neutral: 'bg-gray-500',
    stress: 'bg-orange-500',
    confusion: 'bg-indigo-500',
    hesitation: 'bg-teal-500'
  };

  const maxCount = Math.max(...topEmotions.map(([, count]) => count), 1);

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <TrendingUp className="text-green-500" size={24} />
          <span>Emotion Distribution</span>
        </h2>
        <span className="text-gray-400 text-sm">
          {analysisHistory.length} samples
        </span>
      </div>

      {topEmotions.length > 0 ? (
        <div className="space-y-4">
          {topEmotions.map(([emotion, count]) => (
            <div key={emotion} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 capitalize font-medium">{emotion}</span>
                <span className="text-gray-400 text-sm">{count}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    emotionColors[emotion as keyof typeof emotionColors] || 'bg-gray-500'
                  }`}
                  style={{ width: `${(count / maxCount) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400">No emotion data available</p>
          <p className="text-gray-500 text-sm mt-2">Start analysis to see emotion patterns</p>
        </div>
      )}

      {/* Recent Trend */}
      {analysisHistory.length >= 10 && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h3 className="text-lg font-medium text-white mb-3">Recent Sentiment Trend</h3>
          <div className="flex items-end space-x-1 h-16">
            {analysisHistory.slice(-20).map((analysis, index) => (
              <div
                key={index}
                className={`flex-1 rounded-t transition-all duration-300 ${
                  analysis.overallSentiment > 0.1 ? 'bg-green-500' :
                  analysis.overallSentiment < -0.1 ? 'bg-red-500' : 'bg-yellow-500'
                }`}
                style={{ 
                  height: `${Math.max(10, Math.abs(analysis.overallSentiment) * 60)}px`
                }}
              ></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}