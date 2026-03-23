import React, { useState, useEffect } from 'react';
import { getPublicMapUsers, getAvatarUrl } from '../../services/supabaseService';
import type { PublicMapUser } from '../../types';
import { MapIcon, ExternalLinkIcon, RefreshCwIcon } from '../icons/Icons';

interface MapsProps {
    refreshKey: number;
}

const Maps: React.FC<MapsProps> = ({ refreshKey }) => {
    const [users, setUsers] = useState<PublicMapUser[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getPublicMapUsers();
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch public map users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [refreshKey]);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-10 w-48 bg-surface rounded-lg mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-surface rounded-xl shadow-lg p-6 h-32"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center space-x-4">
                    <h2 className="text-3xl font-bold text-text-primary tracking-tight">Public Maps</h2>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="text-text-secondary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-2 rounded-full hover:bg-border/50"
                        aria-label="Refresh data"
                    >
                        <RefreshCwIcon className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
                <div className="bg-surface px-4 py-2 rounded-lg border border-border/50 text-sm font-medium text-text-secondary">
                    Total Public Maps: <span className="text-primary font-bold">{users.length}</span>
                </div>
            </div>

            {users.length === 0 ? (
                <div className="bg-surface rounded-xl shadow-lg p-12 text-center border border-border/50">
                    <MapIcon className="w-16 h-16 mx-auto text-text-secondary opacity-50 mb-4" />
                    <h3 className="text-xl font-bold text-text-primary mb-2">No Public Maps Found</h3>
                    <p className="text-text-secondary">There are currently no users who have set their map to public.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map((user) => (
                        <div key={user.id} className="bg-surface rounded-xl shadow-lg p-6 border border-border/50 flex flex-col justify-between hover:border-primary/50 transition-colors group">
                            <div className="flex items-center space-x-4 mb-4">
                                <img 
                                    src={getAvatarUrl(user.avatar_id)} 
                                    alt={`${user.username}'s avatar`}
                                    className="w-12 h-12 rounded-full bg-border object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
                                    }}
                                />
                                <div>
                                    <h3 className="font-bold text-text-primary text-lg truncate" title={user.username}>
                                        {user.username}
                                    </h3>
                                    <div className="flex items-center text-xs text-text-secondary mt-1">
                                        {user.country_code && (
                                            <span className="mr-2">
                                                {user.country_code.toUpperCase()}
                                            </span>
                                        )}
                                        <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <a 
                                href={`https://stoutly.co.uk/map/${user.username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 w-full flex items-center justify-center space-x-2 bg-background hover:bg-primary/10 text-primary border border-primary/20 hover:border-primary/50 py-2 px-4 rounded-lg transition-all duration-200 font-medium text-sm"
                            >
                                <span>View Map</span>
                                <ExternalLinkIcon className="w-4 h-4" />
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Maps;
