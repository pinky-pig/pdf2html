import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export const uploadFile = async (formData: FormData) => {
  const response = await api.post(
    '/upload/file',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

export const transFile = async (params: {
  pdf_url: string;
}): Promise<{
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}> => {
  const response = await api.post('/transform/convert', params,);
  return response.data;
};

export const getTaskStatus = async (task_id: string): Promise<
  {
    created_at: number
    error: string | null
    pdf_url: string
    result: string | null
    status: 'pending' | 'processing' | 'completed' | 'failed'
    task_id: string
    updated_at: number
  }> => {
  const response = await api.get(`/transform/task/${task_id}`);
  return response.data;
};

export default api;
