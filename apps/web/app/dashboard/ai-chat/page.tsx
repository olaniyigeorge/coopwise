"use client"

import React, { useEffect } from 'react'
import AIChatInterface from '@/components/ai/chat-interface'
import DashboardLayout from '@/components/dashboard/layout'

export default function AIChatPage() {
  // Add a class to the main element to remove padding for the chat interface
  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.classList.add('p-0');
      
      // Cleanup function to remove the class when component unmounts
      return () => {
        mainElement.classList.remove('p-0');
      };
    }
  }, []);

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 lg:gap-4">
        <div className="col-span-1 lg:col-span-3">
          <AIChatInterface />
        </div>
        
        <div className="hidden lg:block space-y-3 lg:pr-6">
          <div className="bg-card rounded-lg p-3 border">
            <h3 className="font-medium text-base mb-1">About AI Assistant</h3>
            <p className="text-xs text-muted-foreground mb-2">
              Your personal AI financial advisor is here to help you make better savings and financial decisions.
            </p>
            <ul className="space-y-1 text-xs">
              <li className="flex items-start gap-2">
                <span className="bg-primary/10 text-primary rounded-full p-1 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                  </svg>
                </span>
                <span>Get personalized savings advice</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary/10 text-primary rounded-full p-1 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                  </svg>
                </span>
                <span>Learn budgeting strategies</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary/10 text-primary rounded-full p-1 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                  </svg>
                </span>
                <span>Discover investment opportunities</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary/10 text-primary rounded-full p-1 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                  </svg>
                </span>
                <span>Get answers to financial questions</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-card rounded-lg p-3 border">
            <h3 className="font-medium text-base mb-1">Tips for Better Results</h3>
            <ul className="space-y-1 text-xs">
              <li className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-600 rounded-full p-1 mt-0.5 text-xs font-bold">1</span>
                <span>Be specific about your financial goals</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-600 rounded-full p-1 mt-0.5 text-xs font-bold">2</span>
                <span>Provide context about your financial situation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-600 rounded-full p-1 mt-0.5 text-xs font-bold">3</span>
                <span>Ask follow-up questions for more details</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-600 rounded-full p-1 mt-0.5 text-xs font-bold">4</span>
                <span>Try the suggested prompts for quick answers</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-amber-50 text-amber-800 rounded-lg p-3 border border-amber-200">
            <h3 className="font-medium text-base mb-1">Important Note</h3>
            <p className="text-xs mb-1">
              This AI assistant provides general financial guidance and is not a substitute for professional financial advice.
            </p>
            <p className="text-xs">
              Always consult with a qualified financial advisor for personalized recommendations.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 