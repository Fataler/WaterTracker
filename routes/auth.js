const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('gender', 'Gender is required').isIn(['male', 'female'])
], async (req, res) => {
    try {
        console.log('=== Registration Request ===');
        console.log('Headers:', req.headers);
        console.log('Body:', {
            ...req.body,
            password: req.body.password ? '[HIDDEN]' : undefined
        });

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('=== Validation Errors ===');
            console.log('Errors:', JSON.stringify(errors.array(), null, 2));
            console.log('Received fields:', Object.keys(req.body));
            console.log('Required fields:', ['username', 'email', 'password', 'firstName', 'lastName', 'gender']);
            console.log('Missing fields:', ['username', 'email', 'password', 'firstName', 'lastName', 'gender'].filter(
                field => !req.body[field]
            ));
            
            return res.status(400).json({ 
                msg: 'Validation failed',
                errors: errors.array(),
                receivedFields: Object.keys(req.body),
                requiredFields: ['username', 'email', 'password', 'firstName', 'lastName', 'gender'],
                missingFields: ['username', 'email', 'password', 'firstName', 'lastName', 'gender'].filter(
                    field => !req.body[field]
                )
            });
        }

        const { username, email, password, firstName, lastName, middleName, gender, dailyWaterGoal } = req.body;

        console.log('=== Checking Existing User ===');
        const existingUser = await User.findOne({ 
            where: { username }
        });
        
        if (existingUser) {
            console.log('Username already exists:', username);
            return res.status(400).json({ msg: 'User already exists' });
        }

        console.log('=== Checking Existing Email ===');
        const existingEmail = await User.findOne({
            where: { email }
        });

        if (existingEmail) {
            console.log('Email already registered:', email);
            return res.status(400).json({ msg: 'Email already registered' });
        }

        console.log('=== Creating New User ===');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userData = {
            username,
            email,
            password: hashedPassword,
            firstName,
            lastName,
            gender,
            dailyWaterGoal: dailyWaterGoal || 2000,
            role: 'user'
        };

        if (middleName && middleName.trim()) {
            userData.middleName = middleName;
        }

        console.log('User data:', {
            ...userData,
            password: '[HIDDEN]'
        });

        const user = await User.create(userData);
        console.log('User created successfully:', user.id);

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' },
            (err, token) => {
                if (err) {
                    console.error('JWT signing error:', err);
                    throw err;
                }
                console.log('JWT token generated for user:', user.id);
                res.json({ token });
            }
        );
    } catch (err) {
        console.error('=== Registration Error ===');
        console.error('Error type:', err.name);
        console.error('Error message:', err.message);
        console.error('Stack trace:', err.stack);
        
        if (err.errors) {
            console.error('Validation errors:', err.errors);
        }

        res.status(500).json({ 
            msg: 'Server error',
            error: process.env.NODE_ENV === 'development' ? {
                message: err.message,
                type: err.name,
                fields: err.errors // Для ошибок валидации Sequelize
            } : undefined
        });
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
    check('username', 'Username is required').exists(),
    check('password', 'Password is required').exists()
], async (req, res) => {
    try {
        console.log('Login attempt:', {
            ...req.body,
            password: req.body.password ? '[HIDDEN]' : undefined
        });
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Login validation errors:', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;

        console.log('Looking for user:', username);
        const user = await User.findOne({ 
            where: { username },
            raw: true
        });

        console.log('User found:', user ? 'Yes' : 'No');

        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        console.log('Comparing passwords');
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        console.log('Creating token with payload:', {
            ...payload,
            user: {
                ...payload.user,
                password: undefined
            }
        });

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' },
            (err, token) => {
                if (err) {
                    console.error('JWT Sign error:', err);
                    throw err;
                }
                console.log('Token created successfully');
                res.json({ token });
            }
        );
    } catch (err) {
        console.error('Login error:', err);
        console.error('Stack trace:', err.stack);
        res.status(500).json({ 
            msg: 'Server error',
            error: process.env.NODE_ENV === 'development' ? {
                message: err.message,
                type: err.name
            } : undefined
        });
    }
});

module.exports = router;
