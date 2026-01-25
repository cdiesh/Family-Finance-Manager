import { useEffect, useState } from 'react';
import { api } from '../api';

interface Task {
    id: number;
    title: string;
    group: string;
    is_completed: boolean;
    due_date?: string;
}

export const TaskList = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskGroup, setNewTaskGroup] = useState('General');
    const [isAdding, setIsAdding] = useState(false);

    const loadTasks = async () => {
        try {
            const data = await api.getTasks();
            setTasks(data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        loadTasks();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        await api.createTask({ title: newTaskTitle, group: newTaskGroup });
        setNewTaskTitle('');
        setIsAdding(false);
        loadTasks();
    };

    const handleDelete = async (id: number) => {
        await api.deleteTask(id);
        loadTasks();
    };

    // Group tasks
    const groupedTasks = tasks.reduce((acc, task) => {
        if (!acc[task.group]) acc[task.group] = [];
        acc[task.group].push(task);
        return acc;
    }, {} as Record<string, Task[]>);

    return (
        <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>[ 04 ] FINANCIAL_OPERATIONS</h3>
                <button
                    className="btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                    onClick={() => setIsAdding(!isAdding)}
                >
                    {isAdding ? 'CANCEL' : '+ NEW TASK'}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleAdd} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px auto', gap: '1rem' }}>
                        <input
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="Task description..."
                            style={{ background: 'transparent', border: '1px solid var(--border-subtle)', padding: '0.5rem', color: 'white' }}
                            autoFocus
                        />
                        <input
                            value={newTaskGroup}
                            onChange={(e) => setNewTaskGroup(e.target.value)}
                            placeholder="Group (e.g. Tax)"
                            style={{ background: 'transparent', border: '1px solid var(--border-subtle)', padding: '0.5rem', color: 'white' }}
                        />
                        <button type="submit" className="btn-primary">SAVE</button>
                    </div>
                </form>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                {Object.entries(groupedTasks).length === 0 && !isAdding && (
                    <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No active tasks.</div>
                )}

                {Object.entries(groupedTasks).map(([group, groupTasks]) => (
                    <div key={group}>
                        <h4 style={{
                            borderBottom: '1px solid var(--border-subtle)',
                            paddingBottom: '0.5rem',
                            marginBottom: '1rem',
                            color: 'var(--text-secondary)',
                            textTransform: 'uppercase',
                            fontSize: '0.8rem',
                            letterSpacing: '0.1em'
                        }}>
                            {group}
                        </h4>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {groupTasks.map(task => (
                                <li key={task.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                                    <span>{task.title}</span>
                                    <button
                                        onClick={() => handleDelete(task.id)}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}
                                    >
                                        [ DONE ]
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};
