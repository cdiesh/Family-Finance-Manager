import { useState } from 'react';
import { PrivacyMask } from './PrivacyMask';
import { api, type Asset, type Account } from '../api';

interface AssetListProps {
    assets: Asset[];
    plaidAssets: Account[];
    accounts: Account[];
    onAssetChange: () => void;
}

export const AssetList = ({ assets, plaidAssets, accounts, onAssetChange }: AssetListProps) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newAsset, setNewAsset] = useState<Partial<Asset>>({
        name: '',
        type: 'real_estate',
        value: 0,
        ownership_percentage: 100,
        linked_account_id: undefined
    });

    const [realEstateOpen, setRealEstateOpen] = useState(true);
    const [investmentsOpen, setInvestmentsOpen] = useState(true);
    const [holdingsModalOpen, setHoldingsModalOpen] = useState(false);
    const [currentHoldings, setCurrentHoldings] = useState<any[]>([]);
    const [isLoadingHoldings, setIsLoadingHoldings] = useState(false);
    const [holdingsError, setHoldingsError] = useState('');

    const handleViewHoldings = async (itemId: number) => {
        setIsLoadingHoldings(true);
        setHoldingsError('');
        setHoldingsModalOpen(true);
        setCurrentHoldings([]);
        try {
            const data = await api.getHoldings(itemId);
            setCurrentHoldings(data.holdings);
        } catch (e) {
            console.error(e);
            setHoldingsError('Failed to load holdings. Ensure this is an investment account.');
        } finally {
            setIsLoadingHoldings(false);
        }
    };

    const realEstate = assets.filter(a => a.type === 'real_estate').sort((a, b) => {
        const getRank = (name: string) => {
            const n = name.toLowerCase();
            if (n.includes('webster')) return 0;
            if (n.includes('markoe')) return 1;
            return 2;
        };
        return getRank(a.name) - getRank(b.name) || a.name.localeCompare(b.name);
    });
    const manualInvestments = assets.filter(a => a.type === 'investment');

    const handleAdd = async () => {
        if (!newAsset.name || !newAsset.value) return;
        try {
            await api.createAsset(newAsset as any);
            setIsAdding(false);
            setNewAsset({ name: '', type: 'real_estate', value: 0, ownership_percentage: 100, linked_account_id: undefined });
            onAssetChange();
        } catch (e) {
            console.error(e);
            alert('Failed to add asset');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this asset?')) return;
        try {
            await api.deleteAsset(id);
            onAssetChange();
        } catch (e) {
            console.error(e);
        }
    };

    const getLinkedName = (id?: number) => {
        if (!id) return null;
        const acc = accounts.find(a => a.id === id);
        return acc ? `${acc.name} (${acc.institution_name})` : 'Unknown Account';
    };

    const totalRealEstateEquity = realEstate.reduce((sum, a) => sum + a.equity_value, 0);
    const totalInvestments = plaidAssets.reduce((sum, a) => sum + a.balance, 0) +
        manualInvestments.reduce((sum, a) => sum + a.equity_value, 0);

    return (
        <div className="glass-panel" style={{ padding: '2rem', position: 'relative' }}>
            {/* Holdings Modal */}
            {holdingsModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 1000,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '2rem'
                }}>
                    <div style={{
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-lg)',
                        width: '100%',
                        maxWidth: '800px',
                        maxHeight: '85vh',
                        display: 'flex',
                        flexDirection: 'column',
                        border: '1px solid var(--border-subtle)',
                        boxShadow: 'var(--shadow-lg)',
                        overflow: 'hidden' // key for internal scrolling
                    }} onClick={(e) => e.stopPropagation()}>
                        {/* Header (Fixed) */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1.5rem 2rem',
                            borderBottom: '1px solid var(--border-subtle)',
                            background: 'var(--bg-secondary)'
                        }}>
                            <h3 style={{ margin: 0 }}>Investment Holdings</h3>
                            <button
                                onClick={() => setHoldingsModalOpen(false)}
                                className="btn-ghost"
                                style={{ fontSize: '1.5rem', lineHeight: 1, padding: '0 0.5rem' }}
                            >
                                ×
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div style={{ padding: '0 2rem 2rem 2rem', overflowY: 'auto', flex: 1 }}>
                            {isLoadingHoldings && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '3rem',
                                    gap: '1rem'
                                }}>
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        border: '2px solid var(--border-subtle)',
                                        borderTopColor: 'var(--accent-gold)',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                    }} />
                                    <span style={{ color: 'var(--text-muted)' }}>Loading positions...</span>
                                </div>
                            )}

                            {holdingsError && (
                                <div style={{
                                    marginTop: '2rem',
                                    padding: '1rem',
                                    background: 'var(--negative-muted)',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--negative)'
                                }}>
                                    {holdingsError}
                                </div>
                            )}

                            {!isLoadingHoldings && !holdingsError && currentHoldings.length === 0 && (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '3rem',
                                    color: 'var(--text-muted)'
                                }}>
                                    No holdings data available
                                </div>
                            )}

                            {!isLoadingHoldings && currentHoldings.length > 0 && (
                                <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>
                                            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                                <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Symbol</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shares</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentHoldings.map((h, i) => (
                                                <tr key={h.security_id || i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <span style={{
                                                            fontFamily: 'var(--font-mono)',
                                                            color: 'var(--accent-gold)',
                                                            fontWeight: 600
                                                        }}>
                                                            {h.ticker || '—'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                        {h.name}
                                                    </td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                                                        {h.quantity?.toLocaleString()}
                                                    </td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                                                        ${h.price?.toLocaleString()}
                                                    </td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                        <PrivacyMask>
                                                            ${h.value?.toLocaleString()}
                                                        </PrivacyMask>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <div>
                    <h3 style={{ marginBottom: '0.5rem' }}>Assets & Investments</h3>
                    <p style={{ fontSize: '0.85rem' }}>
                        Track real estate equity and investment portfolios
                    </p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={isAdding ? 'btn-ghost' : 'btn-secondary'}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                >
                    {isAdding ? 'Cancel' : '+ Add Asset'}
                </button>
            </div>

            {/* Add Asset Form */}
            {isAdding && (
                <div style={{
                    marginBottom: '2rem',
                    padding: '1.5rem',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                }}>
                    <h4 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>New Asset</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label className="form-label">Name</label>
                            <input
                                value={newAsset.name}
                                onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
                                className="input-premium"
                                placeholder="e.g. 1812 Webster Ave"
                            />
                        </div>
                        <div>
                            <label className="form-label">Type</label>
                            <select
                                value={newAsset.type}
                                onChange={e => setNewAsset({ ...newAsset, type: e.target.value as any })}
                                className="input-premium"
                            >
                                <option value="real_estate">Real Estate</option>
                                <option value="investment">Investment (Private)</option>
                                <option value="vehicle">Vehicle</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Market Value</label>
                            <input
                                type="number"
                                value={newAsset.value}
                                onChange={e => setNewAsset({ ...newAsset, value: parseFloat(e.target.value) })}
                                className="input-premium"
                            />
                        </div>
                        <div>
                            <label className="form-label">Ownership %</label>
                            <input
                                type="number"
                                value={newAsset.ownership_percentage}
                                onChange={e => setNewAsset({ ...newAsset, ownership_percentage: parseFloat(e.target.value) })}
                                className="input-premium"
                            />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">Link Mortgage (Optional)</label>
                            <select
                                value={newAsset.linked_account_id || ''}
                                onChange={e => setNewAsset({ ...newAsset, linked_account_id: e.target.value ? parseInt(e.target.value) : undefined })}
                                className="input-premium"
                            >
                                <option value="">— No mortgage linked —</option>
                                {accounts.filter(a => ['loan', 'mortgage'].includes(a.type)).map(a => (
                                    <option key={a.id} value={a.id}>
                                        {a.name} ({a.institution_name}) - ${a.balance.toLocaleString()}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {!newAsset.linked_account_id && (
                            <>
                                <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Manual Mortgage Tracking</p>
                                </div>
                                <div>
                                    <label className="form-label">Loan Balance</label>
                                    <input
                                        type="number"
                                        value={newAsset.manual_mortgage_balance || 0}
                                        onChange={e => setNewAsset({ ...newAsset, manual_mortgage_balance: parseFloat(e.target.value) })}
                                        className="input-premium"
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Interest Rate (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newAsset.interest_rate || 0}
                                        onChange={e => setNewAsset({ ...newAsset, interest_rate: parseFloat(e.target.value) })}
                                        className="input-premium"
                                    />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Monthly Payment ($)</label>
                                    <input
                                        type="number"
                                        value={newAsset.monthly_payment || 0}
                                        onChange={e => setNewAsset({ ...newAsset, monthly_payment: parseFloat(e.target.value) })}
                                        className="input-premium"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    <button onClick={handleAdd} className="btn-primary" style={{ marginTop: '0.5rem' }}>
                        Create Asset
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!assets.length && !plaidAssets.length && !isAdding && (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem 2rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--border-subtle)'
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }}>🏠</div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>No assets tracked yet</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Add real estate or link investment accounts
                    </p>
                </div>
            )}

            {/* Real Estate Section */}
            {realEstate.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <button
                        onClick={() => setRealEstateOpen(!realEstateOpen)}
                        style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1rem 0',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: '1px solid var(--border-subtle)',
                            cursor: 'pointer',
                            marginBottom: '1rem'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '1.25rem' }}>🏠</span>
                            <div style={{ textAlign: 'left' }}>
                                <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Real Estate</h4>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {realEstate.length} {realEstate.length === 1 ? 'property' : 'properties'}
                                </span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                color: 'var(--positive)'
                            }}>
                                <PrivacyMask>
                                    ${totalRealEstateEquity.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                                </PrivacyMask>
                            </span>
                            <span style={{
                                color: 'var(--text-muted)',
                                transition: 'transform 0.2s',
                                transform: realEstateOpen ? 'rotate(0deg)' : 'rotate(-90deg)'
                            }}>
                                ▼
                            </span>
                        </div>
                    </button>

                    {realEstateOpen && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {realEstate.map(asset => (
                                <div
                                    key={asset.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'stretch',
                                        padding: '1.25rem',
                                        background: 'var(--bg-elevated)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-subtle)',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border-medium)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: '1.05rem',
                                            fontWeight: 600,
                                            color: 'var(--text-primary)',
                                            marginBottom: '0.75rem'
                                        }}>
                                            {asset.name}
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                                    Market Value
                                                </div>
                                                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                                                    <PrivacyMask>${asset.value.toLocaleString()}</PrivacyMask>
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                                    Mortgage
                                                </div>
                                                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                                                    <PrivacyMask>{asset.current_balance > 0 ? `-$${asset.current_balance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '—'}</PrivacyMask>
                                                </div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                                    {asset.linked_account_id ? (
                                                        getLinkedName(asset.linked_account_id)
                                                    ) : (asset.manual_mortgage_balance || 0) > 0 ? (
                                                        'Manual'
                                                    ) : asset.current_balance > 0 ? (
                                                        'Amortized'
                                                    ) : 'None'}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                                    Total Equity
                                                </div>
                                                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--positive)', opacity: 0.8 }}>
                                                    <PrivacyMask>${(asset.value - asset.current_balance).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</PrivacyMask>
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                                    My Equity ({asset.ownership_percentage}%)
                                                </div>
                                                <div style={{
                                                    fontFamily: 'var(--font-display)',
                                                    fontSize: '1.1rem',
                                                    fontWeight: 600,
                                                    color: 'var(--positive)'
                                                }}>
                                                    <PrivacyMask>${asset.equity_value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</PrivacyMask>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{
                                        textAlign: 'right',
                                        paddingLeft: '1.5rem',
                                        borderLeft: '1px solid var(--border-subtle)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center'
                                    }}>
                                        <button
                                            onClick={() => handleDelete(asset.id)}
                                            className="btn-ghost"
                                            style={{ fontSize: '0.7rem', color: 'var(--negative)', padding: '0.25rem 0.5rem' }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Investments Section */}
            {(plaidAssets.length > 0 || manualInvestments.length > 0) && (
                <div>
                    <button
                        onClick={() => setInvestmentsOpen(!investmentsOpen)}
                        style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1rem 0',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: '1px solid var(--border-subtle)',
                            cursor: 'pointer',
                            marginBottom: '1rem'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '1.25rem' }}>📈</span>
                            <div style={{ textAlign: 'left' }}>
                                <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Investments</h4>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {plaidAssets.length + manualInvestments.length} {(plaidAssets.length + manualInvestments.length) === 1 ? 'account' : 'accounts'}
                                </span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                color: 'var(--info)'
                            }}>
                                <PrivacyMask>${totalInvestments.toLocaleString('en-US', { minimumFractionDigits: 0 })}</PrivacyMask>
                            </span>
                            <span style={{
                                color: 'var(--text-muted)',
                                transition: 'transform 0.2s',
                                transform: investmentsOpen ? 'rotate(0deg)' : 'rotate(-90deg)'
                            }}>
                                ▼
                            </span>
                        </div>
                    </button>

                    {investmentsOpen && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {/* Plaid Investments */}
                            {plaidAssets.map(acc => (
                                <div
                                    key={acc.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '1rem 1.25rem',
                                        borderRadius: 'var(--radius-md)',
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
                                            📈
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                                {acc.name}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {acc.institution_name}
                                                <span className="badge badge-gold" style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem' }}>Linked</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: '1rem',
                                            fontWeight: 500,
                                            color: 'var(--text-primary)'
                                        }}>
                                            <PrivacyMask>${acc.balance.toLocaleString()}</PrivacyMask>
                                        </span>
                                        {(acc.type === 'investment' || acc.institution_name.toLowerCase().includes('vanguard')) && (
                                            <button
                                                onClick={() => handleViewHoldings((acc as any).item_id)}
                                                className="btn-secondary"
                                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.7rem' }}
                                            >
                                                Holdings
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Manual Investments */}
                            {manualInvestments.map(asset => (
                                <div
                                    key={asset.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '1rem 1.25rem',
                                        borderRadius: 'var(--radius-md)',
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
                                            border: '1px solid var(--border-subtle)',
                                            opacity: 0.7
                                        }}>
                                            📝
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                                {asset.name}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                Private Investment
                                                <span className="badge badge-neutral" style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem', marginLeft: '0.5rem' }}>Manual</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: '1rem',
                                            fontWeight: 500,
                                            color: 'var(--text-primary)'
                                        }}>
                                            <PrivacyMask>${asset.equity_value.toLocaleString()}</PrivacyMask>
                                        </span>
                                        <button
                                            onClick={() => handleDelete(asset.id)}
                                            className="btn-ghost"
                                            style={{ fontSize: '0.7rem', color: 'var(--negative)', padding: '0.25rem 0.5rem' }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
