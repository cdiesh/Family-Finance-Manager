import { type Account, type Transaction } from '../api';
import { useMemo } from 'react';
import { PrivacyMask } from './PrivacyMask';

interface AccountDetailProps {
    account: Account;
    transactions: Transaction[];
    onClose: () => void;
}

export const AccountDetail = ({ account, transactions, onClose }: AccountDetailProps) => {
    // Determine if liability for display
    const isLiability = ['credit_card', 'loan', 'mortgage'].includes(account.type);

    // Filter or highlight logic could go here
    // For now, just show the list

    // Sort by date desc
    const sortedTx = useMemo(() => {
        return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions]);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }} onClick={onClose}>
            <div style={{
                background: 'var(--bg-primary)',
                width: '800px',
                maxWidth: '90%',
                maxHeight: '90vh',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>

                {/* Fixed Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    padding: '2rem 2rem 1.5rem 2rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: 'var(--bg-primary)'
                }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', margin: 0 }}>{account.name}</h2>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', color: isLiability ? 'var(--status-danger)' : 'inherit', marginTop: '0.5rem' }}>
                            <PrivacyMask>
                                {isLiability ? '-' : ''}${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </PrivacyMask>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                            {account.institution_name} • {account.type.replace('_', ' ').toUpperCase()}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            lineHeight: 1,
                            padding: '0 0.5rem'
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Scrollable Content */}
                <div style={{ padding: '0 2rem 2rem 2rem', overflowY: 'auto', flex: 1 }}>
                    <h3 style={{ marginTop: '1.5rem' }}>HISTORY</h3>
                    <div style={{ marginTop: '1rem' }}>
                        {sortedTx.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)' }}>No transactions found for this account.</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 1 }}>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'left' }}>
                                        <th style={{ padding: '0.5rem 0' }}>DATE</th>
                                        <th style={{ padding: '0.5rem 0' }}>DESCRIPTION</th>
                                        <th style={{ padding: '0.5rem 0' }}>CATEGORY</th>
                                        <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>AMOUNT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedTx.map(tx => (
                                        <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                            <td style={{ padding: '0.75rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                {new Date(tx.date).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '0.75rem 0', fontWeight: 500 }}>
                                                {tx.description}
                                            </td>
                                            <td style={{ padding: '0.75rem 0' }}>
                                                <span style={{
                                                    fontSize: '0.75em',
                                                    background: 'var(--bg-secondary)',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    color: 'var(--text-secondary)'
                                                }}>
                                                    {tx.category}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                                                <PrivacyMask>
                                                    ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </PrivacyMask>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
