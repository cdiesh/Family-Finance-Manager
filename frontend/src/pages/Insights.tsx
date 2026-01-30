import { useState, useEffect } from 'react';
import { api } from '../api';
import { PrivacyMask } from '../components/PrivacyMask';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

export const Insights = ({ onNavigateToDashboard }: { onNavigateToDashboard: () => void }) => {
    const [spendingData, setSpendingData] = useState<any[]>([]); // Trend
    const [categoryData, setCategoryData] = useState<any[]>([]); // Pie
    const [transactions, setTransactions] = useState<any[]>([]); // Drill-down
    const [loading, setLoading] = useState(true);
    const [agentStatus, setAgentStatus] = useState("Idle");

    // Filters
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

    useEffect(() => {
        loadInsights();
    }, [selectedYear, selectedMonth]);

    const loadInsights = async () => {
        setLoading(true);
        try {
            // 1. Fetch Charts
            const data = await api.getInsights('365d', selectedMonth, selectedYear);
            setSpendingData(data.trend);
            setCategoryData(data.distribution);

            // 2. Fetch Transactions (if specific month or just recent)
            // If strict month selected, fetch for that month. Else fetch recent?
            // Let's always fetch relevant transactions for the view.
            const txs = await api.getInsightsTransactions(selectedMonth, selectedYear);
            setTransactions(txs);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAutoCategorize = async () => {
        setAgentStatus("Analyzing transactions...");
        try {
            const res = await api.runAutoCategorization();
            setAgentStatus(`Processed ${res.processed}. Updated ${res.updated}. Learned Rules: ${res.knowledge_size}`);
            await loadInsights(); // Refresh charts
            setTimeout(() => setAgentStatus("Idle"), 5000);
        } catch (e) {
            console.error(e);
            setAgentStatus("Error running agent.");
        }
    };

    const formatCurrency = (val: number) => `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919', '#82ca9d'];

    // Move to specific month when clicking bar
    const handleBarClick = (data: any) => {
        if (data && data.activeLabel) {
            // "Jan 2026"
            const parts = data.activeLabel.split(" ");
            if (parts.length === 2) {
                const monthName = parts[0];
                const year = parseInt(parts[1]);
                const monthIndex = new Date(`${monthName} 1, 2000`).getMonth() + 1;
                setSelectedMonth(monthIndex);
                setSelectedYear(year);
            }
        }
    };

    const clearFilters = () => {
        setSelectedMonth(null);
        setSelectedYear(null);
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={onNavigateToDashboard}
                    className="btn-ghost"
                    style={{ fontSize: '1.2rem' }}
                >
                    ←
                </button>
                <h1 style={{ margin: 0 }}>Financial Insights</h1>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                    {/* Simple Year Selector Stub */}
                    <select
                        className="input-field"
                        value={selectedYear || ''}
                        onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
                    >
                        <option value="">All Years</option>
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                    </select>

                    <select
                        className="input-field"
                        value={selectedMonth || ''}
                        onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)}
                    >
                        <option value="">All Months</option>
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'short' })}</option>
                        ))}
                    </select>

                    {(selectedMonth || selectedYear) && (
                        <button onClick={clearFilters} className="btn-ghost">Clear</button>
                    )}
                </div>
            </div>

            {/* Agentic Control Panel - Moved to Top */}
            <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid var(--accent-sage)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>🤖 AI Financial Agent</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Auto-learns from your history. Categorize a month manually, and I will learn the rules.
                        </p>
                        {agentStatus !== "Idle" && (
                            <p style={{ color: 'var(--accent-sage)', fontWeight: 600, marginTop: '0.5rem', marginLeft: '0.5rem', display: 'inline-block' }}>
                                {agentStatus}
                            </p>
                        )}
                    </div>
                    <button
                        className="btn-primary"
                        onClick={handleAutoCategorize}
                        disabled={agentStatus !== "Idle"}
                    >
                        {agentStatus !== "Idle" ? 'Processing...' : 'Run Auto-Categorization'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                {/* Visual 1: Spending Trend */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3>Spending Trend {selectedYear ? `(${selectedYear})` : '(Last 12 Months)'}</h3>
                    <div style={{ height: '300px', marginTop: '1rem' }}>
                        {loading ? <p>Loading...</p> : (
                            <PrivacyMask className="w-full h-full" placeholder="Click unlock to view charts">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={spendingData}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        onClick={handleBarClick}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip formatter={(value: any) => formatCurrency(value)} />
                                        <Legend />
                                        <Bar dataKey="fixed" stackId="a" fill="#8884d8" name="Fixed Bills" />
                                        <Bar dataKey="variable" stackId="a" fill="#82ca9d" name="Variable Spending" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </PrivacyMask>
                        )}
                    </div>
                </div>

                {/* Visual 2: Category Breakdown */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3>Category Allocation {selectedMonth ? `(${new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'short' })})` : ''}</h3>
                    <div style={{ height: '300px', marginTop: '1rem' }}>
                        {loading ? <p>Loading...</p> : (
                            <PrivacyMask className="w-full h-full" placeholder="Chart hidden">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {categoryData.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: any) => formatCurrency(value)} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </PrivacyMask>
                        )}
                    </div>
                </div>
            </div>

            {/* Drill Down Table */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3>Transaction Drill-Down</h3>
                {loading ? <p>Loading...</p> : (
                    <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                    <th style={{ padding: '0.5rem' }}>Date</th>
                                    <th style={{ padding: '0.5rem' }}>Description</th>
                                    <th style={{ padding: '0.5rem' }}>Category</th>
                                    <th style={{ padding: '0.5rem' }}>Tags</th>
                                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.slice(0, 50).map((tx) => (
                                    <tr key={tx.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                        <td style={{ padding: '0.5rem' }}>{new Date(tx.date).toLocaleDateString()}</td>
                                        <td style={{ padding: '0.5rem' }}>{tx.description}</td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <span style={{
                                                backgroundColor: tx.is_fixed ? 'rgba(136, 132, 216, 0.2)' : 'rgba(130, 202, 157, 0.2)',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '0.8rem'
                                            }}>
                                                {tx.category || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.5rem' }}>{tx.tags}</td>
                                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                            <PrivacyMask>{formatCurrency(tx.amount)}</PrivacyMask>
                                        </td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            No transactions found for this period.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {transactions.length > 50 && (
                            <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-secondary)' }}>
                                Showing first 50 of {transactions.length} transactions
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
};
