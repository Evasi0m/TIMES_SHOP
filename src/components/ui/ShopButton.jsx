const VARIANT_CLASS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

export default function ShopButton({
  variant = 'primary',
  className = '',
  loading = false,
  loadingLabel = 'กำลังดำเนินการ...',
  children,
  disabled,
  ...props
}) {
  const cls = VARIANT_CLASS[variant] || VARIANT_CLASS.primary;
  const isDisabled = disabled || loading;

  return (
    <button type="button" className={`${cls} ${className}`.trim()} disabled={isDisabled} {...props}>
      {loading ? (
        <>
          <span className="spinner" aria-hidden="true" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
