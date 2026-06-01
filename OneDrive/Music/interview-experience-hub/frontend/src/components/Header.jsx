import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { BriefcaseBusiness, Camera, ChevronRight, HelpCircle, LayoutDashboard, LogIn, LogOut, Menu, Moon, Share2, Sun, UserRound, UserPlus, X } from 'lucide-react';
import api, { getApiErrorMessage } from '../lib/apiClient';
import { AUTH_STATES, getAuthState, markAuthenticated, markUnauthenticated, setAuthState } from '../lib/authState';
import { resolveMediaUrl } from '../lib/mediaUrl';

const THEME_KEY = 'ieh_theme';

export function initTheme() {
  const saved = window.sessionStorage.getItem(THEME_KEY);
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

export function toggleDarkMode() {
  const current = document.documentElement.getAttribute('data-theme');
  if (current === 'dark') {
    document.documentElement.removeAttribute('data-theme');
    window.sessionStorage.setItem(THEME_KEY, 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    window.sessionStorage.setItem(THEME_KEY, 'dark');
  }
  window.dispatchEvent(new CustomEvent('ieh:theme-changed'));
}

export default function Header() {
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const profileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    initTheme();
    setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    const onTheme = () => setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    window.addEventListener('ieh:theme-changed', onTheme);
    return () => window.removeEventListener('ieh:theme-changed', onTheme);
  }, []);

  const refreshAuth = async ({ force = false } = {}) => {
    const authState = getAuthState();
    if (!force && authState === AUTH_STATES.UNAUTHENTICATED) {
      setUser(null);
      setIsCheckingAuth(false);
      return;
    }

    setIsCheckingAuth(true);
    try {
      const res = await api.get('/api/auth/me');
      setUser(res?.data?.user || null);
      markAuthenticated();
    } catch (err) {
      if (err?.response?.status !== 401) {
        console.error(getApiErrorMessage(err, 'Failed to verify session.'));
      }
      setUser(null);
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    refreshAuth();
    const handler = () => refreshAuth({ force: true });
    window.addEventListener('ieh:auth-changed', handler);
    return () => window.removeEventListener('ieh:auth-changed', handler);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
      setUser(null);
      markUnauthenticated();
      setIsDrawerOpen(false);
      navigate('/login');
    } catch (err) {
      console.error(getApiErrorMessage(err, 'Logout failed.'));
    }
  };

  const dashboardPath = user?.role === 'student' ? '/student-dashboard' : user?.role === 'interviewer' ? '/interviewer-dashboard' : user?.role === 'admin' ? '/admin' : '/login';
  const profilePath = user?.role === 'student' ? '/profile' : user?.role === 'interviewer' ? '/interviewer-profile' : dashboardPath;
  const isStudentNavbarRoute = user?.role === 'student' && (location.pathname === '/student-dashboard' || location.pathname === '/profile' || location.pathname === '/practice' || location.pathname.startsWith('/book/'));
  const isInterviewerNavbarRoute = user?.role === 'interviewer' && (location.pathname === '/interviewer-dashboard' || location.pathname === '/interviewer-profile' || location.pathname === '/help');
  const displayName = user?.name || user?.email?.split('@')[0] || 'Guest User';
  const displayHint = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : isCheckingAuth ? 'Checking session' : 'Welcome';
  const interviewerStatus = user?.status === 'verified' || user?.proofOfWork?.filePath ? 'Verified Interviewer' : 'Interviewer';
  const profileImageUrl = profileImagePreview || resolveMediaUrl(user?.profileImage?.filePath);

  const closeDrawer = () => setIsDrawerOpen(false);

  useEffect(() => {
    if (!isStudentNavbarRoute && !isInterviewerNavbarRoute) {
      setIsDrawerOpen(false);
    }
  }, [isStudentNavbarRoute, isInterviewerNavbarRoute]);

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfileImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Interview Experience Hub',
      text: 'Interview Experience Hub',
      url: window.location.origin
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        console.error('Share failed.');
      }
    } finally {
      closeDrawer();
    }
  };

  const menuItemClass = 'flex h-[54px] w-full items-center gap-3 px-[18px] text-left text-sm font-medium text-slate-700 transition-colors hover:bg-white/35 hover:text-sky-700 active:bg-white/45 dark:text-slate-200 dark:hover:bg-slate-700/35 dark:hover:text-sky-300 dark:active:bg-slate-700/45';
  const menuIconClass = 'h-5 w-5 text-sky-600 dark:text-sky-300';
  const chevronClass = 'ml-auto h-5 w-5 text-sky-500/80 dark:text-sky-300/80';

  if (isInterviewerNavbarRoute) {
    return (
      <>
      <header className="liquid-glass-panel mx-3 mt-4 mb-2 sm:mx-4">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="min-w-0 truncate text-lg sm:text-xl font-bold text-sky-700 dark:text-sky-300">
            Interview Experience Hub
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/60 bg-white/55 text-slate-700 shadow-[0_8px_20px_rgba(14,116,144,0.12)] transition-colors hover:text-sky-700 dark:border-slate-600/50 dark:bg-slate-800/55 dark:text-slate-200 dark:hover:text-sky-300"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
            </button>
            <button
              onClick={() => setIsDrawerOpen(prev => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/60 bg-white/55 text-slate-700 shadow-[0_8px_20px_rgba(14,116,144,0.12)] transition-colors hover:text-sky-700 dark:border-slate-600/50 dark:bg-slate-800/55 dark:text-slate-200 dark:hover:text-sky-300"
              aria-label={isDrawerOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isDrawerOpen}
            >
              {isDrawerOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[3px] transition-opacity duration-[280ms] ${isDrawerOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={closeDrawer}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-dvh min-h-screen w-[78vw] max-w-[320px] flex-col overflow-y-auto rounded-l-[22px] border-l border-white/40 bg-sky-50/80 px-4 py-5 shadow-[-14px_0_34px_rgba(14,116,144,0.15)] backdrop-blur-2xl transition-transform duration-[280ms] ease-out [@media_(min-width:600px)_and_(max-width:767px)]:w-[360px] [@media_(min-width:600px)_and_(max-width:767px)]:max-w-[360px] md:w-[380px] md:max-w-[380px] dark:border-slate-600/40 dark:bg-slate-900/82 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-hidden={!isDrawerOpen}
      >
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/65 bg-white/45 text-sky-700 shadow-[inset_0_1px_14px_rgba(255,255,255,0.54),0_12px_26px_rgba(14,116,144,0.12)] [@media_(max-width:599px)]:h-14 [@media_(max-width:599px)]:w-14 dark:border-slate-600/55 dark:bg-slate-800/52 dark:text-sky-300">
            {profileImageUrl ? (
              <img src={profileImageUrl} alt="" className="h-full w-full object-cover object-center" />
            ) : (
              <UserRound size={28} strokeWidth={1.9} />
            )}
          </div>
          <p className="mt-3 max-w-full truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{displayName}</p>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{interviewerStatus}</p>
        </div>

        <div className="overflow-hidden rounded-[18px] border border-white/55 bg-white/52 shadow-[0_14px_30px_rgba(14,116,144,0.1)] backdrop-blur-xl dark:border-slate-600/40 dark:bg-slate-800/52">
          <Link to="/interviewer-dashboard" onClick={closeDrawer} className={menuItemClass}>
            <LayoutDashboard className={menuIconClass} strokeWidth={2} />
            <span>Dashboard</span>
            <ChevronRight className={chevronClass} strokeWidth={2} />
          </Link>
          <div className="mx-[18px] h-px bg-white/55 dark:bg-slate-600/35" />
          <Link to="/interviewer-profile" onClick={closeDrawer} className={menuItemClass}>
            <BriefcaseBusiness className={menuIconClass} strokeWidth={2} />
            <span>My Profile</span>
            <ChevronRight className={chevronClass} strokeWidth={2} />
          </Link>
          <div className="mx-[18px] h-px bg-white/55 dark:bg-slate-600/35" />
          <Link to="/help" onClick={closeDrawer} className={menuItemClass}>
            <HelpCircle className={menuIconClass} strokeWidth={2} />
            <span>Help Center</span>
            <ChevronRight className={chevronClass} strokeWidth={2} />
          </Link>
        </div>

        <div className="mt-auto pt-6">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-11 min-w-36 items-center justify-center gap-2 rounded-2xl border border-white/55 bg-white/50 px-5 text-sm font-medium text-slate-700 shadow-[0_10px_22px_rgba(14,116,144,0.09)] transition-colors hover:text-sky-700 active:bg-white/60 dark:border-slate-600/40 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:text-sky-300 dark:active:bg-slate-700/55"
          >
            <LogOut size={18} strokeWidth={2} />
            Logout
          </button>
        </div>
      </aside>
      </>
    );
  }

  if (!isStudentNavbarRoute) {
    return (
      <header className="liquid-glass-panel mx-3 mt-4 mb-2 sm:mx-4">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6 lg:px-8">
          <Link to="/" className="public-brand-title min-w-0 truncate font-bold text-sky-700 dark:text-sky-300">
            Interview Experience Hub
          </Link>

          <nav className="flex shrink-0 items-center gap-1 sm:gap-3">
            <Link to="/help" className="text-xs font-medium text-slate-700 transition-colors hover:text-sky-700 dark:text-slate-200 dark:hover:text-sky-300 sm:text-sm">
              Help
            </Link>
            <Link to="/login" className="text-xs font-medium text-slate-700 transition-colors hover:text-sky-700 dark:text-slate-200 dark:hover:text-sky-300 sm:text-sm">
              Login
            </Link>
            <Link to="/register" className="rounded-xl bg-sky-600 px-2 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-95 sm:px-4 sm:text-sm">
              Register
            </Link>
            <button
              onClick={toggleDarkMode}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/60 bg-white/55 text-slate-700 shadow-[0_8px_20px_rgba(14,116,144,0.12)] transition-colors hover:text-sky-700 dark:border-slate-600/50 dark:bg-slate-800/55 dark:text-slate-200 dark:hover:text-sky-300 sm:rounded-2xl"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
            </button>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <>
    <header className="liquid-glass-panel mx-3 mt-4 mb-2 sm:mx-4">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <Link to="/" className="min-w-0 truncate text-lg sm:text-xl font-bold text-sky-700 dark:text-sky-300">
          Interview Experience Hub
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={toggleDarkMode}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/60 bg-white/55 text-slate-700 shadow-[0_8px_20px_rgba(14,116,144,0.12)] transition-colors hover:text-sky-700 dark:border-slate-600/50 dark:bg-slate-800/55 dark:text-slate-200 dark:hover:text-sky-300"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
          </button>
          <button
            onClick={() => setIsDrawerOpen(prev => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/60 bg-white/55 text-slate-700 shadow-[0_8px_20px_rgba(14,116,144,0.12)] transition-colors hover:text-sky-700 dark:border-slate-600/50 dark:bg-slate-800/55 dark:text-slate-200 dark:hover:text-sky-300"
            aria-label={isDrawerOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isDrawerOpen}
          >
            {isDrawerOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
          </button>
        </div>
      </div>
    </header>

    <div
      className={`fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[3px] transition-opacity duration-[280ms] ${isDrawerOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
      onClick={closeDrawer}
    />
    <aside
      className={`fixed right-0 top-0 z-50 flex h-dvh min-h-screen w-[78vw] max-w-[320px] flex-col overflow-y-auto rounded-l-[22px] border-l border-white/40 bg-sky-50/80 px-4 py-5 shadow-[-14px_0_34px_rgba(14,116,144,0.15)] backdrop-blur-2xl transition-transform duration-[280ms] ease-out [@media_(min-width:600px)_and_(max-width:767px)]:w-[360px] [@media_(min-width:600px)_and_(max-width:767px)]:max-w-[360px] md:w-[380px] md:max-w-[380px] dark:border-slate-600/40 dark:bg-slate-900/82 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      aria-hidden={!isDrawerOpen}
    >
      <div className="mb-5 flex flex-col items-center text-center">
        <input
          ref={profileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleProfileImageChange}
        />
        <button
          type="button"
          onClick={() => profileInputRef.current?.click()}
          className="relative flex h-[66px] w-[66px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/65 bg-white/45 text-sky-700 shadow-[inset_0_1px_14px_rgba(255,255,255,0.54),0_12px_26px_rgba(14,116,144,0.12)] transition-colors hover:text-sky-800 active:scale-[0.99] [@media_(min-width:600px)_and_(max-width:767px)]:h-[70px] [@media_(min-width:600px)_and_(max-width:767px)]:w-[70px] md:h-[74px] md:w-[74px] dark:border-slate-600/55 dark:bg-slate-800/52 dark:text-sky-300 dark:hover:text-sky-200"
          aria-label="Upload profile image"
        >
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt=""
              className="h-full w-full object-cover object-center"
            />
          ) : (
            <>
              <span className="absolute inset-2 rounded-full bg-sky-200/16 blur-sm dark:bg-sky-400/10" />
              <Camera className="relative h-6 w-6" strokeWidth={1.9} />
            </>
          )}
        </button>
        <p className="mt-3 max-w-full truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{displayName}</p>
        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{displayHint}</p>
        <Link
          to={profilePath}
          onClick={closeDrawer}
          className="mt-[14px] inline-flex h-[38px] w-[116px] items-center justify-center rounded-2xl border border-white/60 bg-white/48 text-xs font-medium text-slate-700 shadow-[0_10px_22px_rgba(14,116,144,0.1)] backdrop-blur-xl transition-colors hover:text-sky-700 active:bg-white/60 [@media_(min-width:600px)_and_(max-width:767px)]:w-[122px] md:w-[128px] dark:border-slate-600/45 dark:bg-slate-800/48 dark:text-slate-200 dark:hover:text-sky-300 dark:active:bg-slate-700/55"
        >
          View Profile
        </Link>
      </div>

      <div className="overflow-hidden rounded-[18px] border border-white/55 bg-white/52 shadow-[0_14px_30px_rgba(14,116,144,0.1)] backdrop-blur-xl dark:border-slate-600/40 dark:bg-slate-800/52">
        <button type="button" onClick={handleShare} className={menuItemClass}>
          <Share2 className={menuIconClass} strokeWidth={2} />
          <span>Share</span>
          <ChevronRight className={chevronClass} strokeWidth={2} />
        </button>
        <div className="mx-[18px] h-px bg-white/55 dark:bg-slate-600/35" />
        <Link to={dashboardPath} onClick={closeDrawer} className={menuItemClass}>
          <LayoutDashboard className={menuIconClass} strokeWidth={2} />
          <span>Dashboard</span>
          <ChevronRight className={chevronClass} strokeWidth={2} />
        </Link>
        <div className="mx-[18px] h-px bg-white/55 dark:bg-slate-600/35" />
        <Link to="/help" onClick={closeDrawer} className={menuItemClass}>
          <HelpCircle className={menuIconClass} strokeWidth={2} />
          <span>Help</span>
          <ChevronRight className={chevronClass} strokeWidth={2} />
        </Link>
        <div className="mx-[18px] h-px bg-white/55 dark:bg-slate-600/35" />
        <div className="flex h-[64px] items-center justify-center px-[18px]">
          <Link
            to="/register"
            onClick={closeDrawer}
            className="inline-flex h-11 w-[72%] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(14,116,144,0.18)] transition-opacity hover:opacity-95"
          >
            <UserPlus size={18} strokeWidth={2} />
            Register
          </Link>
        </div>
      </div>

      <div className="mt-auto pt-6">
        {user ? (
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-11 min-w-36 items-center justify-center gap-2 rounded-2xl border border-white/55 bg-white/50 px-5 text-sm font-medium text-slate-700 shadow-[0_10px_22px_rgba(14,116,144,0.09)] transition-colors hover:text-rose-700 active:bg-white/60 dark:border-slate-600/40 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:text-rose-300 dark:active:bg-slate-700/55"
          >
            <LogOut size={18} strokeWidth={2} />
            Logout
          </button>
        ) : (
          <Link
            to="/login"
            onClick={closeDrawer}
            className="inline-flex h-11 min-w-36 items-center justify-center gap-2 rounded-2xl border border-white/55 bg-white/50 px-5 text-sm font-medium text-slate-700 shadow-[0_10px_22px_rgba(14,116,144,0.09)] transition-colors hover:text-sky-700 active:bg-white/60 dark:border-slate-600/40 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:text-sky-300 dark:active:bg-slate-700/55"
          >
            <LogIn size={18} strokeWidth={2} />
            {isCheckingAuth ? 'Checking...' : 'Login'}
          </Link>
        )}
      </div>
    </aside>
    </>
  );
}
