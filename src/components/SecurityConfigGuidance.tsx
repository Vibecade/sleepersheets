import React from 'react';
import { AlertTriangle, Shield, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface SecurityConfigGuidanceProps {
  className?: string;
}

export const SecurityConfigGuidance: React.FC<SecurityConfigGuidanceProps> = ({ className }) => {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-600">
          <Shield className="w-5 h-5" />
          Security Configuration Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Two security configurations need to be updated in your Supabase dashboard to complete the security hardening.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                WARN
              </Badge>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">OTP Expiry Too Long</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  One-time password tokens remain valid longer than the recommended security threshold.
                </p>
              </div>
            </div>
            <div className="ml-16">
              <p className="text-sm mb-2">
                <strong>Action Required:</strong> Reduce OTP expiry time in Supabase Auth settings.
              </p>
              <a
                href="https://supabase.com/docs/guides/platform/going-into-prod#security"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                View configuration guide
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                WARN
              </Badge>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Leaked Password Protection Disabled</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Users can currently sign up with passwords that have been compromised in data breaches.
                </p>
              </div>
            </div>
            <div className="ml-16">
              <p className="text-sm mb-2">
                <strong>Action Required:</strong> Enable leaked password protection in Supabase Auth settings.
              </p>
              <a
                href="https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                View password security guide
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <Alert className="bg-green-50 border-green-200">
          <Shield className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            <strong>Database Security:</strong> Critical RLS policy vulnerabilities have been successfully fixed. 
            User data is now properly protected and league ownership information is secured.
          </AlertDescription>
        </Alert>

        <div className="text-sm text-muted-foreground">
          <p className="mb-2">
            <strong>Next Steps:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Navigate to your Supabase project dashboard</li>
            <li>Go to Authentication → Settings</li>
            <li>Update the OTP expiry duration (recommended: 10 minutes)</li>
            <li>Enable leaked password protection</li>
            <li>Save the configuration changes</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};