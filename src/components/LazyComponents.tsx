
import { lazy } from 'react';

// Core components
export const LazyTeamOverview = lazy(() => import('./TeamOverview'));
export const LazyFantasyManager = lazy(() => import('./FantasyManager'));
export const LazyGamificationCenter = lazy(() => import('./GamificationCenter'));
export const LazyLeagueData = lazy(() => import('./LeagueData'));
export const LazyLeagueConnectionForm = lazy(() => import('./home/LeagueConnectionForm'));
export const LazyUserDashboard = lazy(() => import('./dashboard/UserDashboard'));

// Page components  
export const LazyExport = lazy(() => import('../pages/Export'));
export const LazyAuth = lazy(() => import('../pages/Auth'));
export const LazyHowTo = lazy(() => import('../pages/HowTo'));
export const LazyAbout = lazy(() => import('../pages/About'));
export const LazyPrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy'));
export const LazyTermsOfService = lazy(() => import('../pages/TermsOfService'));
export const LazyCookiePolicy = lazy(() => import('../pages/CookiePolicy'));
