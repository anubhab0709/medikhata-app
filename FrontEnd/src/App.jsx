import { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react';
import { LangCtx } from './context/lang.jsx';
import AddCustModal from './components/AddCustModal.jsx';
import BottomNav from './components/BottomNav.jsx';
import TopBar from './components/TopBar.jsx';
import MobileHeader from './components/MobileHeader.jsx';
import SplashScreen from './components/SplashScreen.jsx';
import Ico from './utils/icons.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import {
  authApi,
  customerApi,
  reminderApi,
  transactionApi,
  getAuthToken,
  isAuthTokenValid,
  clearAuthToken,
  setAuthToken,
} from './utils/api.js';
import { REMINDERS_FEATURE_ENABLED } from './config/features.js';

// Eager dashboard (primary LCP route). Other pages stay lazy.
const CustomerListPage = lazy(() => import('./pages/CustomerListPage.jsx'));
const LedgerPage = lazy(() => import('./pages/LedgerPage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const AuthPage = lazy(() => import('./pages/AuthPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

const RemindersPage = REMINDERS_FEATURE_ENABLED
  ? lazy(() => import('./pages/RemindersPage.jsx'))
  : null;
const ReminderModal = REMINDERS_FEATURE_ENABLED
  ? lazy(() => import('./components/ReminderModal.jsx'))
  : null;

const DEFAULT_SHOP = {
  shopName: '',
  ownerName: '',
  shopPhone: '',
  shopAddress: '',
  role: 'owner',
  brandName: '',
  quickSignature: '',
  businessHours: '',
  closedDay: '',
  whatsappCountryCode: '91',
  defaultTemplateLang: 'en',
  appLanguage: 'en',
  messageLanguage: 'en',
  messageEn: '',
  messageBn: '',
  firstReminderAfterDays: 3,
  secondReminderAfterDays: 7,
  markOverdueAfterDays: 7,
};

function PageFallback() {
  return (
    <div className="flex h-full flex-col gap-4 p-6 page-shell w-full" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-20 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="skeleton h-28 rounded-xl" />
        <div className="skeleton h-28 rounded-xl" />
        <div className="skeleton h-28 rounded-xl hidden lg:block" />
        <div className="skeleton h-28 rounded-xl hidden lg:block" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="skeleton h-48 rounded-xl" />
        <div className="skeleton h-48 rounded-xl" />
      </div>
    </div>
  );
}

function ProtectedRoute() {
  return isAuthTokenValid() ? <Outlet /> : <Navigate to="/login" replace />;
}

function PublicOnlyRoute() {
  return isAuthTokenValid() ? <Navigate to="/app/dashboard" replace /> : <Outlet />;
}

function LedgerRouteView({ customers, shopInfo, onBack, onAddTxn, onEditTxn, onDeleteTxn, onDeleteCustomer, onOpenReminder, onEditCustomer, setCustomers }) {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const activeCust = customers.find(c => String(c.id) === String(id));

  useEffect(() => {
    let active = true;
    const fetchCust = async () => {
      try {
        setLoading(true);
        const res = await customerApi.get(id);
        if (active && res?.customer && setCustomers) {
          setCustomers(prev => prev.map(c => c.id === res.customer.id ? res.customer : c));
        }
      } catch {
        // Keep existing customer from list if refresh fails
      } finally {
        if (active) setLoading(false);
      }
    };
    if (id) fetchCust();
    return () => { active = false; };
  }, [id, setCustomers]);

  if (loading && (!activeCust || !activeCust.transactions || activeCust.transactions.length === 0)) {
    return <PageFallback />;
  }

  if (!activeCust) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        Customer not found.
      </div>
    );
  }

  return (
    <LedgerPage
      customer={activeCust}
      shopInfo={shopInfo}
      onBack={onBack}
      onAddTxn={onAddTxn}
      onEditTxn={onEditTxn}
      onDeleteTxn={onDeleteTxn}
      onDeleteCustomer={onDeleteCustomer}
      onOpenReminder={onOpenReminder}
      onEditCustomer={onEditCustomer}
    />
  );
}

