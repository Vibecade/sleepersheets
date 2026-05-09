import { Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const SuperAdminBanner = () => {
  return (
    <Alert className="sticky top-2 z-30 mb-4 border-amber-500/50 bg-amber-500/10 text-amber-100">
      <Eye className="h-4 w-4" />
      <AlertDescription className="font-medium">
        Viewing as Super Admin — Read Only
      </AlertDescription>
    </Alert>
  );
};
