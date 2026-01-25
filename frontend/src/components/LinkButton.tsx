import { useEffect, useState, useCallback } from 'react';
import { usePlaidLink, type PlaidLinkOnSuccess, type PlaidLinkOnExit } from 'react-plaid-link';

const API_URL = 'http://localhost:8000';

interface LinkProps {
    userId: number;
}

export const LinkButton = ({ userId }: LinkProps) => {
    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const createLinkToken = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/plaid/create_link_token?user_id=${userId}`, {
                method: 'POST',
            });
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            const data = await response.json();
            setToken(data.link_token);
        } catch (err: unknown) {
            console.error('Error creating link token', err);
            setError(err instanceof Error ? err.message : 'Failed to load');
        }
    }, [userId]);

    useEffect(() => {
        if (userId) {
            createLinkToken();
        }
    }, [userId, createLinkToken]);

    const onSuccess = useCallback<PlaidLinkOnSuccess>(async (publicToken, metadata) => {
        try {
            await fetch(`${API_URL}/plaid/exchange_public_token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    public_token: publicToken,
                    user_id: userId,
                    institution_name: metadata.institution?.name,
                }),
            });
            alert(`Successfully linked ${metadata.institution?.name}!`);
            // TODO: Refresh dashboard data
            window.location.reload();
        } catch (err) {
            console.error('Error exchanging token', err);
        }
    }, [userId]);

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
