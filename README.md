# FollowUply - AI Client Tracker for Freelancers

A comprehensive client management and invoice tracking application built with React, TypeScript, Tailwind CSS, and Supabase.

## 🚀 Features

- **Client Management**: Track client information, projects, and communication history
- **Invoice Tracking**: Create, manage, and track invoice payments with automated reminders
- **Smart Reminders**: AI-powered reminders for follow-ups and payments
- **Expense Tracking**: Monitor business expenses with categorization and reporting
- **Multi-language Support**: Available in English, French, Spanish, German, Italian, and Hindi
- **Dark Mode**: Full dark mode support with system preference detection
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Real-time Notifications**: Stay updated with in-app notifications
- **Advanced Search**: Global search across all data types
- **Data Export**: Export expenses and reports for tax purposes

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time, Storage)
- **State Management**: React Hooks with custom hooks
- **Routing**: React Router v6
- **Internationalization**: i18next with browser language detection
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Build Tool**: Vite
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

## 🔧 Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd followuply
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
```

Fill in your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Run database migrations:**
Apply all migrations in the `supabase/migrations` folder to set up your database schema.

5. **Start the development server:**
```bash
npm run dev
```

## 📊 Database Schema

The application uses the following main tables:

- **users**: User authentication data (managed by Supabase Auth)
- **profiles**: User profile information and preferences
- **clients**: Client information and contact details
- **reminders**: Follow-up reminders and notifications
- **invoices**: Invoice tracking and payment status
- **expenses**: Business expense tracking with categorization
- **notifications**: In-app notifications system

### Key Features:
- Row Level Security (RLS) enabled on all tables
- Automatic timestamp updates
- Foreign key relationships with cascade deletes
- Optimized indexes for performance
- Comprehensive data validation

## 🏗 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main app layout with navigation
│   ├── forms/          # Form components
│   └── ui/             # Basic UI components
├── pages/              # Page components (routes)
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries and API clients
│   ├── supabase.ts     # Supabase client configuration
│   ├── database.ts     # Database API functions
│   └── i18n.ts         # Internationalization setup
├── types/              # TypeScript type definitions
├── utils/              # Helper functions
├── locales/            # Translation files
└── styles/             # Global styles
```

## 🔐 Authentication

- **Email/Password**: Standard authentication with email verification
- **Google OAuth**: One-click sign-in with Google
- **Password Reset**: Secure password reset via email
- **Session Management**: Automatic token refresh and session persistence
- **Protected Routes**: Route-level authentication guards

## 💼 Key Features

### Client Management
- Add, edit, and delete clients
- Track client projects and earnings
- Tag-based organization with search
- Platform integration (Fiverr, Upwork, Direct)
- Contact method preferences
- Status management (Active, Inactive, Archived)

### Invoice Tracking
- Create and manage invoices with client association
- Multiple currency support
- Payment status tracking
- Overdue invoice alerts
- Payment method recording
- Due date management

### Expense Management
- Categorized expense tracking (10+ business categories)
- Client-associated expenses
- Tax-deductible expense marking
- Multi-currency support
- Advanced filtering and search
- Reporting and analytics with charts
- CSV export functionality

### Smart Reminders
- Create custom reminders with due dates
- Client-associated reminders
- Priority levels (Low, Medium, High, Urgent)
- Status tracking (Pending, Active, Completed)
- Recurring reminder support

### Internationalization
- 6 language support (EN, FR, ES, DE, IT, HI)
- RTL language support (prepared)
- Dynamic language switching
- Localized date and currency formatting
- Browser language detection

## 🎨 UI/UX Features

- **Dark Mode**: System preference detection with manual toggle
- **Responsive Design**: Mobile-first approach with breakpoints
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Loading States**: Skeleton loaders and progress indicators
- **Error Handling**: User-friendly error messages with toast notifications
- **Search**: Global search across all data types
- **Notifications**: Real-time in-app notification system

## 🚀 Development

### Available Scripts

- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Quality

- **TypeScript**: Full type safety across the application
- **ESLint**: Code linting with React and TypeScript rules
- **Error Boundaries**: Graceful error handling
- **Performance**: Optimized bundle splitting and lazy loading
- **Security**: RLS policies and input sanitization

## 📱 Deployment

The application is configured for deployment on Vercel with:
- Automatic SPA routing redirects
- Environment variable management
- Build optimization
- CDN distribution

### Deployment Steps:
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## 🔧 Configuration

### Environment Variables
```env
# Required
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional
VITE_ENABLE_ANALYTICS=false
VITE_APP_ENV=development
```

### Supabase Setup
1. Create a new Supabase project
2. Run the migrations in order from `supabase/migrations/`
3. Configure authentication providers (Google OAuth optional)
4. Set up storage buckets for file uploads (if needed)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the coding standards
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Coding Standards
- Use TypeScript for all new code
- Follow React hooks patterns
- Implement proper error handling
- Add JSDoc comments for complex functions
- Use semantic commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Email: followuplysc@gmail.com
- Create an issue in the repository
- Check the documentation in `/docs`

## 🙏 Acknowledgments

- Built with [Supabase](https://supabase.com) for backend services
- UI components inspired by modern design systems
- Icons provided by [Lucide React](https://lucide.dev)
- Internationalization powered by [i18next](https://www.i18next.com)

---

**FollowUply** - Helping freelancers stay organized and get paid on time! 🚀