'use client';

import { useEffect, useState } from 'react';

export default function WarningModal() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide modal after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-4">
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
        <div className="text-sm text-gray-500 mt-4">
          This message will automatically close in 5 seconds...
        </div>
      </div>
    </div>
  );
} 