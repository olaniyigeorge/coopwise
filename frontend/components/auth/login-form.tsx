"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/lib/hooks/use-app-store';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import StorageService from '@/lib/storage-service';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  
  const { login, isLoading, error, clearError } = useAuthStore();
  const { toast } = useToast();
  const router = useRouter();

  // Load saved username and remember me preference on mount
  useEffect(() => {
    const savedUsername = StorageService.getUsername();
    const shouldRemember = StorageService.shouldRememberUsername();
    
    if (savedUsername) {
      setUsername(savedUsername);
    }
    
    if (shouldRemember) {
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous errors
    clearError();
    
    try {
      await login({ username, password, rememberMe });
      
      toast({
        title: "Login Successful",
        description: "Welcome back to CoopWise!",
      });
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isFormFilled = username.trim() !== "" && password.trim() !== ""

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full">
      <div className="mb-6">
        <div className="flex justify-start">
          <Link href="/" className="inline-block mb-4">
            <button className="text-sm text-secondary flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back
            </button>
          </Link>
        </div>
        <h2 className="text-xl font-semibold text-center text-primary">Welcome Back</h2>
        <p className="text-sm text-center text-secondary mt-1">Sign in to your account to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-1">
          <Label htmlFor="username" className="text-sm font-medium text-gray-700">Email</Label>
          <Input
            id="email"
            type="text"
            placeholder="Enter your email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full h-10 border border-gray-300 rounded"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-10 border border-gray-300 rounded pr-10"
              disabled={isLoading}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              tabIndex={-1}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="remember" 
              checked={rememberMe} 
              onCheckedChange={(checked) => setRememberMe(checked as boolean)} 
              className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2 focus:ring-offset-2"
              disabled={isLoading}
            />
            <label
              htmlFor="remember"
              className="text-sm font-medium text-gray-700 cursor-pointer select-none"
            >
              Remember me
            </label>
          </div>
          <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/90">
            Forgot Password?
          </Link>
        </div>

        <Button 
          type="submit" 
          disabled={!isFormFilled || isLoading}
          className={`w-full h-10 font-medium rounded mt-2 ${
            isFormFilled && !isLoading
            ? "bg-primary hover:bg-primary/90 text-white" 
            : "bg-gray-200 text-gray-500"
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Signing In...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <div className="text-center mt-4">
        <p className="text-sm text-secondary">
         Don&apos;t have an account? <Link href="/auth/signup" className="text-primary hover:text-primary/90 font-medium">Sign Up</Link>
        </p>
      </div>
    </div>
  );
} 