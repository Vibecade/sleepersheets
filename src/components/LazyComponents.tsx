
import { lazy } from 'react';

// Core components
export const LazyTeamOverview = lazy(() => import('./TeamOverview'));
export const LazyFantasyManager = lazy(() => import('./FantasyManager'));

// Page components  
export const LazyExport = lazy(() => import('../pages/Export'));
export const LazyAuth = lazy(() => import('../pages/Auth'));
export const LazyHowTo = lazy(() => import('../pages/HowTo'));
