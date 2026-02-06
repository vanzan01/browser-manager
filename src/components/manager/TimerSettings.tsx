import React from 'react';
import { Clock } from 'lucide-react';

interface TimerSettingsProps {
  autoCleanInterval: number;
  onIntervalChange: (value: number) => void;
  timeRemaining: string;
  triggerSite: string;
  timerActive: boolean;
  lastCleaned: string;
  onResetTimer: () => void;
}

const TimerSettings: React.FC<TimerSettingsProps> = ({
  autoCleanInterval,
  onIntervalChange,
  timeRemaining,
  triggerSite,
  timerActive,
  lastCleaned,
  onResetTimer,
}) => {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
          <Clock size={16} />
          Auto-Clean Timer (minutes)
        </label>
        {timeRemaining && (
          <div className="text-sm text-blue-600 font-medium">
            Next clean: {timeRemaining}
          </div>
        )}
      </div>

      <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
        Timer will start when you visit one of the tracked sites
        {triggerSite && timerActive && (
          <span className="block mt-1 text-blue-600">
            Currently triggered by: {triggerSite}
          </span>
        )}
      </div>

      <input
        type="range"
        min="0"
        max="120"
        step="5"
        value={autoCleanInterval}
        onChange={(e) => {
          onIntervalChange(parseInt(e.target.value));
        }}
        className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
        <span>Off</span>
        <span>{autoCleanInterval > 0 ? `${autoCleanInterval} min` : 'Disabled'}</span>
        <span>120 min</span>
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Last cleaned: {lastCleaned === 'Never' ? 'Never' : new Date(lastCleaned).toLocaleString()}
      </div>
    </div>
  );
};

export default TimerSettings;
