interface Tab {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

/**
 * Compact TabBar with reduced height
 */
const TabBar = ({ tabs, activeTab, onTabChange }: TabBarProps) => {
  return (
    <div className="flex items-center gap-4">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`vmtb-tab text-sm pb-2 ${activeTab === tab.id ? 'vmtb-tab-active' : ''}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabBar;
