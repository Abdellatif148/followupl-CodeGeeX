import React from 'react'
import { Link } from 'react-router-dom'
import LazyImage from './LazyImage'

export default function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-black py-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <LazyImage 
                src="/followuplyImage-removebg-preview.png" 
                alt="FollowUply Logo" 
                className="w-12 h-12"
                width={48}
                height={48}
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                FollowUply
              </span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Never miss a follow-up or payment again. The AI-powered tool that helps freelancers stay organized and get paid faster.
            </p>
            <a 
              href="mailto:followuplysc@gmail.com"
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              followuplysc@gmail.com
            </a>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/clients" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Clients
                </Link>
              </li>
              <li>
                <Link to="/reminders" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Reminders
                </Link>
              </li>
              <li>
                <Link to="/invoices" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Invoices
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/support" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:followuplysc@gmail.com"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 FollowUply. Built with ❤️ for freelancers.
            </p>
            <p className="text-gray-500 text-sm mt-2 sm:mt-0">
              Helping freelancers stay organized and get paid.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}