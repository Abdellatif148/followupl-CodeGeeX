import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Filter, Download, DollarSign, Calendar, Tag, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { currencyUtils } from '../lib/database';

type Expense = {
  id: string;
  user_id: string;
  title: string;
  category: string;
  amount: number;
  date: string; // ISO
  notes?: string | null;
  created_at: string;
  updated_at?: string | null;
};

const demoCategories = ['Software', 'Marketing', 'Office', 'Travel', 'Contractor', 'Other'];

export default function Expenses() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Filters
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [month, setMonth] = useState<string>('all');

  // New expense form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ title: string; category: string; amount: string; date: string; notes: string }>({
    title: '',
    category: 'Software',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    const init = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) {
          navigate('/login');
          return;
        }
        setUserId(auth.user.id);

        // If you have a 'expenses' table, load it. If not, we fallback to local demo data.
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', auth.user.id)
          .order('date', { ascending: false });

        if (error) {
          // Fallback to mock data when table doesn't exist
          console.warn('Expenses table not found or query failed. Using demo data. Error:', error.message);
          setExpenses(generateDemoData(auth.user.id));
        } else {
          setExpenses((data as any) || []);
        }
      } catch (e) {
        console.error('Error loading expenses:', e);
        setExpenses(generateDemoData('demo-user'));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchQuery =
        !query ||
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        (e.notes || '').toLowerCase().includes(query.toLowerCase()) ||
        e.category.toLowerCase().includes(query.toLowerCase());

      const matchCategory = category === 'all' || e.category === category;

      const matchMonth =
        month === 'all' ||
        (() => {
          const d = new Date(e.date);
          const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          return m === month;
        })();

      return matchQuery && matchCategory && matchMonth;
    });
  }, [expenses, query, category, month]);

  const totalAmount = useMemo(() => {
    return filtered.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [filtered]);

  const monthsOptions = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      const d = new Date(e.date);
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      set.add(m);
    });
    return Array.from(set).sort().reverse();
  }, [expenses]);

  const onCreate = async () => {
    if (!userId) return;
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      user_id: userId,
      title: form.title.trim() || 'Untitled',
      category: form.category || 'Other',
      amount: Number(form.amount || 0),
      date: form.date || new Date().toISOString().split('T')[0],
      notes: form.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Try saving to DB if table exists; ignore errors silently
    try {
      const { data, error } = await supabase.from('expenses').insert({
        user_id: newExpense.user_id,
        title: newExpense.title,
        category: newExpense.category,
        amount: newExpense.amount,
        date: newExpense.date,
        notes: newExpense.notes,
      }).select().single();

      if (!error && data) {
        setExpenses((prev) => [{ ...newExpense, id: data.id }, ...prev]);
      } else {
        // fallback local
        setExpenses((prev) => [newExpense, ...prev]);
      }
    } catch {
      setExpenses((prev) => [newExpense, ...prev]);
    }

    setShowForm(false);
    setForm({
      title: '',
      category: 'Software',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const onDelete = async (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    try {
      await supabase.from('expenses').delete().eq('id', id);
    } catch {
      // ignore if table doesn't exist
    }
  };

  const exportCSV = () => {
    const headers = ['Title', 'Category', 'Amount', 'Date', 'Notes'];
    const rows = filtered.map((e) => [e.title, e.category, e.amount, e.date, (e.notes || '').replace(/\n/g, ' ')]);
    const csv = [headers, ...rows].map((r) => r.map(escapeCSV).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Expenses</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Track and manage your business expenses</p>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Expense
            </button>
            <button
              onClick={exportCSV}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard
            title="Total Expenses"
            icon={<DollarSign className="w-10 h-10 text-red-500" />}
            value={currencyUtils.formatCurrency(totalAmount)}
            gradient="from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20"
            border="border-red-200 dark:border-red-800"
          />
          <SummaryCard
            title="Transactions"
            icon={<Tag className="w-10 h-10 text-purple-500" />}
            value={String(filtered.length)}
            gradient="from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
            border="border-purple-200 dark:border-purple-800"
          />
          <SummaryCard
            title="Avg. per Transaction"
            icon={<Calendar className="w-10 h-10 text-blue-500" />}
            value={filtered.length ? currencyUtils.formatCurrency(totalAmount / filtered.length) : '$0.00'}
            gradient="from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
            border="border-blue-200 dark:border-blue-800"
          />
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, notes, category..."
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
              />
              <Filter className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
            >
              <option value="all">All categories</option>
              {demoCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
            >
              <option value="all">All months</option>
              {monthsOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setQuery('');
                setCategory('all');
                setMonth('all');
              }}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/30">
                <tr>
                  <Th>Name</Th>
                  <Th>Category</Th>
                  <Th right>Amount</Th>
                  <Th>Date</Th>
                  <Th>Notes</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/20">
                    <Td>{e.title}</Td>
                    <Td>{e.category}</Td>
                    <Td right>{currencyUtils.formatCurrency(e.amount)}</Td>
                    <Td>{e.date}</Td>
                    <Td>{e.notes}</Td>
                    <Td>
                      <button
                        onClick={() => onDelete(e.id)}
                        className="inline-flex items-center px-3 py-1.5 text-sm border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </button>
                    </Td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-500 dark:text-gray-400 py-10">
                      No expenses found. Add your first expense to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: New Expense */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add Expense</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white"
                    placeholder="e.g. Adobe subscription"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white"
                    >
                      {demoCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.amount}
                      onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white"
                      placeholder="e.g. 29.99"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Date</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Notes</label>
                    <input
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={onCreate}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700"
                >
                  Save Expense
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

type SummaryCardProps = {
  title: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
  border: string;
};

function SummaryCard(props: SummaryCardProps) {
  const { title, value, icon, gradient, border } = props;
  return (
    <div className={`bg-gradient-to-br ${gradient} border ${border} rounded-2xl p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}

type ThProps = {
  children: React.ReactNode;
  right?: boolean;
};

function Th({ children, right }: ThProps) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider ${
        right ? 'text-right' : ''
      }`}
    >
      {children}
    </th>
  );
}

type TdProps = {
  children: React.ReactNode;
  right?: boolean;
};

function Td({ children, right }: TdProps) {
  return (
    <td className={`px-4 py-3 text-sm text-gray-900 dark:text-gray-100 ${right ? 'text-right' : ''}`}>{children}</td>
  );
}

// Helpers
function escapeCSV(value: string | number) {
  const s = String(value ?? '');
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// Demo data generator if table not present yet
function generateDemoData(userId: string): Expense[] {
  const base = new Date();
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
  const data: Expense[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() - i * 3);
    data.push({
      id: crypto.randomUUID(),
      user_id: userId,
      title: pick(['Figma', 'Notion', 'Google Ads', 'AWS', 'GitHub', 'Zoom', 'HubSpot']),
      category: pick(demoCategories),
      amount: Number((Math.random() * 200 + 10).toFixed(2)),
      date: d.toISOString().split('T')[0],
      notes: pick(['', 'Monthly renewal', 'One-time purchase', 'Campaign spend']),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
  return data;
}
