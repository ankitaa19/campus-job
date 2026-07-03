import React from 'react';

interface Tab {
  id: string;
  label: string;
  count?: number | string;
  showCount?: boolean;
}

interface TabButtonsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const TabButtons: React.FC<TabButtonsProps> = ({ 
  tabs, 
  activeTab, 
  onTabChange,
  className = ''
}) => {
  return (
    <div className={`flex items-center bg-gray-100 rounded-full p-1 shadow-sm ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 text-center ${
            activeTab === tab.id
              ? 'bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white shadow-md'
              : 'text-[#087AED] hover:bg-gray-50'
          }`}
        >
          {tab.label}
          {tab.showCount && activeTab === tab.id && tab.count !== undefined && (
            <span className="ml-1">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  );
};

export default TabButtons;
