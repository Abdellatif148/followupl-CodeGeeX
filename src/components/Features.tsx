import React from 'react'
import { Brain, FileText, Users } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'AI Reminders',
    description: 'Smart notifications to follow up before deals go cold',
    details: 'Our AI analyzes your client interactions and suggests the perfect timing for follow-ups, increasing your conversion rate.'
  },
  {
    icon: FileText,
    title: 'Invoice Tracker',
    description: 'Track unpaid invoices, auto-reminders, and status',
    details: 'Never chase payments manually again. Automated reminders and detailed tracking keep your cash flow healthy.'
  },
  {
    icon: Users,
    title: 'Client Organizer',
    description: 'Keep notes, project status, and contact info',
    details: 'Centralize all client information in one place. From project timelines to communication history.'
  }
]

export default function Features() {
  return (
    <section id="features" className="py-20 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Powerful Tools, Built for Freelancers
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Everything you need to stay organized, get paid faster, and never miss an opportunity.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative"
            >
              <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 rounded-3xl p-8 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-2xl transition-all duration-500 h-full">
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                      <feature.icon className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {feature.title}
                  </h3>
                  
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                    {feature.description}
                  </p>
                  
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                    {feature.details}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}