/**
 * Security Monitor Component
 * Provides real-time security monitoring and alerts
 */

import React, { useState, useEffect } from 'react'
import { Shield, AlertTriangle, Activity, Lock, Eye, EyeOff } from 'lucide-react'
import { ddosProtection, networkMonitor } from '../lib/ddosProtection'
import { sessionSecurity, secureError } from '../lib/security'
import { useAuth } from '../hooks/useAuth'

interface SecurityStatus {
  sessionValid: boolean
  rateLimitStatus: 'normal' | 'warning' | 'blocked'
  networkQuality: 'good' | 'poor' | 'unknown'
  suspiciousActivity: boolean
  lastSecurityCheck: number
}

export default function SecurityMonitor() {
  const { user } = useAuth()
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    sessionValid: true,
    rateLimitStatus: 'normal',
    networkQuality: 'unknown',
    suspiciousActivity: false,
    lastSecurityCheck: Date.now()
  })
  const [showDetails, setShowDetails] = useState(false)
  const [isMonitoring, setIsMonitoring] = useState(true)

  useEffect(() => {
    if (!isMonitoring || !user) return

    const monitorInterval = setInterval(async () => {
      await performSecurityCheck()
    }, 30000) // Check every 30 seconds

    // Initial check
    performSecurityCheck()

    return () => clearInterval(monitorInterval)
  }, [isMonitoring, user])

  const performSecurityCheck = async () => {
    try {
      const newStatus: SecurityStatus = {
        sessionValid: true,
        rateLimitStatus: 'normal',
        networkQuality: 'unknown',
        suspiciousActivity: false,
        lastSecurityCheck: Date.now()
      }

      // Check session integrity
      newStatus.sessionValid = sessionSecurity.validateSessionIntegrity()
      
      if (!newStatus.sessionValid) {
        secureError.logSecurityEvent('session_integrity_failed', { userId: user?.id })
      }

      // Check rate limit status
      if (user) {
        const metrics = ddosProtection.getMetrics(user.id)
        if (metrics.requestCount > 50) {
          newStatus.rateLimitStatus = 'warning'
        }
        if (ddosProtection.isBlocked(user.id)) {
          newStatus.rateLimitStatus = 'blocked'
        }
        newStatus.suspiciousActivity = metrics.suspiciousActivity
      }

      // Check network quality
      try {
        const { latency } = await networkMonitor.checkConnectionQuality()
        newStatus.networkQuality = latency < 1000 ? 'good' : 'poor'
      } catch (error) {
        newStatus.networkQuality = 'poor'
      }

      setSecurityStatus(newStatus)
    } catch (error) {
      console.error('Security check failed:', error)
      secureError.logSecurityEvent('security_monitor_error', { 
        error: error instanceof Error ? error.message : 'Unknown',
        userId: user?.id 
      })
    }
  }

  const getStatusColor = () => {
    if (!securityStatus.sessionValid || securityStatus.rateLimitStatus === 'blocked' || securityStatus.suspiciousActivity) {
      return 'text-red-500'
    }
    if (securityStatus.rateLimitStatus === 'warning' || securityStatus.networkQuality === 'poor') {
      return 'text-yellow-500'
    }
    return 'text-green-500'
  }

  const getStatusIcon = () => {
    if (!securityStatus.sessionValid || securityStatus.rateLimitStatus === 'blocked' || securityStatus.suspiciousActivity) {
      return <AlertTriangle className="w-4 h-4" />
    }
    return <Shield className="w-4 h-4" />
  }

  // Only show in development or for admin users
  if (import.meta.env.PROD && user?.email !== 'admin@followuply.com') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={getStatusColor()}>
              {getStatusIcon()}
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Security Monitor
            </span>
            <div className={`w-2 h-2 rounded-full ${
              securityStatus.sessionValid && securityStatus.rateLimitStatus !== 'blocked' 
                ? 'bg-green-500' 
                : 'bg-red-500'
            }`} />
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMonitoring(!isMonitoring)}
              className={`p-1 rounded ${
                isMonitoring 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-gray-400 dark:text-gray-500'
              }`}
              title={isMonitoring ? 'Monitoring active' : 'Monitoring paused'}
            >
              <Activity className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              title={showDetails ? 'Hide details' : 'Show details'}
            >
              {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Session:</span>
                <span className={securityStatus.sessionValid ? 'text-green-600' : 'text-red-600'}>
                  {securityStatus.sessionValid ? 'Valid' : 'Invalid'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Rate Limit:</span>
                <span className={
                  securityStatus.rateLimitStatus === 'normal' ? 'text-green-600' :
                  securityStatus.rateLimitStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'
                }>
                  {securityStatus.rateLimitStatus}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Network:</span>
                <span className={
                  securityStatus.networkQuality === 'good' ? 'text-green-600' :
                  securityStatus.networkQuality === 'poor' ? 'text-yellow-600' : 'text-gray-600'
                }>
                  {securityStatus.networkQuality}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Suspicious:</span>
                <span className={securityStatus.suspiciousActivity ? 'text-red-600' : 'text-green-600'}>
                  {securityStatus.suspiciousActivity ? 'Yes' : 'No'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Last Check:</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {new Date(securityStatus.lastSecurityCheck).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Security actions */}
            <div className="flex space-x-2 pt-2">
              <button
                onClick={performSecurityCheck}
                className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded"
              >
                Refresh
              </button>
              
              {user && (
                <button
                  onClick={() => ddosProtection.resetMetrics(user.id)}
                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}