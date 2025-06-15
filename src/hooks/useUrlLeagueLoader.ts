
import { useEffect } from 'react';
import { useUrlParams } from '@/hooks/useUrlParams';
import { useToast } from '@/hooks/use-toast';
import { sanitizeInput, validateLeagueId } from '@/utils/inputValidation';
import { fetchLeagueData } from '@/utils/leagueApi';
import type { CombinedLeagueData } from '@/utils/leagueApi';

interface UseUrlLeagueLoaderProps {
    leagueData: CombinedLeagueData | null;
    setLeagueData: (data: CombinedLeagueData | null) => void;
    setLeagueId: (id: string) => void;
    setLoading: (loading: boolean) => void;
}

export const useUrlLeagueLoader = ({
    leagueData,
    setLeagueData,
    setLeagueId,
    setLoading
}: UseUrlLeagueLoaderProps) => {
    const { getLeagueFromUrl, clearUrlParams } = useUrlParams();
    const { toast } = useToast();

    useEffect(() => {
        const urlLeagueId = getLeagueFromUrl();
        if (urlLeagueId && !leagueData) {
            const sanitizedLeagueId = sanitizeInput(urlLeagueId);
            const validation = validateLeagueId(sanitizedLeagueId);
            
            if (validation.isValid) {
                setLeagueId(urlLeagueId);
                setLoading(true);
                fetchLeagueData(sanitizedLeagueId)
                    .then(data => {
                        setLeagueData(data);
                    })
                    .catch(error => {
                        console.error('Error loading league from URL:', error);
                        toast({
                            title: "Error",
                            description: error instanceof Error ? error.message : 'Failed to load league from URL.',
                            variant: "destructive"
                        });
                        clearUrlParams();
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            } else {
                toast({
                    title: "Invalid League ID in URL",
                    description: "The league ID in the URL is not valid. Clearing it.",
                    variant: "default"
                });
                clearUrlParams();
            }
        }
    }, [getLeagueFromUrl, leagueData, setLeagueData, setLeagueId, setLoading, toast, clearUrlParams]);
};
