
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, TrendingUp, Calendar, CheckCircle, ArrowRight } from 'lucide-react';

const ProTierUpgrade = () => {
  return (
    <Card className="bg-gradient-to-br from-amber-50/10 to-yellow-100/10 border-amber-400/30 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-400/5 via-yellow-500/5 to-orange-500/5"></div>
      
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl p-3 shadow-lg">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <CardTitle className="text-2xl gradient-text">Dynasty Pro</CardTitle>
                <Badge className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white">
                  Coming Soon
                </Badge>
              </div>
              <p className="text-amber-300/80 text-sm mt-1">
                Set it and forget it - no more spreadsheet headaches
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-6">
        {/* Value Proposition */}
        <div className="text-center py-4">
          <h3 className="text-xl font-bold text-white mb-2">
            Stop Managing Spreadsheets, Start Managing Champions
          </h3>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Upgrade to Dynasty Pro and let our advanced automation handle all the tedious work. 
            Focus on winning instead of endless Excel calculations.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass p-4 rounded-xl">
            <div className="flex items-start space-x-3">
              <div className="bg-emerald-500/20 rounded-lg p-2 mt-1">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Automated Salary Tracking</h4>
                <p className="text-gray-300 text-sm">
                  Real-time salary cap monitoring with instant alerts when you're approaching limits
                </p>
              </div>
            </div>
          </div>

          <div className="glass p-4 rounded-xl">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-500/20 rounded-lg p-2 mt-1">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Smart Trade Analyzer</h4>
                <p className="text-gray-300 text-sm">
                  AI-powered trade suggestions and impact analysis for every roster move
                </p>
              </div>
            </div>
          </div>

          <div className="glass p-4 rounded-xl">
            <div className="flex items-start space-x-3">
              <div className="bg-purple-500/20 rounded-lg p-2 mt-1">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Contract Automation</h4>
                <p className="text-gray-300 text-sm">
                  Automatic contract renewals and dead cap calculations - zero manual work
                </p>
              </div>
            </div>
          </div>

          <div className="glass p-4 rounded-xl">
            <div className="flex items-start space-x-3">
              <div className="bg-amber-500/20 rounded-lg p-2 mt-1">
                <CheckCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Weekly Reports</h4>
                <p className="text-gray-300 text-sm">
                  Professional league reports delivered to your inbox every week
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison */}
        <div className="bg-gradient-to-r from-red-500/10 to-green-500/10 rounded-xl p-6 border border-amber-400/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <h4 className="text-red-400 font-semibold mb-3">❌ Current Reality</h4>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>Hours spent on spreadsheet updates</li>
                <li>Manual salary cap calculations</li>
                <li>Error-prone contract tracking</li>
                <li>Missed trade opportunities</li>
              </ul>
            </div>
            <div className="text-center">
              <h4 className="text-emerald-400 font-semibold mb-3">✅ Dynasty Pro Future</h4>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>100% automated management</li>
                <li>Real-time cap monitoring</li>
                <li>AI-powered insights</li>
                <li>Championship-focused strategy</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-4">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
            disabled
          >
            <Crown className="w-5 h-5 mr-2" />
            Get Early Access - Coming Soon
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-amber-300/60 text-sm mt-3">
            Be the first to know when Dynasty Pro launches
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProTierUpgrade;
