const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// GET all tasks
router.get('/tasks', async (req, res) => {
    try {
        const tasks = await Task.find().sort({ dayNumber: 1 });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET task by day number
router.get('/tasks/:day', async (req, res) => {
    try {
        const task = await Task.findOne({ dayNumber: req.params.day });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST create or update task
router.post('/tasks', async (req, res) => {
    try {
        const { dayNumber, taskText } = req.body;

        let task = await Task.findOne({ dayNumber });

        if (task) {
            task.taskText = taskText;
            await task.save();
        } else {
            task = new Task({
                dayNumber,
                taskText,
                status: 'pending'
            });
            await task.save();
        }

        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT update task
router.put('/tasks/:day', async (req, res) => {
    try {
        const { taskText } = req.body;
        const task = await Task.findOne({ dayNumber: req.params.day });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        task.taskText = taskText;
        await task.save();

        res.json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT mark day as completed
router.put('/complete/:day', async (req, res) => {
    try {
        const task = await Task.findOne({ dayNumber: req.params.day });

        if (!task) {
            // Create a new task if it doesn't exist
            const newTask = new Task({
                dayNumber: req.params.day,
                status: 'completed',
                dateCompleted: new Date()
            });
            await newTask.save();
            return res.json(newTask);
        }

        task.status = 'completed';
        task.dateCompleted = new Date();
        await task.save();

        res.json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT reset day to pending
router.put('/reset/:day', async (req, res) => {
    try {
        const task = await Task.findOne({ dayNumber: req.params.day });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        task.status = 'pending';
        task.dateCompleted = null;
        await task.save();

        res.json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT mark days as skipped (for auto-update)
router.put('/skip-past-days', async (req, res) => {
    try {
        const currentDay = new Date().getDate();

        // Find all pending tasks before current day
        const result = await Task.updateMany(
            {
                dayNumber: { $lt: currentDay },
                status: 'pending'
            },
            {
                $set: { status: 'skipped' }
            }
        );

        res.json({
            message: 'Past days updated',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE task by day number
router.delete('/tasks/:day', async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ dayNumber: req.params.day });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json({
            message: 'Task deleted successfully',
            deletedTask: task
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST add subtask to a day
router.post('/tasks/:day/subtasks', async (req, res) => {
    try {
        const { text } = req.body;
        const task = await Task.findOne({ dayNumber: req.params.day });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        task.subtasks.push({ text, completed: false });
        await task.save();

        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT toggle subtask completion
router.put('/tasks/:day/subtasks/:subtaskId', async (req, res) => {
    try {
        const { completed } = req.body;
        const task = await Task.findOne({ dayNumber: req.params.day });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const subtask = task.subtasks.id(req.params.subtaskId);
        if (!subtask) {
            return res.status(404).json({ message: 'Subtask not found' });
        }

        subtask.completed = completed;
        await task.save();

        res.json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE subtask
router.delete('/tasks/:day/subtasks/:subtaskId', async (req, res) => {
    try {
        const task = await Task.findOne({ dayNumber: req.params.day });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        task.subtasks.pull(req.params.subtaskId);
        await task.save();

        res.json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
