import React, { useState } from 'react';
import AudioDashboard from './components/AudioDashboard';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AudioContextProvider from './contexts/AudioContext';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <AudioContextProvider>
      <div className="min-h-screen bg-gray-900 text-white">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} />
          <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
            <AudioDashboard />
          </main>
        </div>
      </div>
    </AudioContextProvider>
  );
}

export default App;