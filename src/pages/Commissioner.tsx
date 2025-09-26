import { CommissionerDashboard } from '@/components/commissioner/CommissionerDashboard';
import PageHead from '@/components/PageHead';

interface CommissionerProps {
  leagueId: string;
  leagueData: any;
}

const Commissioner = ({ leagueId, leagueData }: CommissionerProps) => {
  return (
    <>
      <PageHead 
        title="Commissioner Dashboard" 
        description="League management and administration tools for fantasy football commissioners"
      />
      <CommissionerDashboard leagueId={leagueId} leagueData={leagueData} />
    </>
  );
};

export default Commissioner;