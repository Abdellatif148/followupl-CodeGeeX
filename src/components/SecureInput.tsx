/**
 * Secure Input Component
 * Provides input validation and sanitization
 */

import React, { useState, useCallback } from 'react'
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { sanitize, validate, contentSecurity } from '../lib/security'

interface SecureInputProps {
  type: 'text' | 'email' | 'password' | 'tel' | 'url' | 'textarea'
  name: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  validation?: 'email' | 'password' | 'phone' | 'amount' | 'text' | 'uuid'
  maxLength?: number
  minLength?: number
  showValidation?: boolean
  autoComplete?: string
  'aria-label'?: string
}

export default function SecureInput({
  type,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  validation,
  maxLength,
  minLength,
  showValidation = true,
  autoComplete,
  'aria-label': ariaLabel,
  ...props
}: SecureInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [validationState, setValidationState] = useState<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  }>({ isValid: true, errors: [], warnings: [] })

  const validateInput = useCallback((inputValue: string) => {
    const errors: string[] = []
    const warnings: string[] = []

    // Required field validation
    if (required && !inputValue.trim()) {
      errors.push('This field is required')
    }

    // Length validation
    if (minLength && inputValue.length < minLength) {
      errors.push(`Must be at least ${minLength} characters`)
    }

    if (maxLength && inputValue.length > maxLength) {
      errors.push(`Must be less than ${maxLength} characters`)
    }

    // Type-specific validation
    if (inputValue && validation) {
      switch (validation) {
        case 'email':
          if (!validate.email(inputValue)) {
            errors.push('Please enter a valid email address')
          }
          break
        case 'password':
          const passwordCheck = validate.password(inputValue)
          if (!passwordCheck.isValid) {
            errors.push(...passwordCheck.errors)
          }
          if (inputValue.length >= 8 && passwordCheck.score < 3) {
            warnings.push('Consider using a stronger password')
          }
          break
        case 'phone':
          if (!validate.phone(inputValue)) {
            errors.push('Please enter a valid phone number')
          }
          break
        case 'amount':
          if (!validate.amount(inputValue)) {
            errors.push('Please enter a valid amount')
          }
          break
        case 'uuid':
          if (!validate.uuid(inputValue)) {
            errors.push('Invalid ID format')
          }
          break
        case 'text':
          const contentCheck = contentSecurity.validateContent(inputValue, 'text')
          if (!contentCheck.isValid) {
            errors.push(...contentCheck.errors)
          }
          break
      }
    }

    setValidationState({
      isValid: errors.length === 0,
      errors,
      warnings
    })

    return errors.length === 0
  }, [required, minLength, maxLength, validation])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let newValue = e.target.value

    // Sanitize input based on type
    switch (type) {
      case 'email':
        newValue = sanitize.email(newValue)
        break
      case 'tel':
        newValue = sanitize.phone(newValue)
        break
      default:
        newValue = sanitize.text(newValue)
        break
    }

    // Apply length limits
    if (maxLength) {
      newValue = newValue.substring(0, maxLength)
    }

    // Validate input
    validateInput(newValue)

    // Call parent onChange
    onChange(newValue)
  }

  const baseClassName = `w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:ring-2 focus:border-transparent ${
    validationState.errors.length > 0
      ? 'border-red-300 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-400'
      : validationState.warnings.length > 0
      ? 'border-yellow-300 dark:border-yellow-600 focus:ring-yellow-500 dark:focus:ring-yellow-400'
      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400'
  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${className}`

  const inputProps = {
    name,
    value,
    onChange: handleChange,
    placeholder,
    required,
    disabled,
    className: type === 'password' ? `${baseClassName} pr-12` : baseClassName,
    autoComplete,
    'aria-label': ariaLabel || placeholder,
    'aria-invalid': validationState.errors.length > 0,
    'aria-describedby': showValidation ? `${name}-validation` : undefined,
    maxLength,
    minLength,
    ...props
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        {type === 'textarea' ? (
          <textarea
            {...inputProps}
            rows={4}
          />
        ) : (
          <input
            {...inputProps}
            type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
          />
        )}

        {/* Password visibility toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
            disabled={disabled}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Validation feedback */}
      {showValidation && (validationState.errors.length > 0 || validationState.warnings.length > 0) && (
        <div id={`${name}-validation`} className="space-y-1">
          {/* Errors */}
          {validationState.errors.map((error, index) => (
            <div key={`error-${index}`} className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ))}
          
          {/* Warnings */}
          {validationState.warnings.map((warning, index) => (
            <div key={`warning-${index}`} className="flex items-start gap-2 text-sm text-yellow-600 dark:text-yellow-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Success indicator */}
      {showValidation && value && validationState.isValid && validation && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle className="w-4 h-4" />
          <span>Valid {validation}</span>
        </div>
      )}

      {/* Character count */}
      {maxLength && (
        <div className="text-right">
          <span className={`text-xs ${
            value.length > maxLength * 0.9 
              ? 'text-red-500 dark:text-red-400' 
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {value.length}/{maxLength}
          </span>
        </div>
      )}
    </div>
  )
}