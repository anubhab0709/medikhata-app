export default function PageHero({
  eyebrow,
  title,
  subtitle,
  badge,
  children,
  compact = false,
  className = '',
}) {
  return (
    <div className={`page-hero ${className}`}>
      <div className={`page-shell page-hero-inner ${compact ? '!py-3.5 sm:!py-5' : ''}`}>
        <div className="flex flex-col gap-2.5 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
            <div className={`flex flex-wrap items-center gap-2 ${eyebrow ? 'mt-0.5 sm:mt-1' : ''}`}>
              <h1 className="page-title">{title}</h1>
              {badge != null && <span className="badge badge-neutral">{badge}</span>}
            </div>
            {subtitle && (
              <p className="page-subtitle hidden sm:block">{subtitle}</p>
            )}
          </div>
          {children && (
            <div className="w-full lg:w-auto lg:min-w-[260px] lg:max-w-md shrink-0">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
