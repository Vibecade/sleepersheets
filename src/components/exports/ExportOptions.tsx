
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings, Info } from 'lucide-react';

interface ExportOptionsProps {
  onOptionsChange: (options: ExportOptionsData) => void;
}

export interface ExportOptionsData {
  includeLeagueRules: boolean;
  leagueRules: string;
  includeFAAB: boolean;
  faabBudget: string;
  faabNotes: string;
  includeDraftOrder: boolean;
  draftOrder: string;
}

const ExportOptions: React.FC<ExportOptionsProps> = ({ onOptionsChange }) => {
  const [options, setOptions] = useState<ExportOptionsData>({
    includeLeagueRules: false,
    leagueRules: '',
    includeFAAB: false,
    faabBudget: '',
    faabNotes: '',
    includeDraftOrder: false,
    draftOrder: ''
  });

  const updateOptions = (newOptions: Partial<ExportOptionsData>) => {
    const updatedOptions = { ...options, ...newOptions };
    setOptions(updatedOptions);
    onOptionsChange(updatedOptions);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-2">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Export Options</CardTitle>
            <CardDescription>
              Add optional league information to include in your CSV exports
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* League Rules Section */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-rules"
              checked={options.includeLeagueRules}
              onCheckedChange={(checked) => 
                updateOptions({ includeLeagueRules: checked as boolean })
              }
            />
            <Label htmlFor="include-rules" className="text-sm font-medium">
              Include League Rules
            </Label>
          </div>
          {options.includeLeagueRules && (
            <div>
              <Label htmlFor="league-rules" className="text-sm text-gray-600">
                League Rules & Scoring
              </Label>
              <Textarea
                id="league-rules"
                placeholder="Enter your league rules, scoring system, playoff format, etc..."
                value={options.leagueRules}
                onChange={(e) => updateOptions({ leagueRules: e.target.value })}
                className="mt-1 min-h-[100px]"
              />
            </div>
          )}
        </div>

        {/* FAAB Section */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-faab"
              checked={options.includeFAAB}
              onCheckedChange={(checked) => 
                updateOptions({ includeFAAB: checked as boolean })
              }
            />
            <Label htmlFor="include-faab" className="text-sm font-medium">
              Include FAAB Information
            </Label>
          </div>
          {options.includeFAAB && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="faab-budget" className="text-sm text-gray-600">
                  FAAB Budget per Team
                </Label>
                <Input
                  id="faab-budget"
                  placeholder="e.g., $100"
                  value={options.faabBudget}
                  onChange={(e) => updateOptions({ faabBudget: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="faab-notes" className="text-sm text-gray-600">
                  FAAB Notes
                </Label>
                <Textarea
                  id="faab-notes"
                  placeholder="Additional FAAB rules, blind bidding process, etc..."
                  value={options.faabNotes}
                  onChange={(e) => updateOptions({ faabNotes: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </div>

        {/* Draft Order Section */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-draft-order"
              checked={options.includeDraftOrder}
              onCheckedChange={(checked) => 
                updateOptions({ includeDraftOrder: checked as boolean })
              }
            />
            <Label htmlFor="include-draft-order" className="text-sm font-medium">
              Include Draft Order
            </Label>
          </div>
          {options.includeDraftOrder && (
            <div>
              <Label htmlFor="draft-order" className="text-sm text-gray-600">
                Draft Order & Details
              </Label>
              <Textarea
                id="draft-order"
                placeholder="Enter draft order, draft type (snake, linear), date/time, etc..."
                value={options.draftOrder}
                onChange={(e) => updateOptions({ draftOrder: e.target.value })}
                className="mt-1"
              />
            </div>
          )}
        </div>

        <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            This additional information will be included as separate sheets or sections in your CSV exports when enabled.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportOptions;
