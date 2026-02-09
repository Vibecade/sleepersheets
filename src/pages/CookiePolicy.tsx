
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Cookie } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHead from '@/components/PageHead';

const CookiePolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <PageHead 
        title="Cookie Policy"
        description="Cookie Policy for SleeperSheets - Learn about how we use cookies and tracking technologies."
        canonicalUrl="https://sleepersheets.com/cookies"
      />
      
      {/* Header */}
      <div className="glass-header border-b border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-emerald-600/10 animate-pulse"></div>
        <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl p-4 shadow-2xl">
              <Cookie className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">Cookie Policy</h1>
              <p className="text-gray-300 text-lg">How we use cookies and tracking</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="mb-8">
          <CardContent className="prose prose-invert max-w-none pt-6">
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
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Third-Party Cookies</h2>
                <p>We use services from third parties that may set their own cookies:</p>
                <ul className="list-disc pl-6 space-y-2">
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

              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Impact of Disabling Cookies</h2>
                <p>Disabling certain cookies may impact your experience:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Essential cookies:</strong> The site may not function properly</li>
                  <li><strong>Functional cookies:</strong> You may lose saved preferences</li>
                  <li><strong>Analytics cookies:</strong> We won't be able to improve the site based on usage data</li>
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
