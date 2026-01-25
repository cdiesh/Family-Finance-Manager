import { useEffect, useState } from 'react';
import { api } from '../api';

interface Transaction {
    id: number;
    date: string;
    description: string;
    amount: number;
    category: string;
    is_tax_deductible: boolean;
    account_id: number;
}

export const TransactionGrid = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const data = await api.getTransactions();
            setTransactions(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const toggleTax = async (id: number, current: boolean) => {
        // Optimistic update
        setTransactions(prev => prev.map(tx =>
            tx.id === id ? { ...tx, is_tax_deductible: !current } : tx
        ));

        try {
            await api.updateTransactionTax(id, !current);
        } catch (e) {
            // Revert on fail
            console.error('Failed to update tax status');
            loadData();
        }
    };

    if (loading) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading Transactions...</div>;

    return (
        <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3>[ 06 ] EXPENSE_GRID</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {transactions.length} ITEMS // 30 DAYS
                </span>
            </div>

            {transactions.length === 0 ? (
                <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                    No transactions found. Try "SYNC DATA".
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>DATE</th>
                                <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>DESCRIPTION</th>
                                <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>CATEGORY</th>
                                <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, textAlign: 'right' }}>AMOUNT</th>
                                <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, textAlign: 'center' }}>TAX?</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(tx => (
                                <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {new Date(tx.date).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>{tx.description}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <span style={{
                                            background: 'var(--bg-secondary)',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem',
                                            color: 'var(--text-secondary)'
                                        }}>
                                            {tx.category}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                                        ${tx.amount.toFixed(2)}
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={tx.is_tax_deductible}
                                            onChange={() => toggleTax(tx.id, tx.is_tax_deductible)}
                                            style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
