import React from 'react'
import { Helmet } from 'react-helmet-async'
import Navigation from '../components/Navigation'
import Hero from '../components/Hero'
import Promise from '../components/Promise'
import Features from '../components/Features'
import HowItWorks from '../components/HowItWorks'
import About from '../components/About'
import CTA from '../components/CTA'
import Footer from '../components/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Helmet>
        <title>FollowUply - AI Client Tracker for Freelancers | Get Paid On Time</title>
        <meta name="description" content="AI-powered client tracker that helps freelancers get paid on time with smart reminders, invoice tracking, and client management. Perfect for Fiverr, Upwork, and solo developers." />
        <link rel="canonical" href="https://fcodegeex.vercel.app/" />
        <meta property="og:url" content="https://fcodegeex.vercel.app/" />
        <meta property="og:type" content="website" />
      </Helmet>
      <Navigation />
      <Hero />
      <Promise />
      <Features />
      <HowItWorks />
      <About />
      <CTA />
      <Footer />
    </div>
  )
}