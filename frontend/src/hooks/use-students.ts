import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  studentService,
  type AddAcademicRecordPayload,
  type RecordDisciplinaryActionPayload,
  type ReportCasePayload,
  type ResolveCasePayload,
  type StudentFormPayload,
  type StudentsListParams,
  type UpdateStudentPayload,
} from "@/services/student.service";

const STUDENTS_KEY = "students";

export function useStudents(
  params: StudentsListParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [STUDENTS_KEY, params],
    queryFn: () => studentService.list(params),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}

function useInvalidateStudents() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [STUDENTS_KEY] });
}

export function useCreateStudent() {
  const invalidate = useInvalidateStudents();
  return useMutation({
    mutationFn: (payload: StudentFormPayload) => studentService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateStudent() {
  const invalidate = useInvalidateStudents();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateStudentPayload;
    }) => studentService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useArchiveStudent() {
  const invalidate = useInvalidateStudents();
  return useMutation({
    mutationFn: (id: string) => studentService.archive(id),
    onSuccess: invalidate,
  });
}

export function useRestoreStudent() {
  const invalidate = useInvalidateStudents();
  return useMutation({
    mutationFn: (id: string) => studentService.restore(id),
    onSuccess: invalidate,
  });
}

export function useStudentAcademicHistory(
  studentId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["student-academic-history", studentId],
    queryFn: () => studentService.listAcademicHistory(studentId!),
    enabled: (options.enabled ?? true) && !!studentId,
  });
}

export function useAddAcademicRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      studentId,
      payload,
    }: {
      studentId: string;
      payload: AddAcademicRecordPayload;
    }) => studentService.addAcademicRecord(studentId, payload),
    onSuccess: (_data, { studentId }) => {
      queryClient.invalidateQueries({ queryKey: [STUDENTS_KEY] });
      queryClient.invalidateQueries({
        queryKey: ["student-academic-history", studentId],
      });
    },
  });
}

export function useStudentDisciplinaryRecords(
  studentId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["student-disciplinary-records", studentId],
    queryFn: () => studentService.listDisciplinaryRecords(studentId!),
    enabled: (options.enabled ?? true) && !!studentId,
  });
}

export function useRecordDisciplinaryAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      studentId,
      payload,
    }: {
      studentId: string;
      payload: RecordDisciplinaryActionPayload;
    }) => studentService.recordDisciplinaryAction(studentId, payload),
    onSuccess: (_data, { studentId }) => {
      queryClient.invalidateQueries({ queryKey: [STUDENTS_KEY] });
      queryClient.invalidateQueries({
        queryKey: ["student-disciplinary-records", studentId],
      });
    },
  });
}

export function useStudentCases(
  studentId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["student-cases", studentId],
    queryFn: () => studentService.listCases(studentId!),
    enabled: (options.enabled ?? true) && !!studentId,
  });
}

export function useReportCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      studentId,
      payload,
    }: {
      studentId: string;
      payload: ReportCasePayload;
    }) => studentService.reportCase(studentId, payload),
    onSuccess: (_data, { studentId }) =>
      queryClient.invalidateQueries({ queryKey: ["student-cases", studentId] }),
  });
}

export function useResolveCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      studentId,
      caseId,
      payload,
    }: {
      studentId: string;
      caseId: string;
      payload: ResolveCasePayload;
    }) => studentService.resolveCase(studentId, caseId, payload),
    onSuccess: (_data, { studentId }) =>
      queryClient.invalidateQueries({ queryKey: ["student-cases", studentId] }),
  });
}
