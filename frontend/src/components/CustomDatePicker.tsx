import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface CustomDatePickerProps {
    selected: Date | null;
    onChange: (date: Date | null) => void;
    placeholder?: string;
    showTimeSelect?: boolean;
}

const CustomInput = React.forwardRef<HTMLDivElement, any>(({ value, onClick, placeholder }, ref) => (
    <div
        ref={ref}
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            padding: '0.75rem',
            cursor: 'pointer',
            width: '100%',
            color: value ? 'var(--text-primary)' : 'var(--text-secondary)'
        }}
    >
        <span style={{ marginRight: '0.5rem', opacity: 0.7 }}>📅</span>
        <span style={{ flexGrow: 1 }}>{value || placeholder || "Select Date..."}</span>
        {value && <span style={{ opacity: 0.5, fontSize: '0.8em' }}>▼</span>}
    </div>
));
CustomInput.displayName = 'CustomInput';

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ selected, onChange, placeholder, showTimeSelect = true }) => {
    return (
        <div style={{ width: '100%' }}>
            <DatePicker
                selected={selected}
                onChange={onChange}
                showTimeSelect={showTimeSelect}
                timeFormat="h:mm aa"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                customInput={<CustomInput placeholder={placeholder} />}
                popperClassName="glass-datepicker"
                isClearable
                placeholderText={placeholder}
            />
        </div>
    );
};
