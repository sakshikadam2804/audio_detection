import React from 'react';
import { Menu, Settings, Activity, Headphones } from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { isAnalyzing, currentEmotion } = useAudio();

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center space-x-3">
            <Headphones className="text-blue-500" size={24} />
            <div>
              <h1 className="text-xl font-bold">Audio Emotion Predictor</h1>
              <p className="text-sm text-gray-400">Real-time Speech Emotion Analysis</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isAnalyzing ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
            <span className="text-sm text-gray-300">
              {isAnalyzing ? 'Analyzing' : 'Standby'}
            </span>
          </div>
          
          {currentEmotion && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-gray-700 rounded-full">
              <Activity size={16} />
              <span className="text-sm capitalize">{currentEmotion}</span>
            </div>
          )}

          <button className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}