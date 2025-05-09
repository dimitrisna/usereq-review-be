// controllers/diagrams/activity-diagram.js
const ActivityDiagram = require('../../models/activity-diagram');
const createDiagramController = require('./diagram-controller-factory');

module.exports = createDiagramController(ActivityDiagram, 'activityDiagrams');