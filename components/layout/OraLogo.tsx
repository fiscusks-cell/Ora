interface OraLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export function OraLogo({ size = 48, showText = true, className = '' }: OraLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="13" stroke="#3730A3" strokeWidth="2.5" fill="none"/>
        <circle cx="16" cy="16" r="8" stroke="#3730A3" strokeWidth="1" fill="none" opacity="0.3"/>
        <line x1="16" y1="7" x2="16" y2="16" stroke="#3730A3" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="16" y1="16" x2="21" y2="19.5" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="16" cy="16" r="1.8" fill="#3730A3"/>
        <circle cx="16" cy="4" r="1" fill="#3730A3" opacity="0.5"/>
        <circle cx="16" cy="28" r="1" fill="#3730A3" opacity="0.5"/>
        <circle cx="4" cy="16" r="1" fill="#3730A3" opacity="0.5"/>
        <circle cx="28" cy="16" r="1" fill="#3730A3" opacity="0.5"/>
      </svg>
      {showText && (
        <span className="text-2xl text-white tracking-tight" style={{ fontFamily: 'var(--font-inter)' }}>ORA</span>
      )}
    </div>
  );
}
