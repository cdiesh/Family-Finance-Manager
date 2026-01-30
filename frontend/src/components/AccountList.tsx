import type { Account } from '../api';
import { PrivacyMask } from './PrivacyMask';

// Institution icon mapping
const getInstitutionIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('chase')) return '🏛️';
    if (n.includes('bank of america') || n.includes('bofa')) return '🔴';
    if (n.includes('wells fargo')) return '🟡';
    if (n.includes('citi')) return '🔵';
    if (n.includes('capital one')) return '💳';
    if (n.includes('american express') || n.includes('amex')) return '💎';
    if (n.includes('discover')) return '🟠';
    if (n.includes('vanguard')) return '⛵';
    if (n.includes('fidelity')) return '🌿';
    if (n.includes('schwab')) return '💼';
    return '🏦';
};

export const AccountList = ({ accounts, onAccountClick }: { accounts: Account[], onAccountClick?: (account: Account) => void }) => {
    const categories = {
        'BANK ACCOUNTS': ['checking', 'savings', 'depository'],
        'LIABILITIES': ['credit', 'credit_card', 'loan', 'mortgage']
    };

    const groupedAccounts = {
        'BANK ACCOUNTS': [] as Account[],
        'LIABILITIES': [] as Account[]
    };

    accounts.forEach(acc => {
        if (categories['LIABILITIES'].includes(acc.type)) {
            groupedAccounts['LIABILITIES'].push(acc);
        } else if (categories['BANK ACCOUNTS'].includes(acc.type)) {
            groupedAccounts['BANK ACCOUNTS'].push(acc);
        }
    });

    Object.keys(groupedAccounts).forEach(key => {
        groupedAccounts[key as keyof typeof groupedAccounts].sort((a, b) =>
            (a.institution_name || '').localeCompare(b.institution_name || '')
        );
    });

    const hasAccounts = accounts.length > 0;

    const categoryConfig = {
        'BANK ACCOUNTS': {
            icon: '💰',
            description: 'Checking & Savings',
            color: 'var(--positive)'
        },
        'LIABILITIES': {
            icon: '💳',
            description: 'Credit & Loans',
            color: 'var(--negative)'
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <div>
                    <h3 style={{ marginBottom: '0.5rem' }}>Accounts</h3>
                    <p style={{ fontSize: '0.85rem' }}>
                        {accounts.length} accounts across {[...new Set(accounts.map(a => a.institution_name))].length} institutions
                    </p>
                </div>
            </div>

            {!hasAccounts ? (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem 2rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--border-subtle)'
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }}>🏦</div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>No accounts linked yet</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Use the Connections panel to link your first account
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gap: '2rem',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))'
                }}>
                    {Object.entries(groupedAccounts).map(([category, list]) => (
                        list.length > 0 && (
                            <div key={category}>
                                {/* Category Header */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    paddingBottom: '1rem',
                                    marginBottom: '1rem',
                                    borderBottom: '1px solid var(--border-subtle)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{ fontSize: '1.25rem' }}>
                                            {categoryConfig[category as keyof typeof categoryConfig].icon}
                                        </span>
                                        <div>
                                            <h4 style={{
                                                margin: 0,
                                                fontSize: '0.8rem',
                                                letterSpacing: '0.08em',
                                                color: 'var(--text-primary)'
                                            }}>
                                                {category}
                                            </h4>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {categoryConfig[category as keyof typeof categoryConfig].description}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        color: categoryConfig[category as keyof typeof categoryConfig].color
                                    }}>
                                        {category === 'LIABILITIES' ? '-' : ''}$
                                        <PrivacyMask>
                                            {Math.abs(list.reduce((sum, a) => sum + a.balance, 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </PrivacyMask>
                                    </div>
                                </div>

                                {/* Account List */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {list.map(acc => (
                                        <div
                                            key={acc.id}
                                            onClick={() => onAccountClick && onAccountClick(acc)}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '1rem 1.25rem',
                                                borderRadius: 'var(--radius-md)',
                                                cursor: onAccountClick ? 'pointer' : 'default',
                                                transition: 'all 0.2s ease',
                                                background: 'transparent',
                                                border: '1px solid transparent'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'var(--bg-elevated)';
                                                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'transparent';
                                                e.currentTarget.style.borderColor = 'transparent';
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: 'var(--radius-sm)',
                                                    background: 'var(--bg-secondary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '1.1rem',
                                                    border: '1px solid var(--border-subtle)'
                                                }}>
                                                    {getInstitutionIcon(acc.institution_name || '')}
                                                </div>
                                                <div>
                                                    <div style={{
                                                        fontWeight: 500,
                                                        color: 'var(--text-primary)',
                                                        marginBottom: '0.25rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem'
                                                    }}>
                                                        {acc.name}
                                                        {acc.is_hidden && (
                                                            <span className="badge badge-neutral" style={{ fontSize: '0.6rem', padding: '0.2rem 0.5rem' }}>
                                                                Hidden
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        {acc.institution_name}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <span style={{
                                                    fontFamily: 'var(--font-mono)',
                                                    fontSize: '1rem',
                                                    fontWeight: 500,
                                                    color: category === 'LIABILITIES' ? 'var(--negative)' : 'var(--text-primary)'
                                                }}>
                                                    {category === 'LIABILITIES' ? '-' : ''}
                                                    <PrivacyMask>
                                                        ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </PrivacyMask>
                                                </span>
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        if (confirm(`Are you sure you want to ${acc.is_hidden ? 'show' : 'hide'} this account?`)) {
                                                            await import('../api').then(m => m.api.toggleAccountVisibility(acc.id));
                                                            window.location.reload();
                                                        }
                                                    }}
                                                    style={{
                                                        fontSize: '0.7rem',
                                                        padding: '0.35rem 0.75rem',
                                                        background: 'transparent',
                                                        border: '1px solid var(--border-subtle)',
                                                        borderRadius: 'var(--radius-sm)',
                                                        cursor: 'pointer',
                                                        color: 'var(--text-muted)',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.borderColor = 'var(--border-medium)';
                                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                                                        e.currentTarget.style.color = 'var(--text-muted)';
                                                    }}
                                                >
                                                    {acc.is_hidden ? 'Show' : 'Hide'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    ))}
                </div>
            )}
        </div>
    );
};
