import { useEffect, useState, useCallback } from 'react';
import { usePlaidLink, type PlaidLinkOnSuccess, type PlaidLinkOnExit } from 'react-plaid-link';
import { api } from '../api';

export const LinkButton = () => {
    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const createLinkToken = useCallback(async () => {
        try {
            const data = await api.createLinkToken();
            setToken(data.link_token);
        } catch (err: unknown) {
            console.error('Error creating link token', err);
            setError(err instanceof Error ? err.message : 'Failed to load');
        }
    }, []);

    useEffect(() => {
        createLinkToken();
    }, [createLinkToken]);

    const onSuccess = useCallback<PlaidLinkOnSuccess>(async (publicToken, metadata) => {
        try {
            await api.exchangePublicToken(publicToken, metadata.institution?.name || "Unknown Bank");
            await api.syncAccounts();
            alert(`Successfully linked ${metadata.institution?.name}!`);
            window.location.reload();
        } catch (err) {
            console.error('Error exchanging token', err);
            alert('Failed to exchange token');
        }
    }, []);

    const onExit = useCallback<PlaidLinkOnExit>((error, metadata) => {
        if (error) console.error('Plaid Link Exit:', error, metadata);
    }, []);

    const config: Parameters<typeof usePlaidLink>[0] = {
        token,
        onSuccess,
        onExit,
    };

    const { open, ready } = usePlaidLink(config);

    if (error) {
        return (
            <button
                className="btn-primary"
                style={{
                    width: '100%',
                    background: 'var(--negative)',
                    boxShadow: '0 2px 8px rgba(199, 93, 93, 0.25)'
                }}
                onClick={() => window.location.reload()}
            >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Retry Connection
                </span>
            </button>
        );
    }

    return (
        <button
            onClick={() => open()}
            disabled={!ready}
            className="btn-primary"
            style={{ width: '100%' }}
        >
            {ready ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                    </svg>
                    Link Account
                </span>
            ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Connecting...
                </span>
            )}
        </button>
    );
};
