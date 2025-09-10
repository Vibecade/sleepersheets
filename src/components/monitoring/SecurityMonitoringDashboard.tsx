import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataIntegrityMonitor } from './DataIntegrityMonitor';

export const SecurityMonitoringDashboard: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Security Monitoring Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of data integrity, security violations, and league access patterns
          </p>
        </div>

        <Tabs defaultValue="integrity" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="integrity">Data Integrity</TabsTrigger>
            <TabsTrigger value="security">Security Logs</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="integrity" className="space-y-4">
            <DataIntegrityMonitor />
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Event Logs</CardTitle>
                <CardDescription>
                  Authentication attempts, unauthorized access, and security violations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Security logs monitoring coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  API response times, cache hit rates, and resource utilization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Performance monitoring coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};