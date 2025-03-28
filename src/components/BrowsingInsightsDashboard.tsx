import React, { useState, useEffect } from 'react';
import StorageAnalyzer, { DomainStorageMap } from '../services/StorageAnalyzer';
import DomainCard from './DomainCard';
import { formatBytes } from '../utils/format';
import { ChevronLeft, LayoutDashboard, ListFilter, BarChart3, Calendar, Trash2 } from 'lucide-react';

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
    
  // Get domain pages for detail view
  const selectedDomainPages = selectedDomain && domainData[selectedDomain] 
    ? Object.entries(domainData[selectedDomain].pages)
        .sort(([, a], [, b]) => b.total - a.total)
    : [];
  
  // Get the max domain size for scaling
  const maxDomainSize = Math.max(
    ...Object.values(domainData).map(domain => domain.metrics.total),
    1
  );
  
  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          {viewMode !== 'summary' && (
            <button 
              className="mr-3 p-2 rounded-full hover:bg-gray-100"
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
          <h1 className="text-2xl font-bold text-gray-800">
            {viewMode === 'summary' && 'Storage Dashboard'}
            {viewMode === 'detail' && selectedDomain}
            {viewMode === 'advanced' && 'Advanced Analytics'}
          </h1>
        </div>
        
        <div className="flex gap-2">
          <button 
            className={`p-2 rounded-md hover:bg-gray-100 ${viewMode === 'summary' ? 'bg-gray-100 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setViewMode('summary')}
            title="Summary View"
          >
            <LayoutDashboard size={20} />
          </button>
          <button 
            className={`p-2 rounded-md hover:bg-gray-100 ${viewMode === 'advanced' ? 'bg-gray-100 text-blue-600' : 'text-gray-600'}`}
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
      
      {/* ===== SUMMARY VIEW ===== */}
      {!loading && viewMode === 'summary' && (
        <>
          {/* Total Storage */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold text-gray-700">Total Browser Storage</h2>
              <span className="text-xl font-bold text-blue-600">{formatBytes(totalStorage)}</span>
            </div>
            <p className="text-sm text-gray-500">
              Data from {Object.keys(domainData).length} domains tracked in this browser
            </p>
          </div>
          
          {/* Domain List */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-gray-700">Domains by Storage Size</h2>
              <div className="text-sm text-gray-500">
                {formatBytes(totalStorage)} total
              </div>
            </div>
            
            {sortedDomains.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
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
                    onSelect={() => handleDomainSelect(domain)}
                    onDelete={() => handleDomainClear(domain)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
      
      {/* ===== DETAIL VIEW ===== */}
      {!loading && viewMode === 'detail' && selectedDomain && domainData[selectedDomain] && (
        <>
          {/* Domain metrics */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Domain Storage</h2>
            <div className="grid grid-cols-4 gap-4 mb-3">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-sm text-gray-500">Total</div>
                <div className="text-lg font-bold text-gray-800">
                  {formatBytes(domainData[selectedDomain].metrics.total)}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-sm text-gray-500">History</div>
                <div className="text-lg font-bold text-blue-600">
                  {formatBytes(domainData[selectedDomain].metrics.history)}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-sm text-gray-500">Cache</div>
                <div className="text-lg font-bold text-purple-600">
                  {formatBytes(domainData[selectedDomain].metrics.cache)}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-sm text-gray-500">Cookies</div>
                <div className="text-lg font-bold text-yellow-600">
                  {formatBytes(domainData[selectedDomain].metrics.cookies)}
                </div>
              </div>
            </div>
            <button
              className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center gap-2"
              onClick={() => handleDomainClear(selectedDomain)}
            >
              <Trash2 size={16} />
              Clear All Data for {selectedDomain}
            </button>
          </div>
          
          {/* Page List */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Pages</h2>
            
            {selectedDomainPages.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No page data available
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDomainPages.map(([url, metrics]) => (
                  <div key={url} className="bg-white rounded-lg shadow p-3 mb-2">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-medium text-gray-800 truncate max-w-xs">{url}</div>
                      <button 
                        className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-100"
                        onClick={() => handleUrlClear(selectedDomain, url)}
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Size: {formatBytes(metrics.total)}</span>
                      <span>Items: {metrics.items}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      
      {/* ===== ADVANCED VIEW ===== */}
      {!loading && viewMode === 'advanced' && (
        <>
          {/* Time range selector */}
          <div className="mb-4 flex gap-2 justify-center">
            <button
              className={`px-4 py-2 rounded-lg ${selectedTimeRange === '7d' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setSelectedTimeRange('7d')}
            >
              7 Days
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${selectedTimeRange === '30d' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setSelectedTimeRange('30d')}
            >
              30 Days
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${selectedTimeRange === '90d' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setSelectedTimeRange('90d')}
            >
              90 Days
            </button>
          </div>
          
          {/* Timeline Chart - Direct HTML implementation */}
          <div className="mb-6 bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Calendar size={18} />
              Storage Timeline
            </h3>
            
            {/* Simple HTML table-based chart with forced inline styles */}
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '8px 0', height: '240px' }}>
              <tbody>
                <tr style={{ height: '200px', verticalAlign: 'bottom' }}>
                  <td style={{ width: '14%', textAlign: 'center' }}>
                    <div style={{ width: '100%', height: '60px', backgroundColor: '#3B82F6', borderRadius: '4px 4px 0 0', display: 'inline-block' }}></div>
                  </td>
                  <td style={{ width: '14%', textAlign: 'center' }}>
                    <div style={{ width: '100%', height: '90px', backgroundColor: '#3B82F6', borderRadius: '4px 4px 0 0', display: 'inline-block' }}></div>
                  </td>
                  <td style={{ width: '14%', textAlign: 'center' }}>
                    <div style={{ width: '100%', height: '120px', backgroundColor: '#3B82F6', borderRadius: '4px 4px 0 0', display: 'inline-block' }}></div>
                  </td>
                  <td style={{ width: '14%', textAlign: 'center' }}>
                    <div style={{ width: '100%', height: '80px', backgroundColor: '#3B82F6', borderRadius: '4px 4px 0 0', display: 'inline-block' }}></div>
                  </td>
                  <td style={{ width: '14%', textAlign: 'center' }}>
                    <div style={{ width: '100%', height: '140px', backgroundColor: '#3B82F6', borderRadius: '4px 4px 0 0', display: 'inline-block' }}></div>
                  </td>
                  <td style={{ width: '14%', textAlign: 'center' }}>
                    <div style={{ width: '100%', height: '100px', backgroundColor: '#3B82F6', borderRadius: '4px 4px 0 0', display: 'inline-block' }}></div>
                  </td>
                  <td style={{ width: '14%', textAlign: 'center' }}>
                    <div style={{ width: '100%', height: '70px', backgroundColor: '#3B82F6', borderRadius: '4px 4px 0 0', display: 'inline-block' }}></div>
                  </td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', padding: '8px 0' }}>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>03/22</span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '8px 0' }}>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>03/23</span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '8px 0' }}>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>03/24</span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '8px 0' }}>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>03/25</span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '8px 0' }}>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>03/26</span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '8px 0' }}>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>03/27</span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '8px 0' }}>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>03/28</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Storage Type Distribution */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Storage By Type</h3>
              
              {/* Basic pie chart replacement using colored blocks */}
              <div className="flex h-40 items-center justify-center">
                <div className="w-40 h-40 rounded-full overflow-hidden relative">
                  {/* This is a simplified representation - in a real app you'd use a proper chart library */}
                  <div className="absolute inset-0 flex">
                    <div className="bg-blue-500 flex-1" style={{ flexGrow: totalHistorySize() }}></div>
                    <div className="bg-purple-500 flex-1" style={{ flexGrow: totalCacheSize() }}></div>
                    <div className="bg-yellow-500 flex-1" style={{ flexGrow: totalCookiesSize() }}></div>
                    <div className="bg-green-500 flex-1" style={{ flexGrow: totalLocalStorageSize() }}></div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">History: {formatBytes(totalHistorySize())}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">Cache: {formatBytes(totalCacheSize())}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">Cookies: {formatBytes(totalCookiesSize())}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">LocalStorage: {formatBytes(totalLocalStorageSize())}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-700">Top Domains</h3>
                <select 
                  value={sortMetric}
                  onChange={(e) => setSortMetric(e.target.value as any)}
                  className="text-sm bg-gray-100 border-0 rounded-md px-2 py-1 text-gray-700"
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
                    <span className="text-sm text-gray-500">{formatBytes(data.metrics[sortMetric])}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Action Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Bulk Actions</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                className="py-2 px-4 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center justify-center gap-2"
                onClick={() => bulkClearByType('history')}
              >
                <Trash2 size={16} />
                Clear All History
              </button>
              
              <button
                className="py-2 px-4 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center justify-center gap-2"
                onClick={() => bulkClearByType('cache')}
              >
                <Trash2 size={16} />
                Clear All Cache
              </button>
              
              <button
                className="py-2 px-4 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 flex items-center justify-center gap-2"
                onClick={() => bulkClearByType('cookies')}
              >
                <Trash2 size={16} />
                Clear All Cookies
              </button>
              
              <button
                className="py-2 px-4 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center justify-center gap-2"
                onClick={() => bulkClearByType('localStorage')}
              >
                <Trash2 size={16} />
                Clear All LocalStorage
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
  
  // Helper functions for calculations
  function totalHistorySize() {
    return Object.values(domainData).reduce((sum, domain) => sum + domain.metrics.history, 0);
  }
  
  function totalCacheSize() {
    return Object.values(domainData).reduce((sum, domain) => sum + domain.metrics.cache, 0);
  }
  
  function totalCookiesSize() {
    return Object.values(domainData).reduce((sum, domain) => sum + domain.metrics.cookies, 0);
  }
  
  function totalLocalStorageSize() {
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
};

export default BrowsingInsightsDashboard; 