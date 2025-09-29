
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Users, TrendingUp, Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import PageHead from '@/components/PageHead';

const About = () => {
  return (
    <div className="min-h-screen">
      <PageHead 
        title="About SleeperSheets"
        description="Learn about SleeperSheets - The ultimate fantasy football salary cap and contract management tool for dynasty leagues."
        canonicalUrl="https://sleepersheets.com/about"
      />
      
      {/* Header */}
      <div className="glass-header border-b border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-emerald-600/10 animate-pulse"></div>
        <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="bg-gradient-to-br from-primary to-primary-glow rounded-2xl p-4 shadow-2xl">
              <Trophy className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">About SleeperSheets</h1>
              <p className="text-gray-300 text-lg">The ultimate fantasy football salary cap management tool</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="mb-8">
          <CardContent className="space-y-8 pt-6">
            <section className="text-gray-300">
              <h2 className="text-2xl font-semibold text-white mb-4">What is SleeperSheets?</h2>
              <p className="text-lg leading-relaxed">
                SleeperSheets is a comprehensive web-based tool designed specifically for fantasy football dynasty league managers who want to implement salary cap and contract systems. Built to integrate seamlessly with Sleeper fantasy leagues, our platform provides the tools you need to add a new dimension of strategy and realism to your fantasy football experience.
              </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                    <h3 className="text-xl font-semibold text-white">Real-time Tracking</h3>
                  </div>
                  <p className="text-gray-300">
                    Monitor player salaries, contract lengths, and salary cap usage in real-time. Our system automatically calculates dead cap penalties and helps you stay under your league's salary cap.
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Users className="w-6 h-6 text-blue-500" />
                    <h3 className="text-xl font-semibold text-white">Team Management</h3>
                  </div>
                  <p className="text-gray-300">
                    Manage contracts for your entire roster, simulate trades with salary cap implications, and plan for future seasons with comprehensive contract tracking.
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Shield className="w-6 h-6 text-purple-500" />
                    <h3 className="text-xl font-semibold text-white">League Ownership</h3>
                  </div>
                  <p className="text-gray-300">
                    Secure league ownership system ensures only authorized users can modify salary and contract data, while maintaining transparency for all league members.
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    <h3 className="text-xl font-semibold text-white">Export & AI</h3>
                  </div>
                  <p className="text-gray-300">
                    Export your league data in multiple formats and leverage AI-powered insights to optimize your team's salary cap strategy and contract decisions.
                  </p>
                </CardContent>
              </Card>
            </div>

            <section className="text-gray-300">
              <h2 className="text-2xl font-semibold text-white mb-4">How It Works</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</div>
                  <div>
                    <h3 className="font-semibold text-white">Connect Your League</h3>
                    <p>Enter your Sleeper league ID to automatically import your league's roster and player data.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</div>
                  <div>
                    <h3 className="font-semibold text-white">Set Up Salary Cap</h3>
                    <p>Configure your league's salary cap settings, including cap amount, contract rules, and dead cap penalties.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</div>
                  <div>
                    <h3 className="font-semibold text-white">Manage Contracts</h3>
                    <p>Assign salaries and contract lengths to players, track dead cap implications, and simulate trades.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">4</div>
                  <div>
                    <h3 className="font-semibold text-white">Strategic Planning</h3>
                    <p>Use our tools to plan future moves, optimize your roster, and gain a competitive advantage in your league.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="text-gray-300">
              <h2 className="text-2xl font-semibold text-white mb-4">Why Choose SleeperSheets?</h2>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span><strong>Free to Use:</strong> Core features are completely free with no hidden costs</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span><strong>Sleeper Integration:</strong> Seamlessly works with your existing Sleeper leagues</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span><strong>Real-time Updates:</strong> Always stay current with automatic data synchronization</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span><strong>Secure & Private:</strong> Your league data is protected with enterprise-grade security</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span><strong>Mobile Friendly:</strong> Manage your team from any device, anywhere</span>
                </li>
              </ul>
            </section>

            <section className="text-gray-300">
              <h2 className="text-2xl font-semibold text-white mb-4">Contact & Support</h2>
              <p className="mb-4">
                SleeperSheets is developed and maintained by fantasy football enthusiasts who understand the importance of strategic team management. We're committed to providing the best possible experience for dynasty league managers.
              </p>
              <div className="space-y-2">
                <p><strong>Developer:</strong> <a href="https://x.com/dustybeerbong" className="text-blue-400 hover:text-blue-300">@dustybeerbong</a></p>
                <p><strong>Support Email:</strong> support@sleepersheets.com</p>
                <p><strong>Feature Requests:</strong> feedback@sleepersheets.com</p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;
