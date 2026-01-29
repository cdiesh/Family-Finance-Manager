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

const groupColors: Record<string, string> = {
    'General': 'var(--text-secondary)',
    'Tax': '#f87171',
    'House': '#60a5fa',
    'Kids': '#a78bfa',
    'Finance': 'var(--accent-gold)',
    'Bills': '#fb923c'
};

export const TaskList = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskGroup, setNewTaskGroup] = useState('');
    const [newTaskDate, setNewTaskDate] = useState<Date | null>(null);
    const [isAdding, setIsAdding] = useState(false);

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
        if (!newTaskTitle.trim()) return;
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

    const existingGroups = Array.from(new Set([...SUGGESTED_GROUPS, ...tasks.map(t => t.group)]));

    const groupedTasks = tasks.reduce((acc, task) => {
        if (!acc[task.group]) acc[task.group] = [];
        acc[task.group].push(task);
        return acc;
    }, {} as Record<string, Task[]>);

    const getGroupColor = (group: string) => groupColors[group] || 'var(--text-secondary)';

    return (
        <div className="glass-panel" style={{ padding: '2rem' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <div>
                    <h3 style={{ marginBottom: '0.5rem' }}>Family Tasks</h3>
                    <p style={{ fontSize: '0.85rem' }}>
                        {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} across {Object.keys(groupedTasks).length} categories
                    </p>
                </div>
                <button
                    className={isAdding ? 'btn-ghost' : 'btn-primary'}
                    onClick={() => setIsAdding(!isAdding)}
                >
                    {isAdding ? 'Cancel' : '+ New Task'}
                </button>
            </div>

            {/* New Task Form */}
            {isAdding && (
                <form onSubmit={handleAdd} className="task-creation-card">
                    <h4 style={{
                        marginBottom: '1.5rem',
                        color: 'var(--text-primary)',
                        borderBottom: '1px solid var(--border-subtle)',
                        paddingBottom: '0.75rem'
                    }}>
                        Create New Task
                    </h4>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr auto',
                        gap: '1rem',
                        alignItems: 'end'
                    }}>
                        <div>
                            <label className="form-label">Description</label>
                            <input
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder="What needs to be done?"
                                className="input-premium"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="form-label">Category</label>
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
                            <label className="form-label">Due Date</label>
                            <CustomDatePicker
                                selected={newTaskDate}
                                onChange={(date) => setNewTaskDate(date)}
                                placeholder="Select date"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            style={{ height: '46px', whiteSpace: 'nowrap' }}
                        >
                            Save
                        </button>
                    </div>
                </form>
            )}

            {/* Main Content */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2rem'
            }}>
                {/* Calendar View */}
                <div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '1.5rem',
                        paddingBottom: '1rem',
                        borderBottom: '1px solid var(--border-subtle)'
                    }}>
                        <span style={{ fontSize: '1.25rem' }}>📅</span>
                        <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Calendar</h4>
                    </div>
                    <Calendar tasks={tasks} />
                </div>

                {/* Task List */}
                <div style={{
                    borderLeft: '1px solid var(--border-subtle)',
                    paddingLeft: '2rem'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '1.5rem',
                        paddingBottom: '1rem',
                        borderBottom: '1px solid var(--border-subtle)'
                    }}>
                        <span style={{ fontSize: '1.25rem' }}>📋</span>
                        <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>All Tasks</h4>
                    </div>

                    {Object.keys(groupedTasks).length === 0 && (
                        <div style={{
                            textAlign: 'center',
                            padding: '3rem 2rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px dashed var(--border-subtle)'
                        }}>
                            <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }}>✓</div>
                            <p style={{ color: 'var(--text-secondary)' }}>No tasks yet</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                Create your first task above
                            </p>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {Object.entries(groupedTasks).map(([group, groupTasks]) => (
                            <div key={group}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginBottom: '0.75rem'
                                }}>
                                    <span style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: getGroupColor(group)
                                    }} />
                                    <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: getGroupColor(group),
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        {group}
                                    </span>
                                    <span style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--text-muted)',
                                        marginLeft: 'auto'
                                    }}>
                                        {groupTasks.length}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {groupTasks.map(task => (
                                        <div
                                            key={task.id}
                                            style={{
                                                padding: '0.75rem 1rem',
                                                borderRadius: 'var(--radius-md)',
                                                background: 'var(--bg-elevated)',
                                                border: '1px solid var(--border-subtle)',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--border-medium)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                                            }}
                                        >
                                            {editingTaskId === task.id ? (
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <input
                                                        value={editTitle}
                                                        onChange={e => setEditTitle(e.target.value)}
                                                        className="input-premium"
                                                        style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                                                    />
                                                    <div style={{ width: '120px' }}>
                                                        <CustomDatePicker
                                                            selected={editDate}
                                                            onChange={(date) => setEditDate(date)}
                                                            placeholder="Due"
                                                            showTimeSelect={true}
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => saveEdit(task.id)}
                                                        className="btn-ghost"
                                                        style={{ color: 'var(--positive)', fontSize: '1.1rem', padding: '0.25rem' }}
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        onClick={cancelEditing}
                                                        className="btn-ghost"
                                                        style={{ color: 'var(--negative)', fontSize: '0.9rem', padding: '0.25rem' }}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <div
                                                        onClick={() => startEditing(task)}
                                                        style={{
                                                            flex: 1,
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.75rem'
                                                        }}
                                                    >
                                                        <span style={{
                                                            color: task.is_completed ? 'var(--text-muted)' : 'var(--text-primary)',
                                                            textDecoration: task.is_completed ? 'line-through' : 'none',
                                                            fontSize: '0.9rem'
                                                        }}>
                                                            {task.title}
                                                        </span>
                                                        {task.due_date && (
                                                            <span style={{
                                                                fontSize: '0.7rem',
                                                                color: 'var(--text-muted)',
                                                                background: 'var(--bg-secondary)',
                                                                padding: '0.2rem 0.5rem',
                                                                borderRadius: '4px'
                                                            }}>
                                                                {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                        <button
                                                            onClick={() => startEditing(task)}
                                                            className="btn-ghost"
                                                            style={{
                                                                fontSize: '0.75rem',
                                                                padding: '0.25rem 0.5rem',
                                                                opacity: 0.5
                                                            }}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(task.id)}
                                                            className="btn-ghost"
                                                            style={{
                                                                fontSize: '0.75rem',
                                                                padding: '0.25rem 0.5rem',
                                                                opacity: 0.5,
                                                                color: 'var(--negative)'
                                                            }}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
