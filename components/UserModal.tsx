import React, { useState, useEffect } from 'react';
import { XIcon, DownloadIcon } from './icons/Icons';
import type { User } from '../types';
import { fetchUserAdditionalDetails } from '../services/supabaseService';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

const PLACEHOLDER_AVATAR = 'https://ui-avatars.com/api/?name=User&background=random';

const UserBadges: React.FC<{ user: User }> = ({ user }) => (
    <div className="flex flex-wrap items-center gap-1.5 mt-2">
        {user.isTeamMember && <span title="Team Member" className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">Team Member</span>}
        {user.isDeveloper && <span title="Developer" className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">Developer</span>}
        {user.isBetaTester && <span title="Beta Tester" className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Beta Tester</span>}
        {user.hasDonated && <span title="Donator" className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">Donator</span>}
    </div>
);

const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function UserModal({ isOpen, onClose, user }: UserModalProps) {
    const [additionalDetails, setAdditionalDetails] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        if (isOpen && user?.id) {
            setLoadingDetails(true);
            setAdditionalDetails(null);
            fetchUserAdditionalDetails(user.id).then(data => {
                setAdditionalDetails(data);
                setLoadingDetails(false);
            });
        }
    }, [isOpen, user]);

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-surface border border-border/50 rounded-2xl w-full max-w-md flex flex-col overflow-hidden shadow-2xl relative">
                
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-border/50 bg-surface-hover/30">
                    <h2 className="text-lg font-bold text-text-primary capitalize">User Profile</h2>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="flex items-start gap-4 mb-6">
                        <img 
                            src={user.avatarId ? `https://pub-8442b31ab0eb4448acf4efdd3cf1cc48.r2.dev/avatars/${user.avatarId}.png` : PLACEHOLDER_AVATAR} 
                            alt={user.name} 
                            className="w-20 h-20 rounded-xl bg-border object-cover border border-border/50 shadow-md shrink-0"
                            onError={(e) => { e.currentTarget.src = PLACEHOLDER_AVATAR; }}
                        />
                        <div>
                            <h3 className="text-2xl font-black text-text-primary leading-tight">{user.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${user.banStatus === 'Active' ? 'bg-value-green/20 text-value-green' : 'bg-warning-red/20 text-warning-red'}`}>
                                    {user.banStatus}
                                </span>
                                <span className="text-text-secondary text-sm font-medium">Level {user.level}</span>
                            </div>
                            <UserBadges user={user} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                        <div className="flex flex-col gap-1">
                            <span className="text-text-secondary uppercase tracking-wider text-xs font-bold">Email</span>
                            <span className="text-text-primary font-medium opacity-60 italic text-xs">Hidden for privacy</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-text-secondary uppercase tracking-wider text-xs font-bold">Date of Birth</span>
                            <span className="text-text-primary font-medium">{additionalDetails?.dob ? formatDate(additionalDetails.dob) : (user.dob ? formatDate(user.dob) : 'Not provided')}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-text-secondary uppercase tracking-wider text-xs font-bold">Sign Up Date</span>
                            <span className="text-text-primary font-medium">{formatDate(user.signupDate)}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-text-secondary uppercase tracking-wider text-xs font-bold">Last Sign In</span>
                            <span className="text-text-primary font-medium">{formatDate(user.lastActive)}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-text-secondary uppercase tracking-wider text-xs font-bold">Country</span>
                            <span className="text-text-primary font-medium">{user.countryCode || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-text-secondary uppercase tracking-wider text-xs font-bold">Marketing Opt-in</span>
                            <span className="text-text-primary font-medium">
                                {loadingDetails ? '...' : (additionalDetails?.acceptsMarketing ? 'Yes' : 'No')}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-text-secondary uppercase tracking-wider text-xs font-bold">Ratings</span>
                            <span className="text-text-primary font-medium">
                                {loadingDetails ? '...' : (additionalDetails ? additionalDetails.ratingsCount.toLocaleString() : user.reviewsCount?.toLocaleString() || 0)}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-text-secondary uppercase tracking-wider text-xs font-bold">Pub Crawls</span>
                            <span className="text-text-primary font-medium">
                                {loadingDetails ? '...' : (additionalDetails?.crawlsCount.toLocaleString() || 0)}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-text-secondary uppercase tracking-wider text-xs font-bold">Pubs Added</span>
                            <span className="text-text-primary font-medium">
                                {loadingDetails ? '...' : (additionalDetails?.pubsAddedCount.toLocaleString() || 0)}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-text-secondary uppercase tracking-wider text-xs font-bold">Signup Source</span>
                            <span className="text-text-primary font-medium">{additionalDetails?.signupUtmSource || user.signupUtmSource || 'Direct/Unknown'}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border/50 bg-background/50 flex justify-end">
                    <a 
                        href={`https://app.stoutly.co.uk/?user_id=${user.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-primary hover:bg-primary-hover text-background font-bold py-2.5 px-6 rounded-lg transition-colors flex items-center justify-center w-full"
                    >
                        View in Stoutly
                    </a>
                </div>
            </div>
        </div>
    );
}
