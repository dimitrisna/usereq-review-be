// controllers/diagrams/use-case-diagram.js
const UseCaseDiagram = require('../../models/use-case-diagram');
const createDiagramController = require('./diagram-controller-factory');

module.exports = createDiagramController(UseCaseDiagram, 'useCaseDiagrams');