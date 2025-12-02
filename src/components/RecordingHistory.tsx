import React, { useState } from 'react';
import { History, Play, Download, Trash2, Calendar, Clock, Mic, BarChart3 } from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';

export default function RecordingHistory() {
  const { recordings, deleteRecording } = useAudio();
  const [selectedRecording, setSelectedRecording] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'timestamp' | 'emotion' | 'confidence'>('timestamp');

  const exportData = () => {
    if (recordings.length === 0) {
      alert('No recordings to export');
      return;
    }

    const dataToExport = recordings.map(recording => ({
      id: recording.id,
      timestamp: new Date(recording.timestamp).toISOString(),
      emotion: recording.emotion,
      confidence: recording.confidence,
      duration: recording.duration,
      modelUsed: recording.modelUsed,
      fileName: recording.fileName || 'recorded_audio',
      probabilities: recording.probabilities,
      emotionBreakdown: {
        neutral: recording.probabilities[0],
        calm: recording.probabilities[1],
        happy: recording.probabilities[2],
        sad: recording.probabilities[3],
        angry: recording.probabilities[4],
        fearful: recording.probabilities[5],
        disgust: recording.probabilities[6],
        surprised: recording.probabilities[7]
      }
    }));

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `emotion_analysis_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePlayRecording = (recording: any) => {
    if (recording.audioUrl) {
      const audio = new Audio(recording.audioUrl);
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        alert('Error playing audio file');
      });
    }
  };

  const handleDownloadRecording = (recording: any) => {
    if (recording.audioUrl) {
      const link = document.createElement('a');
      link.href = recording.audioUrl;
      link.download = `emotion_recording_${recording.emotion}_${new Date(recording.timestamp).toISOString().replace(/[:.]/g, '-')}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const emotionColors: Record<string, string> = {
    happy: 'text-green-400 bg-green-500/10',
    sad: 'text-blue-400 bg-blue-500/10',
    angry: 'text-red-400 bg-red-500/10',
    fearful: 'text-purple-400 bg-purple-500/10',
    surprised: 'text-yellow-400 bg-yellow-500/10',
    disgust: 'text-pink-400 bg-pink-500/10',
    neutral: 'text-gray-400 bg-gray-500/10',
    calm: 'text-teal-400 bg-teal-500/10'
  };

  const sortedRecordings = [...recordings].sort((a, b) => {
    switch (sortBy) {
      case 'timestamp':
        return b.timestamp - a.timestamp;
      case 'emotion':
        return a.emotion.localeCompare(b.emotion);
      case 'confidence':
        return b.confidence - a.confidence;
      default:
        return b.timestamp - a.timestamp;
    }
  });

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const MiniWaveform = ({ waveform }: { waveform: number[] }) => (
    <div className="flex items-end space-x-0.5 h-8">
      {waveform.slice(0, 20).map((amplitude, index) => (
        <div
          key={index}
          className="bg-blue-500 w-1 rounded-t"
          style={{ height: `${Math.max(4, amplitude * 100)}%` }}
        ></div>
      ))}
    </div>
  );

  const EmotionMiniChart = ({ probabilities }: { probabilities: number[] }) => {
    const emotions = ['neutral', 'calm', 'happy', 'sad', 'angry', 'fearful', 'disgust', 'surprised'];
    const colors = ['#6B7280', '#14B8A6', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899', '#F59E0B'];
    
    return (
      <div className="flex space-x-1">
        {probabilities.map((prob, index) => (
          <div
            key={index}
            className="w-2 rounded-t"
            style={{ 
              height: `${Math.max(4, prob * 32)}px`,
              backgroundColor: colors[index]
            }}
            title={`${emotions[index]}: ${(prob * 100).toFixed(1)}%`}
          ></div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <History className="text-amber-500" size={24} />
          <span>Recording History</span>
        </h2>
        <div className="flex items-center space-x-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 text-white text-sm"
          >
            <option value="timestamp">Sort by Date</option>
            <option value="emotion">Sort by Emotion</option>
            <option value="confidence">Sort by Confidence</option>
          </select>
          <button
            onClick={exportData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={recordings.length === 0}
          >
            Export Data
          </button>
        </div>
      </div>

      {recordings.length === 0 ? (
        <div className="text-center py-12">
          <Mic className="mx-auto text-gray-500 mb-4" size={48} />
          <p className="text-gray-400">No recordings yet</p>
          <p className="text-gray-500 text-sm mt-2">Start recording or upload audio files to see your history</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedRecordings.map((recording) => (
            <div
              key={recording.id}
              className={`p-4 rounded-lg border transition-all cursor-pointer ${
                selectedRecording === recording.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
              }`}
              onClick={() => setSelectedRecording(
                selectedRecording === recording.id ? null : recording.id
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <MiniWaveform waveform={recording.waveform} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        emotionColors[recording.emotion] || 'text-gray-400 bg-gray-500/10'
                      }`}>
                        {recording.emotion}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {(recording.confidence * 100).toFixed(1)}% confidence
                      </span>
                      {recording.fileName && (
                        <span className="text-gray-500 text-xs">
                          {recording.fileName}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Calendar size={12} />
                        <span>{formatDate(recording.timestamp)}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock size={12} />
                        <span>{formatDuration(recording.duration)}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <EmotionMiniChart probabilities={recording.probabilities} />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayRecording(recording);
                    }}
                    className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    title="Play Recording"
                  >
                    <Play size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadRecording(recording);
                    }}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    title="Download Recording"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this recording?')) {
                        deleteRecording(recording.id);
                      }
                    }}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    title="Delete Recording"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {selectedRecording === recording.id && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Detailed Information */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-white">Recording Details</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-400">Model Used:</span>
                          <span className="text-white ml-2 block">{recording.modelUsed}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">File Size:</span>
                          <span className="text-white ml-2">
                            {recording.fileSize 
                              ? `${(recording.fileSize / 1024).toFixed(1)} KB`
                              : `${(recording.duration * 44100 * 2 / 1024).toFixed(1)} KB`
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Emotion Probabilities */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-white flex items-center space-x-2">
                        <BarChart3 size={16} />
                        <span>Emotion Probabilities</span>
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {['neutral', 'calm', 'happy', 'sad', 'angry', 'fearful', 'disgust', 'surprised'].map((emotion, index) => (
                          <div key={emotion} className="flex justify-between items-center">
                            <span className="text-gray-300 capitalize">{emotion}:</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">{((recording.probabilities[index] || 0) * 100).toFixed(1)}%</span>
                              <div className="w-8 bg-gray-700 rounded-full h-1">
                                <div 
                                  className="h-1 bg-blue-500 rounded-full"
                                  style={{ width: `${(recording.probabilities[index] || 0) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Full Waveform */}
                  <div className="mt-4">
                    <h4 className="font-medium text-white mb-2">Audio Waveform</h4>
                    <div className="flex items-end space-x-0.5 h-16 bg-gray-900 rounded p-2">
                      {recording.waveform.map((amplitude, index) => (
                        <div
                          key={index}
                          className="bg-blue-500 w-1 rounded-t"
                          style={{ height: `${Math.max(4, amplitude * 100)}%` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {recordings.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{recordings.length}</p>
              <p className="text-gray-400 text-sm">Total Recordings</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {(recordings.reduce((acc, r) => acc + r.confidence, 0) / recordings.length * 100).toFixed(1)}%
              </p>
              <p className="text-gray-400 text-sm">Avg Confidence</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {formatDuration(recordings.reduce((acc, r) => acc + r.duration, 0))}
              </p>
              <p className="text-gray-400 text-sm">Total Duration</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}