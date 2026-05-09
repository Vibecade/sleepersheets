
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import StaticPageLayout from '@/components/layout/StaticPageLayout';

const TermsOfService = () => {
  return (
    <StaticPageLayout
      title="Terms of Service"
      description="The rules, responsibilities, and usage boundaries for SleeperSheets."
      canonicalUrl="https://sleepersheets.com/terms"
      eyebrow="Policy"
      icon={FileText}
      iconClassName="bg-gradient-to-br from-slate-500 to-slate-700"
    >
      <Card className="page-panel mb-8">
        <CardContent className="prose prose-invert max-w-none pt-6 page-prose">
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
                <p>By accessing and using SleeperSheets, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
                <p>SleeperSheets is a web-based tool for managing salary caps and contracts in fantasy football dynasty leagues. Our service allows you to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Track player salaries and contracts</li>
                  <li>Manage league salary caps</li>
                  <li>Simulate trades</li>
                  <li>Export league data</li>
                  <li>Claim ownership of leagues for editing privileges</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">3. User Accounts</h2>
                <p>To access certain features, you must create an account. You are responsible for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Providing accurate and current information</li>
                  <li>Notifying us immediately of any unauthorized use</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">4. League Ownership</h2>
                <p>Our league ownership system works as follows:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Users can claim ownership of unclaimed leagues</li>
                  <li>Only one user can own a league at a time</li>
                  <li>League owners have exclusive editing rights for their leagues</li>
                  <li>We reserve the right to resolve ownership disputes</li>
                  <li>Ownership claims must be made in good faith by actual league participants</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">5. Acceptable Use</h2>
                <p>You agree not to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use the service for any unlawful purpose</li>
                  <li>Attempt to gain unauthorized access to other users' data</li>
                  <li>Interfere with or disrupt the service</li>
                  <li>Upload malicious code or content</li>
                  <li>Impersonate another person or entity</li>
                  <li>Claim ownership of leagues you don't actually participate in</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">6. Data and Privacy</h2>
                <p>Your use of SleeperSheets is also governed by our Privacy Policy. We integrate with the Sleeper API to fetch your fantasy league data. By using our service, you consent to this data collection and processing.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">7. Intellectual Property</h2>
                <p>The SleeperSheets service, including its design, features, and content, is owned by us and protected by copyright and other intellectual property laws. You may not copy, distribute, or create derivative works without permission.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">8. Disclaimers</h2>
                <p>SleeperSheets is provided "as is" without warranties of any kind. We do not guarantee:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Uninterrupted or error-free service</li>
                  <li>Accuracy of data from third-party sources</li>
                  <li>Compatibility with all devices or browsers</li>
                  <li>Permanent availability of the service</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">9. Limitation of Liability</h2>
                <p>We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service, including but not limited to loss of data or league information.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">10. Termination</h2>
                <p>We reserve the right to terminate or suspend your account and access to the service at any time, without prior notice, for conduct that we believe violates these Terms of Service.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">11. Changes to Terms</h2>
                <p>We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the service constitutes acceptance of the modified terms.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">12. Contact Information</h2>
                <p>If you have questions about these Terms of Service, please contact us at:</p>
                <p>Email: support@sleepersheets.com</p>
                <p>Twitter: <a href="https://x.com/dustybeerbong" className="text-blue-400 hover:text-blue-300">@dustybeerbong</a></p>
              </section>
            </div>
        </CardContent>
      </Card>
    </StaticPageLayout>
  );
};

export default TermsOfService;
