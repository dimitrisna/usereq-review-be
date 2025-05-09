// controllers/diagrams/class-diagram.js
const ClassDiagram = require('../../models/class-diagram');
const createDiagramController = require('./diagram-controller-factory');

module.exports = createDiagramController(ClassDiagram, 'classDiagrams');