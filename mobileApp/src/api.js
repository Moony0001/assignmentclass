import axios from 'axios';

// Use 10.0.2.2 if using Android Emulator
const BASE_URL = 'http://10.0.2.2:3001'; 

// REPLACE THIS WITH YOUR ACTUAL API KEY FROM SUPABASE (table: organizations)
const API_KEY = 'YOUR_API_KEY_HERE'; 

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
  },
});

export default api;