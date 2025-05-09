const mongoose = require('mongoose');

const InvitedUsersToProjectSchema = new mongoose.Schema(
	{
        projectId: {
            type: String,
            required: true
        },
		userEmail: {
			type: String,
            required: true,
			trim: true,
			lowercase: true,
		},
        expirationDate: {
            type: String,
            required: false
        },
        accepted: {
            type: Boolean,
            required: true,
            default: false
        }
	},
	{timestamps: true},
);

InvitedUsersToProjectSchema.index({createdAt: 1}); 

module.exports = mongoose.model('InvitedUsersToProject', InvitedUsersToProjectSchema);
