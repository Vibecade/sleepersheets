
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			screens: {
				'xs': '380px',
				'sm': '640px',
				'md': '768px',
				'lg': '1024px',
				'xl': '1280px',
				'2xl': '1536px',
			},
			fontFamily: {
				'display': ['Bebas Neue', 'system-ui', 'sans-serif'],
				'headline': ['Oswald', 'system-ui', 'sans-serif'],
				'sans': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
				'mono': ['JetBrains Mono', 'ui-monospace', 'monospace'],
				'tech': ['Orbitron', 'system-ui', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))',
					deep: 'hsl(var(--primary-deep))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					glow: 'hsl(var(--secondary-glow))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'stadium-entrance': {
					'0%': {
						opacity: '0',
						transform: 'scale(0.9) translateY(40px)',
						filter: 'blur(10px)'
					},
					'50%': {
						opacity: '0.8',
						transform: 'scale(0.98) translateY(10px)',
						filter: 'blur(2px)'
					},
					'100%': {
						opacity: '1',
						transform: 'scale(1) translateY(0)',
						filter: 'blur(0)'
					}
				},
				'scoreboard-flip': {
					'0%': { transform: 'perspective(400px) rotateX(0deg)' },
					'50%': { transform: 'perspective(400px) rotateX(-90deg)' },
					'100%': { transform: 'perspective(400px) rotateX(0deg)' }
				},
				'helmet-glow': {
					'0%': { 
						boxShadow: '0 0 20px rgba(255,215,0,0.3)',
						transform: 'scale(1)'
					},
					'100%': { 
						boxShadow: '0 0 40px rgba(255,215,0,0.6), 0 0 60px rgba(220,20,60,0.2)',
						transform: 'scale(1.02)'
					}
				},
				'jersey-pulse': {
					'0%, 100%': { 
						backgroundPosition: '0% 50%',
						filter: 'brightness(1)'
					},
					'50%': { 
						backgroundPosition: '100% 50%',
						filter: 'brightness(1.1)'
					}
				},
				'field-flash': {
					'0%, 100%': { opacity: '0.1' },
					'50%': { opacity: '0.3' }
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'stadium-entrance': 'stadium-entrance 0.8s cubic-bezier(0.23, 1, 0.320, 1)',
				'helmet-glow': 'helmet-glow 2s ease-in-out infinite alternate',
				'field-flash': 'field-flash 3s ease-in-out infinite'
			}
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;
