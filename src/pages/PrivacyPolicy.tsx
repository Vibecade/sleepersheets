
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import StaticPageLayout from '@/components/layout/StaticPageLayout';

const PrivacyPolicy = () => {
  return (
    <StaticPageLayout
      title="Privacy Policy"
      description="How SleeperSheets collects, uses, and protects account and league data."
      canonicalUrl="https://sleepersheets.com/privacy"
      eyebrow="Policy"
      icon={Shield}
      iconClassName="bg-gradient-to-br from-blue-500 to-cyan-500"
    >
      <Card className="page-panel mb-8">
        <CardContent className="prose prose-invert max-w-none pt-6 page-prose">
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
                <p>We collect the following types of information:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Account Information:</strong> Email address, username, and profile information when you create an account</li>
                  <li><strong>League Data:</strong> Fantasy football league information you provide, including player salaries and contract details</li>
                  <li><strong>Usage Data:</strong> Information about how you use our service, including pages visited and features used</li>
                  <li><strong>Technical Data:</strong> IP address, browser type, device information, and cookies</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
                <p>We use your information to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide and maintain our service</li>
                  <li>Process and store your fantasy league data</li>
                  <li>Authenticate your account and prevent unauthorized access</li>
                  <li>Communicate with you about service updates</li>
                  <li>Improve our service and develop new features</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">3. Information Sharing</h2>
                <p>We do not sell your personal information. We may share your information in the following circumstances:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>With your consent:</strong> When you explicitly agree to share information</li>
                  <li><strong>Service providers:</strong> With third-party services that help us operate our platform (Supabase for data storage)</li>
                  <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">4. Data Storage and Security</h2>
                <p>Your data is stored securely using industry-standard encryption. We use Supabase as our data provider, which provides enterprise-grade security. We implement appropriate technical and organizational measures to protect your information.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">5. Cookies and Tracking</h2>
                <p>We use cookies and similar technologies to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Maintain your login session</li>
                  <li>Remember your preferences</li>
                  <li>Analyze site usage and performance</li>
                </ul>
                <p>You can control cookie settings through your browser preferences.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">6. Third-Party Services</h2>
                <p>Our service integrates with:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Sleeper API:</strong> To fetch your fantasy league data</li>
                  <li><strong>Supabase:</strong> For authentication and data storage</li>
                </ul>
                <p>These services have their own privacy policies that govern their use of your information.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights</h2>
                <p>You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Export your data</li>
                  <li>Withdraw consent for data processing</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">8. Children's Privacy</h2>
                <p>Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">9. Contact Us</h2>
                <p>If you have questions about this Privacy Policy, please contact us at:</p>
                <p>Email: privacy@sleepersheets.com</p>
                <p>Twitter: <a href="https://x.com/dustybeerbong" className="text-blue-400 hover:text-blue-300">@dustybeerbong</a></p>
              </section>
            </div>
        </CardContent>
      </Card>
    </StaticPageLayout>
  );
};

export default PrivacyPolicy;
