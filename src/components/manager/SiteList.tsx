import React from 'react';
import { Plus, X } from 'lucide-react';

interface SiteListProps {
  targetSites: string[];
  newSite: string;
  onNewSiteChange: (value: string) => void;
  onAddSite: () => void;
  onRemoveSite: (site: string) => void;
  triggerSite: string;
  timerActive: boolean;
}

const SiteList: React.FC<SiteListProps> = ({
  targetSites,
  newSite,
  onNewSiteChange,
  onAddSite,
  onRemoveSite,
  triggerSite,
  timerActive,
}) => {
  return (
    <div className="mb-6">
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newSite}
          onChange={(e) => onNewSiteChange(e.target.value)}
          placeholder="Enter domain (e.g., example.com)"
          className="flex-1 px-3 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
        />
        <button
          onClick={onAddSite}
          className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-2">
        {targetSites.map((site) => (
          <div
            key={site}
            className={`flex items-center justify-between p-3 rounded-lg ${
              site === triggerSite && timerActive
                ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                : 'bg-gray-50 dark:bg-gray-700'
            }`}
          >
            <div className="flex items-center">
              <span className="text-gray-700 dark:text-gray-300">{site}</span>
              {site === triggerSite && timerActive && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                  Active
                </span>
              )}
            </div>
            <button
              onClick={() => onRemoveSite(site)}
              className="text-red-500 hover:text-red-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SiteList;
