const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const { Op } = require('sequelize');

// @route   GET api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PUT api/users/me
// @desc    Update current user profile
// @access  Private
router.put('/me', [
    auth,
    [
        check('firstName', 'First name is required').not().isEmpty(),
        check('lastName', 'Last name is required').not().isEmpty(),
        check('gender', 'Gender must be either male or female').optional().isIn(['male', 'female']),
        check('dailyWaterGoal', 'Daily water goal must be a positive number').optional().isInt({ min: 0 })
    ]
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { firstName, lastName, middleName, gender, dailyWaterGoal } = req.body;

        const updateData = {
            firstName,
            lastName,
            middleName: middleName || null
        };

        if (gender) updateData.gender = gender;
        if (dailyWaterGoal) updateData.dailyWaterGoal = dailyWaterGoal;

        const [updated] = await User.update(updateData, {
            where: { id: req.user.id },
            returning: true
        });

        if (updated === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });

        res.json(user);
    } catch (err) {
        console.error('Error updating user profile:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const users = await User.findAll({
            attributes: { exclude: ['password'] }
        });

        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PUT api/users/:id
// @desc    Update user by ID (admin only)
// @access  Private/Admin
router.put('/:id', [auth, [
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('gender', 'Gender is required').isIn(['male', 'female']),
    check('dailyWaterGoal', 'Daily water goal must be a positive number').isInt({ min: 0 }),
    check('role', 'Role is required').isIn(['user', 'admin'])
]], async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { firstName, lastName, middleName, gender, dailyWaterGoal, role } = req.body;

        const user = await User.findOne({
            where: { 
                id: {
                    [Op.eq]: req.params.id
                }
            }
        });

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Update user fields
        await User.update({
            firstName,
            lastName,
            middleName,
            gender,
            dailyWaterGoal,
            role
        }, {
            where: { 
                id: {
                    [Op.eq]: req.params.id
                }
            }
        });

        // Return updated user without password
        const updatedUser = await User.findOne({
            where: { 
                id: {
                    [Op.eq]: req.params.id
                }
            },
            attributes: { exclude: ['password'] }
        });

        res.json(updatedUser);
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// @route   DELETE api/users/:id
// @desc    Delete user by ID (admin only)
// @access  Private/Admin
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const user = await User.findOne({
            where: { 
                id: {
                    [Op.eq]: req.params.id
                }
            }
        });

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        await User.destroy({
            where: { 
                id: {
                    [Op.eq]: req.params.id
                }
            }
        });

        res.json({ msg: 'User deleted' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

module.exports = router;
