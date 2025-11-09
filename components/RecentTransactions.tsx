import React from 'react';
import type { Transaction } from '../types';

interface RecentTransactionsProps {
    transactions: Transaction[];
}

const StatusBadge: React.FC<{ status: Transaction['status'] }> = ({ status }) => {
    const baseClasses = "px-2.5 py-0.5 text-xs font-medium rounded-full";
    let specificClasses = "";

    switch (status) {
        case 'Completed':
            specificClasses = 'bg-value-green/20 text-value-green';
            break;
        case 'Pending':
            specificClasses = 'bg-primary/20 text-primary';
            break;
        case 'Failed':
            specificClasses = 'bg-warning-red/20 text-warning-red';
            break;
    }
    return <span className={`${baseClasses} ${specificClasses}`}>{status}</span>;
};


const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions }) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-text-secondary">
                <thead className="text-xs text-text-secondary uppercase bg-background">
                    <tr>
                        <th scope="col" className="px-4 py-3">User</th>
                        <th scope="col" className="px-4 py-3">Amount</th>
                        <th scope="col" className="px-4 py-3">Status</th>
                        <th scope="col" className="px-4 py-3 hidden sm:table-cell">Date</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-border hover:bg-border/50">
                            <td className="px-4 py-4 font-medium text-text-primary whitespace-nowrap">
                                <div className="flex flex-col">
                                    <span>{tx.user.name}</span>
                                    <span className="text-xs text-text-secondary">{tx.user.email}</span>
                                </div>
                            </td>
                            <td className="px-4 py-4 text-text-primary">£{tx.amount.toFixed(2)}</td>
                            <td className="px-4 py-4"><StatusBadge status={tx.status} /></td>
                            <td className="px-4 py-4 hidden sm:table-cell">{tx.date}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default RecentTransactions;