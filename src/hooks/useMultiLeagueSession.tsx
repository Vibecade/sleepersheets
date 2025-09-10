import { useState, useEffect, useCallback } from 'react';
import { clearLeagueCache } from '@/utils/apiCache';

interface LeagueSession {
  leagueId: string;
  lastAccessed: number;
  data?: any;
  isActive: boolean;
}

const MAX_CONCURRENT_LEAGUES = 5;
const SESSION_STORAGE_KEY = 'sleepersheets-league-sessions';

export const useMultiLeagueSession = () => {
  const [sessions, setSessions] = useState<Map<string, LeagueSession>>(new Map());
  const [activeLeague, setActiveLeague] = useState<string | null>(null);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      try {
        const sessionData = JSON.parse(stored);
        const sessionMap = new Map();
        Object.entries(sessionData).forEach(([leagueId, session]) => {
          sessionMap.set(leagueId, session as LeagueSession);
        });
        setSessions(sessionMap);
      } catch (error) {
        console.error('Error loading league sessions:', error);
      }
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    const sessionData = Object.fromEntries(sessions);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
  }, [sessions]);

  // Switch to a league session
  const switchToLeague = useCallback((leagueId: string) => {
    setSessions(prev => {
      const updated = new Map(prev);
      
      // Mark all sessions as inactive
      updated.forEach((session, id) => {
        updated.set(id, { ...session, isActive: false });
      });
      
      // Create or update the target session
      const existing = updated.get(leagueId);
      updated.set(leagueId, {
        leagueId,
        lastAccessed: Date.now(),
        data: existing?.data,
        isActive: true
      });
      
      // If we exceed max concurrent leagues, remove the oldest inactive session
      if (updated.size > MAX_CONCURRENT_LEAGUES) {
        const inactiveSessions = Array.from(updated.entries())
          .filter(([_, session]) => !session.isActive)
          .sort(([_, a], [__, b]) => a.lastAccessed - b.lastAccessed);
        
        if (inactiveSessions.length > 0) {
          const [oldestLeagueId] = inactiveSessions[0];
          updated.delete(oldestLeagueId);
          clearLeagueCache(oldestLeagueId);
          console.log(`Removed session for league ${oldestLeagueId} due to session limit`);
        }
      }
      
      return updated;
    });
    
    setActiveLeague(leagueId);
  }, []);

  // Update session data
  const updateSessionData = useCallback((leagueId: string, data: any) => {
    setSessions(prev => {
      const updated = new Map(prev);
      const existing = updated.get(leagueId);
      if (existing) {
        updated.set(leagueId, {
          ...existing,
          data,
          lastAccessed: Date.now()
        });
      }
      return updated;
    });
  }, []);

  // Remove a league session
  const removeSession = useCallback((leagueId: string) => {
    setSessions(prev => {
      const updated = new Map(prev);
      updated.delete(leagueId);
      return updated;
    });
    
    clearLeagueCache(leagueId);
    
    if (activeLeague === leagueId) {
      setActiveLeague(null);
    }
  }, [activeLeague]);

  // Get session info
  const getSessionInfo = useCallback((leagueId: string) => {
    return sessions.get(leagueId);
  }, [sessions]);

  // Get all active sessions
  const getActiveSessions = useCallback(() => {
    return Array.from(sessions.values()).filter(session => session.isActive);
  }, [sessions]);

  // Clear all sessions
  const clearAllSessions = useCallback(() => {
    sessions.forEach((_, leagueId) => {
      clearLeagueCache(leagueId);
    });
    setSessions(new Map());
    setActiveLeague(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }, [sessions]);

  return {
    sessions: Array.from(sessions.values()),
    activeLeague,
    switchToLeague,
    updateSessionData,
    removeSession,
    getSessionInfo,
    getActiveSessions,
    clearAllSessions,
    maxConcurrentLeagues: MAX_CONCURRENT_LEAGUES,
  };
};