/**
 * Security Headers Component
 * Manages CSP and other security headers via meta tags
 */

import React from 'react'
import { Helmet } from 'react-helmet-async'

interface SecurityHeadersProps {
  nonce?: string
  allowInlineStyles?: boolean
  allowInlineScripts?: boolean
  additionalScriptSources?: string[]
  additionalStyleSources?: string[]
}

export default function SecurityHeaders({
  nonce,
  allowInlineStyles = false,
  allowInlineScripts = false,
  additionalScriptSources = [],
  additionalStyleSources = []
}: SecurityHeadersProps) {
  // Generate Content Security Policy
  const generateCSP = () => {
    const scriptSrc = [
      "'self'",
      ...(allowInlineScripts ? ["'unsafe-inline'"] : []),
      ...(nonce ? [`'nonce-${nonce}'`] : []),
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      ...additionalScriptSources
    ].join(' ')

    const styleSrc = [
      "'self'",
      ...(allowInlineStyles ? ["'unsafe-inline'"] : []),
      "https://fonts.googleapis.com",
      ...additionalStyleSources
    ].join(' ')

    return [
      `default-src 'self'`,
      `script-src ${scriptSrc}`,
      `style-src ${styleSrc}`,
      `font-src 'self' https://fonts.gstatic.com`,
      `img-src 'self' data: https: blob:`,
      `connect-src 'self' https://*.supabase.co https://www.google-analytics.com`,
      `frame-ancestors 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `object-src 'none'`,
      `media-src 'self'`,
      `worker-src 'self' blob:`,
      `manifest-src 'self'`,
      `upgrade-insecure-requests`
    ].join('; ')
  }

  return (
    <Helmet>
      {/* Content Security Policy */}
      <meta httpEquiv="Content-Security-Policy" content={generateCSP()} />
      
      {/* Additional Security Headers */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
      <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), payment=()" />
      
      {/* HSTS (only in production) */}
      {import.meta.env.PROD && (
        <meta httpEquiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains; preload" />
      )}
      
      {/* Prevent MIME type sniffing */}
      <meta httpEquiv="X-Download-Options" content="noopen" />
      
      {/* Prevent clickjacking */}
      <meta httpEquiv="X-Permitted-Cross-Domain-Policies" content="none" />
      
      {/* DNS prefetch control */}
      <meta httpEquiv="X-DNS-Prefetch-Control" content="off" />
    </Helmet>
  )
}