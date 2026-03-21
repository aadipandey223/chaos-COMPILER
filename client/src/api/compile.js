import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

export const compileCode = async (code, options = {}) => {
  try {
    const response = await api.post('/compile', {
      code,
      mutate:    true,
      intensity: options.intensity || 'low',
      seed:      options.seed      || null,
    });
    return response.data;
  } catch (err) {
    if (err.response && err.response.data && err.response.data.error) {
      throw new Error(err.response.data.error);
    }
    throw new Error(err.message || 'Unknown network error');
  }
};

export const compileFile = async (file, options = {}) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mutate',    'true');
    formData.append('intensity', options.intensity || 'low');
    if (options.seed) formData.append('seed', options.seed);

    const response = await api.post('/compile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (err) {
    if (err.response && err.response.data && err.response.data.error) {
      throw new Error(err.response.data.error);
    }
    throw new Error(err.message || 'Unknown network error');
  }
};
