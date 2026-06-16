export default function AdminStatGrid({ stats }) {
  if (!stats?.length) return null;

  return (
    <div className="admin-stat-grid">
      {stats.map((stat) => (
        <div key={stat.label} className="admin-stat">
          <p className="admin-stat__label">{stat.label}</p>
          <p className="admin-stat__value">{stat.value}</p>
          {stat.hint && <p className="admin-stat__hint">{stat.hint}</p>}
        </div>
      ))}
    </div>
  );
}
