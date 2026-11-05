import axios from "axios";
import { useStudentAuthStore } from "@/store/student-auth.store";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attaches the signed-in student's bearer token to every request.
apiClient.interceptors.request.use((config) => {
  const token = useStudentAuthStore.getState().token;
  const isAuthRequest = config.url?.includes("/student-auth/login");

  if (isAuthRequest) {
    delete config.headers.Authorization;
    return config;
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Guards against firing the redirect below more than once when several
// requests in flight all come back 401 at the same time.
let redirectingToLogin = false;

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl: string = error?.config?.url ?? "";

    if (
      status === 401 &&
      !requestUrl.includes("/student-auth/login") &&
      typeof window !== "undefined"
    ) {
      if (!redirectingToLogin) {
        redirectingToLogin = true;
        const slug = useStudentAuthStore.getState().student?.institutionSlug;
        useStudentAuthStore.getState().logout();
        // Outside React (axios interceptor), so no router instance is
        // available — a full reload is the only way to get back to login.

        window.location.href = slug ? `/${slug}/login` : "/";
      }
      return Promise.reject(
        new Error("Your session has expired. Please sign in again."),
      );
    }

    const backendMessage = error?.response?.data?.error;
    if (typeof backendMessage === "string" && backendMessage.trim()) {
      return Promise.reject(new Error(backendMessage));
    }
    if (error?.code === "ECONNABORTED" || error?.message === "Network Error") {
      return Promise.reject(
        new Error("Can't reach the server right now. Please try again."),
      );
    }
    return Promise.reject(error);
  },
);
