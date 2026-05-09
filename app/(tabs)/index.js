import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import LoginScreen from '../LoginScreen';
import AssignScheduleScreen from '../screens/AssignScheduleScreen';
import DashboardScreen from '../screens/DashboardScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import FeedbacksScreen from '../screens/FeedbacksScreen';
import LoginLocationTrackingScreen from '../screens/LoginLocationTrackingScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PendingApprovalsScreen from '../screens/PendingApprovalsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReviewRequestsScreen from '../screens/ReviewRequestsScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import SubmitRequestScreen from '../screens/SubmitRequestScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import ViewRequestStatusScreen from '../screens/ViewRequestStatusScreen';
import { normalizeRoleId } from "../constants/roles";
import { getNotificationNavigationTarget } from '../../utils/notificationNavigation';

export default function HomeScreen() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState('Login');
  const [screenParams, setScreenParams] = useState({});
  const searchParams = useLocalSearchParams();
  const handledNotificationKeyRef = useRef("");

  const navigate = useCallback((screenName, params = {}) => {
    setScreenParams(params);
    setScreen(screenName);
  }, []);

  useEffect(() => {
    const requestId = Number(searchParams?.notifRequestId);
    if (!Number.isFinite(requestId)) return;

    // Always prioritize the authenticated user's role to avoid payload-role mismatches
    // (e.g. admin device receiving requester-role notification data).
    const roleId = normalizeRoleId(user?.role_id) ?? normalizeRoleId(searchParams?.notifRoleId);
    const target = getNotificationNavigationTarget({ requestId, roleId });
    if (!target) return;

    const key = `${target.screen}:${target.params.requestId}:${target.params.requestScope || "all"}`;
    if (handledNotificationKeyRef.current === key) return;
    if (!user) return;

    handledNotificationKeyRef.current = key;
    navigate(target.screen, target.params);
  }, [navigate, searchParams?.notifRequestId, searchParams?.notifRoleId, user, user?.role_id]);

  const handleLoginSuccess = (userData) => {
    setUser({ ...userData, role_id: normalizeRoleId(userData?.role_id) });
    setScreen('Dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setScreen('Login');
  };

  if (screen === 'Login') {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} onSignUp={() => navigate('SignUp')} onForgotPassword={() => navigate('ForgotPassword')} />;
  }
  if (screen === 'SignUp') {
    return <SignUpScreen onBack={() => navigate('Login')} />;
  }
  if (screen === 'ForgotPassword') {
    return <ForgotPasswordScreen onBack={() => navigate('Login')} />;
  }
  if (screen === 'Dashboard') {
    return <DashboardScreen user={user} onLogout={handleLogout} onNavigate={navigate} />;
  }
  if (screen === 'SubmitRequest') {
    return <SubmitRequestScreen user={user} onBack={() => navigate('Dashboard')} onSuccess={() => navigate('Dashboard')} />;
  }
  if (screen === 'ViewRequestStatus') {
    return <ViewRequestStatusScreen user={user} initialFilter={screenParams.filter} requestScope={screenParams.requestScope} requestId={screenParams.requestId} onBack={() => navigate('Dashboard')} onNavigate={navigate} />;
  }
  if (screen === 'Feedback') {
    return <FeedbackScreen user={user} requestId={screenParams.requestId} onBack={() => navigate('Dashboard')} />;
  }
  if (screen === 'Feedbacks') {
    return <FeedbacksScreen user={user} onBack={() => navigate('Dashboard')} />;
  }
  if (screen === 'LoginLocationTracking') {
    return <LoginLocationTrackingScreen user={user} onBack={() => navigate('Dashboard')} />;
  }
  if (screen === 'Notifications') {
    return <NotificationsScreen user={user} onBack={() => navigate('Dashboard')} onNavigate={navigate} />;
  }
  if (screen === 'ReviewRequests') {
    return <ReviewRequestsScreen user={user} onBack={() => navigate('Dashboard')} onNavigate={navigate} />;
  }
  if (screen === 'PendingApprovals') {
    return <PendingApprovalsScreen user={user} onBack={() => navigate('Dashboard')} />;
  }
  if (screen === 'UserManagement') {
    return <UserManagementScreen user={user} onBack={() => navigate('Dashboard')} />;
  }
  if (screen === 'Profile') {
    return <ProfileScreen user={user} onBack={() => navigate('Dashboard')} onUpdateUser={(u) => setUser(u)} />;
  }
  if (screen === 'AssignSchedule') {
    return <AssignScheduleScreen user={user} requestId={screenParams.requestId} request={screenParams.request} onBack={() => navigate('ReviewRequests')} onSuccess={() => navigate('Dashboard')} />;
  }
  return <View />;
}
