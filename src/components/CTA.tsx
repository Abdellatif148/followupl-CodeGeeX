import React from 'react'
import { Link } from 'react-router-dom'

export default function CTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 dark:from-black dark:via-gray-900 dark:to-purple-900 relative overflow-hidden transition-colors duration-300">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/6 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/6 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
          Ready to Transform Your{' '}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Freelance Business?
          </span>
        </h2>
        
        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
          Join thousands of freelancers who never miss a follow-up or payment again.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            to="/signup"
            className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-semibold text-lg"
          >
            Start Free Today
          </Link>
          <Link
            to="/login"
            className="border-2 border-white/50 text-white px-8 py-4 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 transition-all duration-200 font-semibold text-lg"
          >
            Sign In
          </Link>
        </div>

        <p className="text-gray-300 text-sm">
          No credit card required • Free forever plan available
        </p>
      </div>
    </section>
  )
}