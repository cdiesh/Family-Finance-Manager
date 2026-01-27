import { useState } from 'react';
import { api } from '../api';
import { GoogleLogin } from '@react-oauth/google';

export const Login = ({ onLogin }: { onLogin: () => void }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.login(email, password);
            onLogin(); // Trigger parent refresh
        } catch (err) {
            setError('Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column'
        }}>
            <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '400px' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>[ ACCESS_CONTROL ]</h3>
                <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Login</h1>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>EMAIL</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)',
                                borderRadius: 'var(--radius-btn)',
                                fontFamily: 'var(--font-mono)'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>PASSWORD</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)',
                                borderRadius: 'var(--radius-btn)',
                                fontFamily: 'var(--font-mono)'
                            }}
                        />
                    </div>

                    {error && <div style={{ color: 'var(--status-danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ width: '100%' }}
                    >
                        {loading ? 'AUTHENTICATING...' : 'ENTER SYSTEM'}
                    </button>

                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <GoogleLogin
                                onSuccess={async (credentialResponse) => {
                                    if (credentialResponse.credential) {
                                        setLoading(true);
                                        try {
                                            await api.loginGoogle(credentialResponse.credential);
                                            onLogin();
                                        } catch {
                                            setError('Google Login Failed');
                                        } finally {
                                            setLoading(false);
                                        }
                                    }
                                }}
                                onError={() => {
                                    setError('Google Login Failed');
                                }}
                                theme="filled_black"
                                shape="pill"
                            />
                        </div>
                    </div>
                </form>
            </div>
            <div style={{ marginTop: '2rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                SECURE CONNECTION // ENCRYPTED
            </div>
        </div>
    );
};
