const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const ClassDiagramSchema = new mongoose.Schema(
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
        requirementsLinked: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ProjectRequirement',
                index: true,
            },
        ],
    },
    { timestamps: true },
);

// Add auto-incremented sequence number per project
ClassDiagramSchema.plugin(AutoIncrement, {
    id: 'class_diagram_seq_id',
    inc_field: 'seq',
    reference_fields: ['project'],
});

module.exports = mongoose.model('ClassDiagram', ClassDiagramSchema);