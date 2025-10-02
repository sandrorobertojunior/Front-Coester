// api.ts

import axios, { AxiosInstance } from "axios";

export const BASE_URL = "http://localhost:9090";

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

let currentAuthToken: string | null = null; // Basic Token: "Basic <token_base64>"

// FUNÇÃO EXPORTADA
export const setAuthToken = (token: string | null) => {
  currentAuthToken = token;
};

// INTERCEPTOR (Melhora o uso da Basic Auth)
api.interceptors.request.use(
  (config) => {
    // Verifica se o token existe E se a requisição não é para a rota de login
    if (currentAuthToken && !config.url?.includes("api/auth/login")) {
      // Garante que o token Basic já está formatado.
      // Se você está enviando o token puro (sem "Basic "), ajuste o backend
      // ou adicione "Basic " aqui, mas assumimos que o `login` já retorna formatado.

      config.headers.Authorization = currentAuthToken.startsWith("Basic ")
        ? currentAuthToken
        : `Basic ${currentAuthToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
