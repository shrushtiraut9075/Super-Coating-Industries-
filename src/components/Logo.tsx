import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'icon' | 'horizontal';
  monochrome?: boolean;
  logoUrl?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className = 'w-12 h-12',
  variant = 'full',
  monochrome = false,
  logoUrl,
}) => {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="Company Logo"
        className={`${className} object-contain`}
      />
    );
  }

  const blueColor = monochrome ? '#000000' : '#0B478B';
  const blueLight = monochrome ? '#000000' : '#1064C2';
  const orangeColor = monochrome ? '#000000' : '#F2600C';
  const orangeLight = monochrome ? '#000000' : '#FFA000';
  const textColor = monochrome ? '#000000' : '#232933';

  // Standalone Icon
  if (variant === 'icon') {
    return (
      <svg
        viewBox="25 0 196 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <defs>
          <linearGradient id="logoBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={blueLight} />
            <stop offset="100%" stopColor={blueColor} />
          </linearGradient>
          <linearGradient id="logoOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={orangeLight} />
            <stop offset="100%" stopColor={orangeColor} />
          </linearGradient>
        </defs>

        {/* Top Arc in Cobalt Blue */}
        <path
          d="M 53 38 C 53 18 73 4 98 4 C 126 4 137 18 137 34 L 115 34 C 115 25 109 18 97 18 C 83 18 73 24 73 34 C 73 44 82 48 98 51 L 110 54 C 128 58 136 67 136 82 C 134 83 131 84 126 84 C 118 70 105 65 91 62 L 76 59 C 60 55 53 48 53 38 Z"
          fill="url(#logoBlueGrad)"
        />

        {/* Upper Body Curve */}
        <path
          d="M 68 28 C 73 21 82 17 93 17 C 107 17 117 25 117 35 C 117 48 102 52 82 56 C 60 60 48 68 44 80 C 41 89 42 100 48 110 C 43 103 40 94 42 84 C 45 70 57 60 76 56 L 94 53 C 106 50 112 45 112 37 C 112 30 105 24 93 24 C 80 24 72 30 68 36 Z"
          fill="url(#logoBlueGrad)"
        />

        {/* Bottom Swoosh in Orange */}
        <path
          d="M 45 82 C 41 97 45 113 58 125 C 71 137 92 140 113 136 C 130 133 143 120 142 103 C 142 90 132 82 119 79 L 105 77 C 88 74 72 73 59 78 C 52 80 48 83 45 86 C 49 84 57 82 66 82 C 80 82 96 86 110 89 C 125 93 130 100 130 107 C 129 119 116 127 101 127 C 83 127 67 121 59 111 C 53 103 51 93 54 83 Z"
          fill="url(#logoOrangeGrad)"
        />

        {/* Bottom Dark Blue Swoosh */}
        <path
          d="M 45 92 C 46 108 55 124 70 134 C 86 145 107 146 124 139 C 111 143 93 141 79 133 C 65 125 56 112 53 97 C 51 89 51 82 53 75 C 48 80 45 86 45 92 Z"
          fill="url(#logoBlueGrad)"
        />

        {/* Spray Gun (Top paint cup, handle, trigger, nozzle) */}
        <path
          d="M 142 36 L 161 40 L 155 64 L 142 61 Z"
          fill={blueColor}
          stroke={blueLight}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M 140 35 L 163 40 L 161 43 L 138 38 Z" fill={blueLight} />
        <path
          d="M 145 62 L 154 64 L 152 74 L 165 74 L 165 80 L 150 80 L 145 98 L 138 106 L 135 98 L 142 79 L 137 77 Z"
          fill={blueColor}
        />
        <path
          d="M 147 79 C 149 84 149 88 147 93"
          stroke={blueLight}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect x="165" y="74" width="8" height="6" rx="1" fill={blueLight} />

        {/* Spray Mist Rays */}
        <polygon points="176,74 204,63 203,66 176,75" fill={orangeColor} />
        <polygon points="177,75 205,72 204,75 177,76" fill={orangeColor} />
        <polygon points="178,77 205,81 204,84 178,78" fill={orangeColor} />
        <polygon points="177,78 204,91 203,94 177,79" fill={orangeColor} />
      </svg>
    );
  }

  // Full Stacked Logo with "SUPER COATING" and "— INDUSTRIES —"
  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center select-none ${className}`}>
        {/* Top Graphic Mark */}
        <svg
          viewBox="25 0 196 150"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto max-h-24"
        >
          <defs>
            <linearGradient id="logoFullBlue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={blueLight} />
              <stop offset="100%" stopColor={blueColor} />
            </linearGradient>
            <linearGradient id="logoFullOrange" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={orangeLight} />
              <stop offset="100%" stopColor={orangeColor} />
            </linearGradient>
          </defs>

          {/* Top 'S' Arch & Curve in Cobalt Blue */}
          <path
            d="M 53 38
               C 53 18 73 4 98 4
               C 126 4 137 18 137 34
               L 115 34
               C 115 25 109 18 97 18
               C 83 18 73 24 73 34
               C 73 44 82 48 98 51
               L 110 54
               C 128 58 136 67 136 82
               C 134 83 131 84 126 84
               C 118 70 105 65 91 62
               L 76 59
               C 60 55 53 48 53 38 Z"
            fill="url(#logoFullBlue)"
          />

          {/* Core Upper 'S' Loop */}
          <path
            d="M 68 28
               C 73 21 82 17 93 17
               C 107 17 117 25 117 35
               C 117 48 102 52 82 56
               C 60 60 48 68 44 80
               C 41 89 42 100 48 110
               C 43 103 40 94 42 84
               C 45 70 57 60 76 56
               L 94 53
               C 106 50 112 45 112 37
               C 112 30 105 24 93 24
               C 80 24 72 30 68 36
               Z"
            fill="url(#logoFullBlue)"
          />

          {/* Bottom Swoosh in Bright Orange */}
          <path
            d="M 45 82
               C 41 97 45 113 58 125
               C 71 137 92 140 113 136
               C 130 133 143 120 142 103
               C 142 90 132 82 119 79
               L 105 77
               C 88 74 72 73 59 78
               C 52 80 48 83 45 86
               C 49 84 57 82 66 82
               C 80 82 96 86 110 89
               C 125 93 130 100 130 107
               C 129 119 116 127 101 127
               C 83 127 67 121 59 111
               C 53 103 51 93 54 83
               Z"
            fill="url(#logoFullOrange)"
          />

          {/* Deep Navy Bottom Curve Accents */}
          <path
            d="M 45 92
               C 46 108 55 124 70 134
               C 86 145 107 146 124 139
               C 111 143 93 141 79 133
               C 65 125 56 112 53 97
               C 51 89 51 82 53 75
               C 48 80 45 86 45 92 Z"
            fill="url(#logoFullBlue)"
          />

          {/* Paint Spray Gun */}
          <path
            d="M 142 36 L 161 40 L 155 64 L 142 61 Z"
            fill={blueColor}
            stroke={blueLight}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M 140 35 L 163 40 L 161 43 L 138 38 Z" fill={blueLight} />
          <path
            d="M 145 62 L 154 64 L 152 74 L 165 74 L 165 80 L 150 80 L 145 98 L 138 106 L 135 98 L 142 79 L 137 77 Z"
            fill={blueColor}
          />
          <path d="M 147 79 C 149 84 149 88 147 93" stroke={blueLight} strokeWidth="2" strokeLinecap="round" />
          <rect x="165" y="74" width="8" height="6" rx="1" fill={blueLight} />

          {/* Spray Fan Rays */}
          <polygon points="176,74 204,63 203,66 176,75" fill={orangeColor} />
          <polygon points="177,75 205,72 204,75 177,76" fill={orangeColor} />
          <polygon points="178,77 205,81 204,84 178,78" fill={orangeColor} />
          <polygon points="177,78 204,91 203,94 177,79" fill={orangeColor} />
        </svg>

        {/* Typography: SUPER COATING */}
        <div className="flex items-center justify-center gap-1.5 font-black tracking-tight leading-none mt-1">
          <span className="text-xl sm:text-2xl" style={{ color: blueColor }}>
            SUPER
          </span>
          <span className="text-xl sm:text-2xl" style={{ color: orangeColor }}>
            COATING
          </span>
        </div>

        {/* Subtitle: — INDUSTRIES — */}
        <div className="flex items-center justify-center gap-2 w-full mt-1.5">
          <span className="h-0.5 w-7 sm:w-10 rounded-full" style={{ backgroundColor: textColor }} />
          <span
            className="text-[10px] sm:text-xs font-black tracking-[0.25em] uppercase"
            style={{ color: textColor }}
          >
            INDUSTRIES
          </span>
          <span className="h-0.5 w-7 sm:w-10 rounded-full" style={{ backgroundColor: textColor }} />
        </div>
      </div>
    );
  }

  // Horizontal Compact Logo for Sidebar & Invoices
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Icon */}
      <svg
        viewBox="25 0 196 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-10 h-10 shrink-0"
      >
        <defs>
          <linearGradient id="logoHBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={blueLight} />
            <stop offset="100%" stopColor={blueColor} />
          </linearGradient>
          <linearGradient id="logoHOrange" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={orangeLight} />
            <stop offset="100%" stopColor={orangeColor} />
          </linearGradient>
        </defs>

        <path
          d="M 53 38 C 53 18 73 4 98 4 C 126 4 137 18 137 34 L 115 34 C 115 25 109 18 97 18 C 83 18 73 24 73 34 C 73 44 82 48 98 51 L 110 54 C 128 58 136 67 136 82 C 134 83 131 84 126 84 C 118 70 105 65 91 62 L 76 59 C 60 55 53 48 53 38 Z"
          fill="url(#logoHBlue)"
        />
        <path
          d="M 45 82 C 41 97 45 113 58 125 C 71 137 92 140 113 136 C 130 133 143 120 142 103 C 142 90 132 82 119 79 L 105 77 C 88 74 72 73 59 78 C 52 80 48 83 45 86 C 49 84 57 82 66 82 C 80 82 96 86 110 89 C 125 93 130 100 130 107 C 129 119 116 127 101 127 C 83 127 67 121 59 111 C 53 103 51 93 54 83 Z"
          fill="url(#logoHOrange)"
        />
        <path
          d="M 45 92 C 46 108 55 124 70 134 C 86 145 107 146 124 139 C 111 143 93 141 79 133 C 65 125 56 112 53 97 C 51 89 51 82 53 75 C 48 80 45 86 45 92 Z"
          fill="url(#logoHBlue)"
        />
        {/* Spray Gun & Rays */}
        <path d="M 142 36 L 161 40 L 155 64 L 142 61 Z" fill={blueColor} stroke={blueLight} strokeWidth="1.5" />
        <path d="M 145 62 L 154 64 L 152 74 L 165 74 L 165 80 L 150 80 L 145 98 L 138 106 L 135 98 L 142 79 Z" fill={blueColor} />
        <rect x="165" y="74" width="8" height="6" rx="1" fill={blueLight} />
        <polygon points="176,74 200,64 199,67 176,75" fill={orangeColor} />
        <polygon points="177,75 200,72 199,75 177,76" fill={orangeColor} />
        <polygon points="178,77 200,81 199,84 178,78" fill={orangeColor} />
        <polygon points="177,78 200,90 199,93 177,79" fill={orangeColor} />
      </svg>

      {/* Text */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1 font-black text-sm leading-none tracking-tight">
          <span style={{ color: blueColor }}>SUPER</span>
          <span style={{ color: orangeColor }}>COATING</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="h-px w-3 bg-slate-400" />
          <span className="text-[8px] font-bold tracking-[0.2em] uppercase text-slate-400">
            INDUSTRIES
          </span>
          <span className="h-px w-3 bg-slate-400" />
        </div>
      </div>
    </div>
  );
};
