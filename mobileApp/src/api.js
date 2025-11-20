import axios from 'axios';

// Use 10.0.2.2 if using Android Emulator
const BASE_URL = 'http://192.168.41.14:3001';

// REPLACE THIS WITH YOUR ACTUAL API KEY FROM SUPABASE (table: organizations)
const API_KEY = '56469d0c-1a8c-4323-82c2-f7897b2d3722';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
  },
});

export default api;
