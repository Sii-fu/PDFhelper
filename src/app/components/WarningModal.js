'use client';

import { useState } from 'react';

export default function WarningModal() {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-4 relative">
        <h2 className="text-xl font-bold mb-4 text-red-600">⚠️ Local LLM Required</h2>
        <p className="text-gray-700 mb-4">
          This project requires a local LLM (Large Language Model) to function properly. 
          The online demo version will not work as expected.
        </p>
        <p className="text-gray-700 mb-4">
          To use this project:
          <ol className="list-decimal ml-5 mt-2">
            <li>Clone the repository locally</li>
            <li>Set up a local LLM server</li>
            <li>Follow the setup instructions in the README</li>
          </ol>
        </p>
        <button
          onClick={handleClose}
          className="mt-4 w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
        >
          I Understand, Close Warning
        </button>
      </div>
    </div>
  );
} 