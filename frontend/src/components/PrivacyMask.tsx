import { usePrivacy } from '../context/PrivacyContext';

interface PrivacyMaskProps {
    children: React.ReactNode;
    className?: string;
    maskType?: 'currency' | 'text' | 'percent';
}

export const PrivacyMask = ({ children, className = '', maskType = 'currency' }: PrivacyMaskProps) => {
    const { isPrivacyMode } = usePrivacy();

    if (isPrivacyMode) {
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

    return <span className={className}>{children}</span>;
};
