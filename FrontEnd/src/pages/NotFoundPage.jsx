import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { isAuthTokenValid } from '../utils/api.js';

export default function NotFoundPage() {
  const home = isAuthTokenValid() ? '/app/dashboard' : '/login';

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-16 text-center bg-slate-50">
      <Logo size={48} className="mb-6" />
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-600 mb-2">404</p>
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">
        This link does not exist or may have moved. Head back and continue managing your ledger.
      </p>
      <Link
        to={home}
        className="mt-8 inline-flex items-center justify-center rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-ring"
      >
        {isAuthTokenValid() ? 'Back to Home' : 'Go to Sign In'}
      </Link>
    </div>
  );
}
