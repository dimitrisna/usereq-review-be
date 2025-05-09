const mongoose = require('mongoose');
const { PROJECT_INTEGRATIONS } = require('../utilities/constants');
const ProjectMockup = {
    url: { type: String, required: false },
    handle: { type: String, required: false },
    filename: { type: String },
    mimetype: { type: String },
    uploadId: { type: String },
    size: { type: Number },
    title: { type: String },
    description: { type: String },
    createdAt: { type: String, required: false },
};

const ProjectFile = {
	url: { type: String, required: false },
	handle: { type: String, required: false },
	filename: { type: String },
	mimetype: { type: String },
	uploadId: { type: String },
	size: { type: Number },
	createdAt: { type: String, required: false },
};

const IntegrationLink = { // represent links between objects between the 2 platforms 
	useReqId: { type: String, required: true, default: '' },
	integrationId: { type: String, required: true, default: '' }
}

const ProjectIntegration = {
	name: { type: String, required: true, enum: PROJECT_INTEGRATIONS },
	apiKey: { type: String, required: true, trim: true },
	projectId: { type: String, required: true, default: '' }, // from the integrated platform (e.g. cyclopt)
	links: [IntegrationLink]
};

const ProjectSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			trim: true,
			required: true,
		},
		description: {
			type: String,
			trim: true,
			required: true,
		},
		swagger: {
			type: Object,
		},
		branches: {
			type: [Object],
		},
		cicd: {
			type: String,
			default: '',
		},
		tags: {
			type: [String],
		},
		users: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		creatorId: {
			type: String,
			required: true,
			default: ''
		},
		invitedUsers: {
			type: [String],
			default: []
		},
		motto: {
			type: String,
			trim: true,
		},
		logo: ProjectFile,
		requirements: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'ProjectRequirement',
				index: true,
			},
		],
		stories: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'ProjectStory',
				index: true,
			},
		],
		activityDiagrams: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'ActivityDiagram',
				index: true,
			},
		],
		useCaseDiagrams: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'UseCaseDiagram',
				index: true,
			},
		],
		files: [ProjectFile],
		useCaseDiagram: ProjectFile,
		mockups: [ProjectMockup],
		mockups_ref: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Mockup',
				index: true,
			},
		],
		sequenceDiagrams: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'SequenceDiagram',
			},
		],
		classDiagrams: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'ClassDiagram',
			},
		],
		designPatterns: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'DesignPattern',
			},
		],
		integrations: [ProjectIntegration],
	},
	{ timestamps: true },
);

ProjectSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Project', ProjectSchema);
