import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SecurityTestProps {
  className?: string;
}

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
}

export const SecurityTest: React.FC<SecurityTestProps> = ({ className }) => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runSecurityTests = async () => {
    setTesting(true);
    setResults([]);
    
    const testResults: TestResult[] = [];

    try {
      // Test 1: Try to access all league ownership data (should fail or return only user's data)
      console.log('Testing league ownership access...');
      const { data: ownershipData, error: ownershipError } = await supabase
        .from('league_ownership')
        .select('*');

      if (ownershipError) {
        testResults.push({
          test: 'League Ownership Data Access',
          passed: true,
          message: 'Correctly blocked unauthorized access to league ownership data'
        });
      } else {
        // If we get data, it should only be the current user's data
        const currentUser = await supabase.auth.getUser();
        const isOnlyUserData = ownershipData?.every(row => row.user_id === currentUser.data.user?.id);
        
        testResults.push({
          test: 'League Ownership Data Access',
          passed: isOnlyUserData || ownershipData?.length === 0,
          message: isOnlyUserData 
            ? 'Correctly returns only current user\'s ownership data'
            : ownershipData?.length === 0
            ? 'No ownership data found (secure)'
            : 'WARNING: May be exposing other users\' ownership data'
        });
      }

      // Test 2: Try to access profiles table (should fail or return only user's profile)
      console.log('Testing profiles data access...');
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        testResults.push({
          test: 'User Profiles Data Access',
          passed: true,
          message: 'Correctly blocked unauthorized access to user profiles'
        });
      } else {
        const currentUser = await supabase.auth.getUser();
        const isOnlyUserProfile = profilesData?.every(profile => profile.id === currentUser.data.user?.id);
        
        testResults.push({
          test: 'User Profiles Data Access',
          passed: isOnlyUserProfile || profilesData?.length === 0,
          message: isOnlyUserProfile
            ? 'Correctly returns only current user\'s profile'
            : profilesData?.length === 0
            ? 'No profile data found (secure)'
            : 'WARNING: May be exposing other users\' profile data'
        });
      }

      // Test 3: Check if we can read fantasy league data
      console.log('Testing fantasy league data access...');
      const { data: leagueData, error: leagueError } = await supabase
        .from('league_settings')
        .select('*')
        .limit(1);

      testResults.push({
        test: 'Fantasy League Data Access',
        passed: !leagueError,
        message: !leagueError 
          ? 'Can access league settings (expected for fantasy app functionality)'
          : `Access blocked: ${leagueError.message}`
      });

      // Test 4: Check authentication state
      const { data: { user } } = await supabase.auth.getUser();
      testResults.push({
        test: 'Authentication Status',
        passed: !!user,
        message: user 
          ? `Authenticated as user ${user.id}`
          : 'Not authenticated - some security tests may not be comprehensive'
      });

    } catch (error) {
      testResults.push({
        test: 'Security Test Execution',
        passed: false,
        message: `Error running tests: ${error}`
      });
    }

    setResults(testResults);
    setTesting(false);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Security Test Suite
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This tool tests the RLS policies to verify that sensitive data is properly secured.
            Run this test to confirm that the security fixes are working correctly.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={runSecurityTests} 
          disabled={testing}
          className="w-full"
        >
          {testing ? 'Running Security Tests...' : 'Run Security Tests'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Test Results:</h3>
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.passed 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start gap-2">
                  {result.passed ? (
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {result.test}
                    </p>
                    <p className={`text-sm ${
                      result.passed ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {result.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};