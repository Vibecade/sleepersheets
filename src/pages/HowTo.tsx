
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Copy, CheckCircle, Sparkles, FileSpreadsheet, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const HowTo = () => {
  const { toast } = useToast();

  const chatGptPrompt = `I am uploading my Sleeper fantasy football league export files. Please create a formatted, multi-sheet Google Sheets document for me with the following requirements:

1. **Team Sheets:**  
   - Create a separate sheet for each team, using the roster export.  
   - Columns: Player Name, Position, NFL Team, Fantasy Salary (if present), and any other relevant info.
   - At the top of each team sheet, display the sum of all player salaries as "Team Total Salary".

2. **Main Sheet:**  
   - Add a "Main" summary sheet with:
     - Each team’s name
     - Total team salary (from their tab)
     - Number of players per team
     - *Any included league-wide information (see below) should also appear on this sheet or be clearly referenced.*

3. **Additional League Information:**  
   - If the exports include **League Rules**, **FAAB Information**, or **Draft Order**, display these as follows:
     - Create a separate sheet for each (named "League Rules", "FAAB", and "Draft Order" as appropriate).
     - On the "Main" summary sheet, also include a brief section at the top with key highlights or a link/reference to these sheets.

4. **Transactions Sheet:**  
   - If a transactions export is provided, add a "Transactions" sheet listing:
     - Date
     - Player
     - Type (draft, waiver, trade, drop)
     - Teams involved

5. **Formatting:**  
   - Use bold headers, alternate row shading, and auto-size columns.
   - Ensure all salaries are formatted as numbers (remove any "$" or extra symbols).
   - Clearly label each section/sheet for ease of navigation.

6. **Output:**  
   - Provide me with a downloadable multi-sheet Excel or Google Sheets file, ready for import.

[Attach my Sleeper CSV export files below]

`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(chatGptPrompt);
      toast({
        title: "Copied to clipboard!",
        description: "The ChatGPT prompt has been copied to your clipboard."
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please manually copy the text below.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen">
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
            <div className="bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 rounded-2xl p-4 shadow-2xl pulse-glow">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">How to Use SleeperSheets</h1>
              <p className="text-gray-300 text-lg">Maximize your fantasy football data with AI-powered analysis</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        {/* Step 1 */}
        <Card className="fade-in hover-lift gradient-border">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">Step 1</Badge>
              <CardTitle className="text-white text-2xl">Export Your Data</CardTitle>
            </div>
            <CardDescription className="text-gray-300 text-lg">
              Use SleeperSheets to download clean, formatted CSV files from your Sleeper league
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="glass p-6 rounded-xl">
              <ul className="text-gray-200 space-y-3 list-disc list-inside">
                <li><strong className="text-emerald-300">Enter your League ID</strong> or username to connect to your Sleeper league</li>
                <li><strong className="text-emerald-300">Preview your data</strong> in the interactive dashboard to verify everything looks correct</li>
                <li><strong className="text-emerald-300">Download CSV files</strong> for rosters, transactions, and draft data</li>
                <li><strong className="text-emerald-300">Clean format guaranteed</strong> - no IDs or raw data, just readable information</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Step 2 */}
        <Card className="fade-in hover-lift gradient-border" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">Step 2</Badge>
              <CardTitle className="text-white text-2xl">Upload to ChatGPT</CardTitle>
            </div>
            <CardDescription className="text-gray-300 text-lg">
              Let AI transform your data into professional spreadsheet analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="glass p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-white text-lg flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-yellow-400" />
                  Copy this prompt to ChatGPT:
                </h4>
                <Button onClick={copyToClipboard} variant="outline" size="sm">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Prompt
                </Button>
              </div>
              <div className="bg-slate-900/80 rounded-lg p-4 border border-slate-700">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                  {chatGptPrompt}
                </pre>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass p-4 rounded-xl">
                <h5 className="font-semibold text-emerald-300 mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  What You'll Get:
                </h5>
                <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                  <li>Individual team sheets with salary totals</li>
                  <li>Main summary with team comparisons</li>
                  <li>Transaction history analysis</li>
                  <li>Professional formatting and styling</li>
                </ul>
              </div>
              <div className="glass p-4 rounded-xl">
                <h5 className="font-semibold text-blue-300 mb-2 flex items-center">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Pro Tips:
                </h5>
                <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                  <li>Upload all CSV files at once for best results</li>
                  <li>Ask ChatGPT for additional analysis</li>
                  <li>Request custom charts and visualizations</li>
                  <li>Export as Excel for sharing with league mates</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3 */}
        <Card className="fade-in hover-lift gradient-border" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">Step 3</Badge>
              <CardTitle className="text-white text-2xl">Analyze & Share</CardTitle>
            </div>
            <CardDescription className="text-gray-300 text-lg">
              Use your professional spreadsheet for league insights and strategic planning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="glass p-6 rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full p-3 w-16 h-16 mx-auto mb-3">
                    <FileSpreadsheet className="w-10 h-10 text-white" />
                  </div>
                  <h5 className="font-semibold text-emerald-300 mb-2">Team Analysis</h5>
                  <p className="text-sm text-gray-300">Compare roster values, identify strengths and weaknesses</p>
                </div>
                <div className="text-center">
                  <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-full p-3 w-16 h-16 mx-auto mb-3">
                    <Bot className="w-10 h-10 text-white" />
                  </div>
                  <h5 className="font-semibold text-blue-300 mb-2">AI Insights</h5>
                  <p className="text-sm text-gray-300">Ask ChatGPT for trade recommendations and strategies</p>
                </div>
                <div className="text-center">
                  <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-full p-3 w-16 h-16 mx-auto mb-3">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h5 className="font-semibold text-purple-300 mb-2">League Reports</h5>
                  <p className="text-sm text-gray-300">Share professional reports with your league</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center pt-8">
          <Link to="/">
            <Button size="lg" className="px-8 py-4 text-lg">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Start Exporting Your Data
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HowTo;
