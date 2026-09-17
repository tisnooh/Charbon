/**
 * Routeur de l'application Charbon.
 * - routes publiques (auth) : redirigent vers / si déjà connecté ;
 * - routes protégées : exigent une session ; onboarding forcé tant que
 *   `onboardingCompleted` est faux ;
 * - onglets principaux : barre d'onglets iOS ; écrans de détail : plein écran.
 */
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useSessionState } from './state/session.js';
import { TabBar } from './components/TabBar.js';
import { SplashScreen } from './screens/SplashScreen.js';
import { LoginScreen } from './screens/auth/LoginScreen.js';
import { RegisterScreen } from './screens/auth/RegisterScreen.js';
import { ForgotPasswordScreen } from './screens/auth/ForgotPasswordScreen.js';
import { ResetPasswordScreen } from './screens/auth/ResetPasswordScreen.js';
import { OnboardingScreen } from './screens/OnboardingScreen.js';
import { TodayScreen } from './screens/TodayScreen.js';
import { TasksScreen } from './screens/TasksScreen.js';
import { HabitsScreen } from './screens/HabitsScreen.js';
import { HabitDetailScreen } from './screens/HabitDetailScreen.js';
import { RoutinesScreen } from './screens/RoutinesScreen.js';
import { RoutineRunScreen } from './screens/RoutineRunScreen.js';
import { GoalsScreen } from './screens/GoalsScreen.js';
import { StatsScreen } from './screens/StatsScreen.js';
import { NotificationsScreen } from './screens/NotificationsScreen.js';
import { ProfileScreen } from './screens/ProfileScreen.js';
import { SubscriptionScreen } from './screens/SubscriptionScreen.js';
import { SecurityScreen } from './screens/SecurityScreen.js';
import { NotFoundScreen } from './screens/NotFoundScreen.js';

function PublicOnly() {
  const { status } = useSessionState();
  if (status === 'loading') return <SplashScreen />;
  if (status === 'authed') return <Navigate to="/" replace />;
  return <Outlet />;
}

function RequireAuth() {
  const { status, session } = useSessionState();
  const location = useLocation();
  if (status === 'loading') return <SplashScreen />;
  if (status === 'anon') return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (session && !session.user.onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  return <Outlet />;
}

function TabLayout() {
  return (
    <>
      <Outlet />
      <TabBar />
    </>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
        <Route path="/reset-password" element={<ResetPasswordScreen />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/onboarding" element={<OnboardingScreen />} />
        <Route element={<TabLayout />}>
          <Route path="/" element={<TodayScreen />} />
          <Route path="/tasks" element={<TasksScreen />} />
          <Route path="/habits" element={<HabitsScreen />} />
          <Route path="/routines" element={<RoutinesScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
        </Route>
        <Route path="/habits/:id" element={<HabitDetailScreen />} />
        <Route path="/routines/:id" element={<RoutineRunScreen />} />
        <Route path="/goals" element={<GoalsScreen />} />
        <Route path="/stats" element={<StatsScreen />} />
        <Route path="/notifications" element={<NotificationsScreen />} />
        <Route path="/profile/subscription" element={<SubscriptionScreen />} />
        <Route path="/profile/security" element={<SecurityScreen />} />
      </Route>

      <Route path="*" element={<NotFoundScreen />} />
    </Routes>
  );
}
