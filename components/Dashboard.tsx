import React, { useState, useEffect } from 'react';
import Home from './tabs/Home';
import Users from './tabs/Users';
import Content from './tabs/Content';
import Financial from './tabs/Financial';
import GA4 from './tabs/GA4';
import Pubs from './tabs/Pubs';
import { HomeIcon, UsersIcon, FileTextIcon, CreditCardIcon, StoutlyLogo, AnalyticsIcon, BuildingIcon, LogOutIcon } from './icons/Icons';
import { getLaunchDuration } from '../services/supabaseService';

const TABS = {
    Home: { component: Home, icon: <HomeIcon /> },
    Users: { component: Users, icon: <UsersIcon /> },
    Pubs: { component: Pubs, icon: <BuildingIcon /> },
    Content: { component: Content, icon: <FileTextIcon /> },
    Financial: { component: Financial, icon: <CreditCardIcon /> },
    GA4: { component: GA4, icon: <AnalyticsIcon /> },
};

type TabName = keyof typeof TABS;

interface DashboardProps {
    onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState<TabName>('Home');
    const [launchDuration, setLaunchDuration] = useState<{ years: number, months: number, days: number } | null>(null);

    useEffect(() => {
        setLaunchDuration(getLaunchDuration());
    }, []);

    const ActiveComponent = TABS[activeTab].component;

    const formatDuration = (duration: { years: number, months: number, days: number } | null): string => {
        if (!duration) return '...';
        
        const { years, months, days } = duration;
        
        const yearString = `${years} year${years !== 1 ? 's' : ''}`;
        const monthString = `${months} month${months !== 1 ? 's' : ''}`;
        const dayString = `${days} day${days !== 1 ? 's' : ''}`;

        if (years > 0) {
            return `${yearString}, ${monthString}, and ${dayString}`;
        }
        if (months > 0) {
            return `${monthString} and ${dayString}`;
        }
        return dayString;
    };


    return (
        <div className="min-h-screen bg-background text-text-primary flex flex-col">
            <div className="flex-grow p-4 sm:p-6 lg:p-8">
                <main className="max-w-7xl mx-auto">
                    <header className="mb-6 flex flex-col items-center text-center sm:flex-row sm:text-left sm:justify-between sm:items-center flex-wrap gap-4">
                        <div className="flex items-center space-x-4">
                            <StoutlyLogo className="h-12 w-12" />
                            <div>
                                <h1 className="text-3xl font-bold text-text-primary">Stoutly Analytics</h1>
                                <p className="text-text-secondary mt-1">Your all-in-one performance dashboard.</p>
                            </div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-primary bg-surface px-4 py-2 rounded-lg border border-border hover:border-primary/50 transition-colors"
                        >
                            <LogOutIcon />
                            <span>Logout</span>
                        </button>
                    </header>

                    <nav className="mb-8">
                        <div className="flex space-x-1 border-b border-border overflow-x-auto pb-px">
                            {(Object.keys(TABS) as TabName[]).map((tabName) => (
                                <button
                                    key={tabName}
                                    onClick={() => setActiveTab(tabName)}
                                    className={`flex items-center space-x-2 px-3 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm font-medium border-b-2 transition-colors duration-200 shrink-0 ${
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
                    Stoutly App Launched <span className="font-bold text-primary">{formatDuration(launchDuration)}</span> ago.
                </p>
            </footer>
        </div>
    );
};

export default Dashboard;