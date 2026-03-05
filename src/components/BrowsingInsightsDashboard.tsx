import { useState, useEffect, useRef } from 'react';
import StorageAnalyzer, { DomainStorageMap, DEFAULT_CLEANUP_RULES } from '../services/StorageAnalyzer';
import { ChevronLeft, LayoutDashboard, BarChart3 } from 'lucide-react';
import SummaryView from './dashboard/SummaryView';
import DetailView from './dashboard/DetailView';
import AdvancedView from './dashboard/AdvancedView';

type ViewMode = 'summary' | 'detail' | 'advanced';
type SortMetric = 'total' | 'history' | 'cache' | 'cookies' | 'localStorage';

function BrowsingInsightsDashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [domainData, setDomainData] = useState<DomainStorageMap>({});
  const [loading, setLoading] = useState(true);
  const [totalStorage, setTotalStorage] = useState(0);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [timelineData, setTimelineData] = useState<any>({});
  const [sortMetric, setSortMetric] = useState<SortMetric>('total');

  const analyzerRef = useRef(new StorageAnalyzer());
  const analyzer = analyzerRef.current;

  function calculateTotal(data: DomainStorageMap): number {
    return Object.values(data).reduce((sum, d) => sum + d.metrics.total, 0);
  }

  async function reloadDomainData() {
    const data = await analyzer.getStorageByDomain();
    setDomainData(data);
    setTotalStorage(calculateTotal(data));
    return data;
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        await reloadDomainData();

        const days = selectedTimeRange === '7d' ? 7 :
                    selectedTimeRange === '30d' ? 30 : 90;
        const timeline = await analyzer.getStorageTimeline(days);
        setTimelineData(timeline);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedTimeRange]);

  function handleDomainSelect(domain: string) {
    setSelectedDomain(domain);
    setViewMode('detail');
  }

  async function handleDomainClear(domain: string) {
    try {
      setLoading(true);
      const itemsDeleted = await analyzer.deleteSelective({
        domain,
        types: ['history', 'cookies', 'cache', 'localStorage']
      }, DEFAULT_CLEANUP_RULES);
      await reloadDomainData();
      alert(`Deleted ${itemsDeleted} items for ${domain}`);
    } catch (error) {
      console.error('Error clearing domain:', error);
      alert(`Error clearing data for ${domain}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleUrlClear(_domain: string, url: string) {
    try {
      setLoading(true);
      const itemsDeleted = await analyzer.deleteSelective({
        url,
        types: ['history', 'cookies', 'cache', 'localStorage']
      }, DEFAULT_CLEANUP_RULES);
      await reloadDomainData();
      alert(`Deleted ${itemsDeleted} items for ${url}`);
    } catch (error) {
      console.error('Error clearing URL:', error);
      alert(`Error clearing data for ${url}`);
    } finally {
      setLoading(false);
    }
  }

  const sortedDomains = Object.entries(domainData)
    .sort(([, a], [, b]) => b.metrics[sortMetric] - a.metrics[sortMetric]);

  const maxDomainSize = Math.max(
    ...Object.values(domainData).map(d => d.metrics.total),
    1
  );

  async function bulkClearByType(type: string) {
    if (!confirm(`Are you sure you want to clear all ${type}?`)) return;

    try {
      setLoading(true);
      await analyzer.deleteSelective({ types: [type] }, DEFAULT_CLEANUP_RULES);
      await reloadDomainData();
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
          onSortMetricChange={(metric) => setSortMetric(metric as SortMetric)}
          sortedDomains={sortedDomains}
          onBulkClear={bulkClearByType}
        />
      )}
    </div>
  );
}

export default BrowsingInsightsDashboard;
