import React from 'react';
import { useAnalysis } from '../contexts/AnalysisContext';
import { Target, Lightbulb } from 'lucide-react';

export default function IntentAnalysis() {
  const { currentAnalysis, analysisHistory } = useAnalysis();

  const intentCounts = analysisHistory.reduce((acc, analysis) => {
    const intent = analysis.intent.intent;
    acc[intent] = (acc[intent] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topIntents = Object.entries(intentCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const intentColors = {
    question: 'text-blue-400 bg-blue-500/10',
    complaint: 'text-red-400 bg-red-500/10',
    compliment: 'text-green-400 bg-green-500/10',
    request: 'text-yellow-400 bg-yellow-500/10',
    information: 'text-purple-400 bg-purple-500/10',
    support: 'text-orange-400 bg-orange-500/10',
    booking: 'text-teal-400 bg-teal-500/10',
    cancellation: 'text-pink-400 bg-pink-500/10'
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Target className="text-amber-500" size={24} />
          <span>Intent Analysis</span>
        </h2>
      </div>

      {/* Current Intent */}
      {currentAnalysis?.intent && (
        <div className="mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-white">Current Intent</h3>
            <span className="text-sm text-gray-400">
              {(currentAnalysis.intent.confidence * 100).toFixed(0)}% confidence
            </span>
          </div>
          <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            intentColors[currentAnalysis.intent.intent as keyof typeof intentColors] || 'text-gray-400 bg-gray-700'
          }`}>
            <span className="capitalize">{currentAnalysis.intent.intent}</span>
          </div>
          <div className="mt-3 w-full bg-gray-600 rounded-full h-2">
            <div 
              className="h-2 bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${currentAnalysis.intent.confidence * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Intent Distribution */}
      <div className="space-y-4">
        <h3 className="font-medium text-white flex items-center space-x-2">
          <Lightbulb size={16} />
          <span>Intent Distribution</span>
        </h3>
        
        {topIntents.length > 0 ? (
          <div className="space-y-3">
            {topIntents.map(([intent, count]) => {
              const percentage = (count / analysisHistory.length) * 100;
              return (
                <div key={intent} className="flex items-center justify-between">
                  <div className={`flex items-center space-x-2 px-2 py-1 rounded text-sm ${
                    intentColors[intent as keyof typeof intentColors] || 'text-gray-400 bg-gray-700'
                  }`}>
                    <span className="capitalize">{intent}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 text-sm">{percentage.toFixed(1)}%</span>
                    <div className="w-16 bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 bg-amber-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No intent data available</p>
            <p className="text-gray-500 text-sm mt-2">Start analysis to see intent patterns</p>
          </div>
        )}
      </div>

      {/* Context Insights */}
      {currentAnalysis && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h3 className="font-medium text-white mb-3">Context Insights</h3>
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-400 text-sm">
              Analysis optimized for <span className="capitalize font-medium">
                {currentAnalysis.intent.context.replace('-', ' ')}
              </span> context
            </p>
          </div>
        </div>
      )}
    </div>
  );
}