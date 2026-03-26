import { useState } from 'react';
import { View } from 'react-native';
import LoginScreen from '../LoginScreen';
import AssignScheduleScreen from '../screens/AssignScheduleScreen';
import DashboardScreen from '../screens/DashboardScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReviewRequestsScreen from '../screens/ReviewRequestsScreen';
import SignUpScreen from '../screens/SignUpScreen';
import SubmitRequestScreen from '../screens/SubmitRequestScreen';
import ViewRequestStatusScreen from '../screens/ViewRequestStatusScreen';

type Screen =
  | 'Login' | 'SignUp' | 'Dashboard' | 'SubmitRequest'
  | 'ViewRequestStatus' | 'Feedback' | 'Notifications'
  | 'ReviewRequests' | 'Profile' | 'AssignSchedule';

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [screen, setScreen] = useState<Screen>('Login');
  const [screenParams, setScreenParams] = useState<any>({});

  const navigate = (screenName: Screen, params: any = {}) => {
    setScreenParams(params);
    setScreen(screenName);
  };

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    setScreen('Dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setScreen('Login');
  };

  if (screen === 'Login') {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} onSignUp={() => navigate('SignUp')} />;
  }
  if (screen === 'SignUp') {
    return <SignUpScreen onBack={() => navigate('Login')} onSuccess={() => navigate('Login')} />;
  }
  if (screen === 'Dashboard') {
    return <DashboardScreen user={user} onLogout={handleLogout} onNavigate={navigate} />;
  }
  if (screen === 'SubmitRequest') {
    return <SubmitRequestScreen onBack={() => navigate('Dashboard')} onSuccess={() => navigate('Dashboard')} />;
  }
  if (screen === 'ViewRequestStatus') {
    return <ViewRequestStatusScreen user={user} onBack={() => navigate('Dashboard')} onNavigate={navigate} />;
  }
  if (screen === 'Feedback') {
    return <FeedbackScreen user={user} requestId={screenParams.requestId} onBack={() => navigate('Dashboard')} />;
  }
  if (screen === 'Notifications') {
    return <NotificationsScreen onBack={() => navigate('Dashboard')} />;
  }
  if (screen === 'ReviewRequests') {
    return <ReviewRequestsScreen user={user} onBack={() => navigate('Dashboard')} onNavigate={navigate} />;
  }
  if (screen === 'Profile') {
    return <ProfileScreen user={user} onBack={() => navigate('Dashboard')} onUpdateUser={(u) => setUser(u)} />;
  }
  if (screen === 'AssignSchedule') {
    return <AssignScheduleScreen user={user} requestId={screenParams.requestId} request={screenParams.request} onBack={() => navigate('ReviewRequests')} onSuccess={() => navigate('Dashboard')} />;
  }
  return <View />;
}