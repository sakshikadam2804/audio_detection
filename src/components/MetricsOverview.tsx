import React from 'react';
import { TrendingUp, Target, Zap, Users } from 'lucide-react';
import { useAnalysis } from '../contexts/AnalysisContext';

export default function MetricsOverview() {
  const { currentAnalysis, analysisHistory } = useAnalysis();

  const avgConfidence = analysisHistory.length > 0 
    ? analysisHistory.reduce((acc, curr) => acc + (curr.audio.confidence + curr.video.confidence + curr.text.confidence) / 3, 0) / analysisHistory.length
    : 0;

  const emotionAccuracy = Math.random() * 0.2 + 0.8; // Simulated
  const processingSpeed = Math.random() * 50 + 150; // ms
  const sessionsToday = Math.floor(Math.random() * 100) + 50;

  const metrics = [
    {
      title: 'Average Confidence',
      value: `${(avgConfidence * 100).toFixed(1)}%`,
      change: '+2.4%',
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Emotion Accuracy',
      value: `${(emotionAccuracy * 100).toFixed(1)}%`,
      change: '+1.2%',
      icon: Target,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Processing Speed',
      value: `${processingSpeed.toFixed(0)}ms`,
      change: '-5.3%',
      icon: Zap,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    {
      title: 'Sessions Today',
      value: sessionsToday.toString(),
      change: '+12.1%',
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${metric.bgColor}`}>
              <metric.icon className={metric.color} size={24} />
            </div>
            <span className="text-green-400 text-sm font-medium">{metric.change}</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-white mb-1">{metric.value}</p>
            <p className="text-gray-400 text-sm">{metric.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
}