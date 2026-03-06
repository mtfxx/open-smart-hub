'use client';
import { useEffect, useState } from 'react';

export default function Home() {
  const [apiStatus, setApiStatus] = useState<string>('Loading...');

  useEffect(() => {
    // Тук Next.js пита нашия Node.js бекенд
    fetch('http://localhost:3001/api/status')
      .then((res) => res.json())
      .then((data) => setApiStatus(data.message))
      .catch(() => setApiStatus('Backend is Offline! ❌'));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center text-blue-400">
          Open Smart Hub ⚡
        </h1>
        
        <div className="bg-gray-800 border border-gray-700 p-8 rounded-xl shadow-lg text-center max-w-md mx-auto">
          <p className="text-gray-400 mb-4">System Status:</p>
          <div className="text-xl font-semibold text-green-400 bg-gray-900 py-3 px-6 rounded-lg inline-block">
            {apiStatus}
          </div>
        </div>
      </div>
    </main>
  );
}
