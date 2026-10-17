import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { Row } from '../services/data';
import { Empty, SectionTitle } from './Shared';
export function AdminCharts({
  people,
  departments,
  complaints,
  submissions,
}: {
  people: Row[];
  departments: Row[];
  complaints: Row[];
  submissions: Row[];
}) {
  const distribution = departments.map((d) => ({
    name: String(d.code),
    count: people.filter((p) => p.role === 'student' && p.department_id === d.id).length,
  }));
  const categories = Object.entries(
    complaints.reduce<Record<string, number>>((acc, r) => {
      const k = String(r.category);
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {}),
  ).map(([name, count]) => ({ name, count }));
  const monthly = Object.entries(
    submissions.reduce<Record<string, number>>((acc, r) => {
      const k = String(r.submitted_at).slice(0, 7);
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {}),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, count]) => ({ name, count }));
  return (
    <div className="resource-grid admin-charts">
      {[
        { title: 'Students by department', data: distribution, color: '#9c7cce' },
        { title: 'Grievance categories', data: categories, color: '#d0a66a' },
        { title: 'Monthly submissions', data: monthly, color: '#73b29d' },
      ].map((chart) => (
        <section className="panel" key={chart.title}>
          <SectionTitle title={chart.title} />
          {chart.data.some((d) => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chart.data}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill={chart.color} radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty title="No activity recorded yet" />
          )}
        </section>
      ))}
    </div>
  );
}
