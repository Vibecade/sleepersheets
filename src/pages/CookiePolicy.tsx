
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHead from '@/components/PageHead';

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-4">
      <PageHead 
        title="Cookie Policy"
        description="Cookie Policy for SleeperSheets - Learn about how we use cookies and tracking technologies."
        canonicalUrl="https://sleepersheets.com/cookies"
      />
      
      <div className="max-w-4xl mx-auto py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Cookie Policy</CardTitle>
            <p className="text-gray-400 text-center">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <div className="space-y-6 text-gray-300">
              <section>
                <h2 className="text-xl font-semibold text-white mb-3">What Are Cookies?</h2>
                <p>Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and enabling certain functionality.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">How We Use Cookies</h2>
                <p>SleeperSheets uses cookies for the following purposes:</p>
                
                <h3 className="text-lg font-medium text-white mt-4 mb-2">Essential Cookies</h3>
                <p>These cookies are necessary for the website to function properly:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Authentication:</strong> To keep you logged in to your account</li>
                  <li><strong>Security:</strong> To protect against fraud and unauthorized access</li>
                  <li><strong>Session management:</strong> To maintain your session state</li>
                </ul>

                <h3 className="text-lg font-medium text-white mt-4 mb-2">Functional Cookies</h3>
                <p>These cookies enhance your experience:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Preferences:</strong> To remember your settings and preferences</li>
                  <li><strong>Language:</strong> To display content in your preferred language</li>
                  <li><strong>Theme:</strong> To remember your light/dark mode preference</li>
                </ul>

                <h3 className="text-lg font-medium text-white mt-4 mb-2">Analytics Cookies</h3>
                <p>These cookies help us understand how you use our site:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Usage analytics:</strong> To analyze site performance and user behavior</li>
                  <li><strong>Error tracking:</strong> To identify and fix technical issues</li>
                  <li><strong>Feature usage:</strong> To understand which features are most popular</li>
                </ul>

                <h3 className="text-lg font-medium text-white mt-4 mb-2">Advertising Cookies</h3>
                <p>These cookies are used for advertising purposes:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Google AdSense:</strong> To display relevant advertisements</li>
                  <li><strong>Ad personalization:</strong> To show ads based on your interests</li>
                  <li><strong>Ad performance:</strong> To measure ad effectiveness</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Third-Party Cookies</h2>
                <p>We use services from third parties that may set their own cookies:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Google AdSense:</strong> For displaying advertisements</li>
                  <li><strong>Supabase:</strong> For authentication and data storage</li>
                  <li><strong>Sleeper API:</strong> For fetching fantasy league data</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Managing Your Cookie Preferences</h2>
                <p>You can control and manage cookies in several ways:</p>
                
                <h3 className="text-lg font-medium text-white mt-4 mb-2">Browser Settings</h3>
                <p>Most browsers allow you to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>View and delete existing cookies</li>
                  <li>Block all cookies</li>
                  <li>Block third-party cookies</li>
                  <li>Clear cookies when you close your browser</li>
                </ul>

                <h3 className="text-lg font-medium text-white mt-4 mb-2">Advertising Opt-Out</h3>
                <p>You can opt out of personalized advertising by:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Visiting <a href="https://www.google.com/settings/ads" className="text-blue-400 hover:text-blue-300">Google Ads Settings</a></li>
                  <li>Using the <a href="https://optout.aboutads.info/" className="text-blue-400 hover:text-blue-300">Digital Advertising Alliance opt-out tool</a></li>
                  <li>Enabling "Do Not Track" in your browser</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Impact of Disabling Cookies</h2>
                <p>Disabling certain cookies may impact your experience:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Essential cookies:</strong> The site may not function properly</li>
                  <li><strong>Functional cookies:</strong> You may lose saved preferences</li>
                  <li><strong>Analytics cookies:</strong> We won't be able to improve the site based on usage data</li>
                  <li><strong>Advertising cookies:</strong> You may see less relevant ads</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Contact Us</h2>
                <p>If you have questions about our use of cookies, please contact us at:</p>
                <p>Email: privacy@sleepersheets.com</p>
                <p>Twitter: <a href="https://x.com/dustybeerbong" className="text-blue-400 hover:text-blue-300">@dustybeerbong</a></p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CookiePolicy;
