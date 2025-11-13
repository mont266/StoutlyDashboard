import React, { useState } from 'react';
import Donations from './financial/Donations';
import Outgoings from './financial/Outgoings';
import { GiftIcon, TrendingDownIcon } from '../icons/Icons';

const SUB_TABS = {
    Donations: { component: Donations, icon: <GiftIcon /> },
    Outgoings: { component: Outgoings, icon: <TrendingDownIcon /> },
};
type SubTabName = keyof typeof SUB_TABS;

const Financial: React.FC = () => {
    const [activeSubTab, setActiveSubTab] = useState<SubTabName>('Donations');

    const ActiveComponent = SUB_TABS[activeSubTab].component;

    return (
        <section>
            <nav className="mb-6">
                <div className="flex space-x-2 border-b border-border pb-px">
                    {(Object.keys(SUB_TABS) as SubTabName[]).map((tabName) => (
                        <button
                            key={tabName}
                            onClick={() => setActiveSubTab(tabName)}
                            className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 shrink-0 ${
                                activeSubTab === tabName
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-text-secondary hover:text-text-primary'
                            }`}
                            aria-current={activeSubTab === tabName ? 'page' : undefined}
                        >
                            {SUB_TABS[tabName].icon}
                            <span>{tabName}</span>
                        </button>
                    ))}
                </div>
            </nav>

            <div>
                <ActiveComponent />
            </div>
        </section>
    );
};

export default Financial;
