import React from 'react';
import { Database, X } from 'lucide-react';
import { CleanupRule } from '../../services/StorageAnalyzer';

interface CleanupRulesProps {
  cleanupRules: CleanupRule[];
  onRulesChange: (rules: CleanupRule[]) => void;
}

const CleanupRules: React.FC<CleanupRulesProps> = ({
  cleanupRules,
  onRulesChange,
}) => {
  return (
    <div className="mb-4">
      <label className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-2">
        <Database size={16} />
        Storage Cleanup Rules
      </label>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        Configure localStorage keys to clear per domain
      </div>
      <div className="space-y-2 mb-2">
        {cleanupRules.map((rule, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg text-sm">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700 dark:text-gray-300">{rule.domain}</span>
              <button
                onClick={() => onRulesChange(cleanupRules.filter((_, i) => i !== index))}
                className="text-red-500 hover:text-red-600"
              >
                <X size={14} />
              </button>
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
              Keys: {rule.localStorageKeys.join(', ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CleanupRules;
