import React from 'react';
import RealTimeAnalysis from './RealTimeAnalysis';
import EmotionCharts from './EmotionCharts';
import IntentAnalysis from './IntentAnalysis';
import ModalityInputs from './ModalityInputs';
import MetricsOverview from './MetricsOverview';
import DatasetUpload from './DatasetUpload';
import RecordingHistory from './RecordingHistory';
import ModelInfo from './ModelInfo';
import { useAnalysis } from '../contexts/AnalysisContext';

export default function Dashboard() {
  const { 
    recordings, 
    datasetFiles, 
    addRecording, 
    deleteRecording, 
    setDatasetFiles 
  } = useAnalysis();

  const handlePlayRecording = (recording: any) => {
    // Create audio element and play
    const audio = new Audio(recording.audioUrl);
    audio.play();
  };

  const handleDownloadRecording = (recording: any) => {
    // Create download link
    const link = document.createElement('a');
    link.href = recording.audioUrl;
    link.download = `emotion_recording_${recording.emotion}_${new Date(recording.timestamp).toISOString()}.wav`;
    link.click();
  };

  return (
    <div className="p-6 space-y-6">
      <MetricsOverview />
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <DatasetUpload onDatasetUploaded={setDatasetFiles} />
        <ModelInfo />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RealTimeAnalysis />
        </div>
        <div>
          <ModalityInputs />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <RecordingHistory 
          recordings={recordings}
          onPlayRecording={handlePlayRecording}
          onDeleteRecording={deleteRecording}
          onDownloadRecording={handleDownloadRecording}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <EmotionCharts />
        <IntentAnalysis />
      </div>
    </div>
  );
}