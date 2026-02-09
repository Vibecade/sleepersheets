
import React from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Shield, Users } from 'lucide-react';

const Auth = () => {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already authenticated and scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      toast({
        title: "Sign In Error",
        description: "Failed to sign in with Google. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background pattern matching the main site */}
      <div className="absolute inset-0 field-pattern opacity-30" />
      
      <Card className="w-full max-w-md glass-card border-primary/30 shadow-glow relative z-10 fade-in">
        <CardHeader className="text-center space-y-4 sm:space-y-6 p-4 sm:p-8">
          <div className="mx-auto bg-gradient-to-br from-primary to-primary-glow rounded-xl p-3 sm:p-4 w-fit shadow-glow">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl sm:text-3xl font-headline font-bold text-foreground mb-2 sm:mb-3">
              Protect Your League
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Sign in to claim your league and protect your salary cap and contract settings
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 sm:space-y-8 p-4 sm:p-8 pt-0">
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center space-x-3 sm:space-x-4 text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <span className="text-foreground font-medium text-sm sm:text-base">Claim league ownership</span>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4 text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <span className="text-foreground font-medium text-sm sm:text-base">Lock settings to prevent changes</span>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4 text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <span className="text-foreground font-medium text-sm sm:text-base">Preserve all your data</span>
            </div>
          </div>

          <Button 
            onClick={handleGoogleSignIn}
            className="w-full glass-button bg-card hover:bg-card/80 text-foreground border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow h-12 sm:h-14 text-sm sm:text-base font-semibold"
            variant="outline"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            By signing in, you agree to protect your league data and maintain fair play
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
