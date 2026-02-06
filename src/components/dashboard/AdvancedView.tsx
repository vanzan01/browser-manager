import React from 'react';
import { DomainStorageMap } from '../../services/StorageAnalyzer';
import { formatBytes } from '../../utils/format';
import { Calendar, Trash2 } from 'lucide-react';

interface AdvancedViewProps {
  domainData: DomainStorageMap;
  timelineData: any;
  selectedTimeRange: string;
  onTimeRangeChange: (range: string) => void;
  sortMetric: 'total' | 'history' | 'cache' | 'cookies' | 'localStorage';
  onSortMetricChange: (metric: string) => void;
  sortedDomains: [string, DomainStorageMap[string]][];
  onBulkClear: (type: string) => void;
}

// Helper functions for calculations
function totalHistorySize(domainData: DomainStorageMap) {
  return Object.values(domainData).reduce((sum, domain) => sum + domain.metrics.history, 0);
}

function totalCacheSize(domainData: DomainStorageMap) {
  return Object.values(domainData).reduce((sum, domain) => sum + domain.metrics.cache, 0);
}

function totalCookiesSize(domainData: DomainStorageMap) {
  return Object.values(domainData).reduce((sum, domain) => sum + domain.metrics.cookies, 0);
}

function totalLocalStorageSize(domainData: DomainStorageMap) {
  return Object.values(domainData).reduce((sum, domain) => sum + domain.metrics.localStorage, 0);
}

function getColorForDomain(size: number, maxSize: number) {
  // Use the utility function from format.ts
  const percentage = Math.min(size / maxSize, 1);

  // Color spectrum from green to yellow to red
  if (percentage < 0.5) {
    // Green to yellow
    const r = Math.floor(255 * (percentage * 2));
    return `rgb(${r}, 255, 0)`;
  } else {
    // Yellow to red
    const g = Math.floor(255 * (1 - (percentage - 0.5) * 2));
    return `rgb(255, ${g}, 0)`;
  }
}

const AdvancedView: React.FC<AdvancedViewProps> = ({
  domainData,
  timelineData,
  selectedTimeRange,
  onTimeRangeChange,
  sortMetric,
  onSortMetricChange,
  sortedDomains,
  onBulkClear,
}) => {
  return (
    <>
      {/* Time range selector */}
      <div className="mb-4 flex gap-2 justify-center">
        <button
          className={`px-4 py-2 rounded-lg ${selectedTimeRange === '7d' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          onClick={() => onTimeRangeChange('7d')}
        >
          7 Days
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${selectedTimeRange === '30d' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          onClick={() => onTimeRangeChange('30d')}
        >
          30 Days
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${selectedTimeRange === '90d' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          onClick={() => onTimeRangeChange('90d')}
        >
          90 Days
        </button>
      </div>

      {/* Timeline Chart - Direct HTML implementation */}
      <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-gray-900/20">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <Calendar size={18} />
          Storage Timeline
        </h3>

        {/* Dynamic timeline chart */}
        {(() => {
          const entries = Object.entries(timelineData)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-7); // Show last 7 entries

          if (entries.length === 0) {
            return <div className="text-center py-8 text-gray-500 dark:text-gray-400">No timeline data available</div>;
          }

          const maxTotal = Math.max(...entries.map(([, d]: [string, any]) => d.total), 1);
          const maxBarHeight = 180;

          return (
            <div className="flex items-end justify-between gap-2" style={{ height: '240px', paddingTop: '20px' }}>
              {entries.map(([date, data]: [string, any]) => {
                const barHeight = Math.max((data.total / maxTotal) * maxBarHeight, 4);
                const dateLabel = date.slice(5); // MM-DD
                return (
                  <div key={date} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {formatBytes(data.total)}
                    </div>
                    <div
                      className="w-full rounded-t"
                      style={{ height: `${barHeight}px`, backgroundColor: '#3B82F6' }}
                    ></div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {dateLabel}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Storage Type Distribution */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-gray-900/20">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Storage By Type</h3>

          {/* Basic pie chart replacement using colored blocks */}
          <div className="flex h-40 items-center justify-center">
            <div className="w-40 h-40 rounded-full overflow-hidden relative">
              {/* This is a simplified representation - in a real app you'd use a proper chart library */}
              <div className="absolute inset-0 flex">
                <div className="bg-blue-500 flex-1" style={{ flexGrow: totalHistorySize(domainData) }}></div>
                <div className="bg-purple-500 flex-1" style={{ flexGrow: totalCacheSize(domainData) }}></div>
                <div className="bg-yellow-500 flex-1" style={{ flexGrow: totalCookiesSize(domainData) }}></div>
                <div className="bg-green-500 flex-1" style={{ flexGrow: totalLocalStorageSize(domainData) }}></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">History: {formatBytes(totalHistorySize(domainData))}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Cache: {formatBytes(totalCacheSize(domainData))}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Cookies: {formatBytes(totalCookiesSize(domainData))}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">LocalStorage: {formatBytes(totalLocalStorageSize(domainData))}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-gray-900/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Top Domains</h3>
            <select
              value={sortMetric}
              onChange={(e) => onSortMetricChange(e.target.value)}
              className="text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-md px-2 py-1 text-gray-700 dark:text-gray-300"
            >
              <option value="total">By Total Storage</option>
              <option value="history">By History</option>
              <option value="cache">By Cache</option>
              <option value="cookies">By Cookies</option>
              <option value="localStorage">By LocalStorage</option>
            </select>
          </div>

          <div className="space-y-2">
            {sortedDomains.slice(0, 5).map(([domain, data]) => (
              <div key={domain} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-2 h-10 mr-2"
                    style={{ backgroundColor: getColorForDomain(data.metrics[sortMetric], Math.max(...sortedDomains.map(([, d]) => d.metrics[sortMetric]))) }}
                  ></div>
                  <span className="text-sm font-medium">{domain}</span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{formatBytes(data.metrics[sortMetric])}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Section */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Bulk Actions</h3>

        <div className="grid grid-cols-2 gap-3">
          <button
            className="py-2 px-4 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center justify-center gap-2"
            onClick={() => onBulkClear('history')}
          >
            <Trash2 size={16} />
            Clear All History
          </button>

          <button
            className="py-2 px-4 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center justify-center gap-2"
            onClick={() => onBulkClear('cache')}
          >
            <Trash2 size={16} />
            Clear All Cache
          </button>

          <button
            className="py-2 px-4 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 flex items-center justify-center gap-2"
            onClick={() => onBulkClear('cookies')}
          >
            <Trash2 size={16} />
            Clear All Cookies
          </button>

          <button
            className="py-2 px-4 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center justify-center gap-2"
            onClick={() => onBulkClear('localStorage')}
          >
            <Trash2 size={16} />
            Clear All LocalStorage
          </button>
        </div>
      </div>
    </>
  );
};

export default AdvancedView;
