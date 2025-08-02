import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Users, FileText, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';

type ResultItem = {
  id: string;
  type: 'client' | 'invoice' | 'reminder';
  title: string;
  subtitle?: string;
  route?: string;
};

type GlobalSearchProps = {
  placeholder?: string;
  onClose?: () => void;
  autoFocus?: boolean;
};

export default function GlobalSearch({ placeholder = 'Search clients, invoices, reminders...', onClose, autoFocus = false }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ResultItem[]>([]);
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  // Close handler
  const close = () => {
    setOpen(false);
    onClose?.();
  };

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        // Try querying supabase if tables exist; otherwise fallback to local demo filtering
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth?.user?.id;

        const q = query.trim().toLowerCase();

        // Clients
        let clientItems: ResultItem[] = [];
        try {
          const { data } = await supabase
            .from('clients')
            .select('id, name, email')
            .ilike('name', `%${query}%`)
            .limit(5);
          if (data && data.length) {
            clientItems = data.map((c: any) => ({
              id: c.id,
              type: 'client',
              title: c.name || 'Client',
              subtitle: c.email || '',
              route: '/clients'
            }));
          }
        } catch {
          // ignore and fallback
        }

        // Invoices
        let invoiceItems: ResultItem[] = [];
        try {
          const { data } = await supabase
            .from('invoices')
            .select('id, title, status, amount')
            .ilike('title', `%${query}%`)
            .limit(5);
          if (data && data.length) {
            invoiceItems = data.map((i: any) => ({
              id: i.id,
              type: 'invoice',
              title: i.title || `Invoice ${i.id.slice(0, 6)}`,
              subtitle: `${i.status || ''} ${i.amount ? `- ${i.amount}` : ''}`.trim(),
              route: '/invoices'
            }));
          }
        } catch {
          // ignore and fallback
        }

        // Reminders
        let reminderItems: ResultItem[] = [];
        try {
          const { data } = await supabase
            .from('reminders')
            .select('id, title, due_date')
            .ilike('title', `%${query}%`)
            .limit(5);
          if (data && data.length) {
            reminderItems = data.map((r: any) => ({
              id: r.id,
              type: 'reminder',
              title: r.title || 'Reminder',
              subtitle: r.due_date ? new Date(r.due_date).toLocaleDateString() : '',
              route: '/reminders'
            }));
          }
        } catch {
          // ignore and fallback
        }

        let merged: ResultItem[] = [...clientItems, ...invoiceItems, ...reminderItems];

        // Fallback demo results if everything empty
        if (!merged.length) {
          const demo: ResultItem[] = [
            { id: 'c1', type: 'client' as const, title: 'Acme Corp', subtitle: 'acme@example.com', route: '/clients' },
            { id: 'i1', type: 'invoice' as const, title: 'Website redesign', subtitle: 'paid - 1200', route: '/invoices' },
            { id: 'r1', type: 'reminder' as const, title: 'Follow up with Jane', subtitle: 'Due 2025-08-07', route: '/reminders' }
          ].filter((r) => r.title.toLowerCase().includes(q) || (r.subtitle || '').toLowerCase().includes(q));
          merged = demo;
        }

        if (!cancelled) {
          setResults(merged);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Debounce
    const t = setTimeout(run, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  const grouped = useMemo(() => {
    const groups: { label: string; icon: React.ReactNode; items: ResultItem[] }[] = [];
    const clients = results.filter((r) => r.type === 'client');
    const invoices = results.filter((r) => r.type === 'invoice');
    const reminders = results.filter((r) => r.type === 'reminder');

    if (clients.length) groups.push({ label: 'Clients', icon: <Users className="w-4 h-4" />, items: clients });
    if (invoices.length) groups.push({ label: 'Invoices', icon: <FileText className="w-4 h-4" />, items: invoices });
    if (reminders.length) groups.push({ label: 'Reminders', icon: <Bell className="w-4 h-4" />, items: reminders });

    return groups;
  }, [results]);

  const onSelect = (item: ResultItem) => {
    if (item.route) {
      navigate(item.route);
      close();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <div className="relative max-w-2xl mx-auto mt-24 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            autoFocus={autoFocus}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
          />
          <button onClick={close} className="ml-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-sm text-gray-600 dark:text-gray-300">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-6 text-sm text-gray-600 dark:text-gray-300">No results</div>
          ) : (
            <div className="p-2">
              {grouped.map((group, gi) => (
                <div key={gi} className="mb-3">
                  <div className="px-3 py-2 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <span>{group.icon}</span>
                    {group.label}
                  </div>
                  <ul className="space-y-1">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => onSelect(item)}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        >
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</div>
                          {item.subtitle ? (
                            <div className="text-xs text-gray-500 dark:text-gray-400">{item.subtitle}</div>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
