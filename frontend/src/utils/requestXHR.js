// src/utils/requestXHR.js
const BASE_URL = 'http://127.0.0.1:3000/api';

function requestXHR(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fullUrl = url.startsWith('http') ? url : BASE_URL + url;
    xhr.open(method, fullUrl);
    xhr.withCredentials = true;

    // Set default headers
    xhr.setRequestHeader('Content-Type', 'application/json');

    // Set additional headers
    for (let key in headers) {
      xhr.setRequestHeader(key, headers[key]);
    }

    // Add auth header if token exists
    const token = localStorage.getItem('token');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.onload = () => {
      let responseBody;
      try {
        responseBody = JSON.parse(xhr.responseText);
      } catch (e) {
        responseBody = xhr.responseText;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ data: responseBody, status: xhr.status });
      } else {
        const error = new Error(`HTTP ${xhr.status}: ${xhr.statusText}`);
        error.response = { data: responseBody, status: xhr.status };
        reject(error);
      }
    };

    xhr.onerror = () => reject(new Error('Network Error'));

    if (data) {
      xhr.send(JSON.stringify(data));
    } else {
      xhr.send();
    }
  });
}

export default requestXHR;