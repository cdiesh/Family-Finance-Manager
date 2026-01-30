import { usePrivacy } from '../context/PrivacyContext';

interface PrivacyMaskProps {
    children: React.ReactNode;
    className?: string;
    maskType?: 'currency' | 'text' | 'percent';
    placeholder?: string;
}

export const PrivacyMask = ({ children, className = '', maskType = 'currency', placeholder }: PrivacyMaskProps) => {
    const { isPrivacyMode } = usePrivacy();

    if (isPrivacyMode) {
        // Detailed Block Masking (Charts, etc.)
        if (placeholder) {
            return (
                <div
                    className={`privacy-mask-block ${className}`}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(10px)',
                        color: 'var(--text-muted)',
                        border: '1px dashed var(--border-color)',
                        borderRadius: '8px',
                        height: '100%',
                        width: '100%',
                        minHeight: '100px'
                    }}
                    title="Content Hidden"
                >
                    <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        🔒 {placeholder}
                    </span>
                </div>
            );
        }

        // Inline Masking (Text, Currency)
        // "Fake big number" with most digits obscured by *, as requested
        // Example: $ *,***,*84
        let fakeValue = '$ *,***,**4';

        if (maskType === 'percent') fakeValue = '**.5%';
        if (maskType === 'text') fakeValue = '**** Hidden ****';

        return (
            <span
                className={`privacy-mask ${className}`}
                title="Value Hidden"
            >
                {fakeValue}
            </span>
        );
    }

    // Pass-through when unlocked
    return <span className={className}>{children}</span>;
};

