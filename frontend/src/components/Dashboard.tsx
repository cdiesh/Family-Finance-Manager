import { useEffect, useState } from 'react';
import { usePrivacy } from '../context/PrivacyContext';
import { PrivacyMask } from './PrivacyMask';
import { api, type User, type Account, type Transaction, type Asset } from '../api';
import { LinkButton } from './LinkButton';
import { Login } from './Login';
import { TaskList } from './TaskList';
import { AccountList } from './AccountList';
import { AssetList } from './AssetList';
import { TransactionGrid } from './TransactionGrid';
import { AccountDetail } from './AccountDetail';

import benFranklinWink from '../assets/ben_franklin_wink_final.png';
import benFranklinNormal from '../assets/ben_franklin_normal_final.png';

export const Dashboard = ({ onNavigateToInsights }: { onNavigateToInsights: () => void }) => {
    const [status, setStatus] = useState<string>('Connecting...');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const { isPrivacyMode, togglePrivacy } = usePrivacy();
    const [isHoveringBen, setIsHoveringBen] = useState(false);

    const loadUser = async () => {
        try {
            const user = await api.getMe();
            setCurrentUser(user);
            const [householdAccounts, txData] = await Promise.all([
                api.getAccounts(),
                api.getTransactions()
            ]);
            setAccounts(householdAccounts.filter(a => !a.is_hidden));
            setTransactions(txData);

            try {
                const assetData = await api.getAssets();
                setAssets(assetData);
            } catch (e) {
                console.warn("Could not load assets", e);
                setAssets([]);
            }
        } catch {
            setCurrentUser(null);
            setAccounts([]);
            setTransactions([]);
            setAssets([]);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const health = await api.checkHealth();
                setStatus(health.status);
                await loadUser();
                setCheckingAuth(false);

                if (!window.location.hash.includes('nosync')) {
                    setIsSyncing(true);
                    console.log('Starting Auto-Sync...');
                    await Promise.allSettled([
                        api.syncAccounts(),
                        api.syncTransactions()
                    ]);
                    console.log('Auto-Sync Complete.');
                    await loadUser();
                    setIsSyncing(false);
                }
            } catch (e) {
                setStatus('Error connecting to Backend');
                setIsSyncing(false);
                setCheckingAuth(false);
            }
        };
        init();
    }, []);

    const handleSync = async () => {
        if (!currentUser) return;
        setIsSyncing(true);
        try {
            await api.syncAccounts();
            await api.syncTransactions();
            await loadUser();
        } catch (e) {
            console.error(e);
            alert('Sync failed');
        } finally {
            setIsSyncing(false);
        }
    };

    // Loading State
    if (checkingAuth) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                flexDirection: 'column',
                gap: '1.5rem'
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    border: '2px solid var(--border-subtle)',
                    borderTopColor: 'var(--accent-gold)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <p style={{ color: 'var(--text-muted)', letterSpacing: '0.1em', fontSize: '0.8rem' }}>
                    INITIALIZING
                </p>
            </div>
        );
    }

    if (!currentUser) return <Login onLogin={() => window.location.reload()} />;

    // Calculate Net Worth
    const linkedAccountIds = new Set(assets.map(a => a.linked_account_id).filter(Boolean) as number[]);

    const totalAssets = accounts
        .filter(a => !['credit', 'loan', 'mortgage'].includes(a.type) && !linkedAccountIds.has(a.id))
        .reduce((sum, a) => sum + a.balance, 0)
        + assets.reduce((sum, a) => sum + (a.value * (a.ownership_percentage / 100)), 0);

    const totalLiabilities = accounts
        .filter(a => ['credit', 'loan', 'mortgage'].includes(a.type) && !linkedAccountIds.has(a.id))
        .reduce((sum, a) => sum + Math.abs(a.balance), 0)
        + assets.reduce((sum, a) => sum + (a.current_balance * (a.ownership_percentage / 100)), 0);

    const netWorth = totalAssets - totalLiabilities;

    const linkedInstitutions = [...new Set(accounts.map(a => a.institution_name))].length;

    return (
        <div style={{
            position: 'relative',
            zIndex: 1,
            padding: 'clamp(1.5rem, 4vw, 4rem)',
            maxWidth: '1400px',
            margin: '0 auto'
        }}>
            {/* Header */}
            <header
                className="animate-fade-in"
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '3rem',
                    paddingBottom: '2rem',
                    borderBottom: '1px solid var(--border-subtle)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div
                        onMouseEnter={() => setIsHoveringBen(true)}
                        onMouseLeave={() => setIsHoveringBen(false)}
                        style={{
                            width: '240px',
                            height: '240px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            cursor: 'pointer',
                            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                            transition: 'transform 0.2s ease'
                        }}
                    >
                        <img
                            src={isHoveringBen ? benFranklinWink : benFranklinNormal}
                            alt="Ben Franklin"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                transition: 'opacity 0.2s ease'
                            }}
                        />
                    </div>
                    <div>
                        <h3 style={{ marginBottom: '0.25rem' }}>Family Wealth</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <h1>Financial Overview</h1>
                            <button
                                onClick={onNavigateToInsights}
                                className="btn-ghost"
                            >
                                View Insights →
                            </button>
                            <button
                                onClick={() => {
                                    if (isPrivacyMode) {
                                        const pin = prompt("Enter Privacy PIN:");
                                        if (pin) {
                                            if (!togglePrivacy(pin)) alert("Incorrect PIN");
                                        }
                                    } else {
                                        togglePrivacy();
                                    }
                                }}
                                className="btn-ghost"
                                style={{ marginLeft: '0.5rem', fontSize: '1.2rem' }}
                                title={isPrivacyMode ? "Unlock to see values" : "Lock values"}
                            >
                                {isPrivacyMode ? "🔒" : "🔓"}
                            </button>
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem'
                    }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: status === 'active' ? 'var(--positive)' : 'var(--negative)',
                            boxShadow: status === 'active' ? '0 0 8px var(--positive)' : '0 0 8px var(--negative)'
                        }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                            {status.toUpperCase()}
                        </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>{currentUser.email}</p>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="btn-secondary"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                        >
                            {isSyncing ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin">
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                    </svg>
                                    Syncing
                                </span>
                            ) : 'Sync'}
                        </button>
                        <button
                            onClick={api.logout}
                            className="btn-ghost"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header >

            {/* Metrics Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(12, 1fr)',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                {/* Net Worth - Hero Card */}
                <div
                    className="metric-card animate-fade-in animate-delay-1"
                    style={{ gridColumn: 'span 5', padding: '2.5rem' }}
                >
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h3 style={{ marginBottom: '1rem' }}>Net Worth</h3>
                        <div className="big-number gold">
                            <PrivacyMask>
                                ${netWorth.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </PrivacyMask>
                        </div>
                        <div style={{
                            display: 'flex',
                            gap: '2rem',
                            marginTop: '1.5rem',
                            paddingTop: '1.5rem',
                            borderTop: '1px solid var(--border-subtle)'
                        }}>
                            <div>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assets</p>
                                <p className="mono-value" style={{ color: 'var(--positive)', fontSize: '1.1rem' }}>
                                    <PrivacyMask>
                                        ${totalAssets.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                                    </PrivacyMask>
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Liabilities</p>
                                <p className="mono-value" style={{ color: 'var(--negative)', fontSize: '1.1rem' }}>
                                    <PrivacyMask>
                                        ${totalLiabilities.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                                    </PrivacyMask>
                                </p>
                            </div>
                        </div>
                    </div>
                </div >

                {/* Cash Flow Card */}
                < div
                    className="metric-card animate-fade-in animate-delay-2"
                    style={{ gridColumn: 'span 4', padding: '2.5rem' }}
                >
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h3 style={{ marginBottom: '1rem' }}>Cash Flow</h3>
                        <div style={{ marginTop: '1rem' }}>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem'
                            }}>
                                <div style={{
                                    padding: '1rem',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-subtle)'
                                }}>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        This Month
                                    </p>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        Transaction analysis coming soon
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div >

                {/* Connections Card */}
                < div
                    className="metric-card animate-fade-in animate-delay-3"
                    style={{
                        gridColumn: 'span 3',
                        padding: '2.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}
                >
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h3 style={{ marginBottom: '1rem' }}>Connections</h3>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {linkedInstitutions}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>institutions</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            {accounts.length} accounts linked
                        </p>
                        <LinkButton />
                    </div>
                </div >
            </div >

            {/* Main Content Grid */}
            < div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(12, 1fr)',
                gap: '1.5rem'
            }}>
                {/* Accounts Section */}
                < div className="animate-fade-in animate-delay-4" style={{ gridColumn: 'span 12' }}>
                    <AccountList
                        accounts={accounts}
                        onAccountClick={setSelectedAccount}
                    />
                </div >

                {/* Assets Section */}
                < div className="animate-fade-in animate-delay-5" style={{ gridColumn: 'span 12' }}>
                    <AssetList
                        assets={assets}
                        plaidAssets={accounts.filter(a => ['investment', 'brokerage', 'other'].includes(a.type))}
                        accounts={accounts}
                        onAssetChange={loadUser}
                    />
                </div >

                {/* Tasks Section */}
                < div className="animate-fade-in" style={{ gridColumn: 'span 12', animationDelay: '0.6s' }}>
                    <TaskList />
                </div >
            </div >

            {/* Account Detail Modal */}
            {
                selectedAccount && (
                    <AccountDetail
                        account={selectedAccount}
                        transactions={transactions.filter(t => t.account_id === selectedAccount.id)}
                        onClose={() => setSelectedAccount(null)}
                    />
                )
            }
        </div >
    );
};
