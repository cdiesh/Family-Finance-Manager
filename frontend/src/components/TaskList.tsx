import { useEffect, useState } from 'react';
import { api } from '../api';
import { Calendar } from './Calendar';

interface Task {
    id: number;
    title: string;
    group: string;
    is_completed: boolean;
    due_date?: string;
}

const SUGGESTED_GROUPS = ['General', 'Tax', 'House', 'Kids', 'Finance', 'Bills'];

export const TaskList = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskGroup, setNewTaskGroup] = useState(''); // Allow typing
    const [newTaskDate, setNewTaskDate] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // Edit State
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editGroup, setEditGroup] = useState('');

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
        await api.createTask({
            title: newTaskTitle,
            group: newTaskGroup || 'General',
            due_date: newTaskDate ? new Date(newTaskDate).toISOString() : undefined
        });
        setNewTaskTitle('');
        setNewTaskGroup('');
        setNewTaskDate('');
        setIsAdding(false);
        loadTasks();
    };

    // Make sure to delete the task from the database
    const handleDelete = async (id: number) => {
        await api.deleteTask(id);
        loadTasks();
    };

    const startEditing = (task: Task) => {
        setEditingTaskId(task.id);
        setEditTitle(task.title);
        setEditGroup(task.group);
    };

    const cancelEditing = () => {
        setEditingTaskId(null);
        setEditTitle('');
        setEditGroup('');
    };

    const saveEdit = async (id: number) => {
        await api.updateTask(id, { title: editTitle, group: editGroup });
        setEditingTaskId(null);
        loadTasks();
    };

    // Get unique existing groups from tasks + suggestions
    const existingGroups = Array.from(new Set([...SUGGESTED_GROUPS, ...tasks.map(t => t.group)]));

    // Group tasks
    const groupedTasks = tasks.reduce((acc, task) => {
        if (!acc[task.group]) acc[task.group] = [];
        acc[task.group].push(task);
        return acc;
    }, {} as Record<string, Task[]>);

    return (
        <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3>[ 04 ] FAMILY_OPERATIONS_CENTER</h3>
                <button
                    className="btn-primary"
                    onClick={() => setIsAdding(!isAdding)}
                >
                    {isAdding ? 'CANCEL' : '+ NEW ITEM'}
                </button>
            </div>

            {/* NEW ITEM FORM */}
            {isAdding && (
                <form onSubmit={handleAdd} style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>CREATE NEW TASK</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                        <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>DESCRIPTION</label>
                            <input
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder="What needs doing?"
                                style={{
                                    width: '100%',
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-subtle)',
                                    padding: '0.75rem',
                                    color: 'var(--text-primary)',
                                    borderRadius: '4px'
                                }}
                                autoFocus
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>CATEGORY (Type or Select)</label>
                            <input
                                list="group-suggestions"
                                value={newTaskGroup}
                                onChange={(e) => setNewTaskGroup(e.target.value)}
                                placeholder="General"
                                style={{
                                    width: '100%',
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-subtle)',
                                    padding: '0.75rem',
                                    color: 'var(--text-primary)',
                                    borderRadius: '4px'
                                }}
                            />
                            <datalist id="group-suggestions">
                                {existingGroups.map(g => <option key={g} value={g} />)}
                            </datalist>
                        </div>

                        <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>DUE DATE (Optional)</label>
                            <input
                                type="date"
                                value={newTaskDate}
                                onChange={(e) => setNewTaskDate(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-subtle)',
                                    padding: '0.75rem',
                                    color: 'var(--text-primary)',
                                    borderRadius: '4px',
                                    colorScheme: 'dark'
                                }}
                            />
                        </div>

                        <button type="submit" className="btn-primary" style={{ height: '42px' }}>SAVE TASK</button>
                    </div>
                </form>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                {/* LEFT COLUMN: CALENDAR */}
                <div>
                    <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>CALENDAR VIEW</h4>
                    <Calendar tasks={tasks} />
                </div>

                {/* RIGHT COLUMN: LISTS */}
                <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '2rem' }}>
                    <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>MASTER TASK LIST</h4>

                    {Object.keys(groupedTasks).length === 0 && (
                        <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No active tasks.</div>
                    )}

                    {Object.entries(groupedTasks).map(([group, groupTasks]) => (
                        <div key={group} style={{ marginBottom: '1.5rem' }}>
                            <h5 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.8rem' }}>{group}</h5>
                            <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', margin: 0 }}>
                                {groupTasks.map(task => (
                                    <li key={task.id} style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                        {editingTaskId === task.id ? (
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <input
                                                    value={editTitle}
                                                    onChange={e => setEditTitle(e.target.value)}
                                                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: 'white', padding: '2px 4px', width: '100%' }}
                                                />
                                                <input
                                                    list="group-suggestions"
                                                    value={editGroup}
                                                    onChange={e => setEditGroup(e.target.value)}
                                                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: 'white', padding: '2px 4px', width: '80px' }}
                                                    placeholder="Group"
                                                />
                                                <button onClick={() => saveEdit(task.id)} style={{ color: 'var(--status-success)', background: 'none', border: 'none', cursor: 'pointer' }}>✓</button>
                                                <button onClick={cancelEditing} style={{ color: 'var(--status-danger)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                <span style={{
                                                    color: task.is_completed ? 'var(--text-secondary)' : 'var(--text-primary)',
                                                    textDecoration: task.is_completed ? 'line-through' : 'none',
                                                    cursor: 'pointer'
                                                }} onClick={() => startEditing(task)} title="Click to Edit">
                                                    {task.title}
                                                    {task.due_date && (
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                                                            📅 {new Date(task.due_date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                                                        </span>
                                                    )}
                                                </span>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => startEditing(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', opacity: 0.5 }}>✎</button>
                                                    <button onClick={() => handleDelete(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.8rem', opacity: 0.5 }}>✕</button>
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
