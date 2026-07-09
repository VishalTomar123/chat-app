import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

API.interceptors.request.use(

  (config) => {

    const token = localStorage.getItem("token");

    if (token) {

      config.headers.Authorization = `Bearer ${token}`;

    }

    return config;

  },

  (error) => Promise.reject(error)

);

API.interceptors.response.use(

  res=>res,
  
  err=>{
  
  if(err.response?.status===401){
  
  localStorage.clear();
  
  window.location="/";
  
  }
  
  return Promise.reject(err);
  
  }
  
);

export default API;