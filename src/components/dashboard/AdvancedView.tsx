import { DomainStorageMap } from '../../services/StorageAnalyzer';
import { formatBytes, getColorForValue } from '../../utils/format';
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

function totalSizeByMetric(domainData: DomainStorageMap, metric: keyof DomainStorageMap[string]['metrics']) {
  return Object.values(domainData).reduce((sum, domain) => sum + domain.metrics[metric], 0);
}

const timeRangeOptions = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
];

const bulkActions = [
  { type: 'history', label: 'Clear All History', bgClass: 'bg-red-100', textClass: 'text-red-700', hoverClass: 'hover:bg-red-200' },
  { type: 'cache', label: 'Clear All Cache', bgClass: 'bg-purple-100', textClass: 'text-purple-700', hoverClass: 'hover:bg-purple-200' },
  { type: 'cookies', label: 'Clear All Cookies', bgClass: 'bg-yellow-100', textClass: 'text-yellow-700', hoverClass: 'hover:bg-yellow-200' },
  { type: 'localStorage', label: 'Clear All LocalStorage', bgClass: 'bg-green-100', textClass: 'text-green-700', hoverClass: 'hover:bg-green-200' },
];

const storageTypeIndicators = [
  { metric: 'history' as const, color: 'bg-blue-500', label: 'History' },
  { metric: 'cache' as const, color: 'bg-purple-500', label: 'Cache' },
  { metric: 'cookies' as const, color: 'bg-yellow-500', label: 'Cookies' },
  { metric: 'localStorage' as const, color: 'bg-green-500', label: 'LocalStorage' },
];

function TimelineChart({ timelineData }: { timelineData: any }) {
  const entries = Object.entries(timelineData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7);

  if (entries.length === 0) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">No timeline data available</div>;
  }

  const maxTotal = Math.max(...entries.map(([, d]: [string, any]) => d.total), 1);
  const maxBarHeight = 180;

  return (
    <div className="flex items-end justify-between gap-2" style={{ height: '240px', paddingTop: '20px' }}>
      {entries.map(([date, data]: [string, any]) => {
        const barHeight = Math.max((data.total / maxTotal) * maxBarHeight, 4);
        const dateLabel = date.slice(5);
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
}

function AdvancedView({
  domainData,
  timelineData,
  selectedTimeRange,
  onTimeRangeChange,
  sortMetric,
  onSortMetricChange,
  sortedDomains,
  onBulkClear,
}: AdvancedViewProps) {
  return (
    <>
      <div className="mb-4 flex gap-2 justify-center">
        {timeRangeOptions.map(({ value, label }) => (
          <button
            key={value}
            className={`px-4 py-2 rounded-lg ${selectedTimeRange === value ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            onClick={() => onTimeRangeChange(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-gray-900/20">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <Calendar size={18} />
          Storage Timeline
        </h3>
        <TimelineChart timelineData={timelineData} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-gray-900/20">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Storage By Type</h3>

          <div className="flex h-40 items-center justify-center">
            <div className="w-40 h-40 rounded-full overflow-hidden relative">
              <div className="absolute inset-0 flex">
                {storageTypeIndicators.map(({ metric, color }) => (
                  <div key={metric} className={`${color} flex-1`} style={{ flexGrow: totalSizeByMetric(domainData, metric) }}></div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            {storageTypeIndicators.map(({ metric, color, label }) => (
              <div key={metric} className="flex items-center">
                <div className={`w-3 h-3 ${color} rounded mr-2`}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{label}: {formatBytes(totalSizeByMetric(domainData, metric))}</span>
              </div>
            ))}
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
                    style={{ backgroundColor: getColorForValue(data.metrics[sortMetric], Math.max(...sortedDomains.map(([, d]) => d.metrics[sortMetric]))) }}
                  ></div>
                  <span className="text-sm font-medium">{domain}</span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{formatBytes(data.metrics[sortMetric])}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Bulk Actions</h3>

        <div className="grid grid-cols-2 gap-3">
          {bulkActions.map(({ type, label, bgClass, textClass, hoverClass }) => (
            <button
              key={type}
              className={`py-2 px-4 ${bgClass} ${textClass} rounded-lg ${hoverClass} flex items-center justify-center gap-2`}
              onClick={() => onBulkClear(type)}
            >
              <Trash2 size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default AdvancedView;
