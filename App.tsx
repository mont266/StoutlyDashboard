import React, { useState, useEffect } from 'react';
import Home from './components/tabs/Home';
import Users from './components/tabs/Users';
import Content from './components/tabs/Content';
import Financial from './components/tabs/Financial';
import GA4 from './components/tabs/GA4';
import { HomeIcon, UsersIcon, FileTextIcon, CreditCardIcon, StoutlyLogo, AnalyticsIcon } from './components/icons/Icons';
import { getDaysSinceLaunch } from './services/supabaseService';

const TABS = {
    Home: { component: Home, icon: <HomeIcon /> },
    Users: { component: Users, icon: <UsersIcon /> },
    Content: { component: Content, icon: <FileTextIcon /> },
    Financial: { component: Financial, icon: <CreditCardIcon /> },
    GA4: { component: GA4, icon: <AnalyticsIcon /> },
};

type TabName = keyof typeof TABS;

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabName>('Home');
    const [daysSinceLaunch, setDaysSinceLaunch] = useState<number>(0);

    useEffect(() => {
        setDaysSinceLaunch(getDaysSinceLaunch());
    }, []);

    const ActiveComponent = TABS[activeTab].component;

    return (
        <div className="min-h-screen bg-background text-text-primary flex flex-col">
            <div className="flex-grow p-4 sm:p-6 lg:p-8">
                <main className="max-w-7xl mx-auto">
                    <header className="mb-6 flex items-center space-x-4">
                        <StoutlyLogo className="h-12 w-12" />
                        <div>
                            <h1 className="text-3xl font-bold text-text-primary">Stoutly Analytics</h1>
                            <p className="text-text-secondary mt-1">Your all-in-one performance dashboard.</p>
                        </div>
                    </header>

                    <nav className="mb-8">
                        <div className="flex space-x-2 border-b border-border overflow-x-auto pb-px">
                            {(Object.keys(TABS) as TabName[]).map((tabName) => (
                                <button
                                    key={tabName}
                                    onClick={() => setActiveTab(tabName)}
                                    className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 shrink-0 ${
                                        activeTab === tabName
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-text-secondary hover:text-text-primary'
                                    }`}
                                    aria-current={activeTab === tabName ? 'page' : undefined}
                                >
                                    {TABS[tabName].icon}
                                    <span>{tabName}</span>
                                </button>
                            ))}
                        </div>
                    </nav>

                    <div>
                        <ActiveComponent />
                    </div>
                </main>
            </div>
            <footer className="w-full bg-surface text-center p-4 border-t border-border mt-8">
                <p className="text-sm text-text-secondary">
                    Stoutly App Launched <span className="font-bold text-primary">{daysSinceLaunch}</span> days ago.
                </p>
            </footer>
        </div>
    );
};

export default App;