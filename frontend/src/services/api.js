import requestXHR from '../utils/requestXHR';

const api = {
  get: (url, headers = {}) => requestXHR(url, 'GET', null, headers),
  post: (url, data, headers = {}) => requestXHR(url, 'POST', data, headers),
  put: (url, data, headers = {}) => requestXHR(url, 'PUT', data, headers),
  delete: (url, headers = {}) => requestXHR(url, 'DELETE', null, headers),
  patch: (url, data, headers = {}) => requestXHR(url, 'PATCH', data, headers),
};

export default api;
