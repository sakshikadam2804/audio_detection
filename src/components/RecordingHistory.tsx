import React, { useState } from 'react';
import { History, Play, Download, Trash2, Calendar, Clock, Mic } from 'lucide-react';

interface Recording {
  id: string;
  timestamp: number;
  duration: number;
  emotion: string;
  confidence: number;
  audioUrl: string;
  waveform: number[];
  modelUsed: string;
  probabilities?: number[];
  fileName?: string;
  fileSize?: number;
}

interface RecordingHistoryProps {
  recordings: Recording[];
  onPlayRecording: (recording: Recording) => void;
  onDeleteRecording: (id: string) => void;
  onDownloadRecording: (recording: Recording) => void;
}

export default function RecordingHistory({ 
  recordings, 
  onPlayRecording, 
  onDeleteRecording, 
  onDownloadRecording 
}: RecordingHistoryProps) {
  const [selectedRecording, setSelectedRecording] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'timestamp' | 'emotion' | 'confidence'>('timestamp');

  const exportData = () => {
    const dataToExport = recordings.map(recording => ({
      timestamp: new Date(recording.timestamp).toISOString(),
      emotion: recording.emotion,
      confidence: recording.confidence,
      duration: recording.duration,
      modelUsed: recording.modelUsed,
      fileName: recording.fileName || 'recorded_audio',
      probabilities: recording.probabilities
    }));

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `emotion_analysis_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
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
          style={{ height: `${Math.max(2, amplitude * 100)}%` }}
        ></div>
      ))}
    </div>
  );

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <History className="text-amber-500" size={24} />
          <span>Recording History</span>
          <button
            onClick={exportData}
            className="ml-auto px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
            disabled={recordings.length === 0}
          >
            Export Data
          </button>
        </h2>
        <div className="flex items-center space-x-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 text-white text-sm"
          >
            <option value="timestamp">Sort by Date</option>
            <option value="emotion">Sort by Emotion</option>
            <option value="confidence">Sort by Confidence</option>
          </select>
        </div>
      </div>

      {recordings.length === 0 ? (
        <div className="text-center py-12">
          <Mic className="mx-auto text-gray-500 mb-4" size={48} />
          <p className="text-gray-400">No recordings yet</p>
          <p className="text-gray-500 text-sm mt-2">Start recording to see your history</p>
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
                    <div className="flex items-center space-x-3 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
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
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayRecording(recording);
                    }}
                    className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    <Play size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadRecording(recording);
                    }}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRecording(recording.id);
                    }}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {selectedRecording === recording.id && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Model Used:</span>
                      <span className="text-white ml-2">{recording.modelUsed}</span>
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
                  
                  {/* Emotion Probabilities */}
                  {recording.probabilities && (
                    <div className="mt-3">
                      <span className="text-gray-400 text-sm">Emotion Probabilities:</span>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        {['neutral', 'calm', 'happy', 'sad', 'angry', 'fearful', 'disgust', 'surprised'].map((emotion, index) => (
                          <div key={emotion} className="flex justify-between">
                            <span className="text-gray-300 capitalize">{emotion}:</span>
                            <span className="text-gray-400">{(recording.probabilities![index] * 100).toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3">
                    <span className="text-gray-400 text-sm">Full Waveform:</span>
                    <div className="mt-2 flex items-end space-x-0.5 h-16 bg-gray-900 rounded p-2">
                      {recording.waveform.map((amplitude, index) => (
                        <div
                          key={index}
                          className="bg-blue-500 w-1 rounded-t"
                          style={{ height: `${Math.max(2, amplitude * 100)}%` }}
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