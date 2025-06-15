
import { useEffect } from 'react';
import { useUrlParams } from '@/hooks/useUrlParams';
import { useToast } from '@/hooks/use-toast';
import { sanitizeInput, validateLeagueId } from '@/utils/inputValidation';

interface UseUrlLeagueLoaderProps {
    leagueIdFromState: string;
    setLeagueId: (id: string) => void;
}

export const useUrlLeagueLoader = ({
    leagueIdFromState,
    setLeagueId,
}: UseUrlLeagueLoaderProps) => {
    const { getLeagueFromUrl, clearUrlParams } = useUrlParams();
    const { toast } = useToast();

    useEffect(() => {
        const urlLeagueId = getLeagueFromUrl();
        
        if (urlLeagueId && urlLeagueId !== leagueIdFromState) {
            const sanitizedLeagueId = sanitizeInput(urlLeagueId);
            const validation = validateLeagueId(sanitizedLeagueId);
            
            if (validation.isValid) {
                setLeagueId(sanitizedLeagueId);
            } else {
                toast({
                    title: "Invalid League ID in URL",
                    description: "The league ID in the URL is not valid. Clearing it.",
                    variant: "default"
                });
                clearUrlParams();
            }
        }
    }, [getLeagueFromUrl, leagueIdFromState, setLeagueId, toast, clearUrlParams]);
};
