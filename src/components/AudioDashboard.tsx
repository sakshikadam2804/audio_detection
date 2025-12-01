import React from 'react';
import AudioRecorder from './AudioRecorder';
import EmotionDisplay from './EmotionDisplay';
import DatasetUpload from './DatasetUpload';
import RecordingHistory from './RecordingHistory';
import ModelInfo from './ModelInfo';
import AudioFileUpload from './AudioFileUpload';
import { useAudio } from '../contexts/AudioContext';

export default function AudioDashboard() {
  const { 
    recordings, 
    addRecording, 
    deleteRecording, 
    setDatasetFiles 
  } = useAudio();

  const handlePlayRecording = (recording: any) => {
    const audio = new Audio(recording.audioUrl);
    audio.play();
  };

  const handleDownloadRecording = (recording: any) => {
    const link = document.createElement('a');
    link.href = recording.audioUrl;
    link.download = `emotion_recording_${recording.emotion}_${new Date(recording.timestamp).toISOString()}.wav`;
    link.click();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Real-time Emotion Display */}
      <EmotionDisplay />
      
      {/* Audio Recording, File Upload, and Dataset Upload */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <AudioRecorder onRecordingComplete={addRecording} />
        <AudioFileUpload onPredictionComplete={addRecording} />
        <DatasetUpload onDatasetUploaded={setDatasetFiles} />
      </div>

      {/* Recording History */}
      <RecordingHistory 
        recordings={recordings}
        onPlayRecording={handlePlayRecording}
        onDeleteRecording={deleteRecording}
        onDownloadRecording={handleDownloadRecording}
      />

      {/* Model Information */}
      <ModelInfo />
    </div>
  );
}