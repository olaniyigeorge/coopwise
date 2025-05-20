"use client"

import React from 'react'
import Image from 'next/image'

export default function Features() {
  const features = [
    {
      icon: "/assets/icons/fluent_people-community-48-regular (1).svg",
      title: "Save with people you know",
      description: "Start a group with friends or join one you trust. Set simple rules everyone agrees on."
    },
    {
      icon: "/assets/icons/fluent_people-community-48-regular (1).svg",
      title: "Nothing Is Hidden",
      description: "Everyone can see the group's contributions and payouts. It's clear and secure."
    },
    {
      icon: "/assets/icons/fluent_people-community-48-regular (1).svg",
      title: "Get Gentle Saving Reminders",
      description: "Start a group with friends or join one you trust. Set simple rules everyone agrees on."
    }
  ]

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-16 text-primary">What makes CoopWise different</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#EFF6F5] rounded-full flex items-center justify-center mb-6">
                <Image 
                  src={feature.icon}
                  alt={feature.title}
                  width={24}
                  height={24}
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 