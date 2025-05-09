// controllers/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/user');

// GitHub OAuth integration
exports.getGithubAccessToken = async (req, res) => {
    if (!req.query.code) {
        return res.json({
            success: false,
            message: "Code not found..."
        });
    }

    const code = req.query.code;

    try {
        // Exchange code for access token
        let githubRes = await axios.post(
            `https://github.com/login/oauth/access_token?client_id=${process.env.GITHUB_CLIENT_ID}&client_secret=${process.env.GITHUB_CLIENT_SECRET}&code=${code}&scope=user:email`,
            {},
            { headers: { "Accept": "application/json" } }
        );

        if (!githubRes.data.access_token) {
            return res.json({
                success: false,
                message: "Access Token not found..."
            });
        }

        const access_token = githubRes.data.access_token;

        // Get user data from GitHub
        githubRes = await axios.get('https://api.github.com/user', {
            headers: { "Authorization": "Bearer " + access_token }
        });

        const githubUser = githubRes.data;

        // Validate GitHub user data
        if (!githubUser.id) {
            return res.json({
                success: false,
                message: "GitHub user not found..."
            });
        } else if (!githubUser.email) {
            // Try to get primary email if not provided in profile
            try {
                const emailsRes = await axios.get('https://api.github.com/user/emails', {
                    headers: { "Authorization": "Bearer " + access_token }
                });

                const primaryEmail = emailsRes.data.find(email => email.primary);
                if (primaryEmail) {
                    githubUser.email = primaryEmail.email;
                } else {
                    return res.json({
                        success: false,
                        message: "GitHub email not found, please enable access to your email to continue..."
                    });
                }
            } catch (error) {
                return res.json({
                    success: false,
                    message: "GitHub email not found, please enable access to your email to continue..."
                });
            }
        }

        // Check if user exists
        let userFound = await User.findOne({
            $or: [
                { username: githubUser.login },
                { email: githubUser.email }
            ]
        });

        if (userFound) {
            // Update existing user with GitHub data
            userFound.githubAccessToken = access_token;
            userFound.githubId = githubUser.id;
            userFound.githubAvatarURL = githubUser.avatar_url;
            await userFound.save();

            // Populate user projects
            const retUser = await User.findById(userFound._id).populate({
                path: 'projects',
                select: '_id name description'
            });

            // Create JWT token
            const token = jwt.sign(
                { user: { _id: retUser._id, role: retUser.role } },
                process.env.JWT_SECRET
            );

            return res.json({
                success: true,
                message: "Linked to existing user!",
                user: retUser,
                token
            });
        } else {
            // Create new user with GitHub data
            const newUser = await User.create({
                email: githubUser.email,
                username: githubUser.login,
                fullName: githubUser.name || githubUser.login,
                role: "User",
                githubAccessToken: access_token,
                githubId: githubUser.id,
                githubAvatarURL: githubUser.avatar_url
            });

            // Get user with populated projects
            const retUser = await User.findById(newUser._id).populate({
                path: 'projects',
                select: '_id name description'
            });

            // Create JWT token
            const token = jwt.sign(
                { user: { _id: retUser._id, role: retUser.role } },
                process.env.JWT_SECRET
            );

            return res.json({
                success: true,
                message: "Created new user!",
                user: retUser,
                token
            });
        }
    } catch (error) {
        console.error('GitHub OAuth error:', error);

        if (error.response && error.response.data && error.response.data.message === "Bad credentials") {
            return res.json({
                success: false,
                message: "Invalid GitHub credentials"
            });
        }

        return res.json({
            success: false,
            message: "Failed to login with GitHub"
        });
    }
};

// Get GitHub user data
exports.getGithubUserData = async (req, res) => {
    const { auth } = req.body;

    if (!auth) {
        return res.status(400).json({ error: 'Auth token required' });
    }

    try {
        const githubRes = await axios.get('https://api.github.com/user', {
            headers: { "Authorization": "Bearer " + auth }
        });

        res.json(githubRes.data);
    } catch (error) {
        console.error('GitHub user data error:', error);
        res.status(500).json({ error: 'Failed to fetch GitHub user data' });
    }
};

// Make user a team lead
exports.makeUserTeamLead = async (req, res) => {
    if (!req.query.teamLeadHash) {
        return res.status(400).json({ error: 'TeamLeadHash is required' });
    }

    try {
        const user = await User.findOne({ teamLeadHash: req.query.teamLeadHash });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update user role
        user.role = 'TeamLead';
        user.teamLeadRequestDate = '';
        await user.save();

        res.status(200).json({
            message: "User is now a TeamLead",
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Make user team lead error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get all users
exports.getUsers = async (req, res) => {
    try {
        // Only admin can get all users
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const users = await User.find({}, '-password -token');
        res.json({ users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id, '-password -token');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        // Only user can update their own profile, or admin can update any profile
        if (req.user._id.toString() !== req.params.id && req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update allowed fields
        const allowedUpdates = ['fullName', 'username', 'avatar'];
        allowedUpdates.forEach(update => {
            if (req.body[update] !== undefined) {
                user[update] = req.body[update];
            }
        });

        await user.save();

        // Return updated user without sensitive fields
        const updatedUser = await User.findById(req.params.id, '-password -token');
        res.json({ user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        // Only user can change their own password
        if (req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Get user's projects
exports.getUserProjects = async (req, res) => {
    try {
        // Only user can view their own projects, or admin can view any user's projects
        if (req.user._id.toString() !== req.params.id && req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const user = await User.findById(req.params.id).populate('projects');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ projects: user.projects });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};