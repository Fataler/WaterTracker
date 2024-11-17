const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const WaterIntake = require('../models/WaterIntake');
const { Op } = require('sequelize');

// @route   POST api/water
// @desc    Add water intake record
// @access  Private
router.post('/', [auth,
    check('amount', 'Amount is required and must be positive').isInt({ min: 1 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { amount } = req.body;
        const now = new Date();

        // Создаем запись с правильным форматированием даты и времени
        const record = await WaterIntake.create({
            UserId: req.user.id,
            amount: parseInt(amount, 10),
            date: now,
            time: now.toTimeString().slice(0, 8)
        });

        res.json(record);
    } catch (err) {
        console.error('Error adding water intake:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// @route   GET api/water
// @desc    Get all water intake records for current user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const records = await WaterIntake.findAll({
            where: { 
                UserId: req.user.id
            },
            order: [['date', 'DESC'], ['time', 'DESC']]
        });

        res.json(records);
    } catch (err) {
        console.error('Error fetching water intake records:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// @route   GET api/water/date/:date
// @desc    Get water intake records for specific date
// @access  Private
router.get('/date/:date', auth, async (req, res) => {
    try {
        console.log('Requested date:', req.params.date);
        
        // Проверяем формат даты
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(req.params.date)) {
            return res.status(400).json({ msg: 'Invalid date format. Use YYYY-MM-DD' });
        }

        const records = await WaterIntake.findAll({
            where: {
                UserId: req.user.id,
                date: req.params.date
            },
            order: [['time', 'ASC']],
            raw: true
        });

        console.log('Found records:', records);
        res.json(records);
    } catch (err) {
        console.error('Error fetching water intake records for date:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// @route   GET api/water/stats
// @desc    Get water intake statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
    try {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        // Get daily totals for the last 30 days
        const dailyTotals = await WaterIntake.findAll({
            where: {
                UserId: req.user.id,
                date: {
                    [Op.between]: [thirtyDaysAgo, today]
                }
            },
            attributes: [
                'date',
                [sequelize.fn('SUM', sequelize.col('amount')), 'total']
            ],
            group: ['date'],
            order: [['date', 'DESC']]
        });

        // Calculate monthly total and daily average
        const monthlyTotal = dailyTotals.reduce((sum, day) => sum + parseInt(day.getDataValue('total'), 10), 0);
        const dailyAverage = monthlyTotal / (dailyTotals.length || 1);

        // Find the best day
        const bestDay = dailyTotals.reduce((best, current) => {
            const currentTotal = parseInt(current.getDataValue('total'), 10);
            return currentTotal > best.total ? {
                date: current.date,
                total: currentTotal
            } : best;
        }, { date: null, total: 0 });

        res.json({
            dailyTotals,
            monthlyTotal,
            dailyAverage,
            bestDay
        });
    } catch (err) {
        console.error('Error fetching water intake statistics:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// @route   POST api/water/admin
// @desc    Add water intake record for any user (Admin only)
// @access  Private/Admin
router.post('/admin', [auth, admin,
    check('amount', 'Amount is required and must be positive').isInt({ min: 1 }),
    check('userId', 'User ID is required').notEmpty(),
    check('date', 'Date is required (YYYY-MM-DD)').matches(/^\d{4}-\d{2}-\d{2}$/),
    check('time', 'Time is required (HH:mm:ss)').matches(/^\d{2}:\d{2}:\d{2}$/)
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { amount, userId, date, time } = req.body;

        // Проверяем существование пользователя
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Создаем запись
        const record = await WaterIntake.create({
            UserId: userId,
            amount: parseInt(amount, 10),
            date,
            time
        });

        res.json(record);
    } catch (err) {
        console.error('Error adding water intake (admin):', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// @route   GET api/water/admin/users
// @desc    Get list of all users (Admin only)
// @access  Private/Admin
router.get('/admin/users', [auth, admin], async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'username', 'firstName', 'lastName', 'middleName'],
            order: [['firstName', 'ASC'], ['lastName', 'ASC']]
        });
        res.json(users);
    } catch (err) {
        console.error('Error fetching users list:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// @route   GET api/water/admin/:userId/date/:date
// @desc    Get water intake records for specific user and date (Admin only)
// @access  Private/Admin
router.get('/admin/:userId/date/:date', [auth, admin], async (req, res) => {
    try {
        const { userId, date } = req.params;

        // Проверяем формат даты
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({ msg: 'Invalid date format. Use YYYY-MM-DD' });
        }

        // Проверяем существование пользователя
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const records = await WaterIntake.findAll({
            where: {
                UserId: userId,
                date
            },
            order: [['time', 'ASC']],
            raw: true
        });

        res.json(records);
    } catch (err) {
        console.error('Error fetching water intake records for user:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// @route   GET /api/water/date/:date
// @desc    Get water intake for specific date
// @access  Private
router.get('/date/:date', auth, async (req, res) => {
  try {
    const waterIntake = await WaterIntake.findAll({
      where: {
        userId: req.user.id,
        date: req.params.date
      },
      order: [['time', 'ASC']]
    });
    res.json(waterIntake);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/water/range/:startDate/:endDate
// @desc    Get water intake for date range
// @access  Private
router.get('/range/:startDate/:endDate', auth, async (req, res) => {
  try {
    const waterIntake = await WaterIntake.findAll({
      where: {
        userId: req.user.id,
        date: {
          [Op.between]: [req.params.startDate, req.params.endDate]
        }
      },
      order: [['date', 'ASC'], ['time', 'ASC']]
    });
    res.json(waterIntake);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/water
// @desc    Add water intake
// @access  Private
router.post('/', [
  auth,
  [
    check('amount', 'Amount is required').not().isEmpty(),
    check('amount', 'Amount must be a number').isNumeric(),
    check('date', 'Date is required').not().isEmpty(),
    check('time', 'Time is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const waterIntake = await WaterIntake.create({
      userId: req.user.id,
      amount: req.body.amount,
      date: req.body.date,
      time: req.body.time
    });

    res.json(waterIntake);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/water/admin/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/admin/users', [auth, admin], async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role']
    });
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/water/admin/:userId/date/:date
// @desc    Get user's water intake for specific date (admin only)
// @access  Private/Admin
router.get('/admin/:userId/date/:date', [auth, admin], async (req, res) => {
  try {
    const waterIntake = await WaterIntake.findAll({
      where: {
        userId: req.params.userId,
        date: req.params.date
      },
      order: [['time', 'ASC']]
    });
    res.json(waterIntake);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/water/admin
// @desc    Add water intake for any user (admin only)
// @access  Private/Admin
router.post('/admin', [
  auth,
  admin,
  [
    check('userId', 'User ID is required').not().isEmpty(),
    check('amount', 'Amount is required').not().isEmpty(),
    check('amount', 'Amount must be a number').isNumeric(),
    check('date', 'Date is required').not().isEmpty(),
    check('time', 'Time is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const waterIntake = await WaterIntake.create({
      userId: req.body.userId,
      amount: req.body.amount,
      date: req.body.date,
      time: req.body.time
    });

    res.json(waterIntake);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/water/admin/:id
// @desc    Update water intake record (admin only)
// @access  Private/Admin
router.put('/admin/:id', [auth, admin], async (req, res) => {
  try {
    const waterIntake = await WaterIntake.findByPk(req.params.id);
    
    if (!waterIntake) {
      return res.status(404).json({ msg: 'Water intake record not found' });
    }

    await waterIntake.update({
      amount: req.body.amount,
      time: req.body.time
    });

    res.json(waterIntake);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/water/admin/:id
// @desc    Delete water intake record (admin only)
// @access  Private/Admin
router.delete('/admin/:id', [auth, admin], async (req, res) => {
  try {
    const waterIntake = await WaterIntake.findByPk(req.params.id);
    
    if (!waterIntake) {
      return res.status(404).json({ msg: 'Water intake record not found' });
    }

    await waterIntake.destroy();
    res.json({ msg: 'Water intake record removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
