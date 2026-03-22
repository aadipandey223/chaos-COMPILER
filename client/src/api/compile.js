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
    const text = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
    
    return await compileCode(text, options);
  } catch (err) {
    if (err.response && err.response.data && err.response.data.error) {
      throw new Error(err.response.data.error);
    }
    throw new Error(err.message || 'Unknown network error');
  }
};
