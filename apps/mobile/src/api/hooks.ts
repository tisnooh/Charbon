/**
 * Hooks TanStack Query — toute la conversation avec l'API passe par ici.
 * Conventions :
 * - mutations optimistes pour les validations (habitudes, tâches, actions de
 *   routine) : feedback instantané, rollback automatique en cas d'échec ;
 * - invalidations cohérentes : une validation impacte today/habits/stats.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  GoalDTO,
  HabitDetailDTO,
  HabitDTO,
  NotificationDTO,
  RoutineDTO,
  RoutineTodayDTO,
  SessionResponse,
  StatsRange,
  StatsSummaryDTO,
  SubscriptionDTO,
  TaskDTO,
  TodayDTO,
  UserMe,
} from '@charbon/shared';
import { apiRequest } from './client.js';

// --- Clés de cache ---
export const qk = {
  me: ['me'] as const,
  today: ['today'] as const,
  tasks: (view: string) => ['tasks', view] as const,
  habits: ['habits'] as const,
  habit: (id: string) => ['habits', id] as const,
  habitHistory: (id: string, days: number) => ['habits', id, 'history', days] as const,
  routines: ['routines'] as const,
  routinesToday: ['routines', 'today'] as const,
  goals: (status?: string) => ['goals', status ?? 'all'] as const,
  stats: (range: StatsRange) => ['stats', range] as const,
  notifications: ['notifications'] as const,
  subscription: ['subscription'] as const,
};

function invalidateCore(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: qk.today });
  void qc.invalidateQueries({ queryKey: qk.habits });
  void qc.invalidateQueries({ queryKey: ['stats'] });
  void qc.invalidateQueries({ queryKey: qk.routinesToday });
}

// --- Session / profil ---

export function useMe() {
  return useQuery({
    queryKey: qk.me,
    queryFn: () => apiRequest<SessionResponse>('/me'),
    staleTime: 60_000,
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      apiRequest<SessionResponse>('/auth/login', { method: 'POST', body: input }),
    onSuccess: (data) => {
      qc.setQueryData(qk.me, data);
      void qc.invalidateQueries();
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; email: string; password: string; timezone?: string }) =>
      apiRequest<SessionResponse>('/auth/register', { method: 'POST', body: input }),
    onSuccess: (data) => {
      qc.setQueryData(qk.me, data);
      void qc.invalidateQueries();
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
    onSettled: () => {
      qc.clear();
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) =>
      apiRequest<{ ok: boolean; message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: { email },
      }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: { token: string; password: string }) =>
      apiRequest<{ ok: boolean }>('/auth/reset-password', { method: 'POST', body: input }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; password: string }) =>
      apiRequest<{ ok: boolean }>('/auth/change-password', { method: 'POST', body: input }),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (password: string) =>
      apiRequest<{ ok: boolean }>('/auth/account', { method: 'DELETE', body: { password } }),
    onSuccess: () => qc.clear(),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Pick<UserMe, 'name' | 'timezone' | 'remindersEnabled' | 'dailyReminderTime' | 'onboardingCompleted'>>) =>
      apiRequest<SessionResponse>('/me', { method: 'PATCH', body: patch }),
    onSuccess: (data) => {
      qc.setQueryData(qk.me, data);
      invalidateCore(qc);
    },
  });
}

// --- Onboarding ---

export function useOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      goals: Array<{ title: string }>;
      habits: Array<{ name: string; color?: string; schedule?: { type: 'daily' | 'days_of_week'; days: number[] } }>;
      routines: Array<{ name: string; timeOfDay?: string; items: Array<{ title: string }> }>;
    }) => apiRequest<{ ok: boolean; me: SessionResponse }>('/onboarding', { method: 'POST', body: input }),
    onSuccess: (data) => {
      qc.setQueryData(qk.me, data.me);
      void qc.invalidateQueries();
    },
  });
}

// --- Dashboard ---

export function useToday() {
  return useQuery({
    queryKey: qk.today,
    queryFn: () => apiRequest<TodayDTO>('/today'),
    staleTime: 15_000,
  });
}

// --- Tâches ---

export type TaskView = 'today' | 'upcoming' | 'all' | 'done' | 'deleted';

export function useTasks(view: TaskView) {
  return useQuery({
    queryKey: qk.tasks(view),
    queryFn: () => apiRequest<{ items: TaskDTO[] }>('/tasks', { query: { view } }),
  });
}

export function useTaskMutations() {
  const qc = useQueryClient();
  const refreshTasks = () => {
    void qc.invalidateQueries({ queryKey: ['tasks'] });
    void qc.invalidateQueries({ queryKey: qk.today });
    void qc.invalidateQueries({ queryKey: ['stats'] });
  };
  return {
    create: useMutation({
      mutationFn: (input: { title: string; notes?: string | null; dueAt?: string | null; goalId?: string | null }) =>
        apiRequest<TaskDTO>('/tasks', { method: 'POST', body: input }),
      onSuccess: refreshTasks,
    }),
    update: useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: { title?: string; notes?: string | null; dueAt?: string | null; goalId?: string | null } }) =>
        apiRequest<TaskDTO>(`/tasks/${id}`, { method: 'PATCH', body: patch }),
      onSuccess: refreshTasks,
    }),
    complete: useMutation({
      mutationFn: (id: string) => apiRequest<TaskDTO>(`/tasks/${id}/complete`, { method: 'POST' }),
      onSuccess: refreshTasks,
    }),
    uncomplete: useMutation({
      mutationFn: (id: string) => apiRequest<TaskDTO>(`/tasks/${id}/uncomplete`, { method: 'POST' }),
      onSuccess: refreshTasks,
    }),
    remove: useMutation({
      mutationFn: (id: string) => apiRequest<TaskDTO>(`/tasks/${id}`, { method: 'DELETE' }),
      onSuccess: refreshTasks,
    }),
    restore: useMutation({
      mutationFn: (id: string) => apiRequest<TaskDTO>(`/tasks/${id}/restore`, { method: 'POST' }),
      onSuccess: refreshTasks,
    }),
  };
}

// --- Habitudes ---

export function useHabits() {
  return useQuery({
    queryKey: qk.habits,
    queryFn: () => apiRequest<{ items: HabitDTO[] }>('/habits'),
    staleTime: 15_000,
  });
}

export function useHabit(id: string) {
  return useQuery({
    queryKey: qk.habit(id),
    queryFn: () => apiRequest<HabitDTO>(`/habits/${id}`),
    enabled: id.length > 0,
  });
}

export function useHabitHistory(id: string, days: number) {
  return useQuery({
    queryKey: qk.habitHistory(id, days),
    queryFn: () => apiRequest<HabitDetailDTO>(`/habits/${id}/history`, { query: { days } }),
    enabled: id.length > 0,
  });
}

export function useHabitMutations() {
  const qc = useQueryClient();
  const after = () => invalidateCore(qc);
  return {
    create: useMutation({
      mutationFn: (input: { name: string; color?: string; schedule?: { type: 'daily' | 'days_of_week'; days: number[] }; goalId?: string | null; startDate?: string }) =>
        apiRequest<HabitDTO>('/habits', { method: 'POST', body: input }),
      onSuccess: after,
    }),
    update: useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: { name?: string; color?: string; schedule?: { type: 'daily' | 'days_of_week'; days: number[] }; goalId?: string | null } }) =>
        apiRequest<HabitDTO>(`/habits/${id}`, { method: 'PATCH', body: patch }),
      onSuccess: after,
    }),
    pause: useMutation({
      mutationFn: (id: string) => apiRequest<HabitDTO>(`/habits/${id}/pause`, { method: 'POST' }),
      onSuccess: after,
    }),
    resume: useMutation({
      mutationFn: (id: string) => apiRequest<HabitDTO>(`/habits/${id}/resume`, { method: 'POST' }),
      onSuccess: after,
    }),
    remove: useMutation({
      mutationFn: (id: string) => apiRequest<{ ok: boolean }>(`/habits/${id}`, { method: 'DELETE' }),
      onSuccess: after,
    }),
    complete: useMutation({
      mutationFn: ({ id, date }: { id: string; date?: string }) =>
        apiRequest<{ done: boolean; date: string; streak: { current: number; longest: number; atRiskToday: boolean } }>(
          `/habits/${id}/completions`,
          { method: 'POST', body: { date } },
        ),
      onSuccess: after,
    }),
    uncomplete: useMutation({
      mutationFn: ({ id, date }: { id: string; date: string }) =>
        apiRequest<{ done: boolean }>(`/habits/${id}/completions/${date}`, { method: 'DELETE' }),
      onSuccess: after,
    }),
  };
}

// --- Routines ---

export function useRoutines() {
  return useQuery({
    queryKey: qk.routines,
    queryFn: () => apiRequest<{ items: RoutineDTO[] }>('/routines'),
  });
}

export function useRoutinesToday() {
  return useQuery({
    queryKey: qk.routinesToday,
    queryFn: () => apiRequest<{ items: RoutineTodayDTO[] }>('/routines/today'),
    staleTime: 15_000,
  });
}

export function useRoutineMutations() {
  const qc = useQueryClient();
  const after = () => {
    void qc.invalidateQueries({ queryKey: ['routines'] });
    void qc.invalidateQueries({ queryKey: qk.today });
    void qc.invalidateQueries({ queryKey: ['stats'] });
  };
  return {
    create: useMutation({
      mutationFn: (input: { name: string; timeOfDay?: string; scheduledTime?: string | null; schedule?: { type: 'daily' | 'days_of_week'; days: number[] }; items?: Array<{ title: string; durationMinutes?: number | null }> }) =>
        apiRequest<RoutineDTO>('/routines', { method: 'POST', body: input }),
      onSuccess: after,
    }),
    update: useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: { name?: string; timeOfDay?: string; scheduledTime?: string | null; schedule?: { type: 'daily' | 'days_of_week'; days: number[] } } }) =>
        apiRequest<RoutineDTO>(`/routines/${id}`, { method: 'PATCH', body: patch }),
      onSuccess: after,
    }),
    remove: useMutation({
      mutationFn: (id: string) => apiRequest<{ ok: boolean }>(`/routines/${id}`, { method: 'DELETE' }),
      onSuccess: after,
    }),
    addItem: useMutation({
      mutationFn: ({ id, item }: { id: string; item: { title: string; durationMinutes?: number | null } }) =>
        apiRequest<RoutineDTO>(`/routines/${id}/items`, { method: 'POST', body: item }),
      onSuccess: after,
    }),
    updateItem: useMutation({
      mutationFn: ({ id, itemId, patch }: { id: string; itemId: string; patch: { title?: string; durationMinutes?: number | null; sortOrder?: number } }) =>
        apiRequest<RoutineDTO>(`/routines/${id}/items/${itemId}`, { method: 'PATCH', body: patch }),
      onSuccess: after,
    }),
    deleteItem: useMutation({
      mutationFn: ({ id, itemId }: { id: string; itemId: string }) =>
        apiRequest<RoutineDTO>(`/routines/${id}/items/${itemId}`, { method: 'DELETE' }),
      onSuccess: after,
    }),
    reorderItems: useMutation({
      mutationFn: ({ id, itemIds }: { id: string; itemIds: string[] }) =>
        apiRequest<RoutineDTO>(`/routines/${id}/items/order`, { method: 'PUT', body: { itemIds } }),
      onSuccess: after,
    }),
    completeItem: useMutation({
      mutationFn: ({ id, itemId, date }: { id: string; itemId: string; date?: string }) =>
        apiRequest<RoutineTodayDTO>(`/routines/${id}/items/${itemId}/completions`, {
          method: 'POST',
          body: { date },
        }),
      onSuccess: after,
    }),
    uncompleteItem: useMutation({
      mutationFn: ({ id, itemId, date }: { id: string; itemId: string; date: string }) =>
        apiRequest<RoutineTodayDTO>(`/routines/${id}/items/${itemId}/completions/${date}`, {
          method: 'DELETE',
        }),
      onSuccess: after,
    }),
  };
}

// --- Objectifs ---

export function useGoals(status?: 'active' | 'completed' | 'archived') {
  return useQuery({
    queryKey: qk.goals(status),
    queryFn: () => apiRequest<{ items: GoalDTO[] }>('/goals', { query: { status } }),
  });
}

export function useGoalMutations() {
  const qc = useQueryClient();
  const after = () => {
    void qc.invalidateQueries({ queryKey: ['goals'] });
    void qc.invalidateQueries({ queryKey: qk.today });
  };
  return {
    create: useMutation({
      mutationFn: (input: { title: string; description?: string | null; targetDate?: string | null }) =>
        apiRequest<GoalDTO>('/goals', { method: 'POST', body: input }),
      onSuccess: after,
    }),
    update: useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: { title?: string; description?: string | null; targetDate?: string | null } }) =>
        apiRequest<GoalDTO>(`/goals/${id}`, { method: 'PATCH', body: patch }),
      onSuccess: after,
    }),
    setStatus: useMutation({
      mutationFn: ({ id, status }: { id: string; status: 'active' | 'completed' | 'archived' }) =>
        apiRequest<GoalDTO>(`/goals/${id}/status`, { method: 'PATCH', body: { status } }),
      onSuccess: after,
    }),
    remove: useMutation({
      mutationFn: (id: string) => apiRequest<{ ok: boolean }>(`/goals/${id}`, { method: 'DELETE' }),
      onSuccess: after,
    }),
  };
}

// --- Stats ---

export function useStats(range: StatsRange) {
  return useQuery({
    queryKey: qk.stats(range),
    queryFn: () => apiRequest<StatsSummaryDTO>('/stats/summary', { query: { range } }),
    retry: (failureCount, error) => {
      // 403 premium_required : pas de retry (l'UI affiche l'upsell).
      if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'premium_required') return false;
      return failureCount < 2;
    },
  });
}

// --- Notifications ---

export function useNotifications() {
  return useQuery({
    queryKey: qk.notifications,
    queryFn: () => apiRequest<{ items: NotificationDTO[]; total: number; unread: number }>('/notifications'),
  });
}

export function useNotificationMutations() {
  const qc = useQueryClient();
  return {
    markRead: useMutation({
      mutationFn: (id: string) => apiRequest<NotificationDTO>(`/notifications/${id}/read`, { method: 'POST' }),
      onSuccess: () => void qc.invalidateQueries({ queryKey: qk.notifications }),
    }),
    markAllRead: useMutation({
      mutationFn: () => apiRequest<{ unread: number }>('/notifications/read-all', { method: 'POST' }),
      onSuccess: () => void qc.invalidateQueries({ queryKey: qk.notifications }),
    }),
  };
}

// --- Abonnement ---

export function useSubscription() {
  return useQuery({
    queryKey: qk.subscription,
    queryFn: () => apiRequest<SubscriptionDTO>('/subscription'),
  });
}

export function useSubscriptionMutations() {
  const qc = useQueryClient();
  const after = () => {
    void qc.invalidateQueries({ queryKey: qk.subscription });
    void qc.invalidateQueries({ queryKey: qk.me });
    void qc.invalidateQueries({ queryKey: ['stats'] });
    void qc.invalidateQueries({ queryKey: ['habits'] });
  };
  return {
    upgrade: useMutation({
      mutationFn: () => apiRequest<SubscriptionDTO>('/subscription/upgrade', { method: 'POST' }),
      onSuccess: after,
    }),
    cancel: useMutation({
      mutationFn: () => apiRequest<SubscriptionDTO>('/subscription/cancel', { method: 'POST' }),
      onSuccess: after,
    }),
  };
}
