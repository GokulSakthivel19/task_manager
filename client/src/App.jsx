import React, { useState, useEffect } from 'react';
import './index.css';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [tasks, setTasks] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [taskText, setTaskText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch all tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  // Auto-skip past days on load
  useEffect(() => {
    if (tasks.length > 0) {
      skipPastDays();
    }
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/tasks`);
      const data = await response.json();

      // Create a map of existing tasks
      const taskMap = {};
      data.forEach(task => {
        taskMap[task.dayNumber] = task;
      });

      // Create array for all 31 days
      const allDays = [];
      for (let i = 1; i <= 31; i++) {
        allDays.push(taskMap[i] || {
          dayNumber: i,
          taskText: '',
          status: 'pending',
          dateCreated: new Date()
        });
      }

      setTasks(allDays);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const skipPastDays = async () => {
    try {
      await fetch(`${API_URL}/skip-past-days`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      // Refresh tasks after skipping
      fetchTasks();
    } catch (error) {
      console.error('Error skipping past days:', error);
    }
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
    setTaskText(day.taskText || '');
  };

  const handleCloseModal = () => {
    setSelectedDay(null);
    setTaskText('');
  };

  const handleSaveTask = async () => {
    if (!selectedDay) return;

    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayNumber: selectedDay.dayNumber,
          taskText: taskText
        })
      });

      if (response.ok) {
        await fetchTasks();
        handleCloseModal();
      }
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!selectedDay) return;

    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/complete/${selectedDay.dayNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        await fetchTasks();
        handleCloseModal();
      }
    } catch (error) {
      console.error('Error marking complete:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedDay) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete the task for Day ${selectedDay.dayNumber}?`
    );

    if (!confirmDelete) return;

    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/tasks/${selectedDay.dayNumber}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        await fetchTasks();
        handleCloseModal();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleResetStatus = async () => {
    if (!selectedDay) return;

    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/reset/${selectedDay.dayNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        await fetchTasks();
      }
    } catch (error) {
      console.error('Error resetting status:', error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'completed';
      case 'skipped':
        return 'skipped';
      default:
        return 'pending';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'skipped':
        return 'Skipped';
      default:
        return 'Pending';
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">31-Day Challenge Tracker</h1>
        <p className="app-subtitle">Try Alone, Fail Alone, Win Alone...!!!</p>
      </header>

      <div className="calendar-container">
        <div className="calendar-grid">
          {tasks.map((task) => (
            <div
              key={task.dayNumber}
              className={`day-card ${getStatusColor(task.status)}`}
              onClick={() => handleDayClick(task)}
            >
              {task.taskText && <div className="task-indicator"></div>}
              <div className="day-number">{task.dayNumber}</div>
              <div className="day-label">Day</div>
            </div>
          ))}
        </div>
      </div>

      {selectedDay && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <span className="day-badge">Day {selectedDay.dayNumber}</span>
              </h2>
              <button className="close-button" onClick={handleCloseModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="status-section">
                <div className="status-label">Current Status</div>
                <div className={`status-badge ${getStatusColor(selectedDay.status)}`}>
                  <span className="status-dot"></span>
                  {getStatusText(selectedDay.status)}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Task / Notes</label>
                <textarea
                  className="task-textarea"
                  placeholder="What do you want to accomplish today?"
                  value={taskText}
                  onChange={(e) => setTaskText(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={handleSaveTask}
                disabled={saving}
              >
                {saving ? 'Saving...' : ' Save Task'}
              </button>
              <button
                className="btn btn-success"
                onClick={handleMarkComplete}
                disabled={saving || selectedDay.status === 'completed'}
              >
                {selectedDay.status === 'completed' ? '✓ Completed' : ' Mark Complete'}
              </button>
              {selectedDay.status === 'completed' && (
                <button
                  className="btn btn-warning"
                  onClick={handleResetStatus}
                  disabled={saving}
                >
                  ↺ Reset to Pending
                </button>
              )}
              {selectedDay.taskText && selectedDay._id && (
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteTask}
                  disabled={saving}
                >
                  Delete Task
                </button>
              )}
              <button
                className="btn btn-secondary"
                onClick={handleCloseModal}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
