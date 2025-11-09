
import React, { useState, useEffect } from 'react';
import { getAllUsers, getUsersToday, getUTMStats } from '../../services/supabaseService';
import type { User, UTMStat } from '../../types';
import StatCard from '../StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { UsersIcon, GlobeIcon } from '../icons/Icons';

type SubTab = 'all' | 'today' | 'utm';

const Users: React.FC = () => {
    const [subTab, setSubTab] = useState<SubTab>('all');
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [todayUsers, setTodayUsers] = useState<User[]>([]);
    const [utmStats, setUtmStats] = useState<UTMStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [all, today, utm] = await Promise.all([
                getAllUsers(),
                getUsersToday(),
                getUTMStats(),
            ]);
            setAllUsers(all);
            setTodayUsers(today);
            setUtmStats(utm);
            setLoading(false);
        };
        fetchData();
    }, []);

    const subTabs: { id: SubTab; label: string }[] = [
        { id: 'all', label: 'All Users' },
        { id: 'today', label: 'Logged in Today' },
        { id: 'utm', label: 'UTM Sources' },
    ];

    const renderContent = () => {
        if (loading) return <div className="bg-surface rounded-xl h-96 animate-pulse"></div>;

        switch (subTab) {
            case 'all':
                return <UserTable users={allUsers} />;
            case 'today':
                return <UserList users={todayUsers} />;
            case 'utm':
                return <UTMChart data={utmStats} />;
            default:
                return null;
        }
    };

    return (
        <section>
            <h2 className="text-2xl font-bold mb-6">User Analytics</h2>
            <div className="space-y-8">
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                     <StatCard title="Total Users" value={allUsers.length.toLocaleString()} icon={<UsersIcon />} />
                     <StatCard title="Active Today" value={todayUsers.length.toLocaleString()} icon={<UsersIcon />} />
                     <StatCard title="UTM Sources" value={utmStats.length.toLocaleString()} icon={<GlobeIcon />} />
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

const UserTable: React.FC<{ users: User[] }> = ({ users }) => {
    // Basic pagination and search state
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const usersPerPage = 10;

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const paginatedUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    return (
        <div>
            <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="bg-background w-full max-w-sm px-3 py-2 rounded-lg border border-border focus:ring-primary focus:border-primary mb-4"
            />
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-text-secondary">
                    <thead className="text-xs text-text-secondary uppercase bg-background">
                        <tr>
                            <th className="px-4 py-3">User</th>
                            <th className="px-4 py-3">Level</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 hidden sm:table-cell">Last Active</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedUsers.map(user => (
                            <tr key={user.id} className="border-b border-border hover:bg-border/50">
                                <td className="px-4 py-4 font-medium text-text-primary whitespace-nowrap">
                                    <div className="flex items-center space-x-3">
                                        <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full" />
                                        <div>
                                            <span>{user.name}</span>
                                            <p className="text-xs text-text-secondary">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4">{user.level}</td>
                                <td className="px-4 py-4">
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${user.banStatus === 'Active' ? 'bg-value-green/20 text-value-green' : 'bg-warning-red/20 text-warning-red'}`}>
                                        {user.banStatus}
                                    </span>
                                </td>
                                <td className="px-4 py-4 hidden sm:table-cell">{user.lastActive}</td>
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
                 <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full" />
                <div>
                    <p className="font-semibold text-text-primary">{user.name}</p>
                    <p className="text-xs text-text-secondary">{user.lastActive}</p>
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