# Expense Tracking Feature: Requirements and Implementation Plan

Based on our discussion, I've created a comprehensive plan for implementing the expense tracking feature in your application.

## Feature Requirements

1. **Business Expense Tracking**
   - Manual expense entry with standard business categories
   - Association with projects/clients
   - Support for reporting and analytics

2. **Data Structure**
   - Standard expense categories (office supplies, travel, meals, etc.)
   - Project/client association
   - Basic expense metadata (date, amount, description, etc.)

3. **User Interface**
   - Expense entry form
   - Expense listing with filtering and sorting
   - Analytics dashboard with expense trends
   - Integration with existing dashboard

4. **Integration Points**
   - Client data integration
   - Currency handling (using existing currency utilities)
   - Navigation and global search

## Implementation Plan

### 1. Database Schema Design

```sql
-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  amount numeric NOT NULL,
  currency text NOT NULL,
  category text NOT NULL,
  subcategory text,
  expense_date timestamptz NOT NULL,
  payment_method text,
  tax_deductible boolean DEFAULT false,
  status text CHECK (status IN ('pending', 'approved', 'reimbursed', 'reconciled')),
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own expenses"
  ON expenses FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  USING (user_id = auth.uid());
```

### 2. TypeScript Interface

Add the following to `src/types/database.ts`:

```typescript
export interface Expense {
  id: string;
  user_id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  category: string;
  subcategory: string | null;
  expense_date: string;
  payment_method: string | null;
  tax_deductible: boolean;
  status: 'pending' | 'approved' | 'reimbursed' | 'reconciled';
  tags: string[];
  created_at: string;
  updated_at: string;
  clients?: {
    id: string;
    name: string;
    platform: string;
  };
}

export type ExpenseInsert = Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'clients'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ExpenseUpdate = Partial<ExpenseInsert>;
```

### 3. API Implementation

Add the following to `src/lib/database.ts`:

