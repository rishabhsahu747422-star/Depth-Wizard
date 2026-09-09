import React, { useState } from "react";
import Navbar from "./components/Navbar";
import UploadView from "./components/UploadView";
import ProcessingView from "./components/ProcessingView";
import ResultsView from "./components/ResultsView";

const App = () => {
  const [currentView, setCurrentView] = useState("upload");
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  const handleRunPipeline = () => {
    if (!selectedFile) return;

    setCurrentView("processing");
  };

  const handleProcessingComplete = () => {
    setCurrentView("results");
  };

  const handleNewImage = () => {
    setSelectedFile(null);
    setCurrentView("upload");
  };

  return (
    <div className="min-h-screen bg-[#F6F7F9] text-gray-900">
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onNewImage={handleNewImage}
      />

      <main>
        {currentView === "upload" && (
          <UploadView
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onRunPipeline={handleRunPipeline}
            onRemoveFile={() => setSelectedFile(null)}
          />
        )}

        {currentView === "processing" && (
          <ProcessingView onComplete={handleProcessingComplete} />
        )}

        {currentView === "results" && (
          <ResultsView selectedFile={selectedFile} />
        )}
      </main>
    </div>
  );
};

export default App;
