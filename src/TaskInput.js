import React, { useState } from 'react';
import { supabase } from './supabaseClient';

const TaskInput = ({ session, onTaskAdded }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState('Medium'); // Default priority
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!session?.user?.id) {
            alert('User not logged in.');
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('tasks')
            .insert([
                {
                    user_id: session.user.id,
                    title,
                    description,
                    due_date: dueDate || null, // Set to null if empty
                    priority,
                },
            ]);

        if (error) {
            alert(error.message);
        } else {
            setTitle('');
            setDescription('');
            setDueDate('');
            setPriority('Medium');
            if (onTaskAdded) {
                onTaskAdded(); // Notify parent component that a task was added
            }
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="task-input-form">
            <input
                type="text"
                placeholder="Task Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
            />
            <textarea
                placeholder="Task Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
            ></textarea>
            <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={loading}
            />
            <select value={priority} onChange={(e) => setPriority(e.target.value)} disabled={loading}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
            </select>
            <button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Task'}
            </button>
        </form>
    );
};

export default TaskInput;