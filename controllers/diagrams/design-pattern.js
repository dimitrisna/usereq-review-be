// controllers/diagrams/design-pattern.js
const DesignPattern = require('../../models/design-pattern');
const createDiagramController = require('./diagram-controller-factory');

module.exports = createDiagramController(DesignPattern, 'designPatterns');