'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

const STUDENT_DASHBOARD = '/dashboard';
const ADMIN_DASHBOARD = '/admin';

export default function NotFound() {
  const cardRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const [dashboardHref, setDashboardHref] = useState<string>(STUDENT_DASHBOARD);

  // Send admins to /admin and everyone else to the student dashboard
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function resolveDashboard() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (!cancelled && profile?.is_admin) {
          setDashboardHref(ADMIN_DASHBOARD);
        }
      } catch {
        // If anything fails, fall back to the student dashboard
      }
    }

    resolveDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    let timeout: ReturnType<typeof setTimeout>;

    function shock() {
      cardRef.current?.classList.add('shocking');
      screenRef.current?.classList.add('flash');
      timeout = setTimeout(() => {
        cardRef.current?.classList.remove('shocking');
        screenRef.current?.classList.remove('flash');
      }, 1850);
    }

    const first = setTimeout(shock, 900);
    const interval = setInterval(shock, 4600);

    return () => {
      clearTimeout(first);
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="dx-wrap">
      <div className="card" ref={cardRef}>
        <div className="chart-tab">CHART · UNAVAILABLE</div>

        <div className="monitor">
          <div className="monitor-topbar">
            <span className="live"><span className="live-dot" /> LIVE — BAY 4</span>
            <span>404.HTML</span>
          </div>

          <div className="screen" ref={screenRef}>
            <svg className="ecg-screen" viewBox="0 0 300 90" preserveAspectRatio="none">
              <g className="ecg-grid">
                <line x1="0" y1="15" x2="300" y2="15" />
                <line x1="0" y1="45" x2="300" y2="45" />
                <line x1="0" y1="75" x2="300" y2="75" />
                <line x1="50" y1="0" x2="50" y2="90" />
                <line x1="100" y1="0" x2="100" y2="90" />
                <line x1="150" y1="0" x2="150" y2="90" />
                <line x1="200" y1="0" x2="200" y2="90" />
                <line x1="250" y1="0" x2="250" y2="90" />
              </g>

              <g className="ecg-track">
                <path
                  className="ecg-path"
                  d="M0,45 L20,45 L26,40 L32,50 L38,45 L110,45 L116,40 L122,50 L128,45 L200,45 L206,40 L212,50 L218,45 L300,45
                     L320,45 L326,40 L332,50 L338,45 L410,45 L416,40 L422,50 L428,45 L500,45 L506,40 L512,50 L518,45 L600,45"
                />
              </g>

              <path className="ecg-spike" d="M110,45 L122,45 L128,20 L136,72 L144,45 L156,45" />
            </svg>

            <div className="readout">
              <span className="status">STATUS: NOT FOUND</span>
              <span className="code"><span>ERROR CODE</span>404</span>
            </div>
          </div>
        </div>

        <div className="scene">
          <svg className="defib-svg" viewBox="0 0 400 190">
            <text className="patient-404" x="200" y="118">404</text>

            <g className="paddle-left">
              <path className="cord" d="M60,170 C90,150 30,120 70,95" />
              <circle className="charge-glow" cx="70" cy="93" r="2" />
              <path className="sketchy" d="M52,92 C50,80 62,72 76,74 C90,76 94,90 88,100 C82,110 66,110 58,102 C54,98 52,96 52,92 Z" />
              <path className="sketchy" d="M50,96 L20,120" />
            </g>

            <g className="paddle-right">
              <path className="cord" d="M340,170 C310,150 370,120 330,95" />
              <circle className="charge-glow" cx="330" cy="93" r="2" />
              <path className="sketchy" d="M348,92 C350,80 338,72 324,74 C310,76 306,90 312,100 C318,110 334,110 342,102 C346,98 348,96 348,92 Z" />
              <path className="sketchy" d="M350,96 L380,120" />
            </g>

            <g transform="translate(200,95)">
              <path className="spark" d="M-6,-22 L-14,-6 L-4,-6 L-10,14" />
              <path className="spark" d="M6,-24 L14,-8 L4,-8 L10,16" />
              <path className="spark" d="M-26,-2 L-14,2 M26,-2 L14,2" />
            </g>
          </svg>
        </div>

        <div className="copy">
          <h1>This page flatlined.</h1>
          <p>
            We ran the vitals, checked the chart twice and paged a specialist —
            this page just isn&apos;t in the system anymore. Let&apos;s get you
            somewhere with a pulse.
          </p>
          <Link
            className="cta"
            href={dashboardHref}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 9,
              background: '#1c2621',
              color: '#f2f6ef',
              textDecoration: 'none',
              fontSize: 14.5,
              fontWeight: 600,
              lineHeight: 1,
              padding: '12px 20px',
              clipPath:
                'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
            }}
          >
            <svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: 16, height: 16, flexShrink: 0, display: 'block' }}
            >
              <path d="M15 6 L7 12 L15 18" />
            </svg>
            Return to dashboard
          </Link>
        </div>

        <div className="footnote">TIME OF PAGE LOAD LOGGED · REVIVAL ATTEMPTS: ∞</div>
      </div>

      <style jsx>{`
        .dx-wrap {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 18px;
          background-color: #eef2ec;
          background-image:
            radial-gradient(circle at 20% 10%, #e3ebe1, transparent 60%),
            linear-gradient(#cddbc9 1px, transparent 1px),
            linear-gradient(90deg, #cddbc9 1px, transparent 1px);
          background-size: auto, 34px 34px, 34px 34px;
          background-position: center;
          background-blend-mode: normal, multiply, multiply;
          color: #1c2621;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .card {
          width: 100%;
          max-width: 620px;
          background: #fbfcf9;
          border: 1.5px solid #d7e0d3;
          border-radius: 6px;
          padding: 28px 28px 34px;
          box-shadow: 0 1px 0 rgba(28, 38, 33, 0.04), 0 18px 40px -22px rgba(28, 38, 33, 0.35);
          position: relative;
        }

        .chart-tab {
          position: absolute;
          top: -14px;
          left: 28px;
          background: #1c2621;
          color: #f2f6ef;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.04em;
          padding: 5px 10px 4px;
          border-radius: 3px;
          box-shadow: 0 4px 10px -4px rgba(0, 0, 0, 0.4);
        }

        .monitor {
          background: linear-gradient(180deg, #23282a, #17191a);
          border-radius: 10px;
          padding: 12px 12px 14px;
          margin-top: 10px;
          box-shadow: inset 0 0 0 1px #000, 0 6px 16px -8px rgba(0, 0, 0, 0.5);
        }

        .monitor-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #9fb3a6;
          padding: 2px 4px 8px;
          letter-spacing: 0.03em;
        }

        .live {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #45e08a;
        }

        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #45e08a;
          animation: blink 1.6s steps(1) infinite;
        }

        @keyframes blink {
          50% {
            opacity: 0.25;
          }
        }

        .screen {
          background: #04140c;
          border-radius: 6px;
          overflow: hidden;
          position: relative;
          box-shadow: inset 0 0 24px rgba(0, 0, 0, 0.6);
          border: 2px solid #000;
        }

        .screen::after {
          content: '';
          position: absolute;
          inset: 0;
          background: #eafff2;
          opacity: 0;
        }

        .screen:global(.flash)::after {
          animation: flashPulse 1.8s ease-out 1;
        }

        @keyframes flashPulse {
          0% { opacity: 0; }
          46% { opacity: 0; }
          50% { opacity: 0.9; }
          58% { opacity: 0; }
          100% { opacity: 0; }
        }

        .ecg-screen {
          display: block;
          width: 100%;
          height: auto;
        }

        .ecg-grid line {
          stroke: #0d3323;
          stroke-width: 1;
        }

        .ecg-track {
          animation: scrollLine 2.2s linear infinite;
        }

        @keyframes scrollLine {
          from { transform: translateX(0); }
          to { transform: translateX(-300px); }
        }

        .ecg-path {
          fill: none;
          stroke: #45e08a;
          stroke-width: 2.4;
          stroke-linecap: round;
          stroke-linejoin: round;
          filter: drop-shadow(0 0 3px rgba(69, 224, 138, 0.65));
        }

        .ecg-spike {
          fill: none;
          stroke: #45e08a;
          stroke-width: 2.6;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 260;
          stroke-dashoffset: 260;
          filter: drop-shadow(0 0 5px rgba(69, 224, 138, 0.85));
          opacity: 0;
        }

        .screen:global(.flash) .ecg-spike {
          animation: drawSpike 1.8s ease-out 1;
        }

        @keyframes drawSpike {
          0% { opacity: 0; stroke-dashoffset: 260; }
          44% { opacity: 0; stroke-dashoffset: 260; }
          50% { opacity: 1; }
          64% { stroke-dashoffset: 0; opacity: 1; }
          82% { opacity: 1; }
          100% { opacity: 0; stroke-dashoffset: 0; }
        }

        .readout {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding: 10px 6px 2px;
          font-family: 'IBM Plex Mono', monospace;
        }

        .status {
          font-size: 11px;
          color: #ff5c47;
          letter-spacing: 0.04em;
          animation: blink 1.6s steps(1) infinite;
        }

        .code {
          font-size: 22px;
          color: #45e08a;
          font-weight: 600;
          text-shadow: 0 0 8px rgba(69, 224, 138, 0.5);
        }

        .code span {
          font-size: 11px;
          color: #9fb3a6;
          display: block;
          font-weight: 400;
          margin-bottom: 2px;
        }

        .scene {
          margin: 18px 0 6px;
        }

        .defib-svg {
          width: 100%;
          height: auto;
          display: block;
          overflow: visible;
        }

        .patient-404 {
          font-family: 'Kalam', cursive;
          font-size: 76px;
          fill: #1c2621;
          text-anchor: middle;
        }

        .card:global(.shocking) .patient-404 {
          animation: shake 1.8s ease-out 1;
        }

        @keyframes shake {
          0%, 42% { transform: translate(0, 0) rotate(0); }
          50% { transform: translate(-3px, 1px) rotate(-1deg); }
          54% { transform: translate(4px, -2px) rotate(1.2deg); }
          58% { transform: translate(-4px, 1px) rotate(-1deg); }
          62% { transform: translate(3px, 0) rotate(0.6deg); }
          68% { transform: translate(0, 0) rotate(0); }
        }

        .sketchy {
          fill: none;
          stroke: #1c2621;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .card:global(.shocking) .paddle-left {
          animation: swingLeft 1.8s cubic-bezier(0.5, 0, 0.2, 1) 1;
        }

        .card:global(.shocking) .paddle-right {
          animation: swingRight 1.8s cubic-bezier(0.5, 0, 0.2, 1) 1;
        }

        @keyframes swingLeft {
          0%, 38% { transform: translateX(0) rotate(-10deg); }
          50% { transform: translateX(108px) rotate(-3deg); }
          64% { transform: translateX(108px) rotate(-3deg); }
          100% { transform: translateX(0) rotate(-10deg); }
        }

        @keyframes swingRight {
          0%, 38% { transform: translateX(0) rotate(10deg); }
          50% { transform: translateX(-108px) rotate(3deg); }
          64% { transform: translateX(-108px) rotate(3deg); }
          100% { transform: translateX(0) rotate(10deg); }
        }

        .charge-glow {
          fill: #ffb648;
          opacity: 0;
          filter: blur(3px);
        }

        .card:global(.shocking) .charge-glow {
          animation: charge 1.8s ease-out 1;
        }

        @keyframes charge {
          0%, 10% { opacity: 0; r: 2; }
          36% { opacity: 0.9; r: 9; }
          46% { opacity: 0.2; r: 11; }
          50% { opacity: 0; }
          100% { opacity: 0; }
        }

        .spark {
          stroke: #ff5c47;
          stroke-width: 2.6;
          stroke-linecap: round;
          fill: none;
          opacity: 0;
        }

        .card:global(.shocking) .spark {
          animation: sparkPop 1.8s ease-out 1;
        }

        @keyframes sparkPop {
          0%, 45% { opacity: 0; transform: scale(0.6); }
          52% { opacity: 1; transform: scale(1); }
          64% { opacity: 0; transform: scale(1.25); }
          100% { opacity: 0; }
        }

        .cord {
          fill: none;
          stroke: #52604f;
          stroke-width: 2.5;
          stroke-linecap: round;
          opacity: 0.6;
        }

        .copy {
          text-align: center;
          margin-top: 6px;
        }

        .copy h1 {
          font-size: 22px;
          margin: 4px 0 8px;
          letter-spacing: -0.01em;
        }

        .copy p {
          font-size: 14.5px;
          line-height: 1.55;
          color: #52604f;
          max-width: 44ch;
          margin: 0 auto 22px;
        }

        .cta {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          background: #1c2621;
          color: #f2f6ef;
          text-decoration: none;
          font-size: 14.5px;
          font-weight: 600;
          padding: 12px 20px;
          clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
          transition: transform 0.15s ease, background 0.15s ease;
        }

        .cta:hover {
          background: #303f36;
          transform: translateY(-1px);
        }

        .cta:active {
          transform: translateY(0);
        }

        .cta svg {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .footnote {
          text-align: center;
          margin-top: 16px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          color: #9fae9a;
          letter-spacing: 0.03em;
        }

        @media (max-width: 420px) {
          .patient-404 {
            font-size: 58px;
          }
          .copy h1 {
            font-size: 19px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ecg-track,
          .live-dot {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
