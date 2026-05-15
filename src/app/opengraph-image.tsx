import { ImageResponse } from "next/og";
import { getTodaysChallenge } from "@/lib/challenges";
import { formatLongDate } from "@/lib/utils";

export const runtime = "edge";
export const alt = "Picks Daily — Guess the NFL Player";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const c = getTodaysChallenge();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#050505",
          backgroundImage:
            "radial-gradient(900px 500px at 18% 20%, rgba(255, 42, 42, 0.22), transparent 60%), radial-gradient(700px 400px at 82% 90%, rgba(22, 255, 122, 0.10), transparent 60%)",
          color: "#f5f5f5",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          padding: 64,
        }}
      >
        {/* Left column: copy */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            paddingRight: 40,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "linear-gradient(135deg, #ff5050, #cc0022)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                position: "relative",
              }}
            >
              <span style={{ fontSize: 36, fontWeight: 800 }}>P</span>
              <span
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  background: "#16ff7a",
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>
                PICKS
              </div>
              <div
                style={{
                  marginTop: 2,
                  fontSize: 14,
                  letterSpacing: 6,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                Daily
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                padding: "8px 16px",
                borderRadius: 999,
                background: "rgba(255, 42, 42, 0.15)",
                border: "1px solid rgba(255, 42, 42, 0.4)",
                color: "#ff5e5e",
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              {`Today's Pick · ${formatLongDate(c.date)}`}
            </div>
            <div
              style={{
                fontSize: 84,
                fontWeight: 800,
                letterSpacing: -3,
                lineHeight: 1,
                color: "#ffffff",
              }}
            >
              Who&apos;s in the red?
            </div>
            <div style={{ fontSize: 28, color: "#9ca3af", maxWidth: 560, display: "flex" }}>
              {`${c.title} — one new silhouetted NFL play every day. Spot the player, build your streak.`}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 16,
              fontSize: 18,
              color: "#9ca3af",
              fontWeight: 600,
            }}
          >
            <span>Wordle meets NFL highlights</span>
            <span style={{ color: "#3a3a3a" }}>·</span>
            <span>5 attempts</span>
            <span style={{ color: "#3a3a3a" }}>·</span>
            <span>2-min daily</span>
          </div>
        </div>

        {/* Right column: silhouette card */}
        <div
          style={{
            width: 320,
            height: 502,
            borderRadius: 28,
            background:
              "linear-gradient(180deg, #0e0e0e 0%, #0a0a0a 60%, #050505 100%)",
            border: "1px solid #1f1f1f",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            boxShadow: "0 30px 60px -20px rgba(0,0,0,0.7)",
          }}
        >
          <svg
            width={260}
            height={420}
            viewBox="0 0 200 320"
            style={{ display: "block" }}
          >
            <defs>
              <radialGradient id="og-spot" cx="50%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#ff2a2a" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#ff2a2a" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect x="0" y="0" width="200" height="320" fill="url(#og-spot)" />
            {[40, 80, 120, 160, 200, 240, 280].map((y) => (
              <line
                key={y}
                x1="0"
                x2="200"
                y1={y}
                y2={y}
                stroke="#1a1a1a"
                strokeWidth="1"
              />
            ))}
            <g fill="#ff2a2a">
              <circle cx="100" cy="120" r="18" />
              <path d="M70 200 Q100 150 130 200 L128 230 Q100 215 72 230 Z" />
              <rect x="78" y="225" width="14" height="42" rx="6" />
              <rect x="108" y="225" width="14" height="42" rx="6" />
            </g>
            <g fill="#3a3a3a">
              <circle cx="40" cy="100" r="10" />
              <rect x="33" y="110" width="14" height="28" rx="4" />
              <circle cx="160" cy="100" r="10" />
              <rect x="153" y="110" width="14" height="28" rx="4" />
              <circle cx="60" cy="260" r="10" />
              <rect x="53" y="270" width="14" height="28" rx="4" />
              <circle cx="140" cy="260" r="10" />
              <rect x="133" y="270" width="14" height="28" rx="4" />
            </g>
          </svg>
          <div
            style={{
              position: "absolute",
              bottom: 18,
              left: 18,
              right: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "6px 12px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.6)",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                display: "flex",
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "#ff2a2a",
                marginRight: 8,
              }}
            />
            <span>Spot the player in red</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
