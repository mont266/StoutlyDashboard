

import React, { useState, useEffect, useMemo } from 'react';
import { dash_getUsersData, getAvatarUrl } from '../../services/supabaseService';
import type { User, UTMStat, UserKpis } from '../../types';
import type { DashUsersData } from '../../services/dashContracts';
import StatCard from '../StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { UsersIcon, GlobeIcon, ChevronsUpDownIcon, StarIcon } from '../icons/Icons';

type SubTab = 'all' | 'today' | 'utm';

const PLACEHOLDER_AVATAR = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTYgMjF2LTJhNCA0IDAgMCAwLTQtNEg2YTQgNCAwIDAgMC00IDR2MiI+PC9wYXRoPjxjaXJjbGUgY3g9IjkiIGN5PSI3IiByPSI0Ij48L2NpcmNsZT48L3N2Zz4=`;

const Users: React.FC = () => {
    const [subTab, setSubTab] = useState<SubTab>('all');
    const [data, setData] = useState<DashUsersData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Single, consolidated API call
                const result = await dash_getUsersData();
                setData(result);
            } catch (error) {
                console.error("Failed to fetch user data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const subTabs: { id: SubTab; label: string }[] = [
        { id: 'all', label: 'All Users' },
        { id: 'today', label: 'Logged in Today' },
        { id: 'utm', label: 'UTM Sources' },
    ];

    const renderContent = () => {
        if (loading || !data) return <div className="bg-surface rounded-xl h-96 animate-pulse"></div>;

        switch (subTab) {
            case 'all':
                return <UserTable users={data.allUsers} />;
            case 'today':
                return <UserList users={data.todayUsers} />;
            case 'utm':
                return <UTMChart data={data.utmStats} />;
            default:
                return null;
        }
    };

    return (
        <section>
            <h2 className="text-2xl font-bold mb-6">User Analytics</h2>
            <div className="space-y-8">
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                     <StatCard title="Total Users" value={data?.kpis.totalUsers.toLocaleString() ?? '...'} icon={<UsersIcon />} />
                     <StatCard title="Active Today" value={data?.kpis.activeToday.toLocaleString() ?? '...'} icon={<UsersIcon />} />
                     <StatCard title="UTM Sources" value={data?.utmStats.length.toLocaleString() ?? '...'} icon={<GlobeIcon />} />
                 </div>
                 <div className="bg-surface p-2 sm:p-4 rounded-xl">
                    <div className="mb-4">
                        <div className="flex space-x-2 border-b border-border pb-px">
                            {subTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setSubTab(tab.id)}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                                        subTab === tab.id
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-text-secondary hover:text-text-primary'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {renderContent()}
                </div>
            </div>
        </section>
    );
};

const UserBadges: React.FC<{ user: User }> = ({ user }) => (
    <div className="flex items-center space-x-1.5 ml-2">
        {user.isTeamMember && <span title="Team Member" className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-400">Team</span>}
        {user.isDeveloper && <span title="Developer" className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-400">Dev</span>}
        {user.isBetaTester && <span title="Beta Tester" className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400">Beta</span>}
        {user.hasDonated && <span title="Donator" className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/20 text-primary">Donator</span>}
    </div>
);

type SortableUserKeys = 'name' | 'level' | 'reviewsCount' | 'lastActive' | 'signupDate';

const UserTable: React.FC<{ users: User[] }> = ({ users }) => {
    // Basic pagination and search state
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortableUserKeys; direction: 'ascending' | 'descending' }>({ key: 'signupDate', direction: 'descending' });
    const usersPerPage = 10;

    const filteredUsers = useMemo(() => users.filter(user => {
        const query = searchQuery.toLowerCase();
        const nameMatch = user.name ? user.name.toLowerCase().includes(query) : false;
        return nameMatch;
    }), [users, searchQuery]);

    const sortedUsers = useMemo(() => {
        let sortableUsers = [...filteredUsers];
        if (sortConfig.key) {
            sortableUsers.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                
                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableUsers;
    }, [filteredUsers, sortConfig]);

    const requestSort = (key: SortableUserKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const paginatedUsers = sortedUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);
    const totalPages = Math.ceil(sortedUsers.length / usersPerPage);

    const SortableHeader: React.FC<{ sortKey: SortableUserKeys, children: React.ReactNode, className?: string }> = ({ sortKey, children, className }) => (
         <th className={`px-4 py-3 group ${className}`} >
            <button onClick={() => requestSort(sortKey)} className={`flex items-center w-full ${sortConfig.key === sortKey ? 'text-text-primary' : ''}`}>
                {children}
                <ChevronsUpDownIcon />
            </button>
        </th>
    );

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <div>
            <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="bg-background w-full max-w-sm px-3 py-2 rounded-lg border border-border focus:ring-primary focus:border-primary mb-4"
            />
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-text-secondary">
                    <thead className="text-xs text-text-secondary uppercase bg-background">
                        <tr>
                            <SortableHeader sortKey="name">User</SortableHeader>
                            <th className="px-4 py-3 hidden md:table-cell">Country</th>
                            <SortableHeader sortKey="level">Level</SortableHeader>
                            <SortableHeader sortKey="reviewsCount">Reviews</SortableHeader>
                            <th className="px-4 py-3">Status</th>
                            <SortableHeader sortKey="lastActive" className="hidden lg:table-cell">Last Active</SortableHeader>
                            <SortableHeader sortKey="signupDate" className="hidden lg:table-cell">Sign Up</SortableHeader>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedUsers.map(user => (
                            <tr key={user.id} className="border-b border-border hover:bg-border/50">
                                <td className="px-4 py-4 font-medium text-text-primary whitespace-nowrap">
                                    <div className="flex items-center space-x-3">
                                        <img 
                                            src={getAvatarUrl(user.avatarId)} 
                                            alt={`${user.name}'s avatar`}
                                            className="w-10 h-10 rounded-full bg-border object-cover"
                                            onError={(e) => { e.currentTarget.src = PLACEHOLDER_AVATAR; }}
                                        />
                                        <div>
                                            <div className="flex items-center">
                                                <span className="font-semibold">{user.name}</span>
                                                <UserBadges user={user} />
                                            </div>
                                            <p className="text-xs text-text-secondary">Joined: {formatDate(user.signupDate)}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 hidden md:table-cell">{user.countryCode || 'N/A'}</td>
                                <td className="px-4 py-4">{user.level}</td>
                                <td className="px-4 py-4">{user.reviewsCount.toLocaleString()}</td>
                                <td className="px-4 py-4">
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${user.banStatus === 'Active' ? 'bg-value-green/20 text-value-green' : 'bg-warning-red/20 text-warning-red'}`}>
                                        {user.banStatus}
                                    </span>
                                </td>
                                <td className="px-4 py-4 hidden lg:table-cell">{formatDate(user.lastActive)}</td>
                                <td className="px-4 py-4 hidden lg:table-cell">{formatDate(user.signupDate)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <div className="flex justify-between items-center mt-4 text-sm">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded bg-border disabled:opacity-50">Previous</button>
                <span>Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded bg-border disabled:opacity-50">Next</button>
            </div>
        </div>
    )
};

const UserList: React.FC<{ users: User[] }> = ({ users }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {users.map(user => (
            <div key={user.id} className="bg-background p-4 rounded-lg flex items-center space-x-3 border border-border">
                 <img 
                    src={getAvatarUrl(user.avatarId)} 
                    alt={user.name} 
                    className="w-12 h-12 rounded-full bg-border object-cover"
                    onError={(e) => { e.currentTarget.src = PLACEHOLDER_AVATAR; }}
                 />
                <div>
                    <p className="font-semibold text-text-primary">{user.name}</p>
                    <p className="text-xs text-text-secondary">{new Date(user.lastActive).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                </div>
            </div>
        ))}
    </div>
);

const UTMChart: React.FC<{ data: UTMStat[] }> = ({ data }) => (
    <div className="h-96 p-4">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#9CA3AF' }} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="source" type="category" tick={{ fill: '#9CA3AF' }} fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#FDEED4' }}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                />
                <Bar dataKey="count" name="Signups" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20}>
                    <LabelList dataKey="count" position="right" fill="#FDEED4" fontSize={12} />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </div>
);


export default Users;