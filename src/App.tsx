import { useState, useEffect } from 'react';
import HistoryManager from './components/HistoryManager';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedPreference = localStorage.getItem('darkMode');
    if (savedPreference !== null) {
      setDarkMode(JSON.parse(savedPreference));
    } else {
      setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  function toggleDarkMode() {
    setDarkMode(prev => !prev);
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <HistoryManager darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
    </div>
  );
}

export default App;
