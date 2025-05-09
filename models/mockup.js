const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const MockupSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
            required: true,
        },
        description: {
            type: String,
            trim: true,
        },
        url: {
            type: String,
            required: true,
        },
        handle: {
            type: String,
            required: true,
        },
        filename: {
            type: String,
        },
        mimetype: {
            type: String,
        },
        uploadId: {
            type: String,
        },
        size: {
            type: Number,
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
        },
        seq: {
            type: Number,
        },
        storiesLinked: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ProjectStory',
                index: true,
            },
        ],
        previousScreens: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Mockup',
                index: true,
            },
        ],
        nextScreens: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Mockup',
                index: true,
            },
        ],
    },
    { timestamps: true },
);

// Add auto-incremented sequence number per project
MockupSchema.plugin(AutoIncrement, {
    id: 'mockup_seq_id',
    inc_field: 'seq',
    reference_fields: ['project'],
});

module.exports = mongoose.model('Mockup', MockupSchema);