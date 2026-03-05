import { DomainStorageMap } from '../../services/StorageAnalyzer';
import DomainCard from '../DomainCard';
import { formatBytes } from '../../utils/format';

interface SummaryViewProps {
  domainData: DomainStorageMap;
  totalStorage: number;
  sortedDomains: [string, DomainStorageMap[string]][];
  maxDomainSize: number;
  onDomainSelect: (domain: string) => void;
  onDomainClear: (domain: string) => void;
}

function SummaryView({
  domainData,
  totalStorage,
  sortedDomains,
  maxDomainSize,
  onDomainSelect,
  onDomainClear,
}: SummaryViewProps) {
  return (
    <>
      <div className="mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Total Browser Storage</h2>
          <span className="text-xl font-bold text-blue-600">{formatBytes(totalStorage)}</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Data from {Object.keys(domainData).length} domains tracked in this browser
        </p>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Domains by Storage Size</h2>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {formatBytes(totalStorage)} total
          </div>
        </div>

        {sortedDomains.length === 0 ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            No domain data available
          </div>
        ) : (
          <div className="space-y-3">
            {sortedDomains.map(([domain, data]) => (
              <DomainCard
                key={domain}
                domain={domain}
                metrics={data.metrics}
                maxSize={maxDomainSize}
                onSelect={() => onDomainSelect(domain)}
                onDelete={() => onDomainClear(domain)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default SummaryView;
