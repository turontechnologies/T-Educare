import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import type { LoginRequest } from "@/types/auth";

export function useLogin() {
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);

  return useMutation({
    mutationFn: (payload: LoginRequest) => authService.login(payload),
    onSuccess: ({ user, token }) => {
      setUser(user);
      setToken(token);
      toast.success(`Welcome back, ${user.firstName}`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Login failed");
    },
  });
}
