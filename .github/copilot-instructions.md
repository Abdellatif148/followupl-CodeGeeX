# Copilot Instructions for FollowUply

## Overview
FollowUply is a client management and invoice tracking application built with React, TypeScript, Tailwind CSS, and Supabase. It includes features like client and expense tracking, invoice management, smart reminders, and multi-language support. The project is designed for freelancers to streamline their workflows.

## Architecture
- **Frontend**: Built with React 18, TypeScript, and Tailwind CSS.
- **Backend**: Supabase for database, authentication, and real-time features.
- **State Management**: React Hooks with custom hooks.
- **Routing**: React Router v6.
- **Internationalization**: i18next for multi-language support.
- **Build Tool**: Vite for fast builds and development.
- **Deployment**: Vercel for hosting.

### Key Directories
- `src/components/`: Reusable UI components.
- `src/pages/`: Page-level components for routing.
- `src/hooks/`: Custom React hooks.
- `src/lib/`: Utility libraries and API clients (e.g., `supabase.ts` for Supabase configuration).
- `src/locales/`: Translation files for internationalization.
- `supabase/migrations/`: Database migration scripts.

## Developer Workflows

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
   Fill in your Supabase credentials.
4. Run database migrations:
   Apply all migrations in the `supabase/migrations` folder.
5. Start the development server:
   ```bash
   npm run dev
   ```

### Testing and Linting
- Run ESLint:
  ```bash
  npm run lint
  ```
- Add tests for new features and ensure existing tests pass.

### Deployment
- The project is configured for Vercel. Push to the `main` branch to trigger automatic deployment.

## Project-Specific Conventions
- **TypeScript**: Use TypeScript for all new code.
- **React Hooks**: Follow React hooks patterns for state and side effects.
- **Error Handling**: Implement proper error boundaries and user-friendly error messages.
- **Internationalization**: Use `i18next` for translations and localized formatting.
- **Styling**: Use Tailwind CSS for consistent styling.

## Integration Points
- **Supabase**: Used for database, authentication, and real-time features. Configuration is in `src/lib/supabase.ts`.
- **i18next**: Internationalization setup is in `src/lib/i18n.ts`.
- **Icons**: Lucide React is used for icons.
- **Date Handling**: `date-fns` is used for date formatting and manipulation.

## Examples
### Adding a New Page
1. Create a new file in `src/pages/` (e.g., `NewPage.tsx`).
2. Add a route in the main router (likely in `App.tsx` or `Layout.tsx`).
3. Use existing components from `src/components/` to build the page.

### Creating a New Component
1. Add the component in `src/components/`.
2. Use Tailwind CSS for styling.
3. Write TypeScript types for props.
4. Add unit tests if applicable.

## Notes for AI Agents
- Focus on reusability and modularity when generating code.
- Follow the established folder structure and naming conventions.
- Ensure all new features are accessible and responsive.
- Use existing hooks and utilities where possible (e.g., `useDarkMode`, `useCurrency`).
- Adhere to the coding standards outlined in the `README.md`.

For further details, refer to the `README.md` or specific files in the codebase.
