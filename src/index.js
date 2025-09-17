import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { supabase } from './supabaseClient';
import './index.css';
import TaskInput from './TaskInput'; // Import the new TaskInput component

const App = () => {
    const [session, setSession] = useState(null);
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [tasks, setTasks] = useState([]); // State to hold tasks
    const [editingTask, setEditingTask] = useState(null); // State to hold the task being edited
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editDueDate, setEditDueDate] = useState('');
    const [editPriority, setEditPriority] = useState('Medium');
    const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed', 'archived'
    const [isDarkMode, setIsDarkMode] = useState(false); // New state for dark mode

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    // Function to fetch tasks
    const fetchTasks = async () => {
        if (session?.user?.id) {
            let query = supabase
                .from('tasks')
                .select('*')
                .eq('user_id', session.user.id);

            if (filter === 'active') {
                query = query.eq('is_complete', false).eq('is_archived', false);
            } else if (filter === 'completed') {
                query = query.eq('is_complete', true).eq('is_archived', false);
            } else if (filter === 'archived') {
                query = query.eq('is_archived', true);
            } else { // 'all' filter
                query = query.eq('is_archived', false);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching tasks:', error.message);
            } else {
                // Custom sort for priority if 'all' or 'active' filter is applied
                if (filter === 'all' || filter === 'active') {
                    const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
                    data.sort((a, b) => {
                        return priorityOrder[a.priority] - priorityOrder[b.priority];
                    });
                }
                setTasks(data);
            }
        } else {
            setTasks([]); // Clear tasks if no user is logged in
        }
    };

    // Fetch tasks whenever the session changes
    useEffect(() => {
        fetchTasks();
    }, [session, filter]); // Added filter to dependency array

    const handleLogin = async (e) => {
        e.preventDefault();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert(error.message);
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName,
                },
            },
        });
        if (error) {
            alert(error.message);
        } else {
            alert('Check your email for the login link!');
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const toggleTaskCompletion = async (taskId, currentStatus) => {
        const { error } = await supabase
            .from('tasks')
            .update({ is_complete: !currentStatus })
            .eq('id', taskId);

        if (error) {
            alert('Error updating task status: ' + error.message);
        } else {
            fetchTasks(); // Re-fetch tasks to update the UI
        }
    };

    const deleteTask = async (taskId) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);

            if (error) {
                alert('Error deleting task: ' + error.message);
            } else {
                fetchTasks(); // Re-fetch tasks to update the UI
            }
        }
    };

    const startEditing = (task) => {
        setEditingTask(task);
        setEditTitle(task.title);
        setEditDescription(task.description || '');
        setEditDueDate(task.due_date || '');
        setEditPriority(task.priority || 'Medium'); // Set edit priority
    };

    const cancelEditing = () => {
        setEditingTask(null);
        setEditTitle('');
        setEditDescription('');
        setEditDueDate('');
        setEditPriority('Medium'); // Reset edit priority
    };

    const saveEditedTask = async (taskId) => {
        const { error } = await supabase
            .from('tasks')
            .update({ title: editTitle, description: editDescription, due_date: editDueDate || null, priority: editPriority })
            .eq('id', taskId);

        if (error) {
            alert('Error updating task: ' + error.message);
        } else {
            setEditingTask(null);
            setEditTitle('');
            setEditDescription('');
            setEditDueDate('');
            setEditPriority('Medium');
            fetchTasks();
        }
    };

    const clearCompletedTasks = async () => {
        if (window.confirm('Are you sure you want to delete all completed tasks?')) {
            if (!session?.user?.id) {
                alert('User not logged in.');
                return;
            }

            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('user_id', session.user.id)
                .eq('is_complete', true);

            if (error) {
                alert('Error clearing completed tasks: ' + error.message);
            } else {
                fetchTasks(); // Re-fetch tasks to update the UI
            }
        }
    };

    const toggleTaskArchiving = async (taskId, currentStatus) => {
        const { error } = await supabase
            .from('tasks')
            .update({ is_archived: !currentStatus })
            .eq('id', taskId);

        if (error) {
            alert('Error updating task archive status: ' + error.message);
        } else {
            fetchTasks(); // Re-fetch tasks to update the UI
        }
    };

    const getSurname = () => {
        if (session?.user?.user_metadata?.display_name) {
            const nameParts = session.user.user_metadata.display_name.split(' ');
            return nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];
        }
        return 'User';
    };

    return (
        <div className={`app-container ${isDarkMode ? 'dark-mode' : ''}`}>
            <header className={`app-header ${!session ? 'login-header' : ''}`}>
                <h1>Task Manager</h1>
                {!session && ( // Dark Mode button only for login page
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className={`dark-mode-toggle-login ${isDarkMode ? 'active' : ''}`}>
                        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                    </button>
                )}
                {session && (
                    <div className="filter-buttons-header">
                        <button onClick={() => setIsDarkMode(!isDarkMode)} className={isDarkMode ? 'active' : ''}>
                            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                        </button>
                        <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>All</button>
                        <button onClick={() => setFilter('active')} className={filter === 'active' ? 'active' : ''}>Active</button>
                        <button onClick={() => setFilter('completed')} className={filter === 'completed' ? 'active' : ''}>Completed</button>
                        <button onClick={() => setFilter('archived')} className={filter === 'archived' ? 'active' : ''}>Archived</button>
                    </div>
                )}
            </header>
            <main className="main-content">
                {session ? (
                    <div className="logged-in-container">
                        <h2>Welcome, {getSurname()}!</h2>
                        <button onClick={handleLogout}>Logout</button>

                        <TaskInput session={session} onTaskAdded={fetchTasks} />

                        {/* Removed filter-buttons from here */}
                        {filter === 'completed' && (
                            <button onClick={clearCompletedTasks} className="clear-completed-button">Clear Completed</button>
                        )}

                        <div className="task-list">
                            <h3>Your Tasks</h3>
                            {tasks.length === 0 ? (
                                <p>No tasks yet. Add one above!</p>
                            ) : (
                                <ul>
                                    {tasks.map((task) => (
                                        <li key={task.id} className={task.is_complete ? 'completed' : ''}>
                                            {editingTask?.id === task.id ? (
                                                <div className="edit-form">
                                                    <input
                                                        type="text"
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                    />
                                                    <textarea
                                                        value={editDescription}
                                                        onChange={(e) => setEditDescription(e.target.value)}
                                                    ></textarea>
                                                    <input
                                                        type="date"
                                                        value={editDueDate}
                                                        onChange={(e) => setEditDueDate(e.target.value)}
                                                    />
                                                    <select
                                                        value={editPriority}
                                                        onChange={(e) => setEditPriority(e.target.value)}
                                                    >
                                                        <option value="Low">Low</option>
                                                        <option value="Medium">Medium</option>
                                                        <option value="High">High</option>
                                                    </select>
                                                    <button onClick={() => saveEditedTask(task.id)}>Save</button>
                                                    <button onClick={cancelEditing} className="cancel-button">Cancel</button>
                                                </div>
                                            ) : (
                                                <div className="task-content">
                                                    <div className="task-details">
                                                        <div className="task-title-row">
                                                            <input
                                                                type="checkbox"
                                                                checked={task.is_complete}
                                                                onChange={() => toggleTaskCompletion(task.id, task.is_complete)}
                                                            />
                                                            <h4>{task.title}</h4>
                                                        </div>
                                                        {task.description && <p>{task.description}</p>}
                                                        {task.due_date && <p>Due: {new Date(task.due_date).toLocaleDateString()}</p>}
                                                        <p>Status: {task.is_complete ? 'Complete' : 'Active'}</p>
                                                        <p>Priority: {task.priority}</p>
                                                    </div>
                                                    <div className="task-actions">
                                                        <button onClick={() => startEditing(task)} className="edit-button">
                                                            Edit
                                                        </button>
                                                        <button onClick={() => deleteTask(task.id)} className="delete-button">
                                                            Delete
                                                        </button>
                                                        <button onClick={() => toggleTaskArchiving(task.id, task.is_archived)} className="archive-button">
                                                            {task.is_archived ? 'Unarchive' : 'Archive'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                ) : (
                    <div>
                        <h2>{isLoginView ? 'Login' : 'Create Account'}</h2>
                        <div className="form-container">
                            <form onSubmit={isLoginView ? handleLogin : handleSignUp}>
                                {!isLoginView && (
                                    <input
                                        type="text"
                                        placeholder="Display Name"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        required
                                    />
                                )}
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button type="submit">{isLoginView ? 'Login' : 'Create Account'}</button>
                            </form>
                            <p className="toggle-form" onClick={() => setIsLoginView(!isLoginView)}>
                                {isLoginView ? 'Need an account? Create one' : 'Already have an account? Login'}
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
