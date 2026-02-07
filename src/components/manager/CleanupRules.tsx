import { useState } from 'react';
import { Database, Pencil, Plus, X } from 'lucide-react';
import { CleanupRule } from '../../services/StorageAnalyzer';

interface CleanupRulesProps {
  cleanupRules: CleanupRule[];
  onRulesChange: (rules: CleanupRule[]) => void;
}

function CleanupRules({
  cleanupRules,
  onRulesChange,
}: CleanupRulesProps) {
  // null = not editing, -1 = adding new, 0+ = editing that index
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formDomain, setFormDomain] = useState('');
  const [formLocalKeys, setFormLocalKeys] = useState('');
  const [formSessionKeys, setFormSessionKeys] = useState('');

  const openAddForm = () => {
    setEditingIndex(-1);
    setFormDomain('');
    setFormLocalKeys('');
    setFormSessionKeys('');
  };

  const openEditForm = (index: number) => {
    const rule = cleanupRules[index];
    setEditingIndex(index);
    setFormDomain(rule.domain);
    setFormLocalKeys(rule.localStorageKeys.join(', '));
    setFormSessionKeys(rule.sessionStorageKeys.join(', '));
  };

  const closeForm = () => {
    setEditingIndex(null);
  };

  const parseKeys = (input: string): string[] =>
    input.split(',').map((k) => k.trim()).filter(Boolean);

  const handleSave = () => {
    const localKeys = parseKeys(formLocalKeys);
    const sessionKeys = parseKeys(formSessionKeys);
    const domain = formDomain.trim();

    if (!domain || (localKeys.length === 0 && sessionKeys.length === 0)) return;

    const newRule: CleanupRule = {
      domain,
      localStorageKeys: localKeys,
      sessionStorageKeys: sessionKeys,
    };

    if (editingIndex === -1) {
      onRulesChange([...cleanupRules, newRule]);
    } else if (editingIndex !== null) {
      const updated = [...cleanupRules];
      updated[editingIndex] = newRule;
      onRulesChange(updated);
    }

    closeForm();
  };

  const renderForm = () => (
    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg space-y-2">
      <input
        type="text"
        value={formDomain}
        onChange={(e) => setFormDomain(e.target.value)}
        placeholder="Domain (e.g. youtube.com)"
        className="w-full px-3 py-1.5 text-sm border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
      />
      <input
        type="text"
        value={formLocalKeys}
        onChange={(e) => setFormLocalKeys(e.target.value)}
        placeholder="localStorage keys (comma-separated)"
        className="w-full px-3 py-1.5 text-sm border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
      />
      <input
        type="text"
        value={formSessionKeys}
        onChange={(e) => setFormSessionKeys(e.target.value)}
        placeholder="sessionStorage keys (comma-separated, optional)"
        className="w-full px-3 py-1.5 text-sm border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {editingIndex === -1 ? 'Add' : 'Save'}
        </button>
        <button
          onClick={closeForm}
          className="px-3 py-1 text-sm bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="mb-4">
      <label className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-2">
        <Database size={16} />
        Storage Cleanup Rules
        <button
          onClick={openAddForm}
          className="ml-auto bg-blue-500 text-white p-1 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus size={16} />
        </button>
      </label>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        Configure localStorage keys to clear per domain
      </div>

      {editingIndex === -1 && renderForm()}

      <div className="space-y-2 mb-2">
        {cleanupRules.map((rule, index) =>
          editingIndex === index ? (
            <div key={index}>{renderForm()}</div>
          ) : (
            <div key={index} className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg text-sm">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700 dark:text-gray-300">{rule.domain}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditForm(index)}
                    className="text-gray-500 hover:text-blue-500 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => onRulesChange(cleanupRules.filter((_, i) => i !== index))}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                Keys: {rule.localStorageKeys.join(', ')}
              </div>
              {rule.sessionStorageKeys.length > 0 && (
                <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                  Session keys: {rule.sessionStorageKeys.join(', ')}
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default CleanupRules;
