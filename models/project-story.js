const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const {PROJECT_STORY_RATING} = require('../utilities/constants');

const ProjectStorySchema = new mongoose.Schema(
	{
		title: {
			type: String,
			trim: true,
			required: true,
		},
		text: {
			// this is actually Gherkin code
			type: String,
			required: true,
		},
		rating: [
			{
				type: String,
				enum: PROJECT_STORY_RATING,
			},
		],
		comment: {
			type: String,
		},
		project: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Project',
		},
		seq: {
			type: Number,
		},
		requirementsLinked: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'ProjectRequirement',
				index: true,
			},
		],
	},
	{timestamps: true},
);

ProjectStorySchema.plugin(AutoIncrement, {
	id: 'project_story_seq_id',
	inc_field: 'seq',
	reference_fields: ['project'],
});

module.exports = mongoose.model('ProjectStory', ProjectStorySchema);
