import React, { useState, useEffect } from 'react';
import StorageAnalyzer, { DomainStorageMap } from '../services/StorageAnalyzer';
import { ChevronLeft, LayoutDashboard, BarChart3 } from 'lucide-react';
import SummaryView from './dashboard/SummaryView';
import DetailView from './dashboard/DetailView';
import AdvancedView from './dashboard/AdvancedView';

// View modes for progressive disclosure
type ViewMode = 'summary' | 'detail' | 'advanced';

const BrowsingInsightsDashboard: React.FC = () => {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [domainData, setDomainData] = useState<DomainStorageMap>({});
  const [loading, setLoading] = useState(true);
  const [totalStorage, setTotalStorage] = useState(0);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [timelineData, setTimelineData] = useState<any>({});
  const [sortMetric, setSortMetric] = useState<'total' | 'history' | 'cache' | 'cookies' | 'localStorage'>('total');

  // Init storage analyzer
  const analyzer = new StorageAnalyzer();

  // Load storage data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await analyzer.getStorageByDomain();
        setDomainData(data);

        // Calculate total storage
        let total = 0;
        Object.values(data).forEach(domain => {
          total += domain.metrics.total;
        });
        setTotalStorage(total);

        // Always load timeline data regardless of view mode
        const days = selectedTimeRange === '7d' ? 7 :
                    selectedTimeRange === '30d' ? 30 : 90;
        const timeline = await analyzer.getStorageTimeline(days);
        setTimelineData(timeline);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedTimeRange]); // Only reload when time range changes

  // Handle domain selection
  const handleDomainSelect = (domain: string) => {
    setSelectedDomain(domain);
    setViewMode('detail');
  };

  // Handle domain deletion
  const handleDomainClear = async (domain: string) => {
    try {
      setLoading(true);
      const itemsDeleted = await analyzer.deleteSelective({
        domain: domain,
        types: ['history', 'cookies', 'cache']
      });

      // Reload data
      const data = await analyzer.getStorageByDomain();
      setDomainData(data);

      // Recalculate total storage
      let total = 0;
      Object.values(data).forEach(domain => {
        total += domain.metrics.total;
      });
      setTotalStorage(total);

      alert(`Deleted ${itemsDeleted} items for ${domain}`);
    } catch (error) {
      console.error('Error clearing domain:', error);
      alert(`Error clearing data for ${domain}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle domain specific URL deletion
  const handleUrlClear = async (domain: string, url: string) => {
    try {
      setLoading(true);
      const itemsDeleted = await analyzer.deleteSelective({
        url: url,
        types: ['history', 'cookies', 'cache']
      });

      // Reload data
      const data = await analyzer.getStorageByDomain();
      setDomainData(data);

      alert(`Deleted ${itemsDeleted} items for ${url}`);
    } catch (error) {
      console.error('Error clearing URL:', error);
      alert(`Error clearing data for ${url}`);
    } finally {
      setLoading(false);
    }
  };

  // Sort domains by selected metric
  const sortedDomains = Object.entries(domainData)
    .sort(([, a], [, b]) => b.metrics[sortMetric] - a.metrics[sortMetric]);

  // Get the max domain size for scaling
  const maxDomainSize = Math.max(
    ...Object.values(domainData).map(domain => domain.metrics.total),
    1
  );

  async function bulkClearByType(type: 'history' | 'cache' | 'cookies' | 'localStorage') {
    if (!confirm(`Are you sure you want to clear all ${type}?`)) {
      return;
    }

    try {
      setLoading(true);
      await analyzer.deleteSelective({
        types: [type]
      });

      // Reload data
      const data = await analyzer.getStorageByDomain();
      setDomainData(data);

      // Recalculate total storage
      let total = 0;
      Object.values(data).forEach(domain => {
        total += domain.metrics.total;
      });
      setTotalStorage(total);

      alert(`All ${type} cleared successfully`);
    } catch (error) {
      console.error(`Error clearing ${type}:`, error);
      alert(`Error clearing ${type}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/20 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          {viewMode !== 'summary' && (
            <button
              className="mr-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                if (viewMode === 'detail') {
                  setViewMode('summary');
                  setSelectedDomain(null);
                } else if (viewMode === 'advanced') {
                  setViewMode('summary');
                }
              }}
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {viewMode === 'summary' && 'Storage Dashboard'}
            {viewMode === 'detail' && selectedDomain}
            {viewMode === 'advanced' && 'Advanced Analytics'}
          </h1>
        </div>

        <div className="flex gap-2">
          <button
            className={`p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${viewMode === 'summary' ? 'bg-gray-100 dark:bg-gray-700 text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}
            onClick={() => setViewMode('summary')}
            title="Summary View"
          >
            <LayoutDashboard size={20} />
          </button>
          <button
            className={`p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${viewMode === 'advanced' ? 'bg-gray-100 dark:bg-gray-700 text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}
            onClick={() => setViewMode('advanced')}
            title="Advanced View"
          >
            <BarChart3 size={20} />
          </button>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {!loading && viewMode === 'summary' && (
        <SummaryView
          domainData={domainData}
          totalStorage={totalStorage}
          sortedDomains={sortedDomains}
          maxDomainSize={maxDomainSize}
          onDomainSelect={handleDomainSelect}
          onDomainClear={handleDomainClear}
        />
      )}

      {!loading && viewMode === 'detail' && selectedDomain && domainData[selectedDomain] && (
        <DetailView
          selectedDomain={selectedDomain}
          domainData={domainData}
          onDomainClear={handleDomainClear}
          onUrlClear={handleUrlClear}
        />
      )}

      {!loading && viewMode === 'advanced' && (
        <AdvancedView
          domainData={domainData}
          timelineData={timelineData}
          selectedTimeRange={selectedTimeRange}
          onTimeRangeChange={setSelectedTimeRange}
          sortMetric={sortMetric}
          onSortMetricChange={(metric) => setSortMetric(metric as any)}
          sortedDomains={sortedDomains}
          onBulkClear={(type) => bulkClearByType(type as any)}
        />
      )}
    </div>
  );
};

export default BrowsingInsightsDashboard;
