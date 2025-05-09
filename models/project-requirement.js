const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const {
	PROJECT_REQUIREMENT_RATING,
	PROJECT_REQUIREMENT_TYPE,
	PROJECT_REQUIREMENT_PRIORITY,
} = require('../utilities/constants');

const ProjectRequirementSchema = new mongoose.Schema(
	{
		text: {
			type: String,
			trim: true,
			required: true,
		},
		description: {
			type: String,
			trim: true,
		},
		type: {
			type: String,
			enum: PROJECT_REQUIREMENT_TYPE,
		},
		rating: {
			type: String,
			enum: PROJECT_REQUIREMENT_RATING,
		},
		comment: {
			type: String,
		},
		user_priority: {
			type: String,
			enum: PROJECT_REQUIREMENT_PRIORITY,
		},
		system_priority: {
			type: String,
			enum: PROJECT_REQUIREMENT_PRIORITY,
		},
		project: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Project',
		},
		seq: {
			type: Number,
		},
	},
	{ timestamps: true },
);

ProjectRequirementSchema.plugin(AutoIncrement, {
	id: 'project_requirement_seq_id',
	inc_field: 'seq',
	reference_fields: ['project'],
});

module.exports = mongoose.model('ProjectRequirement', ProjectRequirementSchema);
