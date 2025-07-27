# Copilot Instructions for followuply-CodeGeeX

## Overview
This project is a web application built with modern web technologies including React, TypeScript, and Tailwind CSS. It integrates with Supabase for backend services and uses Vite as the build tool. The application is structured into components, hooks, libraries, and pages, following a modular and scalable architecture.

## Key Directories and Files
- **`src/components/`**: Contains reusable React components. Examples include `Navigation.tsx`, `Footer.tsx`, and `DarkModeToggle.tsx`.
- **`src/pages/`**: Contains page-level components corresponding to different routes, such as `Dashboard.tsx` and `Login.tsx`.
- **`src/hooks/`**: Custom React hooks for shared logic, e.g., `useDarkMode.ts` and `useAnalytics.ts`.
- **`src/lib/`**: Utility libraries for interacting with external services like Supabase (`supabase.ts`) and APIs (`expensesApi.ts`).
- **`src/locales/`**: JSON files for internationalization, supporting multiple languages like English (`en.json`) and French (`fr.json`).
- **`supabase/`**: Contains configuration and migration files for the Supabase backend.
- **`tailwind.config.js`**: Configuration for Tailwind CSS.
- **`vite.config.ts`**: Configuration for the Vite build tool.

## Developer Workflows
### Building and Running the Application
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```
4. Preview the production build:
   ```bash
   npm run preview
   ```

### Testing
- Currently, no explicit testing framework is configured in the project. Add tests as needed.

### Linting and Formatting
- Run ESLint to check for code issues:
  ```bash
  npm run lint
  ```

## Project-Specific Conventions
- **Component Structure**: Each component is a functional React component written in TypeScript. Props are strongly typed.
- **Styling**: Tailwind CSS is used for styling. Utility classes are preferred over custom CSS.
- **State Management**: React's Context API and hooks are used for state management.
- **Routing**: React Router is used for client-side routing.
- **API Integration**: Supabase is the primary backend service. API calls are abstracted in `src/lib/`.

## Integration Points
- **Supabase**: Configured in `src/lib/supabase.ts`. Ensure the `.env` file contains the necessary keys.
- **Internationalization**: Managed via `src/locales/`. Add new languages by creating a corresponding JSON file.

## Design and UI Guidelines
- **Beautiful Designs**: All designs should be visually appealing, fully featured, and production-ready. Avoid cookie-cutter templates.
- **Icons**: Use `lucide-react` for all icons. Do not install other icon libraries unless explicitly requested.
- **Styling**: Tailwind CSS is the primary styling framework. Use utility classes effectively to maintain consistency and simplicity.

## JSX and React Conventions
- **JSX Syntax**: Follow JSX syntax conventions for all React components.
- **React Hooks**: Leverage React hooks for state and lifecycle management. Examples include `useState`, `useEffect`, and custom hooks like `useDarkMode`.

## Avoid Unnecessary Dependencies
- Do not install additional UI themes, icon libraries, or styling frameworks unless absolutely necessary or explicitly requested.

## Examples
### Adding a New Page
1. Create a new file in `src/pages/`, e.g., `NewPage.tsx`.
2. Add the component logic and export it.
3. Update the router configuration to include the new page.

### Creating a New Component
1. Create a new file in `src/components/`, e.g., `NewComponent.tsx`.
2. Define the functional component and its props.
3. Use Tailwind CSS classes for styling.

---

Feel free to update this file as the project evolves. If you encounter any issues or have suggestions, please document them here.
For all designs I ask you to make, have them be beautiful, not cookie cutter. Make webpages that are fully featured and worthy for production.

By default, this template supports JSX syntax with Tailwind CSS classes, React hooks, and Lucide React for icons. Do not install other packages for UI themes, icons, etc unless absolutely necessary or I request them.

Use icons from lucide-react for logos.
