// swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const fs = require('fs');

// Define the Swagger options
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Review App API',
      version: '1.0.0',
      description: 'API documentation for the Software Design Artifacts Review Application',
      contact: {
        name: 'API Support',
        email: 'support@reviewapp.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000', // Make sure this matches your actual server port
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Make sure these paths point to your actual route files
  apis: [
    path.resolve(__dirname, './routes/*.js'),
    path.resolve(__dirname, './routes/diagrams/*.js'),
    path.resolve(__dirname, './models/*.js'),
    path.resolve(__dirname, './controllers/*.js'),
  ],
};

// Generate the Swagger specification
const specs = swaggerJsdoc(options);
fs.writeFileSync(
    path.resolve(__dirname, './swagger-output.json'),
    JSON.stringify(specs, null, 2)
);
module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs, {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true
    }
  }),
};