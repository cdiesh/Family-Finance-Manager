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
    const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
    const [filters, setFilters] = useState({
        dateStart: '',
        dateEnd: '',
        amountMin: '',
        amountMax: ''
    });

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
        setTransactions(prev => prev.map(tx =>
            tx.id === id ? { ...tx, is_tax_deductible: !current } : tx
        ));
        try {
            await api.updateTransactionTax(id, !current);
        } catch (e) {
            console.error('Failed to update tax status');
            loadData();
        }
    };

    const handleSort = (key: keyof Transaction) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const filteredTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.date).getTime();
        if (filters.dateStart && txDate < new Date(filters.dateStart).getTime()) return false;
        if (filters.dateEnd && txDate > new Date(filters.dateEnd).getTime()) return false;

        const amt = Math.abs(tx.amount); // Filter by magnitude usually? Or absolute value? Let's do raw value for now but amount is often negative for expenses. 
        // Actually, expenses are usually positive in this app based on earlier logs? 
        // Wait, Liabilities are negative (-$12k), but transaction amounts?
        // Let's check logic. Usually "Amount > 100" means "Spent more than 100". 
        // If expenses are negative, then "Amount < -100". 
        // Let's assume absolute magnitude for filtering "Amount" to be user friendly, or just raw. 
        // User asked "parse by amount". 
        // Let's stick to raw for now, but maybe suggest absolute later. 
        // Actually, let's treat it as "Magnitude" since users say "Show me transactions over $100".
        // They rarely mean "Show me transactions less than -100".
        // Let's use Math.abs() for the filter comparison to be safe for both Income/Expense.
        if (filters.amountMin && Math.abs(tx.amount) < parseFloat(filters.amountMin)) return false;
        if (filters.amountMax && Math.abs(tx.amount) > parseFloat(filters.amountMax)) return false;

        return true;
    });

    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        let valA = a[key];
        let valB = b[key];

        // Handle string case
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    if (loading) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading Transactions...</div>;

    const SortIcon = ({ col }: { col: keyof Transaction }) => (
        <span style={{ marginLeft: '5px', opacity: sortConfig?.key === col ? 1 : 0.3 }}>
            {sortConfig?.key === col && sortConfig.direction === 'asc' ? '↑' : '↓'}
        </span>
    );

    return (
        <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
                <div>
                    <h3>[ 06 ] EXPENSE_GRID</h3>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>DATE FROM</label>
                            <input
                                type="date"
                                value={filters.dateStart}
                                onChange={e => setFilters(f => ({ ...f, dateStart: e.target.value }))}
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '5px', borderRadius: '4px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>DATE TO</label>
                            <input
                                type="date"
                                value={filters.dateEnd}
                                onChange={e => setFilters(f => ({ ...f, dateEnd: e.target.value }))}
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '5px', borderRadius: '4px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>MIN $</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={filters.amountMin}
                                onChange={e => setFilters(f => ({ ...f, amountMin: e.target.value }))}
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '5px', borderRadius: '4px', width: '80px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>MAX $</label>
                            <input
                                type="number"
                                placeholder="Inf"
                                value={filters.amountMax}
                                onChange={e => setFilters(f => ({ ...f, amountMax: e.target.value }))}
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '5px', borderRadius: '4px', width: '80px' }}
                            />
                        </div>
                        {(filters.dateStart || filters.dateEnd || filters.amountMin || filters.amountMax) && (
                            <button
                                onClick={() => setFilters({ dateStart: '', dateEnd: '', amountMin: '', amountMax: '' })}
                                style={{ background: 'none', border: 'none', color: 'var(--status-danger)', cursor: 'pointer', fontSize: '0.8rem', alignSelf: 'center', marginTop: '14px' }}
                            >
                                × Clear
                            </button>
                        )}
                    </div>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {sortedTransactions.length} ITEMS
                </span>
            </div>

            {sortedTransactions.length === 0 ? (
                <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                    No transactions found matching filters.
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                                <th
                                    onClick={() => handleSort('date')}
                                    style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer', userSelect: 'none' }}
                                >
                                    DATE <SortIcon col="date" />
                                </th>
                                <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>DESCRIPTION</th>
                                <th
                                    onClick={() => handleSort('category')}
                                    style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer', userSelect: 'none' }}
                                >
                                    CATEGORY <SortIcon col="category" />
                                </th>
                                <th
                                    onClick={() => handleSort('amount')}
                                    style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                                >
                                    AMOUNT <SortIcon col="amount" />
                                </th>
                                <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, textAlign: 'center' }}>TAX?</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedTransactions.map(tx => (
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
