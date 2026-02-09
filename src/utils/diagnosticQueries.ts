import { supabase } from '@/integrations/supabase/client';

export const diagnoseSalaryDiscrepancy = async (leagueId: string) => {
  console.log('=== SALARY DISCREPANCY DIAGNOSTIC ===');
  console.log('League ID:', leagueId);

  const { data: salaries, error: salariesError } = await supabase
    .from('player_salaries')
    .select('player_id, salary, acquisition_type, taxi_squad')
    .eq('league_id', leagueId);

  if (salariesError) {
    console.error('Error fetching salaries:', salariesError);
    return;
  }

  console.log('\n--- All Players ---');
  salaries?.forEach(s => {
    console.log(`Player ${s.player_id}: $${s.salary}, Type: ${s.acquisition_type}, Taxi: ${s.taxi_squad}`);
  });

  const contractPlayers = salaries?.filter(s => s.acquisition_type === 'contract' || !s.acquisition_type) || [];
  const faabPlayers = salaries?.filter(s => s.acquisition_type === 'faab') || [];

  const contractTotal = contractPlayers.reduce((sum, p) => sum + (p.salary || 0), 0);
  const faabTotal = faabPlayers.reduce((sum, p) => sum + (p.salary || 0), 0);

  console.log('\n--- Summary ---');
  console.log(`Contract Players: ${contractPlayers.length}, Total: $${contractTotal}`);
  console.log(`FAAB Players: ${faabPlayers.length}, Total: $${faabTotal} (NOT counted in cap)`);
  console.log(`Total if FAAB counted: $${contractTotal + faabTotal}`);
  console.log(`Total if FAAB not counted: $${contractTotal}`);

  const { data: transactions, error: transError } = await supabase
    .from('processed_transactions')
    .select('transaction_id, player_updates')
    .eq('league_id', leagueId);

  if (!transError && transactions) {
    console.log(`\n--- Processed FAAB Transactions: ${transactions.length} ---`);
  }

  return {
    contractPlayers,
    faabPlayers,
    contractTotal,
    faabTotal,
    totalWithFAAB: contractTotal + faabTotal,
    totalWithoutFAAB: contractTotal
  };
};

export const findMisclassifiedFAABPlayers = async (leagueId: string) => {
  const { data: faabTransactions } = await supabase
    .from('processed_transactions')
    .select('player_updates')
    .eq('league_id', leagueId);

  if (!faabTransactions) return [];

  const faabPlayerIds = new Set<string>();
  faabTransactions.forEach(t => {
    const updates = (t.player_updates as any) || [];
    updates.forEach((u: any) => {
      if (u.playerId) faabPlayerIds.add(u.playerId);
    });
  });

  const { data: salaries } = await supabase
    .from('player_salaries')
    .select('player_id, salary, acquisition_type')
    .eq('league_id', leagueId)
    .in('player_id', Array.from(faabPlayerIds));

  const misclassified = salaries?.filter(s =>
    s.acquisition_type !== 'faab' && faabPlayerIds.has(s.player_id)
  ) || [];

  console.log('\n--- Misclassified FAAB Players ---');
  misclassified.forEach(p => {
    console.log(`Player ${p.player_id}: $${p.salary}, Currently marked as: ${p.acquisition_type}`);
  });

  return misclassified;
};
