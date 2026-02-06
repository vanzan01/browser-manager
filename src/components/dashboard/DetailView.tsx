import React from 'react';
import { DomainStorageMap } from '../../services/StorageAnalyzer';
import { formatBytes } from '../../utils/format';
import { Trash2 } from 'lucide-react';

interface DetailViewProps {
  selectedDomain: string;
  domainData: DomainStorageMap;
  onDomainClear: (domain: string) => void;
  onUrlClear: (domain: string, url: string) => void;
}

const DetailView: React.FC<DetailViewProps> = ({
  selectedDomain,
  domainData,
  onDomainClear,
  onUrlClear,
}) => {
  // Get domain pages for detail view
  const selectedDomainPages = Object.entries(domainData[selectedDomain].pages)
    .sort(([, a], [, b]) => b.total - a.total);

  return (
    <>
      {/* Domain metrics */}
      <div className="mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Domain Storage</h2>
        <div className="grid grid-cols-4 gap-4 mb-3">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm dark:shadow-gray-900/20">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
            <div className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {formatBytes(domainData[selectedDomain].metrics.total)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm dark:shadow-gray-900/20">
            <div className="text-sm text-gray-500 dark:text-gray-400">History</div>
            <div className="text-lg font-bold text-blue-600">
              {formatBytes(domainData[selectedDomain].metrics.history)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm dark:shadow-gray-900/20">
            <div className="text-sm text-gray-500 dark:text-gray-400">Cache</div>
            <div className="text-lg font-bold text-purple-600">
              {formatBytes(domainData[selectedDomain].metrics.cache)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm dark:shadow-gray-900/20">
            <div className="text-sm text-gray-500 dark:text-gray-400">Cookies</div>
            <div className="text-lg font-bold text-yellow-600">
              {formatBytes(domainData[selectedDomain].metrics.cookies)}
            </div>
          </div>
        </div>
        <button
          className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center gap-2"
          onClick={() => onDomainClear(selectedDomain)}
        >
          <Trash2 size={16} />
          Clear All Data for {selectedDomain}
        </button>
      </div>

      {/* Page List */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Pages</h2>

        {selectedDomainPages.length === 0 ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            No page data available
          </div>
        ) : (
          <div className="space-y-2">
            {selectedDomainPages.map(([url, metrics]) => (
              <div key={url} className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20 p-3 mb-2">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate max-w-xs">{url}</div>
                  <button
                    className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-100"
                    onClick={() => onUrlClear(selectedDomain, url)}
                  >
                    Clear
                  </button>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Size: {formatBytes(metrics.total)}</span>
                  <span>Items: {metrics.items}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default DetailView;
