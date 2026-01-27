import { useEffect, useState } from 'react';
import { api } from '../api';
import { Calendar } from './Calendar';
import { CustomDatePicker } from './CustomDatePicker';

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
    const [newTaskDate, setNewTaskDate] = useState<Date | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    // Edit State
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editGroup, setEditGroup] = useState('');
    const [editDate, setEditDate] = useState<Date | null>(null);

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
            due_date: newTaskDate ? newTaskDate.toISOString() : undefined
        });
        setNewTaskTitle('');
        setNewTaskGroup('');
        setNewTaskDate(null);
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
        setEditDate(task.due_date ? new Date(task.due_date) : null);
    };

    const cancelEditing = () => {
        setEditingTaskId(null);
        setEditTitle('');
        setEditGroup('');
        setEditDate(null);
    };

    const saveEdit = async (id: number) => {
        await api.updateTask(id, {
            title: editTitle,
            group: editGroup,
            due_date: editDate ? editDate.toISOString() : undefined
        });
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
                <form onSubmit={handleAdd} className="task-creation-card">
                    <h4 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                        CREATE NEW TASK
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr auto', gap: '1rem', alignItems: 'end' }}>
                        <div>
                            <label className="form-label">DESCRIPTION</label>
                            <input
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder="What needs doing?"
                                className="input-premium"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="form-label">CATEGORY</label>
                            <input
                                list="group-suggestions"
                                value={newTaskGroup}
                                onChange={(e) => setNewTaskGroup(e.target.value)}
                                placeholder="Select..."
                                className="input-premium"
                            />
                            <datalist id="group-suggestions">
                                {existingGroups.map(g => <option key={g} value={g} />)}
                            </datalist>
                        </div>

                        <div>
                            <label className="form-label">DUE DATE</label>
                            <CustomDatePicker
                                selected={newTaskDate}
                                onChange={(date) => setNewTaskDate(date)}
                                placeholder="Select Date & Time"
                            />
                        </div>

                        <button type="submit" className="btn-primary" style={{ height: '46px', whiteSpace: 'nowrap' }}>
                            SAVE TASK
                        </button>
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
                                                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '2px 4px', width: '80px' }}
                                                    placeholder="Group"
                                                />
                                                <div style={{ width: '150px' }}>
                                                    <CustomDatePicker
                                                        selected={editDate}
                                                        onChange={(date) => setEditDate(date)}
                                                        placeholder="Due Date"
                                                        showTimeSelect={true}
                                                    />
                                                </div>
                                                <button onClick={() => saveEdit(task.id)} style={{ color: 'var(--status-success)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✓</button>
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
