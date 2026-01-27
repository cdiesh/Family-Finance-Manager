import { useEffect, useState } from 'react';
import { api, type User, type Account } from '../api';
import { LinkButton } from './LinkButton';
import { Login } from './Login';
import { TaskList } from './TaskList';
import { AccountList } from './AccountList';
import { TransactionGrid } from './TransactionGrid';

export const Dashboard = () => {
    const [status, setStatus] = useState<string>('Connecting...');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]); // Household accounts
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    const loadUser = async () => {
        try {
            const user = await api.getMe();
            setCurrentUser(user);
            const householdAccounts = await api.getAccounts();
            setAccounts(householdAccounts);
        } catch {
            setCurrentUser(null);
            setAccounts([]);
        }
    };

    // Initialize System & User
    useEffect(() => {
        const init = async () => {
            try {
                const health = await api.checkHealth();
                setStatus(health.status);
                await loadUser();
            } catch (e) {
                setStatus('Error connecting to Backend');
            } finally {
                setCheckingAuth(false);
            }
        };
        init();
    }, []);

    const handleSync = async () => {
        if (!currentUser) return;
        setIsSyncing(true);
        try {
            // Sync both Accounts and Transactions
            await api.syncAccounts();
            await api.syncTransactions();
            await loadUser(); // Refresh data
            window.location.reload(); // Quick way to refresh all child components
        } catch (e) {
            console.error(e);
            alert('Sync failed');
        } finally {
            setIsSyncing(false);
        }
    };

    if (checkingAuth) {
        return <div style={{ padding: '3rem', color: 'var(--text-secondary)' }}>SYSTEM_INIT...</div>;
    }

    if (!currentUser) {
        return <Login onLogin={() => window.location.reload()} />;
    }

    // Calculate Net Worth
    const netWorth = accounts.reduce((sum, acc) => {
        // Logic: Depository/Investment is +, Credit/Loan is -
        const isLiability = ['credit', 'loan', 'mortgage'].includes(acc.type);
        return sum + (isLiability ? -acc.balance : acc.balance);
    }, 0);

    return (
        <div style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                <div>
                    <div>
                        <h3 style={{ marginBottom: '0.5rem' }}>[ DIESH_CAUGHEY_CFO ]</h3>
                        <h1>Diesh Caughey Family Finances</h1>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div className="bracket-number" style={{ fontSize: '0.9rem' }}>
                        STATUS // <span style={{ color: status === 'active' ? 'var(--status-success)' : 'var(--status-danger)' }}>{status.toUpperCase()}</span>
                    </div>
                    <div className="bracket-number" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        USER: {currentUser.email}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            style={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                            }}
                        >
                            {isSyncing ? 'SYNCING...' : 'SYNC DATA'}
                        </button>
                        <button
                            onClick={api.logout}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-secondary)',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                            }}
                        >
                            LOGOUT
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
                {/* Metric 1: Net Worth */}
                <div className="glass-panel" style={{ gridColumn: 'span 4', padding: '1.5rem' }}>
                    <h3>[ 01 ] NET_WORTH</h3>
                    <h2 style={{ fontSize: '3rem', margin: '1rem 0', fontWeight: 500 }}>
                        ${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {accounts.length} Accounts Linked
                    </p>
                </div>

                {/* Metric 2: Cash Flow */}
                <div className="glass-panel" style={{ gridColumn: 'span 4', padding: '1.5rem' }}>
                    <h3>[ 02 ] CASH_FLOW_MOMENTUM</h3>
                    <div style={{ marginTop: '1.5rem' }}>
                        <p style={{ color: 'var(--text-secondary)' }}>Pending Transaction Sync...</p>
                    </div>
                </div>

                {/* Action: Link Bank */}
                <div className="glass-panel" style={{ gridColumn: 'span 4', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <h3>[ 03 ] CONNECTIONS</h3>
                    <div style={{ marginTop: '1rem' }}>
                        <LinkButton />
                    </div>
                </div>

                {/* Row 2: Accounts List */}
                <div style={{ gridColumn: 'span 12' }}>
                    <AccountList accounts={accounts} />
                </div>

                {/* Row 3: Transaction Grid */}
                <div style={{ gridColumn: 'span 12' }}>
                    <TransactionGrid />
                </div>

                {/* Row 4: To-Do List */}
                <div style={{ gridColumn: 'span 12' }}>
                    <TaskList />
                </div>
            </div>
        </div>
    );
};
