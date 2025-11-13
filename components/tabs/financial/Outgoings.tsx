import React, { useState, useEffect } from 'react';
import { dash_getOutgoingsData, dash_addOutgoing, dash_endSubscription } from '../../../services/supabaseService';
import type { DashOutgoingsData, NewOutgoingData, Subscription } from '../../../services/dashContracts';
import StatCard from '../../StatCard';
import { DollarSignIcon, TrendingDownIcon, PlusIcon, StopCircleIcon } from '../../icons/Icons';

const CURRENCY_SYMBOLS: Record<string, string> = {
    'GBP': '£',
    'USD': '$',
    'EUR': '€',
};

const Outgoings: React.FC = () => {
    const [data, setData] = useState<DashOutgoingsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal State
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isEndModalOpen, setEndModalOpen] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await dash_getOutgoingsData();
            setData(result);
        } catch (err) {
            setError('Failed to fetch outgoings data. Please ensure you have run the latest SQL script to deploy the database function.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddSuccess = () => {
        setAddModalOpen(false);
        fetchData(); // Refresh data
    };

    const handleEndSuccess = () => {
        setEndModalOpen(false);
        setSelectedSubscription(null);
        fetchData(); // Refresh data
    };
    
    const handleOpenEndModal = (subscription: Subscription) => {
        setSelectedSubscription(subscription);
        setEndModalOpen(true);
    };

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatMultiCurrency = (amount: number, currency: string, gbpAmount: number) => {
        const symbol = CURRENCY_SYMBOLS[currency] || currency;
        const originalAmountFormatted = `${symbol}${amount.toFixed(2)}`;

        if (currency === 'GBP') {
            return `£${gbpAmount.toFixed(2)}`;
        }
        
        return (
            <div className="flex flex-col items-end">
                <span className="text-warning-red font-mono">{originalAmountFormatted}</span>
                <span className="text-xs text-text-secondary font-mono">(≈ £{gbpAmount.toFixed(2)})</span>
            </div>
        );
    };
    
    const SkeletonTable: React.FC = () => (
        <div className="bg-surface rounded-xl shadow-lg">
            <div className="p-4 border-b border-border">
                <div className="h-6 bg-border rounded w-1/3"></div>
            </div>
            <div className="p-6">
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex justify-between items-center">
                            <div className="h-4 bg-border rounded w-1/4"></div>
                            <div className="h-4 bg-border rounded hidden md:block w-1/4"></div>
                            <div className="h-4 bg-border rounded hidden lg:block w-1/4"></div>
                            <div className="h-4 bg-border rounded w-1/6"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderLoading = () => (
        <div className="animate-pulse space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface rounded-xl h-28"></div>
                <div className="bg-surface rounded-xl h-28"></div>
            </div>
            <div className="space-y-8">
                <SkeletonTable />
                <SkeletonTable />
            </div>
        </div>
    );

    if (loading) return <section>{renderLoading()}</section>;
    if (error) return <div className="text-warning-red bg-warning-red/10 border border-warning-red/30 p-4 rounded-lg text-center">{error}</div>;
    if (!data) return <p>No outgoings data available.</p>;

    return (
        <section>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-2xl font-bold">Outgoings</h2>
                <button 
                    onClick={() => setAddModalOpen(true)}
                    className="flex items-center space-x-2 bg-primary text-background font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <PlusIcon />
                    <span>Add Outgoing</span>
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <StatCard 
                    title="Total Spend To Date (GBP)" 
                    value={`£${data.kpis.totalSpend.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                    icon={<DollarSignIcon />} 
                    isChurn 
                />
                <StatCard 
                    title="Current Monthly Cost (GBP)" 
                    value={`£${data.kpis.monthlyCost.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                    icon={<TrendingDownIcon />} 
                    isChurn 
                />
            </div>

            <div className="space-y-8">
                {/* Subscriptions Table */}
                <div className="bg-surface rounded-xl shadow-lg">
                    <h3 className="text-lg font-semibold text-text-primary p-4 border-b border-border">Monthly Subscriptions</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-text-secondary">
                            <thead className="text-xs text-text-secondary uppercase bg-background">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Service</th>
                                    <th scope="col" className="px-6 py-3 hidden md:table-cell">Category</th>
                                    <th scope="col" className="px-6 py-3 hidden lg:table-cell">Start Date</th>
                                    <th scope="col" className="px-6 py-3">Status</th>
                                    <th scope="col" className="px-6 py-3 text-right">Monthly Cost</th>
                                    <th scope="col" className="px-6 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.tables.subscriptions.map(sub => (
                                    <tr key={sub.id} className="border-b border-border hover:bg-border/50">
                                        <td className="px-6 py-4 font-medium text-text-primary whitespace-nowrap">{sub.name}</td>
                                        <td className="px-6 py-4 hidden md:table-cell">{sub.category || 'N/A'}</td>
                                        <td className="px-6 py-4 hidden lg:table-cell">{formatDate(sub.start_date)}</td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-0.5 text-xs rounded-full ${sub.status === 'Active' ? 'bg-value-green/20 text-value-green' : 'bg-gray-500/20 text-gray-400'}`}>
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {formatMultiCurrency(sub.amount, sub.currency, sub.amount_gbp)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {sub.status === 'Active' ? (
                                                <button onClick={() => handleOpenEndModal(sub)} className="text-text-secondary hover:text-warning-red transition-colors" title="End Subscription">
                                                    <StopCircleIcon />
                                                </button>
                                            ) : (
                                                <span>-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Manual Outgoings Table */}
                <div className="bg-surface rounded-xl shadow-lg">
                    <h3 className="text-lg font-semibold text-text-primary p-4 border-b border-border">Manual Outgoings</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-text-secondary">
                            <thead className="text-xs text-text-secondary uppercase bg-background">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Item/Service</th>
                                    <th scope="col" className="px-6 py-3 hidden md:table-cell">Category</th>
                                    <th scope="col" className="px-6 py-3 hidden lg:table-cell">Purchase Date</th>
                                    <th scope="col" className="px-6 py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.tables.manualOutgoings.map(item => (
                                    <tr key={item.id} className="border-b border-border hover:bg-border/50">
                                        <td className="px-6 py-4 font-medium text-text-primary whitespace-nowrap">{item.name}</td>
                                        <td className="px-6 py-4 hidden md:table-cell">{item.category || 'N/A'}</td>
                                        <td className="px-6 py-4 hidden lg:table-cell">{formatDate(item.purchase_date)}</td>
                                        <td className="px-6 py-4 text-right">
                                             {formatMultiCurrency(item.amount, item.currency, item.amount_gbp)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isAddModalOpen && <AddOutgoingModal onClose={() => setAddModalOpen(false)} onSave={handleAddSuccess} />}
            {isEndModalOpen && selectedSubscription && <EndSubscriptionModal subscription={selectedSubscription} onClose={() => setEndModalOpen(false)} onSave={handleEndSuccess} />}

        </section>
    );
};

// --- MODAL COMPONENTS ---

const AddOutgoingModal: React.FC<{ onClose: () => void; onSave: () => void; }> = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState<NewOutgoingData>({
        name: '',
        type: 'manual',
        amount: 0,
        start_date: new Date().toISOString().split('T')[0],
        description: '',
        category: '',
        currency: 'GBP'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || formData.amount <= 0 || !formData.start_date) {
            setError('Please fill in all required fields.');
            return;
        }
        setError('');
        setIsSubmitting(true);
        try {
            await dash_addOutgoing(formData);
            onSave();
        } catch (err) {
            setError('Failed to save outgoing. Please try again.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-surface rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-border">
                        <h3 className="text-lg font-bold">Add New Outgoing</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {error && <p className="text-warning-red text-sm">{error}</p>}
                        
                        <div>
                            <label className="text-sm font-medium text-text-secondary">Type</label>
                            <div className="flex space-x-2 bg-background p-1 rounded-lg mt-1">
                                <button type="button" onClick={() => setFormData(f => ({...f, type: 'manual'}))} className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${formData.type === 'manual' ? 'bg-primary text-background' : 'text-text-secondary'}`}>Manual Purchase</button>
                                <button type="button" onClick={() => setFormData(f => ({...f, type: 'subscription'}))} className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${formData.type === 'subscription' ? 'bg-primary text-background' : 'text-text-secondary'}`}>Subscription</button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="name" className="text-sm font-medium text-text-secondary">Name*</label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-background border border-border rounded-lg p-2 mt-1 focus:ring-primary focus:border-primary" />
                        </div>
                        
                        <div className="grid grid-cols-5 gap-4">
                            <div className="col-span-2">
                                <label htmlFor="currency" className="text-sm font-medium text-text-secondary">Currency*</label>
                                <select id="currency" name="currency" value={formData.currency} onChange={handleChange} className="w-full bg-background border border-border rounded-lg p-2 mt-1 focus:ring-primary focus:border-primary">
                                    <option value="GBP">GBP (£)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                </select>
                            </div>
                            <div className="col-span-3">
                                <label htmlFor="amount" className="text-sm font-medium text-text-secondary">Amount*</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="text-text-secondary sm:text-sm">{CURRENCY_SYMBOLS[formData.currency]}</span>
                                    </div>
                                    <input type="number" id="amount" name="amount" value={formData.amount} onChange={handleChange} required min="0.01" step="0.01" className="w-full bg-background border border-border rounded-lg p-2 pl-7 mt-1 focus:ring-primary focus:border-primary" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="start_date" className="text-sm font-medium text-text-secondary">{formData.type === 'manual' ? 'Purchase Date*' : 'Start Date*'}</label>
                            <input type="date" id="start_date" name="start_date" value={formData.start_date} onChange={handleChange} required className="w-full bg-background border border-border rounded-lg p-2 mt-1 focus:ring-primary focus:border-primary" />
                        </div>


                        <div>
                            <label htmlFor="category" className="text-sm font-medium text-text-secondary">Category</label>
                            <input type="text" id="category" name="category" value={formData.category} onChange={handleChange} placeholder="e.g., Hosting, SaaS" className="w-full bg-background border border-border rounded-lg p-2 mt-1 focus:ring-primary focus:border-primary" />
                        </div>

                        <div>
                            <label htmlFor="description" className="text-sm font-medium text-text-secondary">Description</label>
                            <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={2} className="w-full bg-background border border-border rounded-lg p-2 mt-1 focus:ring-primary focus:border-primary" />
                        </div>
                    </div>
                    <div className="p-4 bg-background/50 rounded-b-xl flex justify-end space-x-3">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-border text-text-primary hover:bg-border/80 transition-colors">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-primary text-background font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                            {isSubmitting ? 'Saving...' : 'Save Outgoing'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EndSubscriptionModal: React.FC<{ subscription: Subscription, onClose: () => void; onSave: () => void; }> = ({ subscription, onClose, onSave }) => {
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!endDate) {
            setError('Please select an end date.');
            return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            await dash_endSubscription(subscription.id, endDate);
            onSave();
        } catch (err) {
            setError('Failed to end subscription. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-surface rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-border">
                        <h3 className="text-lg font-bold">End Subscription</h3>
                        <p className="text-sm text-text-secondary">Set a cancellation date for <span className="font-semibold text-text-primary">{subscription.name}</span>.</p>
                    </div>
                    <div className="p-6 space-y-4">
                         {error && <p className="text-warning-red text-sm">{error}</p>}
                        <div>
                            <label htmlFor="endDate" className="text-sm font-medium text-text-secondary">End Date*</label>
                            <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} required className="w-full bg-background border border-border rounded-lg p-2 mt-1 focus:ring-primary focus:border-primary" />
                        </div>
                        <p className="text-xs text-text-secondary">The subscription will no longer be included in the monthly cost calculation after this date.</p>
                    </div>
                    <div className="p-4 bg-background/50 rounded-b-xl flex justify-end space-x-3">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-border text-text-primary hover:bg-border/80 transition-colors">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-warning-red text-white font-semibold hover:bg-warning-red/90 transition-colors disabled:opacity-50">
                            {isSubmitting ? 'Ending...' : 'End Subscription'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default Outgoings;