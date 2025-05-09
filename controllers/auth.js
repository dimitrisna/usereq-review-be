// controllers/auth.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const auth0Client = require('../services/auth0');

// Handle Auth0 authentication callback
exports.auth0Callback = async (req, res) => {
    const { REVIEW_APP_FRONTEND_HOST } = process.env;
    const { accessToken, origin = REVIEW_APP_FRONTEND_HOST } = req.query;

    // Initialize Auth0 client
    const auth0 = auth0Client(accessToken);

    try {
        // Get user info from Auth0
        const response = await auth0("userinfo");
        const info = await response.json();
        const { sub, email, picture, name, username, nickname } = info;

        // Find existing user
        const existingUser = await User.findOne({ $or: [{ id: sub }, { email }] });

        if (existingUser) {
            // Update existing user info
            if (sub) existingUser.id = sub;
            existingUser.token = accessToken;
            existingUser.avatar = picture || "https://storage.googleapis.com/cyclopt-user-content/113286556.png";
            existingUser.lastActiveAt = new Date();
            await existingUser.save();

            // Create JWT token
            const jwtToken = jwt.sign(
                { user: { _id: existingUser._id, role: existingUser.role } },
                process.env.JWT_SECRET
            );

            // Redirect to frontend with token
            const url = `${origin}/auth?token=${jwtToken}`;
            return res.redirect(url);
        }

        // Create new user if not exists
        const user = new User({
            id: sub,
            email,
            username: username || name || nickname,
            fullName: name || username || nickname,
            token: accessToken,
            avatar: picture || "https://storage.googleapis.com/cyclopt-user-content/113286556.png",
            role: "User"
        });

        await user.save();

        // Create JWT token for new user
        const jwtToken = jwt.sign(
            { user: { _id: user._id, role: user.role } },
            process.env.JWT_SECRET
        );

        // Redirect to frontend with token
        const url = `${origin}/auth?token=${jwtToken}`;
        return res.redirect(url);
    } catch (error) {
        console.error('Auth0 user info error:', error);
        const fallBackUrl = `${origin}/auth?error=auth0_error`;
        return res.redirect(fallBackUrl);
    }
};

// Register a new user
exports.register = async (req, res) => {
    try {
        const { email, username, fullName, password } = req.body;

        // Check if user exists
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Generate unique ID
        const id = require('crypto').randomBytes(10).toString('hex');

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        user = new User({
            id,
            email,
            username,
            fullName,
            password: hashedPassword,
            role: 'User'
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { user: { _id: user._id, role: user.role } },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user data and token
        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                fullName: user.fullName,
                role: user.role
            },
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        // Check if body exists
        if (!req.body) {
            return res.status(400).json({ error: 'Request body is required' });
        }

        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { user: { _id: user._id, role: user.role } },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user data and token
        res.json({
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                fullName: user.fullName,
                role: user.role
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Logout user
exports.logout = async (req, res) => {
    try {
        // Clear user token
        const user = await User.findById(req.auth.user._id);
        if (user) {
            user.token = '';
            await user.save();
        }

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
    try {
        if (!req.auth || !req.auth.isAuthenticated) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const user = await User.findById(req.auth.user._id).populate({
            path: 'projects',
            select: '_id name description'
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                projects: user.projects
            }
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};