import React, { lazy, Suspense, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BarChart3 } from 'lucide-react';
import { useLeagueData } from '@/components/LeagueDataContext';

const LazyAnalyticsAccordionContent = lazy(() => import('./AnalyticsAccordionContent'));

export const AnalyticsAccordion: React.FC = () => {
  const { league, rosters, userMap, players, transactions } = useLeagueData();
  const [openItem, setOpenItem] = useState<string>('');
  const users = Object.values(userMap);
  const leagueId = league.league_id;

  return (
    <Card>
      <Accordion type="single" collapsible className="w-full" value={openItem} onValueChange={setOpenItem}>
        <AccordionItem value="analytics" className="border-none">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-5 h-5 text-primary" />
              <div className="text-left">
                <h3 className="text-lg font-semibold">Advanced Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Deep dive into league performance, trends, and key metrics
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {openItem === 'analytics' ? (
              <Suspense fallback={<div className="py-4 text-sm text-muted-foreground">Loading analytics...</div>}>
                <LazyAnalyticsAccordionContent
                  rosters={rosters}
                  users={users}
                  players={players}
                  transactions={transactions}
                  leagueId={leagueId}
                />
              </Suspense>
            ) : null}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default AnalyticsAccordion;
