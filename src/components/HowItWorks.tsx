import React from 'react'
import { Plus, Bell, Send } from 'lucide-react'

const steps = [
  {
    icon: Plus,
    title: 'Add your client & project info',
    description: 'Quick setup with all the details that matter',
    details: 'Input client information, project timelines, invoice amounts, and communication preferences in just a few clicks.'
  },
  {
    icon: Bell,
    title: 'Get AI-powered reminders and tracking',
    description: 'Smart notifications keep you on top of everything',
    details: 'Our AI monitors your projects and sends you timely reminders for follow-ups, invoice due dates, and important milestones.'
  },
  {
    icon: Send,
    title: 'Send invoices on time — stay organized',
    description: 'Never miss a payment deadline again',
    details: 'Automated invoice reminders and payment tracking ensure you get paid faster while maintaining professional relationships.'
  }
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Get started in minutes and transform how you manage your freelance business.
          </p>
        </div>

        <div className="relative">
          {/* Connection lines for desktop */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-300 to-purple-300 transform -translate-y-1/2"></div>
          
          <div className="grid lg:grid-cols-3 gap-12 lg:gap-8 relative">
            {steps.map((step, index) => (
              <div key={index} className="text-center group">
                {/* Step number */}
                <div className="flex items-center justify-center mb-8 lg:mb-12">
                  <div className="relative">
                    <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full border-4 border-gray-200 dark:border-gray-600 flex items-center justify-center group-hover:border-blue-300 dark:group-hover:border-blue-500 transition-colors duration-300 relative z-10">
                      <step.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {step.title}
                  </h3>
                  
                  <p className="text-blue-600 dark:text-blue-400 font-medium mb-4">
                    {step.description}
                  </p>
                  
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {step.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}