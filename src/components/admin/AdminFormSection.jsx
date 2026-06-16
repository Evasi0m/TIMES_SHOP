export default function AdminFormSection({ title, description, children }) {
  return (
    <section className="admin-form-section">
      <h2 className="admin-form-section__title">{title}</h2>
      {description && <p className="admin-form-section__desc">{description}</p>}
      <div className="space-y-4">{children}</div>
    </section>
  );
}
