import React from 'react';
import { formatBytes, formatDate, getColorForValue } from '../utils/format';
import { StorageMetrics } from '../services/StorageAnalyzer';

interface DomainCardProps {
  domain: string;
  metrics: StorageMetrics;
  maxSize?: number;
  onSelect: () => void;
  onDelete: () => void;
}

const DomainCard: React.FC<DomainCardProps> = ({ 
  domain, 
  metrics, 
  maxSize = 1000000, 
  onSelect,
  onDelete 
}) => {
  // Calculate percentages for the progress bars
  const historyPercentage = (metrics.history / metrics.total) * 100;
  const cachePercentage = (metrics.cache / metrics.total) * 100;
  const cookiesPercentage = (metrics.cookies / metrics.total) * 100;
  const lsPercentage = (metrics.localStorage / metrics.total) * 100;
  
  const totalPercentage = Math.min((metrics.total / maxSize) * 100, 100);
  const barColor = getColorForValue(metrics.total, maxSize);
  
  return (
    <div 
      className="bg-white rounded-lg shadow p-4 mb-3 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-800">{domain}</h3>
        <button 
          className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-red-100"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          Clear
        </button>
      </div>
      
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Total Storage</span>
          <span className="font-medium">{formatBytes(metrics.total)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="h-2.5 rounded-full" 
            style={{ width: `${totalPercentage}%`, backgroundColor: barColor }}
          ></div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-500 mb-2">
        <div>
          <div className="flex justify-between">
            <span>History</span>
            <span>{formatBytes(metrics.history)}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
            <div 
              className="h-1.5 rounded-full bg-blue-400" 
              style={{ width: `${historyPercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between">
            <span>Cache</span>
            <span>{formatBytes(metrics.cache)}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
            <div 
              className="h-1.5 rounded-full bg-purple-400" 
              style={{ width: `${cachePercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between">
            <span>Cookies</span>
            <span>{formatBytes(metrics.cookies)}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
            <div 
              className="h-1.5 rounded-full bg-yellow-400" 
              style={{ width: `${cookiesPercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between">
            <span>LocalStorage</span>
            <span>{formatBytes(metrics.localStorage)}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
            <div 
              className="h-1.5 rounded-full bg-green-400" 
              style={{ width: `${lsPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>Items: {metrics.items}</span>
        <span>Last accessed: {formatDate(metrics.lastAccessed)}</span>
      </div>
    </div>
  );
};

export default DomainCard; 