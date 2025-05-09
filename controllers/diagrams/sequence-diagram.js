// controllers/diagrams/sequence-diagram.js
const SequenceDiagram = require('../../models/sequence-diagram');
const createDiagramController = require('./diagram-controller-factory');

module.exports = createDiagramController(SequenceDiagram, 'sequenceDiagrams');