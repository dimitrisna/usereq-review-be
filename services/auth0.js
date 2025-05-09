// services/auth0.js
const fetch = require('node-fetch');

/**
 * Creates an Auth0 API client
 * @param {string} token - Optional access token for authenticated requests
 * @returns {Function} - Auth0 API client function
 */
const auth0Client = (token) => {
  const { AUTH0_URL } = process.env;
  
  const headers = {
    'User-Agent': 'Review App Backend',
    'Authorization': token ? `Bearer ${token}` : undefined
  };
  
  const fetchInstance = async (url, options = {}) => {
    const response = await fetch(`${AUTH0_URL}/${url}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });
    return response;
  };
  
  return fetchInstance;
};

module.exports = auth0Client;