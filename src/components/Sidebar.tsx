import React from 'react';
import { 
  BarChart3, 
  Mic, 
  Database, 
  History, 
  Settings, 
  Download,
  Play,
  Pause
} from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const { 
    isAnalyzing, 
    startAnalysis, 
    stopAnalysis 
  } = useAudio();

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', active: true },
    { icon: Mic, label: 'Audio Recording' },
    { icon: Database, label: 'Dataset Upload' },
    { icon: History, label: 'Recording History' },
    { icon: Settings, label: 'Settings' }
  ];

  return (
    <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-gray-800 border-r border-gray-700 transition-all duration-300 ${
      isOpen ? 'w-64' : 'w-16'
    }`}>
      <div className="p-4 space-y-6">
        {/* Control Panel */}
        <div className="space-y-3">
          <button
            onClick={isAnalyzing ? stopAnalysis : startAnalysis}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              isAnalyzing 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isAnalyzing ? <Pause size={20} /> : <Play size={20} />}
            {isOpen && <span>{isAnalyzing ? 'Stop Analysis' : 'Start Analysis'}</span>}
          </button>
          
          {isOpen && (
            <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              <Download size={16} />
              <span>Export Data</span>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                item.active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <item.icon size={20} />
              {isOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}