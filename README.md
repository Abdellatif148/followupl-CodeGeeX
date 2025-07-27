# FollowUply - AI Client Tracker for Freelancers

A comprehensive client management and invoice tracking application built with React, TypeScript, and Supabase.

## Features

- **Client Management**: Track client information, projects, and communication history
- **Invoice Tracking**: Create, manage, and track invoice payments
- **Smart Reminders**: AI-powered reminders for follow-ups and payments
- **Expense Tracking**: Monitor business expenses with categorization and reporting
- **Multi-language Support**: Available in English, French, Spanish, German, Italian, and Hindi
- **Dark Mode**: Full dark mode support
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **State Management**: React Hooks
- **Routing**: React Router v6
- **Internationalization**: i18next
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Analytics**: Google Analytics 4

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd followuply
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run database migrations:
```bash
# Apply all migrations in the supabase/migrations folder
# This will create all necessary tables and functions
```

5. Start the development server:
```bash
npm run dev
```

## Database Schema

The application uses the following main tables:

- **users**: User authentication data
- **profiles**: User profile information and preferences
- **clients**: Client information and contact details
- **reminders**: Follow-up reminders and notifications
- **invoices**: Invoice tracking and payment status
- **expenses**: Business expense tracking
- **notifications**: In-app notifications

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries and API clients
├── types/              # TypeScript type definitions
├── utils/              # Helper functions
├── locales/            # Translation files
└── styles/             # Global styles
```

## Key Features

### Authentication
- Email/password authentication
- Google OAuth integration
- Password reset functionality
- Protected routes

### Client Management
- Add, edit, and delete clients
- Track client projects and earnings
- Tag-based organization
- Search and filtering

### Invoice Tracking
- Create and manage invoices
- Track payment status
- Overdue invoice alerts
- Payment reminders

### Expense Management
- Categorized expense tracking
- Client-associated expenses
- Tax-deductible expense marking
- Reporting and analytics

### Internationalization
- Multi-language support
- RTL language support (prepared)
- Dynamic language switching
- Localized date and currency formatting

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Quality

- TypeScript for type safety
- ESLint for code linting
- Consistent code formatting
- Error handling and logging

## Deployment

The application is configured for deployment on Vercel with automatic redirects for SPA routing.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email followuplysc@gmail.com or visit our support page.