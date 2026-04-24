<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>{{ $subject }}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600&family=DM+Sans:wght@400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #f0f4f8;
      font-family: 'DM Sans', Arial, sans-serif;
      color: #374151;
      padding: 40px 16px;
      min-height: 100vh;
    }
    .wrapper { max-width: 620px; margin: 0 auto; }

    .header {
      background: #1a2e52;
      border-radius: 12px 12px 0 0;
      padding: 20px 40px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-icon {
      width: 36px; height: 36px;
      background: rgba(255,255,255,0.15);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
    }
    .header-title {
      color: #ffffff;
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .card {
      background: #ffffff;
      padding: 48px 48px 40px;
      border-left: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      padding: 5px 12px;
      border-radius: 20px;
      margin-bottom: 28px;
    }
    .badge-dot { width: 7px; height: 7px; border-radius: 50%; }
    .badge-green  { background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0; }
    .badge-green .badge-dot  { background:#10b981; }
    .badge-red    { background:#fef2f2; color:#991b1b; border:1px solid #fca5a5; }
    .badge-red .badge-dot    { background:#ef4444; }
    .badge-blue   { background:#eff6ff; color:#1e40af; border:1px solid #93c5fd; }
    .badge-blue .badge-dot   { background:#3b82f6; }
    .badge-yellow { background:#fffbeb; color:#92400e; border:1px solid #fcd34d; }
    .badge-yellow .badge-dot { background:#f59e0b; }
    .badge-purple { background:#f5f3ff; color:#4c1d95; border:1px solid #c4b5fd; }
    .badge-purple .badge-dot { background:#7c3aed; }

    .greeting {
      font-family: 'Source Serif 4', Georgia, serif;
      font-size: 26px;
      font-weight: 600;
      color: #1a2e52;
      margin-bottom: 20px;
    }
    .divider { height: 1px; background: #e2e8f0; margin: 24px 0; }

    p { font-size: 15px; line-height: 1.75; color: #4b5563; margin-bottom: 14px; }
    p:last-of-type { margin-bottom: 0; }
    strong { color: #1a2e52; font-weight: 600; }

    .btn-wrap { margin: 32px 0 28px; }
    .btn {
      display: inline-block;
      background: #1a2e52;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.4px;
      padding: 13px 32px;
      border-radius: 8px;
    }

    .notice {
      background: #f8fafc;
      border-left: 3px solid #cbd5e1;
      border-radius: 0 6px 6px 0;
      padding: 12px 16px;
      margin: 24px 0 0;
    }
    .notice p { font-size: 13px; color: #64748b; margin: 0; }
    .notice p + p { margin-top: 6px; }

    .signoff { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; }
    .signoff p { font-size: 14px; color: #6b7280; margin: 0; }
    .signoff .org { font-weight: 600; color: #1a2e52; font-size: 14px; }

    .footer {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-top: none;
      border-radius: 0 0 12px 12px;
      padding: 20px 48px;
      text-align: center;
    }
    .footer p { font-size: 12px; color: #9ca3af; margin: 0; line-height: 1.6; }
    .footer a { color: #1a2e52; text-decoration: none; font-weight: 500; }
  </style>
</head>
<body>
  <div class="wrapper">

    <div class="header">
      <div class="header-icon">🏢</div>
      <span class="header-title">General Service Office System</span>
    </div>

    <div class="card">

      <div class="badge badge-{{ $badgeType ?? 'blue' }}">
        <span class="badge-dot"></span>
        {{ $badgeLabel }}
      </div>

      <h1 class="greeting">{{ $greeting }}</h1>

      <div class="divider"></div>

      @foreach ($lines as $line)
        @if (trim($line) !== '')
          <p>{!! $line !!}</p>
        @endif
      @endforeach

      @if (!empty($actionUrl) && !empty($actionText))
        <div class="btn-wrap">
          <a href="{{ $actionUrl }}" class="btn">{{ $actionText }} →</a>
        </div>
      @endif

      @if (!empty($notices))
        <div class="notice">
          @foreach ($notices as $notice)
            <p>{{ $notice }}</p>
          @endforeach
        </div>
      @endif

      <div class="signoff">
        <p>Best regards,</p>
        <p class="org">General Service Office Team</p>
      </div>

    </div>

    <div class="footer">
      <p>© {{ date('Y') }} General Service Office. All rights reserved.</p>
    </div>

  </div>
</body>
</html>