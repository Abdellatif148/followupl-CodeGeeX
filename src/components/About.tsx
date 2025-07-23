import React from 'react'

export default function About() {
  return (
    <section className="py-20 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center">
              <span className="text-4xl">👋</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 rounded-3xl p-8 sm:p-12 transition-colors duration-300">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              About the Creator
            </h2>
            
            <div className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed space-y-4">
              <p>
                "Hey! I'm <span className="font-semibold text-blue-600 dark:text-blue-400">Abdellatif</span>, 
                the creator of FollowUply. 👋
              </p>
              
              <p>
                I love freelancing, but I often found myself disorganized. Sometimes I didn't 
                get paid on time, or clients ghosted me after I forgot to follow up.
              </p>
              
              <p>
                I built FollowUply to fix this — and I hope it helps you too!"
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Contact:</span>{' '}
                <a 
                  href="mailto:followuplysc@gmail.com" 
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                >
                  followuplysc@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}