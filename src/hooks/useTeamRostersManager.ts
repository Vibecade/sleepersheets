import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { useDeadCapPlayers } from '@/hooks/useDeadCapPlayers';
import { useLeagueSettings } from '@/hooks/useLeagueSettings';
import { useFAABCalculations } from '@/hooks/useFAABCalculations';
import { useToast } from '@/hooks/use-toast';
import { calculateOptimizedSalaries } from '@/utils/salaryCalculations';
import { useLeagueOwnership } from '@/hooks/useLeagueOwnership';

interface UseTeamRostersManagerProps {
  rosters: any[];
}

export const useTeamRostersManager = ({ rosters }: UseTeamRostersManagerProps) => {
  const [showSalaryFeatures, setShowSalaryFeatures] = useState(false);
  const [showDeadCapManager, setShowDeadCapManager] = useState(false);
  const [showFAAB, setShowFAAB] = useState(false);
  const [showContractCalculator, setShowContractCalculator] = useState(false);
  const [localSalaryCap, setLocalSalaryCap] = useState<string>('');
  const [localFaabCap, setLocalFaabCap] = useState<string>('');
  const [localReserveLimit, setLocalReserveLimit] = useState<string>('');
  const { toast } = useToast();

  const leagueId = rosters[0]?.league_id || '';
  
  const { salaries, getEffectiveSalary, loading: salariesLoading } = usePlayerSalaries(leagueId);
  const { deadCapPlayers, loading: deadCapLoading } = useDeadCapPlayers(leagueId);
  const { settings, updateSettings, loading: settingsLoading } = useLeagueSettings(leagueId);
  const { canModifyLeague } = useLeagueOwnership();

  const canModify = canModifyLeague(leagueId);

  const salaryCap = settings?.salary_cap || 200000;
  const deadCapEnabled = settings?.dead_cap_enabled ?? true;
  const faabCap = settings?.faab_cap || 100;
  const reserveLimit = settings?.reserve_limit || 100;

  // Memoize salary calculations to prevent recalculation on every render
  const { teamSalaries, teamDeadCaps } = useMemo(() => {
    if (!rosters.length || salariesLoading || deadCapLoading) {
      return { teamSalaries: {}, teamDeadCaps: {} };
    }
    
    return calculateOptimizedSalaries({
      rosters,
      deadCapPlayers,
      getEffectiveSalary,
      salaryCap,
    });
  }, [rosters, deadCapPlayers, getEffectiveSalary, salaryCap, salariesLoading, deadCapLoading]);

  const { teamFAAB } = useFAABCalculations({ rosters, leagueId });

  // Only show salary features if there are actual salaries
  useEffect(() => {
    if (!salariesLoading && Object.values(salaries).some(s => s !== null && s > 0)) {
      setShowSalaryFeatures(true);
    }
  }, [salaries, salariesLoading]);

  // Update local state when settings change
  useEffect(() => {
    if (settings?.salary_cap) {
      setLocalSalaryCap(settings.salary_cap.toString());
    }
    if (settings?.faab_cap !== null && settings?.faab_cap !== undefined) {
      setLocalFaabCap(settings.faab_cap.toString());
    } else {
      setLocalFaabCap('100'); // Default FAAB cap
    }
    if (settings?.reserve_limit !== null && settings?.reserve_limit !== undefined) {
      setLocalReserveLimit(settings.reserve_limit.toString());
    } else {
      setLocalReserveLimit('100'); // Default reserve limit
    }
  }, [settings]);

  const handleSalaryCapSave = useCallback(async () => {
    if (!canModify) {
      toast({
        title: "Access Denied",
        description: "You must claim this league to modify settings",
        variant: "destructive"
      });
      return;
    }

    if (!localSalaryCap) {
      toast({
        title: "Error",
        description: "Please enter a valid salary cap amount",
        variant: "destructive"
      });
      return;
    }
    
    const newSalaryCap = Number(localSalaryCap);
    
    if (newSalaryCap <= 0) {
      toast({
        title: "Error",
        description: "Salary cap must be greater than 0",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await updateSettings({ salary_cap: newSalaryCap });
      toast({
        title: "Success!",
        description: `Salary cap updated to $${newSalaryCap.toLocaleString()}`,
      });
    } catch (error) {
      console.error('Failed to update salary cap:', error);
      toast({
        title: "Error",
        description: "Failed to update salary cap",
        variant: "destructive"
      });
    }
  }, [canModify, localSalaryCap, toast, updateSettings]);

  const handleFaabSettingsSave = useCallback(async () => {
    if (!canModify) {
      toast({
        title: "Access Denied",
        description: "You must claim this league to modify settings",
        variant: "destructive"
      });
      return;
    }

    if (!localFaabCap || !localReserveLimit) {
      toast({
        title: "Error",
        description: "Please enter valid FAAB settings",
        variant: "destructive"
      });
      return;
    }
    
    const newFaabCap = Number(localFaabCap);
    const newReserveLimit = Number(localReserveLimit);
    
    if (newFaabCap <= 0 || newReserveLimit < 0) {
      toast({
        title: "Error",
        description: "FAAB cap must be greater than 0 and reserve limit cannot be negative",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await updateSettings({ 
        faab_cap: newFaabCap,
        reserve_limit: newReserveLimit
      });
      toast({
        title: "Success!",
        description: `FAAB settings updated: Cap $${newFaabCap}, Reserve $${newReserveLimit}`,
      });
    } catch (error) {
      console.error('Failed to update FAAB settings:', error);
      toast({
        title: "Error",
        description: "Failed to update FAAB settings",
        variant: "destructive"
      });
    }
  }, [canModify, localFaabCap, localReserveLimit, toast, updateSettings]);

  const handleDeadCapEnabledChange = useCallback(async (enabled: boolean) => {
    if (!canModify) {
      toast({
        title: "Access Denied",
        description: "You must claim this league to modify settings",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateSettings({ dead_cap_enabled: enabled });
    } catch (error) {
      console.error('Failed to update dead cap setting:', error);
      toast({
        title: "Error",
        description: "Failed to update dead cap setting",
        variant: "destructive"
      });
    }
  }, [canModify, toast, updateSettings]);

  return {
    leagueId,
    showSalaryFeatures,
    setShowSalaryFeatures,
    showDeadCapManager,
    setShowDeadCapManager,
    showFAAB,
    setShowFAAB,
    showContractCalculator,
    setShowContractCalculator,
    localSalaryCap,
    setLocalSalaryCap,
    localFaabCap,
    setLocalFaabCap,
    localReserveLimit,
    setLocalReserveLimit,
    settingsLoading,
    handleSalaryCapSave,
    handleFaabSettingsSave,
    handleDeadCapEnabledChange,
    teamSalaries,
    teamDeadCaps,
    teamFAAB,
    salaryCap,
    deadCapEnabled,
    faabCap,
    reserveLimit,
    canModify,
  };
};