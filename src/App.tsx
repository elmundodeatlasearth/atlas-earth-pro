import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthContainer } from './features/auth/AuthContainer';
import { useSecurity } from './context/SecurityContext';
import { DataProvider } from './context/DataContext';
import MainLayout from './components/layout/MainLayout';
import { useData } from './context/DataContext';
import './index.css';

// Lazy-loaded route components for code-splitting
const AnalyticsDashboard = lazy(() => import('./features/stats/AnalyticsDashboard'));
const AdvancedCalculator = lazy(() => import('./features/calculator/AdvancedCalculator'));
const GoalPlanner = lazy(() => import('./features/goals/GoalPlanner'));
const TimeToGoal = lazy(() => import('./features/goals/TimeToGoal'));
const ScenarioComparator = lazy(() => import('./features/comparison/ScenarioComparator'));
const ProgressTracker = lazy(() => import('./features/tracking/ProgressTracker'));
const DataManager = lazy(() => import('./features/data/DataManager'));
const Subscriptions = lazy(() => import('./features/subscriptions/Subscriptions'));

// Loading fallback for lazy routes
const RouteLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-pulse text-accent font-bold text-sm tracking-widest uppercase">
      Cargando...
    </div>
  </div>
);

// Wrapper component to provide data context to feature components
const AppContent = () => {
  const { userData, boostHours } = useData();

  return (
    <MainLayout>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<AnalyticsDashboard />} />
          <Route path="/calculator" element={<AdvancedCalculator />} />
          <Route
            path="/goals"
            element={
              <GoalPlanner
                currentParcels={userData.common + userData.rare + userData.epic + userData.legendary}
                currentBadges={userData.badges}
                boostHours={boostHours}
              />
            }
          />
          <Route path="/time-to-goal" element={<TimeToGoal />} />
          <Route path="/comparison" element={<ScenarioComparator />} />
          <Route path="/progress" element={<ProgressTracker />} />
          <Route path="/data" element={<DataManager />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/stats" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </MainLayout>
  );
};

function App() {
  const { session, loading } = useSecurity();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-white text-xl animate-pulse">Cargando Sistema...</div>
      </div>
    );
  }

  // Show auth screen if not logged in
  if (!session) {
    return <AuthContainer />;
  }

  return (
    <BrowserRouter>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </BrowserRouter>
  );
}

export default App;
