"use client"

import React from 'react'
import Image from 'next/image'

export default function Testimonials() {
  const testimonials = [
    {
      name: "Mama Blessing, Owerri",
      groupName: "Oja Connect",
      avatar: "/assets/images/Ellipse 7.png",
      quote: "We used to do Ajo by word of mouth, now everyone sees what's happening. It's clearer and safer."
    },
    {
      name: "Chinedo, Onitsha",
      groupName: "Hustle and Save Gang",
      avatar: "/assets/images/Ellipse 7a.png",
      quote: "I like that I still save with my guys, but now we have reminders and records. Nobody dey argue payout again."
    },
    {
      name: "Aunty Kemi, Ibadan",
      groupName: "Ireti Savings Circle",
      avatar: "/assets/images/Ellipse 7b.png",
      quote: "Before CoopWise, we used to forget who had paid. Now we track everything together and there's no confusion."
    }
  ]

  return (
    <section className="py-10 md:py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-xl md:text-2xl font-semibold text-center mb-8 md:mb-12 text-primary">What our users are saying</h2>
        
        <div className="grid py-8 md:py-12 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 pt-12 gap-28 ">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="border border-gray-200 rounded-lg flex flex-col text-left pt-16 relative mx-auto w-full max-w-sm">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <Image 
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  width={110}
                  height={110}
                  className="rounded-full object-cover w-[110px] h-[110px] md:w-[140px] md:h-[140px]"
                />
              </div>
              <div className="px-4 pb-6 text-center">
                <h3 className="text-base font-semibold text-gray-900">{testimonial.name}</h3>
                <p className="text-sm text-gray-600 mt-2 mb-3">{testimonial.quote}</p>
                <p className="text-sm text-primary font-medium">{testimonial.groupName}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 