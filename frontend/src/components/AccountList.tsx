import type { Account } from '../api';

export const AccountList = ({ accounts }: { accounts: Account[] }) => {
    // Group by type
    const grouped = accounts.reduce((acc, account) => {
        const type = account.type.replace('_', ' ').toUpperCase();
        if (!acc[type]) acc[type] = [];
        acc[type].push(account);
        return acc;
    }, {} as Record<string, Account[]>);

    return (
        <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3>[ 05 ] ACCOUNTS_OVERVIEW</h3>

            {accounts.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '1rem' }}>
                    No accounts linked yet. Use the Connections panel to add one.
                </div>
            ) : (
                <div style={{ marginTop: '1.5rem', display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                    {Object.entries(grouped).map(([type, list]) => (
                        <div key={type}>
                            <h4 style={{
                                color: 'var(--text-secondary)',
                                borderBottom: '1px solid var(--border-subtle)',
                                paddingBottom: '0.5rem',
                                marginBottom: '1rem'
                            }}>
                                {type}
                            </h4>
                            {list.map(acc => (
                                <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span>{acc.name}</span>
                                    <span style={{ fontFamily: 'var(--font-mono)' }}>
                                        ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
