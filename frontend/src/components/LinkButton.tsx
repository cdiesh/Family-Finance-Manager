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
            <button className="btn-primary" style={{ width: '100%', background: 'var(--status-danger)' }} onClick={() => window.location.reload()}>
                Error: {error} (Retry)
            </button>
        )
    }

    return (
        <button onClick={() => open()} disabled={!ready} className="btn-primary" style={{ width: '100%' }}>
            {ready ? '+ Link Bank Account' : 'Loading Plaid...'}
        </button>
    );
};
