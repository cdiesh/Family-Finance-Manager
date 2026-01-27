import { useState } from 'react';

interface Task {
    id: number;
    title: string;
    due_date?: string;
    is_completed: boolean;
}

interface CalendarProps {
    tasks: Task[];
}

export const Calendar = ({ tasks }: CalendarProps) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    // Map tasks to dates
    const tasksByDate: Record<number, Task[]> = {};
    tasks.forEach(task => {
        if (task.due_date) {
            const date = new Date(task.due_date);
            if (date.getFullYear() === year && date.getMonth() === month) {
                const day = date.getDate();
                if (!tasksByDate[day]) tasksByDate[day] = [];
                tasksByDate[day].push(task);
            }
        }
    });

    // Generate grid cells
    const cells = [];
    // Empty cells for padding
    for (let i = 0; i < firstDay; i++) {
        cells.push(<div key={`empty-${i}`} style={{ height: '80px', border: '1px solid transparent' }}></div>);
    }
    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const dayTasks = tasksByDate[day] || [];
        const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

        cells.push(
            <div key={day} style={{
                height: '80px',
                border: '1px solid var(--border-subtle)',
                padding: '0.25rem',
                background: isToday ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                borderRadius: '4px',
                position: 'relative'
            }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{day}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {dayTasks.map(t => (
                        <div key={t.id} style={{
                            fontSize: '0.65rem',
                            background: t.is_completed ? 'var(--status-success-dim)' : 'var(--bg-secondary)',
                            padding: '1px 3px',
                            borderRadius: '2px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {t.title}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0 }}>{monthName} {year}</h4>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={prevMonth} className="btn-secondary" style={{ padding: '0.25rem 0.5rem' }}>{'<'}</button>
                    <button onClick={nextMonth} className="btn-secondary" style={{ padding: '0.25rem 0.5rem' }}>{'>'}</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                {cells}
            </div>
        </div>
    );
};
