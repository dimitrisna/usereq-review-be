const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const {USER_ROLES} = require('../utilities/constants');

const UserSchema = new mongoose.Schema(
	{
		id: { type: String, required: true, unique: true },
		email: {
			type: String,
			unique: true,
			index: true,
			trim: true,
			required: true,
			lowercase: true,
		},
		username: {
			type: String,
			trim: true,
			lowercase: true,
			required: true,
			unique: true,
			index: true,
		},
		token: { type: String, default: "" },
		avatar: { type: String, default: "" },
		role: {
			type: String,
			required: true,
			enum: USER_ROLES,
		},
		fullName: {
			type: String,
			trim: true,
			required: true,
		},
		password: {
			type: String,
		},
		newPassword: {
			type: String,
			required: false
		},
		pin: {
			type: String,
			required: false
		},
		pinExpirationDate: {
			type: String,
			required: false
		},
		teamLeadHash: {
			type: String,
			required: false
		},
		teamLeadRequestDate: {
			type: String,
			required: false
		},
		githubAccessToken: {
			type: String,
			required: false
		},
		githubId: {
			type: String,
			required: false
		},
		githubAvatarURL: {
			type: String,
			required: false
		},
		projects: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Project',
			},
		],
	},
	{timestamps: true},
);

UserSchema.index({createdAt: 1});

UserSchema.methods.comparePassword = function(password) {
	return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
