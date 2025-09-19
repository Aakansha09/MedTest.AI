import React from 'react';
import { GoogleIcon } from '../components/icons/GoogleIcon';
import { LogoIcon } from '../components/icons/LogoIcon';

interface LoginProps {
  onLogin: () => void;
}

const FeatureCard: React.FC<{ title: string; description: string, icon?: React.ReactNode }> = ({ title, description }) => (
    <div className="bg-surface p-6 rounded-xl border border-border-color transition-shadow hover:shadow-md">
        <h3 className="font-semibold text-text-primary">{title}</h3>
        <p className="text-sm text-text-secondary mt-2">{description}</p>
    </div>
);


export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-background flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        <div className="pr-8">
          <div className="flex items-center mb-6">
            <LogoIcon className="w-12 h-12" />
            <h1 className="text-3xl font-bold text-text-primary ml-4">MedTest AI</h1>
          </div>
          <p className="text-xl text-text-secondary mt-2 mb-8">Healthcare Test Case Generation Platform</p>
          <p className="text-text-secondary leading-relaxed mb-10">
            Transform your testing workflow with AI-powered test case generation. Create comprehensive test suites from requirements in minutes, not hours.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureCard title="AI-Powered Generation" description="Generate comprehensive test cases from requirements instantly using advanced AI." />
            <FeatureCard title="Built-in Traceability" description="Automatic traceability matrix linking requirements to test cases." />
            <FeatureCard title="Jira & Azure Integration" description="Seamlessly integrates with Jira, Azure DevOps, and TestRail." />
            <FeatureCard title="Export & Reports" description="Export to CSV, PDF reports, or upload directly to your tools." />
          </div>
        </div>

        <div className="bg-surface p-8 md:p-12 rounded-2xl shadow-xl border border-border-color">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-text-primary">Welcome back</h2>
            <p className="text-text-secondary mt-2 mb-8">Sign in to your MedTest AI account</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">Email</label>
                <input id="email" type="email" placeholder="Enter your email" required className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-3" />
              </div>
              <div>
                <label htmlFor="password"className="block text-sm font-medium text-text-primary mb-2">Password</label>
                <input id="password" type="password" placeholder="Enter your password" required className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-3" />
              </div>
            </div>

            <button type="submit" className="w-full mt-8 py-3 px-4 text-base font-medium text-white bg-primary hover:bg-primary-hover rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-transform hover:scale-105">
              Sign In
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-border-color"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-surface text-text-secondary">OR CONTINUE WITH</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center py-3 px-4 bg-white border border-border-color rounded-lg hover:bg-gray-50 text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary">
              <GoogleIcon className="w-5 h-5 mr-2" />
              Google
            </button>
            <button className="flex items-center justify-center py-3 px-4 bg-white border border-border-color rounded-lg hover:bg-gray-50 text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary">
              SSO
            </button>
          </div>

          <p className="text-center text-sm text-text-secondary mt-8">
            Don't have an account? <a href="#" className="font-medium text-primary hover:underline">Contact your administrator</a>
          </p>
        </div>
      </div>
    </div>
  );
};