function AppShell({ initialShopInfo, onReady }) {
  const navigateTo = useNavigate();
  const location = useLocation();
  const [customers, setCustomers] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState({ credit: 0, debit: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [todayActivity, setTodayActivity] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [showAddCust, setShowAddCust] = useState(false);
  const [reminderCust, setReminderCust] = useState(null);
  const [bulkToastVisible, setBulkToastVisible] = useState(false);
  const [shopInfo, setShopInfo] = useState(() => ({
    ...DEFAULT_SHOP,
    ...(initialShopInfo || {}),
  }));
  const [apiError, setApiError] = useState('');

  const applyDashboardExtras = useCallback((payload) => {
    if (payload?.monthlySummary) {
      setMonthlySummary({
        credit: Math.round(Number(payload.monthlySummary.credit) || 0),
        debit: Math.round(Number(payload.monthlySummary.debit) || 0),
      });
    }
    if (Array.isArray(payload?.recentActivity)) {
      setRecentActivity(payload.recentActivity);
    }
    if (Array.isArray(payload?.todayActivity)) {
      setTodayActivity(payload.todayActivity);
    }
  }, []);

  const refreshDashboardExtras = useCallback(async () => {
    try {
      const extras = await customerApi.dashboardSummary();
      applyDashboardExtras(extras);
    } catch {
      // Keep last known dashboard numbers if refresh fails
    }
  }, [applyDashboardExtras]);

  const loadCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    setApiError('');
    try {
      const [meResult, result] = await Promise.all([authApi.me(), customerApi.list()]);

      if (meResult?.user) {
        setShopInfo(prev => ({
          ...prev,
          ...meResult.user.settings,
          shopName: meResult.user.shopName || meResult.user.settings?.shopName || prev.shopName,
          ownerName: meResult.user.ownerName || meResult.user.settings?.ownerName || prev.ownerName,
        }));
      }

      setCustomers(Array.isArray(result?.customers) ? result.customers : []);
      applyDashboardExtras(result);
    } catch (error) {
      if (error?.status === 401) {
        clearAuthToken();
        navigateTo('/login', { replace: true });
        return;
      }
      setApiError(error?.message || 'Unable to load customers');
    } finally {
      setLoadingCustomers(false);
    }
  }, [applyDashboardExtras, navigateTo]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount/bootstrap load
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    if (!loadingCustomers) onReady?.();
  }, [loadingCustomers, onReady]);

  useEffect(() => {
    if (!REMINDERS_FEATURE_ENABLED && location.pathname.includes('/app/reminders')) {
      navigateTo('/app/dashboard', { replace: true });
    }
  }, [location.pathname, navigateTo]);

  const navigate = useCallback((view) => {
    if (!REMINDERS_FEATURE_ENABLED && view === 'reminders') {
      navigateTo('/app/dashboard');
      return;
    }
    const routeMap = {
      dashboard: '/app/dashboard',
      customers: '/app/customers',
      reminders: '/app/reminders',
      settings: '/app/settings',
    };
    navigateTo(routeMap[view] || '/app/dashboard');
  }, [navigateTo]);

  const selectCust = useCallback((customer) => {
    navigateTo(`/app/customers/${customer.id}`);
  }, [navigateTo]);

  const addTxn = useCallback(async (custId, txn) => {
    const created = await transactionApi.create(custId, txn);
    setCustomers(prev => prev.map(c => (c.id !== custId ? c : created.customer)));
    refreshDashboardExtras();
  }, [refreshDashboardExtras]);

  const deleteTxn = useCallback(async (custId, txnId) => {
    const updated = await transactionApi.remove(custId, txnId);
    setCustomers(prev => prev.map(c => (c.id !== custId ? c : updated.customer)));
    refreshDashboardExtras();
  }, [refreshDashboardExtras]);

  const deleteCustomer = useCallback(async (custId) => {
    await customerApi.remove(custId);
    setCustomers(prev => prev.filter(c => c.id !== custId));
    setReminderCust(prev => (prev && prev.id === custId ? null : prev));
    refreshDashboardExtras();
    if (location.pathname.includes(`/app/customers/${custId}`)) {
      navigateTo('/app/customers');
    }
  }, [location.pathname, navigateTo, refreshDashboardExtras]);

  const editTxn = useCallback(async (custId, nextTxn) => {
    const updated = await transactionApi.update(custId, nextTxn.id, nextTxn);
    setCustomers(prev => prev.map(c => (c.id !== custId ? c : updated.customer)));
    refreshDashboardExtras();
  }, [refreshDashboardExtras]);

  const addCust = useCallback(async (customerPayload) => {
    const created = await customerApi.create(customerPayload);
    setCustomers(prev => [created.customer, ...prev]);
    setShowAddCust(false);
  }, []);

  const editCustomer = useCallback(async (custId, payload) => {
    const updated = await customerApi.update(custId, payload);
    setCustomers(prev => prev.map(c => {
      if (c.id !== custId) return c;
      return {
        ...c,
        ...updated.customer,
        transactions: Array.isArray(updated.customer?.transactions) && updated.customer.transactions.length > 0
          ? updated.customer.transactions
          : (c.transactions || []),
      };
    }));
    setReminderCust(prev => (prev && prev.id === custId ? { ...prev, ...updated.customer, transactions: prev.transactions } : prev));
  }, []);

  const openRem = useCallback((c) => {
    if (!REMINDERS_FEATURE_ENABLED) return;
    setReminderCust(c);
  }, []);
  const closeRem = useCallback(() => setReminderCust(null), []);

  const startBulkReminders = useCallback((selectedCustomers) => {
    if (!REMINDERS_FEATURE_ENABLED) return Promise.resolve();
    if (!selectedCustomers.length) return Promise.resolve();
    return reminderApi.markBulk(selectedCustomers.map(c => c.id))
      .then((result) => {
        const updatedCustomers = Array.isArray(result?.customers) ? result.customers : [];
        const updatedMap = new Map(updatedCustomers.map((c) => [c.id, c]));
        setCustomers(prev => prev.map(c => {
          if (!updatedMap.has(c.id)) return c;
          const next = updatedMap.get(c.id);
          // Reminder API omits transactions — keep existing ledger history
          return {
            ...c,
            ...next,
            transactions: Array.isArray(c.transactions) && c.transactions.length > 0
              ? c.transactions
              : (next.transactions || []),
          };
        }));
        setReminderCust(null);
        setBulkToastVisible(true);
      })
      .catch((error) => {
        setApiError(error?.message || 'Unable to send reminders');
      });
  }, []);

  const markReminded = useCallback(async (custId) => {
    if (!REMINDERS_FEATURE_ENABLED) return;
    try {
      const result = await reminderApi.markOne(custId);
      setCustomers(prev => prev.map(c => {
        if (c.id !== custId) return c;
        const next = result.customer;
        // Reminder API returns customer without transactions — preserve ledger history
        return {
          ...c,
          ...next,
          transactions: Array.isArray(c.transactions) && c.transactions.length > 0
            ? c.transactions
            : (next?.transactions || []),
        };
      }));
      setReminderCust(null);
    } catch (error) {
      setApiError(error?.message || 'Unable to update reminder status');
    }
  }, []);

  useEffect(() => {
    if (!bulkToastVisible) return undefined;
    const timer = window.setTimeout(() => setBulkToastVisible(false), 2200);
    return () => window.clearTimeout(timer);
  }, [bulkToastVisible]);

  const navActive = location.pathname.includes('/app/customers')
    ? 'customers'
    : location.pathname.includes('/app/reminders')
      ? 'reminders'
      : location.pathname.includes('/app/settings')
        ? 'settings'
        : 'dashboard';
  const dueCount = useMemo(() => customers.filter(c => c.balance > 0).length, [customers]);
  const loadingView = loadingCustomers || apiError;
  const isLedgerDetail = /\/app\/customers\/[^/]+/.test(location.pathname);

  const handleLogout = useCallback(() => {
    authApi.logout().catch(() => {}).finally(() => {
      clearAuthToken();
      navigateTo('/login', { replace: true });
    });
  }, [navigateTo]);

  return (
    <LangCtx.Provider value={shopInfo?.appLanguage === 'bn' ? 'bn' : 'en'}>
      <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
        <MobileHeader shopInfo={shopInfo} onLogout={handleLogout} />
        <TopBar active={navActive} onNavigate={navigate} shopInfo={shopInfo} dueCount={dueCount} onLogout={handleLogout} />
        <main className="flex-1 overflow-hidden flex flex-col">
          <div key={location.pathname} className="flex-1 overflow-hidden flex flex-col fade-up-in">
              {loadingView ? (
                apiError ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                    <p className="text-sm font-medium text-red-600">{apiError}</p>
                    <button type="button" className="btn btn-sm" onClick={loadCustomers}>Retry</button>
                  </div>
                ) : (
                  <PageFallback />
                )
              ) : (
                <Suspense fallback={<PageFallback />}>
                  <Routes>
                    <Route path="dashboard" element={<DashboardPage customers={customers} monthlySummary={monthlySummary} recentActivity={recentActivity} todayActivity={todayActivity} onNavigate={navigate} onAddCust={() => setShowAddCust(true)} onOpenCustomer={selectCust} shopInfo={shopInfo} />} />
                    <Route path="customers" element={<CustomerListPage customers={customers} onSelect={selectCust} onAddCust={() => setShowAddCust(true)} />} />
                    <Route path="customers/:id" element={<LedgerRouteView customers={customers} shopInfo={shopInfo} onBack={() => navigate('customers')} onAddTxn={addTxn} onEditTxn={editTxn} onDeleteTxn={deleteTxn} onDeleteCustomer={deleteCustomer} onOpenReminder={openRem} onEditCustomer={editCustomer} setCustomers={setCustomers} />} />
                    {REMINDERS_FEATURE_ENABLED && RemindersPage ? (
                      <Route path="reminders" element={<RemindersPage customers={customers} shopInfo={shopInfo} onOpenReminder={openRem} onSendSelectedReminders={startBulkReminders} />} />
                    ) : (
                      <Route path="reminders" element={<Navigate to="/app/dashboard" replace />} />
                    )}
                    <Route path="settings" element={<SettingsPage shopInfo={shopInfo} setShopInfo={setShopInfo} />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              )}
          </div>
        </main>
        <BottomNav active={navActive} onNavigate={navigate} onAdd={() => setShowAddCust(true)} dueCount={dueCount} isModalOpen={showAddCust || !!reminderCust || isLedgerDetail} />
        {showAddCust && <AddCustModal onClose={() => setShowAddCust(false)} onAdd={addCust} />}
        {REMINDERS_FEATURE_ENABLED && ReminderModal && reminderCust && (
          <Suspense fallback={null}>
            <ReminderModal customer={reminderCust} onClose={closeRem} onSent={markReminded} shopInfo={shopInfo} />
          </Suspense>
        )}
        {bulkToastVisible && (
          <div className="fixed bottom-20 sm:bottom-8 left-1/2 z-[60] -translate-x-1/2 px-4">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-xl bulk-toast-enter">
              <div className="bulk-toast-check flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Ico.Check />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Reminders sent</p>
                <p className="text-xs text-slate-500">Selected reminders were sent successfully</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </LangCtx.Provider>
  );
}

export default function App() {
  const [initialShopInfo, setInitialShopInfo] = useState(DEFAULT_SHOP);
  const [bootReady, setBootReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const minSplashMs = 900;

  useEffect(() => {
    // Public routes: brief branded splash, then login/signup
    if (isAuthTokenValid()) return undefined;
    const t = window.setTimeout(() => setBootReady(true), minSplashMs);
    return () => window.clearTimeout(t);
  }, []);

  const handleAuthSuccess = useCallback((token, user) => {
    setAuthToken(token);
    setInitialShopInfo({
      ...DEFAULT_SHOP,
      ...(user?.settings || {}),
      shopName: user?.shopName || user?.settings?.shopName || '',
      ownerName: user?.ownerName || user?.settings?.ownerName || '',
    });
    // Show splash while protected shell loads profile + customers
    setBootReady(false);
    setShowSplash(true);
  }, []);

  const handleShellReady = useCallback(() => {
    setBootReady(true);
  }, []);

  const handleSplashDone = useCallback(() => {
    setShowSplash(false);
  }, []);

  useEffect(() => {
    if (!isAuthTokenValid()) return undefined;
    const idle = window.requestIdleCallback
      || ((cb) => window.setTimeout(cb, 1200));
    const cancel = window.cancelIdleCallback || window.clearTimeout;
    const id = idle(() => {
      import('./pages/CustomerListPage.jsx');
      import('./pages/SettingsPage.jsx');
      if (REMINDERS_FEATURE_ENABLED) import('./pages/RemindersPage.jsx');
    });
    return () => cancel(id);
  }, []);

  return (
    <>
      {showSplash && (
        <SplashScreen ready={bootReady} onComplete={handleSplashDone} />
      )}
      <Router>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<AuthPage key="login" mode="login" onAuthSuccess={handleAuthSuccess} />} />
              <Route path="/signup" element={<AuthPage key="signup" mode="signup" onAuthSuccess={handleAuthSuccess} />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/app/*" element={<AppShell initialShopInfo={initialShopInfo} onReady={handleShellReady} />} />
            </Route>
            <Route path="/logout" element={<LogoutPage />} />
            <Route path="/" element={<Navigate to={getAuthToken() ? '/app/dashboard' : '/login'} replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Router>
    </>
  );
}

function LogoutPage() {
  const navigate = useNavigate();
  useEffect(() => {
    authApi.logout().catch(() => {}).finally(() => {
      clearAuthToken();
      navigate('/login', { replace: true });
    });
  }, [navigate]);
  return null;
}
