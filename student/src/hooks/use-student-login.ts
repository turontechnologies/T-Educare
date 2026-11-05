import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { studentAuthService } from "@/services/student-auth.service";
import { useStudentAuthStore } from "@/store/student-auth.store";
import type { StudentLoginRequest } from "@/types/student-auth";

export function useStudentLogin() {
  const router = useRouter();
  const setStudent = useStudentAuthStore((state) => state.setStudent);
  const setToken = useStudentAuthStore((state) => state.setToken);

  return useMutation({
    mutationFn: async (payload: StudentLoginRequest) => {
      // Clear any stale session before trying a fresh login so the app does
      // not accidentally send an expired bearer token on the login request.
      useStudentAuthStore.getState().logout();
      return studentAuthService.login(payload);
    },
    onSuccess: ({ student, token }) => {
      setStudent(student);
      setToken(token);
      toast.success(`Welcome back, ${student.firstName}`);
      const slug = student.institutionSlug;
      router.push(slug ? `/${slug}/dashboard` : "/");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Login failed");
    },
  });
}
