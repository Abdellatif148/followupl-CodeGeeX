-- Time Tracking Analytics
CREATE OR REPLACE FUNCTION public.get_time_analytics(user_id uuid)
RETURNS jsonb AS $$
DECLARE
  total_hours numeric;
  billable_hours numeric;
  non_billable_hours numeric;
  by_client jsonb;
  by_project jsonb;
  top_tasks jsonb;
  trend jsonb;
BEGIN
  SELECT COALESCE(SUM(duration_minutes),0)/60 INTO total_hours FROM time_entries WHERE user_id = get_time_analytics.user_id;
  SELECT COALESCE(SUM(duration_minutes),0)/60 INTO billable_hours FROM time_entries WHERE user_id = get_time_analytics.user_id AND billable IS TRUE;
  SELECT COALESCE(SUM(duration_minutes),0)/60 INTO non_billable_hours FROM time_entries WHERE user_id = get_time_analytics.user_id AND billable IS FALSE;
  SELECT jsonb_agg(row_to_json(t)) INTO by_client FROM (
    SELECT client_id, COALESCE(SUM(duration_minutes),0)/60 AS hours FROM time_entries WHERE user_id = get_time_analytics.user_id GROUP BY client_id ORDER BY hours DESC LIMIT 5
  ) t;
  SELECT jsonb_agg(row_to_json(t)) INTO by_project FROM (
    SELECT project, COALESCE(SUM(duration_minutes),0)/60 AS hours FROM time_entries WHERE user_id = get_time_analytics.user_id GROUP BY project ORDER BY hours DESC LIMIT 5
  ) t;
  SELECT jsonb_agg(row_to_json(t)) INTO top_tasks FROM (
    SELECT description, COALESCE(SUM(duration_minutes),0)/60 AS hours FROM time_entries WHERE user_id = get_time_analytics.user_id GROUP BY description ORDER BY hours DESC LIMIT 5
  ) t;
  SELECT jsonb_agg(hours) INTO trend FROM (
    SELECT COALESCE(SUM(duration_minutes),0)/60 AS hours FROM time_entries WHERE user_id = get_time_analytics.user_id AND start_time > now() - interval '5 week' GROUP BY date_trunc('week', start_time) ORDER BY date_trunc('week', start_time) DESC LIMIT 5
  ) t;
  RETURN jsonb_build_object(
    'totalHours', total_hours,
    'billableHours', billable_hours,
    'nonBillableHours', non_billable_hours,
    'byClient', by_client,
    'byProject', by_project,
    'topTasks', top_tasks,
    'trend', trend
  );
END;
$$ LANGUAGE plpgsql;

-- Expenses Analytics
CREATE OR REPLACE FUNCTION public.get_expense_analytics(user_id uuid)
RETURNS jsonb AS $$
DECLARE
  total_expenses numeric;
  billable numeric;
  non_billable numeric;
  by_category jsonb;
  by_client jsonb;
  recent jsonb;
  trend jsonb;
BEGIN
  SELECT COALESCE(SUM(amount),0) INTO total_expenses FROM expenses WHERE user_id = get_expense_analytics.user_id;
  SELECT COALESCE(SUM(amount),0) INTO billable FROM expenses WHERE user_id = get_expense_analytics.user_id AND billable IS TRUE;
  SELECT COALESCE(SUM(amount),0) INTO non_billable FROM expenses WHERE user_id = get_expense_analytics.user_id AND billable IS FALSE;
  SELECT jsonb_agg(row_to_json(t)) INTO by_category FROM (
    SELECT category, COALESCE(SUM(amount),0) AS amount FROM expenses WHERE user_id = get_expense_analytics.user_id GROUP BY category ORDER BY amount DESC LIMIT 5
  ) t;
  SELECT jsonb_agg(row_to_json(t)) INTO by_client FROM (
    SELECT client_id, COALESCE(SUM(amount),0) AS amount FROM expenses WHERE user_id = get_expense_analytics.user_id GROUP BY client_id ORDER BY amount DESC LIMIT 5
  ) t;
  SELECT jsonb_agg(row_to_json(t)) INTO recent FROM (
    SELECT description, amount FROM expenses WHERE user_id = get_expense_analytics.user_id ORDER BY incurred_at DESC LIMIT 5
  ) t;
  SELECT jsonb_agg(amount) INTO trend FROM (
    SELECT COALESCE(SUM(amount),0) AS amount FROM expenses WHERE user_id = get_expense_analytics.user_id AND incurred_at > now() - interval '5 week' GROUP BY date_trunc('week', incurred_at) ORDER BY date_trunc('week', incurred_at) DESC LIMIT 5
  ) t;
  RETURN jsonb_build_object(
    'totalExpenses', total_expenses,
    'billable', billable,
    'nonBillable', non_billable,
    'byCategory', by_category,
    'byClient', by_client,
    'recent', recent,
    'trend', trend
  );
END;
$$ LANGUAGE plpgsql;

-- Combined Analytics
CREATE OR REPLACE FUNCTION public.get_combined_analytics(user_id uuid)
RETURNS jsonb AS $$
DECLARE
  profit numeric;
  avg_hourly_rate numeric;
  unbilled_hours numeric;
  unbilled_expenses numeric;
BEGIN
  SELECT COALESCE(SUM(i.amount),0) - COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.user_id = get_combined_analytics.user_id),0) INTO profit FROM invoices i WHERE i.user_id = get_combined_analytics.user_id AND i.status IN ('paid','overdue','pending');
  SELECT CASE WHEN SUM(te.duration_minutes) > 0 THEN SUM(i.amount) / (SUM(te.duration_minutes)/60) ELSE 0 END INTO avg_hourly_rate FROM invoices i JOIN time_entries te ON i.client_id = te.client_id WHERE i.user_id = get_combined_analytics.user_id AND te.user_id = get_combined_analytics.user_id;
  SELECT COALESCE(SUM(duration_minutes),0)/60 INTO unbilled_hours FROM time_entries WHERE user_id = get_combined_analytics.user_id AND billable IS TRUE AND id NOT IN (SELECT time_entry_id FROM invoice_time_entries WHERE user_id = get_combined_analytics.user_id);
  SELECT COALESCE(SUM(amount),0) INTO unbilled_expenses FROM expenses WHERE user_id = get_combined_analytics.user_id AND billable IS TRUE AND id NOT IN (SELECT expense_id FROM invoice_expenses WHERE user_id = get_combined_analytics.user_id);
  RETURN jsonb_build_object(
    'profit', profit,
    'avgHourlyRate', avg_hourly_rate,
    'unbilledHours', unbilled_hours,
    'unbilledExpenses', unbilled_expenses
  );
END;
$$ LANGUAGE plpgsql; 