import React from 'react'
import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  image?: string
  url?: string
  type?: string
  noIndex?: boolean
}

export function SEO({
  title = "FollowUply - AI Client Tracker for Freelancers | Get Paid On Time",
  description = "AI-powered client tracker that helps freelancers get paid on time with smart reminders, invoice tracking, and client management. Perfect for Fiverr, Upwork, and solo developers.",
  keywords = "freelance client tracker, get paid, invoice reminders, AI follow-up, freelance productivity, client management, freelancer tools, payment tracking, Fiverr tools, Upwork tools",
  image = "https://followuply.vercel.app/followuplyImage.png",
  url = "https://followuply.vercel.app",
  type = "website",
  noIndex = false
}: SEOProps) {
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Abdellatif Choukri" />
      
      {/* Robots */}
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="FollowUply" />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="FollowUply - AI Client Tracker for Freelancers" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content="FollowUply - AI Client Tracker for Freelancers" />
      <meta name="twitter:site" content="@followuply" />
      <meta name="twitter:creator" content="@abdellatifchoukri" />
      
      {/* LinkedIn Meta Tags */}
      <meta property="linkedin:title" content={title} />
      <meta property="linkedin:description" content={description} />
      <meta property="linkedin:image" content={image} />
      
      {/* Additional Meta Tags */}
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="theme-color" content="#6366f1" />
    </Helmet>
  )
}