import React from 'react';
import type { PintPriceByCountry } from '../types';
import { XIcon } from './icons/Icons';

interface CountriesRatedModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: PintPriceByCountry[];
}

const CountriesRatedModal: React.FC<CountriesRatedModalProps> = ({ isOpen, onClose, data }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-surface rounded-xl shadow-2xl w-full max-w-md mx-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-border">
                    <h2 className="text-lg font-semibold text-text-primary">Countries with Ratings</h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-primary transition-colors">
                        <XIcon />
                    </button>
                </div>
                <div className="overflow-y-auto max-h-[60vh] p-4">
                    <table className="w-full text-sm text-left text-text-secondary">
                        <thead className="text-xs text-text-secondary uppercase bg-background sticky top-0">
                            <tr>
                                <th scope="col" className="px-4 py-3">Country</th>
                                <th scope="col" className="px-4 py-3 text-right">Number of Ratings</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {data.sort((a, b) => b.ratingsCount - a.ratingsCount).map(item => (
                                <tr key={item.countryCode} className="hover:bg-border/50">
                                    <td className="px-4 py-3 font-medium text-text-primary">{item.country}</td>
                                    <td className="px-4 py-3 text-text-primary text-right font-mono">{item.ratingsCount.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CountriesRatedModal;
