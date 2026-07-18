interface LogoProps {
  className?: string;
}

export function Logo({ className }: Readonly<LogoProps>) {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <circle cx="16" cy="16" r="15" fill="#141414" stroke="#3f3f46" />
      <circle
        cx="16"
        cy="16"
        r="11"
        stroke="#ffffff"
        strokeOpacity="0.12"
      />
      <circle
        cx="16"
        cy="16"
        r="8.5"
        stroke="#ffffff"
        strokeOpacity="0.12"
      />
      <circle cx="16" cy="16" r="5.5" fill="#1DB954" />
      <path
        d="M13 16.2L15.2 18.5L19.5 13.5"
        stroke="#000000"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
