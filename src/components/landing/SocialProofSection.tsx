import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Quote, Twitter, MessageCircle } from 'lucide-react';

const SocialProofSection: React.FC = () => {
  const testimonials = [
    {
      quote: "SleeperSheets completely transformed how we manage our 12-team dynasty league. The salary cap tracking is flawless and the trade simulator has saved us countless hours of manual calculations.",
      author: "Mike Chen",
      role: "League Commissioner",  
      league: "Dynasty Warriors League",
      rating: 5
    },
    {
      quote: "I use SleeperSheets for both my dynasty league and regular redraft leagues. The performance analytics help me see how I'm doing vs league averages, and the export features are perfect for our season recap.",
      author: "Sarah Johnson", 
      role: "Fantasy Manager",
      league: "Elite Fantasy Football", 
      rating: 5
    },
    {
      quote: "The data export features are incredible for our keeper league. We can generate detailed reports for our annual meeting and track multi-year performance trends perfectly.",
      author: "David Rodriguez",
      role: "League Treasurer", 
      league: "Championship Keeper League",
      rating: 5
    }
  ];

  const benefits = [
    "Start for Free with core features",
    "Secure data with league ownership protection", 
    "Real-time salary cap tracking",
    "Advanced contract management",
    "Comprehensive trade analysis",
    "Professional export capabilities"
  ];

  return (
    <section className="py-16 sm:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Community Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Join the <span className="gradient-text">Fantasy Community</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Connect with fellow fantasy managers, share strategies, and stay updated on the latest features.
          </p>

          <div className="flex justify-center gap-6">
            <Button 
              variant="outline" 
              size="lg"
              className="glass-card hover-lift group"
              onClick={() => {/* Twitter link will be added later */}}
            >
              <Twitter className="w-5 h-5 mr-2 group-hover:text-primary transition-colors" />
              Follow on Twitter
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="glass-card hover-lift group"
              onClick={() => {/* Discord link will be added later */}}
            >
              <MessageCircle className="w-5 h-5 mr-2 group-hover:text-primary transition-colors" />
              Join Discord
            </Button>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              What Fantasy Managers Say
            </h3>
            <p className="text-lg text-muted-foreground">
              Real feedback from dynasty, keeper, and regular league commissioners and managers
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="glass-card hover-lift h-full">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  
                  <div className="mb-6">
                    <Quote className="w-6 h-6 text-primary mb-3" />
                    <p className="text-muted-foreground leading-relaxed italic">
                      "{testimonial.quote}"
                    </p>
                  </div>

                  <div className="border-t border-border/50 pt-4">
                    <div className="font-semibold text-foreground">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {testimonial.league}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="glass-card p-8">
          <h3 className="text-2xl font-bold text-center mb-8">
            Why Choose <span className="text-primary">SleeperSheets</span>?
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-success rounded-full flex-shrink-0"></div>
                <span className="text-muted-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;