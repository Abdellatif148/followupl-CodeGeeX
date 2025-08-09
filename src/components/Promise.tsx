import React from 'react'
import { Shield, Target, Zap } from 'lucide-react'

const promiseCards = [
  {
    icon: Shield,
    title: 'No more forgotten invoices',
    description: 'Automated reminders ensure you get paid on time, every time.'
  },
  {
    icon: Target,
    title: 'Stay in control of every client',
    description: 'Organize client information, project status, and communication history in one place.'
  },
  {
    icon: Zap,
    title: 'Let AI do the follow-ups for you',
    description: 'Smart notifications tell you exactly when and how to follow up for maximum impact.'
  }
]

export default function Promise() {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Why FollowUply?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Freelancers lose income and time due to poor tracking. FollowUply gives you 
            the tools to stay on top of your work and relationships.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {promiseCards.map((card, index) => (
            <div 
              key={index}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group hover:-translate-y-2 border border-gray-200 dark:border-gray-700"
            >
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <card.icon className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {card.title}
              </h3>
              
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}