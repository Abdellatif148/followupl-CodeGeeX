import React from 'react'
import { Helmet } from 'react-helmet-async'

export function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://followuply.vercel.app/#organization",
        "name": "FollowUply",
        "url": "https://followuply.vercel.app",
        "logo": {
          "@type": "ImageObject",
          "url": "https://followuply.vercel.app/followuplyImage.png",
          "width": 512,
          "height": 512
        },
        "founder": {
          "@type": "Person",
          "name": "Abdellatif Choukri",
          "email": "followuplysc@gmail.com"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "email": "followuplysc@gmail.com",
          "contactType": "customer service"
        },
        "sameAs": [
          "https://twitter.com/followuply"
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://followuply.vercel.app/#website",
        "url": "https://followuply.vercel.app",
        "name": "FollowUply",
        "description": "AI-powered client tracker that helps freelancers get paid on time with smart reminders, invoice tracking, and client management.",
        "publisher": {
          "@id": "https://followuply.vercel.app/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://followuply.vercel.app/search?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://followuply.vercel.app/#software",
        "name": "FollowUply",
        "description": "AI-powered client tracker that helps freelancers get paid on time with smart reminders, invoice tracking, and client management.",
        "url": "https://followuply.vercel.app",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web Browser",
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0",
        "author": {
          "@id": "https://followuply.vercel.app/#organization"
        },
        "offers": [
          {
            "@type": "Offer",
            "name": "Free Plan",
            "price": "0",
            "priceCurrency": "USD",
            "description": "Free forever plan with essential features"
          },
          {
            "@type": "Offer",
            "name": "Pro Plan",
            "price": "9.99",
            "priceCurrency": "USD",
            "billingIncrement": "P1M",
            "description": "Advanced features for growing freelancers"
          }
        ],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "ratingCount": "150",
          "bestRating": "5",
          "worstRating": "1"
        },
        "featureList": [
          "AI-powered reminders",
          "Client management",
          "Invoice tracking",
          "Payment reminders",
          "Multi-language support",
          "Dark mode interface"
        ]
      }
    ]
  }

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  )
}