```typescript
// Expense operations
export const expensesApi = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        clients (
          id,
          name,
          platform
        )
      `)
      .eq('user_id', userId)
      .order('expense_date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        clients (
          id,
          name,
          platform
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Expense;
  },

  async create(expense: ExpenseInsert) {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select()
      .single();
    
    if (error) throw error;
    return data as Expense;
  },

  async update(id: string, updates: ExpenseUpdate) {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Expense;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getByCategory(userId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select('category, amount, currency')
      .eq('user_id', userId)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate);
    
    if (error) throw error;
    
    // Group by category and sum amounts
    const categoryTotals = data.reduce((acc, expense) => {
      const category = expense.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += expense.amount;
      return acc;
    }, {});
    
    return Object.entries(categoryTotals).map(([category, total]) => ({
      category,
      total
    }));
  },

  async getByClient(userId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        amount, 
        currency,
        clients (
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
      .not('client_id', 'is', null);
    
    if (error) throw error;
    
    // Group by client and sum amounts
    const clientTotals = data.reduce((acc, expense) => {
      const clientId = expense.clients.id;
      const clientName = expense.clients.name;
      
      if (!acc[clientId]) {
        acc[clientId] = {
          name: clientName,
          total: 0
        };
      }
      acc[clientId].total += expense.amount;
      return acc;
    }, {});
    
    return Object.values(clientTotals);
  },

  async getMonthlyTotals(userId: string, year: number) {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    const { data, error } = await supabase
      .from('expenses')
      .select('amount, expense_date')
      .eq('user_id', userId)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate);
    
    if (error) throw error;
    
    // Group by month and sum amounts
    const monthlyTotals = data.reduce((acc, expense) => {
      const month = new Date(expense.expense_date).getMonth();
      if (!acc[month]) {
        acc[month] = 0;
      }
      acc[month] += expense.amount;
      return acc;
    }, Array(12).fill(0));
    
    return monthlyTotals;
  }
};
```

### 4. UI Components

#### 4.1 Update Navigation

Add expenses to the navigation in `src/components/Layout.tsx`:

```typescript
const navigation = [
  { name: t('navigation.dashboard'), href: '/dashboard', icon: Home },
  { name: t('navigation.clients'), href: '/clients', icon: Users },
  { name: t('navigation.reminders'), href: '/reminders', icon: Bell },
  { name: t('navigation.invoices'), href: '/invoices', icon: FileText },
  { name: t('navigation.expenses'), href: '/expenses', icon: DollarSign }, // Add this line
  { name: t('navigation.settings'), href: '/settings', icon: Settings },
];
```

#### 4.2 Create Expense Form Component

Create a new file `src/components/ExpenseForm.tsx` for the expense entry form. This component will:
- Allow users to enter expense details (title, amount, date, etc.)
- Select a category from predefined options
- Associate expenses with clients (optional)
- Mark expenses as tax-deductible
- Save expenses to the database

#### 4.3 Create Expenses Page

Create a new file `src/pages/Expenses.tsx` for the expense listing page. This page will:
- Display a list of expenses with filtering and sorting options
- Show expense totals and summaries
- Provide options to add, edit, and delete expenses
- Include export functionality for expense data

#### 4.4 Create Expense Analytics Component

Create a new file `src/components/ExpenseAnalytics.tsx` for the expense analytics dashboard. This component will:
- Display expense trends over time (monthly, quarterly, yearly)
- Show expense breakdowns by category
- Display client-specific expense analytics
- Include visualizations (charts, graphs) for better data representation

### 5. Dashboard Integration

Update the Dashboard component to include expense metrics:

- Add expense metrics to the stats grid:
  - Total expenses for the current month
  - Comparison with previous month (percentage change)
  - Largest expense category

- Add recent expenses to the content grid:
  - Display the 5 most recent expenses
  - Show expense amount, category, and date
  - Provide quick links to view all expenses

### 6. Reporting Functionality

Create a new file `src/pages/ExpenseReports.tsx` for generating expense reports:

- Monthly expense reports:
  - Total expenses by month
  - Month-over-month comparison
  - Trend analysis

- Category-based reports:
  - Expenses broken down by category
  - Category percentage of total expenses
  - Top spending categories

- Client-based reports:
  - Expenses associated with specific clients
  - Client expense comparison
  - Profitability analysis (comparing client income vs. expenses)

- Tax deduction reports:
  - Summary of tax-deductible expenses
  - Categorized tax deductions
  - Exportable reports for tax filing

### 7. Global Search Integration

Update the global search component to include expenses in search results:
- Search by expense title, description, or category
- Display expense details in search results
- Provide quick links to view or edit expenses

## Potential Challenges and Solutions

### 1. Performance with Large Datasets

**Challenge**: As users add more expenses, queries might become slower, especially for analytics.

**Solution**: 
- Implement pagination for expense listings
- Use efficient queries with proper indexes
- Consider caching frequently accessed data
- Optimize analytics queries to run in the background

### 2. Currency Handling

**Challenge**: Users may track expenses in multiple currencies, making reporting complex.

**Solution**:
- Store the original currency and amount
- Use the existing currency utilities for display
- Consider implementing currency conversion for reports
- Allow filtering/grouping by currency

### 3. Integration with Existing Features

**Challenge**: Ensuring the expense tracking feature integrates seamlessly with existing features.

**Solution**:
- Maintain consistent UI/UX design
- Leverage existing components and utilities
- Ensure proper data relationships (e.g., client associations)
- Update existing features to reference expense data where appropriate

### 4. Data Visualization Performance

**Challenge**: Complex charts and visualizations might impact performance.

**Solution**:
- Use efficient charting libraries
- Implement lazy loading for visualizations
- Consider server-side data aggregation
- Optimize queries for visualization data

## Implementation Timeline

1. **Week 1**: Database schema and API implementation
   - Create database migration
   - Implement TypeScript interfaces
   - Develop API endpoints

2. **Week 2**: Core UI components
   - Expense form component
   - Expense listing page
   - Navigation integration

3. **Week 3**: Analytics and reporting
   - Expense analytics component
   - Reporting functionality
   - Dashboard integration

4. **Week 4**: Integration and testing
   - Global search integration
   - Performance optimization
   - User testing and feedback
   - Bug fixes and refinements

## Conclusion

The expense tracking feature will enhance your application by providing users with comprehensive tools to manage their business expenses. By integrating with existing client and invoice data, users will gain valuable insights into their business finances, helping them make informed decisions and simplify tax reporting.

The implementation plan outlined above provides a structured approach to developing this feature, with careful consideration of potential challenges and their solutions. Following this plan will ensure a seamless integration with your existing application while maintaining good performance and user experience.