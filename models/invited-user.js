const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const {USER_ROLES} = require('../utilities/constants');

const InvitedUserSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			trim: true,
			unique: true,
			index: true,
			required: true,
			lowercase: true,
		},
		role: {
			type: String,
			required: true,
			enum: USER_ROLES,
		},
		invitationHash: {
			type: String,
		},
	},
	{timestamps: true},
);

InvitedUserSchema.pre('save', async function(next) {
	try {
		/* istanbul ignore else: no need to test the else as it'll do nothing */
		if (this.isModified('email')) {
			const hash = await bcrypt.hash(
				this.email + new Date().toISOString(),
				bcrypt.genSaltSync(6),
			);
			this.invitationHash = hash;
		}

		return next();
	} catch (error) {
		/* istanbul ignore next */
		return next(error);
	}
});

module.exports = mongoose.model('InvitedUser', InvitedUserSchema);
