import sharp from "sharp";

/**
 * Soniq user account summary profile card generator (PNG Buffer).
 * Modeled after the high-aesthetic design system of soniqResultCard.ts.
 */

export interface SoniqAccountCardOptions {
  displayName: string;
  avatarUrl?: string | null;
  totalGames: number;
  bestScore: number;
  averageAccuracy: number;
  fastestTimeSeconds: number;
  rank?: string;
  width?: number;
  height?: number;
  brandName?: string;
  websiteUrl?: string;
  imageTimeoutMs?: number;
}

const COLORS = {
  background: "#08080B",
  panel: "#121218",
  panelDark: "#0B0B10",
  border: "#292930",
  lime: "#D1FF27",
  white: "#F4F3F7",
  muted: "#8C8A9C",
  purple: "#B79AFF",
  pink: "#FF4694",
};

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

async function fetchImageAsDataUri(url: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8" },
    });

    if (!response.ok) {
      throw new Error(`Could not fetch avatar (${response.status})`);
    }

    const contentType = response.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length === 0) throw new Error("Image buffer empty");
    return `data:${contentType};base64,${bytes.toString("base64")}`;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Generates an OpenGraph / Social share card for a user's account profile.
 */
export async function generateSoniqAccountCard(
  options: SoniqAccountCardOptions,
): Promise<Buffer> {
  const {
    displayName,
    avatarUrl,
    totalGames,
    bestScore,
    averageAccuracy,
    fastestTimeSeconds,
    rank = "PLAYER STATS",
    width = 1706,
    height = 896,
    brandName = "soniq.",
    websiteUrl = "soniq.dibbu.dev",
    imageTimeoutMs = 10_000,
  } = options;

  let avatarDataUri: string | null = null;
  if (avatarUrl && avatarUrl.startsWith("http")) {
    try {
      avatarDataUri = await fetchImageAsDataUri(avatarUrl, imageTimeoutMs);
    } catch {
      avatarDataUri = null;
    }
  }

  // Coordinate scaling relative to 1706x896 reference dimensions
  const sx = width / 1706;
  const sy = height / 896;
  const s = Math.min(sx, sy);
  const x = (n: number) => +(n * sx).toFixed(2);
  const y = (n: number) => +(n * sy).toFixed(2);
  const f = (n: number) => +(n * s).toFixed(2);

  const safeName = escapeXml(displayName || "Music Fan");
  const safeBrand = escapeXml(brandName);
  const safeWebsite = escapeXml(websiteUrl);
  const safeRank = escapeXml(rank);
  const scoreText = escapeXml(formatNumber(bestScore));
  const accuracyText = `${Math.round(averageAccuracy)}%`;
  const fastestText = fastestTimeSeconds > 0 ? `${fastestTimeSeconds.toFixed(1)}s` : "---";
  const gamesText = formatNumber(totalGames);

  const initials = (displayName || "U").slice(0, 2).toUpperCase();

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <filter id="glow" x="-300%" y="-300%" width="700%" height="700%">
        <feGaussianBlur stdDeviation="${f(12)}" result="blur" />
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <clipPath id="avatarClip">
        <rect x="${x(124)}" y="${y(263)}" width="${x(182)}" height="${y(182)}" rx="${f(91)}"/>
      </clipPath>
    </defs>

    <!-- Canvas background & outer neon border -->
    <rect width="100%" height="100%" fill="${COLORS.background}"/>
    <rect x="${x(52)}" y="${y(52)}" width="${x(1602)}" height="${y(792)}" rx="${f(49)}"
      fill="none" stroke="#526A0B" stroke-width="${f(2.8)}"/>

    <!-- Brand Header -->
    <circle cx="${x(132)}" cy="${y(139)}" r="${f(10)}" fill="${COLORS.lime}" filter="url(#glow)"/>
    <text x="${x(160)}" y="${y(155)}" fill="${COLORS.white}" font-size="${f(43)}" font-weight="750"
      font-family="Inter, Arial, sans-serif">${safeBrand.replace(/\.$/, "")}<tspan fill="${COLORS.lime}">.</tspan></text>

    <!-- Top Badge Pill -->
    <rect x="${x(1320)}" y="${y(113)}" width="${x(263)}" height="${y(53)}" rx="${f(28)}"
      fill="${COLORS.panel}" stroke="${COLORS.border}" stroke-width="${f(1.5)}"/>
    <text x="${x(1451.5)}" y="${y(146)}" text-anchor="middle" fill="${COLORS.lime}"
      font-family="monospace" font-size="${f(17)}" font-weight="700" letter-spacing="${f(2)}">${safeRank}</text>

    <!-- Avatar / Initials container -->
    <rect x="${x(122)}" y="${y(261)}" width="${x(186)}" height="${y(186)}" rx="${f(93)}"
      fill="#17171D" stroke="#555560" stroke-width="${f(2.5)}"/>
    ${
      avatarDataUri
        ? `<image href="${avatarDataUri}" x="${x(125)}" y="${y(264)}" width="${x(180)}" height="${y(180)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarClip)"/>`
        : `<text x="${x(215)}" y="${y(375)}" text-anchor="middle" fill="${COLORS.lime}" font-family="Inter, Arial, sans-serif" font-size="${f(68)}" font-weight="800">${escapeXml(initials)}</text>`
    }

    <!-- User display name and subtitle -->
    <text x="${x(341)}" y="${y(323)}" fill="${COLORS.muted}" font-family="monospace" font-size="${f(16)}"
      font-weight="700" letter-spacing="${f(2.3)}">MUSIC TRIVIA MASTER</text>
    <text x="${x(341)}" y="${y(390)}" fill="${COLORS.white}" font-family="Inter, Arial, sans-serif"
      font-size="${f(59)}" font-weight="750">${safeName}</text>

    <!-- Top Score Main Panel -->
    <rect x="${x(1088)}" y="${y(246)}" width="${x(495)}" height="${y(217)}" rx="${f(39)}"
      fill="${COLORS.panelDark}" stroke="${COLORS.border}" stroke-width="${f(1.5)}"/>
    <text x="${x(1335.5)}" y="${y(292)}" text-anchor="middle" fill="${COLORS.muted}" font-family="monospace"
      font-size="${f(15)}" font-weight="700" letter-spacing="${f(2.5)}">CAREER HIGH SCORE</text>
    <text x="${x(1335.5)}" y="${y(386)}" text-anchor="middle" fill="${COLORS.lime}" font-family="Inter, Arial, sans-serif"
      font-size="${f(91)}" font-weight="800">${scoreText}</text>
    <text x="${x(1335.5)}" y="${y(427)}" text-anchor="middle" fill="${COLORS.white}" font-family="monospace"
      font-size="${f(19)}" font-weight="700">${gamesText} Quizzes Played</text>

    <!-- 3 Bottom Metric Panels -->
    <!-- Metric 1: Accuracy -->
    <rect x="${x(123)}" y="${y(541)}" width="${x(460)}" height="${y(127)}" rx="${f(30)}"
      fill="${COLORS.panel}" stroke="${COLORS.border}" stroke-width="${f(1.5)}"/>
    <text x="${x(353)}" y="${y(582)}" text-anchor="middle" fill="${COLORS.muted}" font-family="monospace"
      font-size="${f(15)}" font-weight="700" letter-spacing="${f(1.5)}">ACCURACY</text>
    <text x="${x(353)}" y="${y(632)}" text-anchor="middle" fill="${COLORS.purple}" font-family="monospace"
      font-size="${f(34)}" font-weight="700">${escapeXml(accuracyText)}</text>

    <!-- Metric 2: Fastest Run -->
    <rect x="${x(623)}" y="${y(541)}" width="${x(460)}" height="${y(127)}" rx="${f(30)}"
      fill="${COLORS.panel}" stroke="${COLORS.border}" stroke-width="${f(1.5)}"/>
    <text x="${x(853)}" y="${y(582)}" text-anchor="middle" fill="${COLORS.muted}" font-family="monospace"
      font-size="${f(15)}" font-weight="700" letter-spacing="${f(1.5)}">FASTEST 10-TRACK RUN</text>
    <text x="${x(853)}" y="${y(632)}" text-anchor="middle" fill="${COLORS.white}" font-family="monospace"
      font-size="${f(34)}" font-weight="700">${escapeXml(fastestText)}</text>

    <!-- Metric 3: Quizzes Completed -->
    <rect x="${x(1123)}" y="${y(541)}" width="${x(460)}" height="${y(127)}" rx="${f(30)}"
      fill="${COLORS.panel}" stroke="${COLORS.border}" stroke-width="${f(1.5)}"/>
    <text x="${x(1353)}" y="${y(582)}" text-anchor="middle" fill="${COLORS.muted}" font-family="monospace"
      font-size="${f(15)}" font-weight="700" letter-spacing="${f(1.5)}">GAMES COMPLETED</text>
    <text x="${x(1353)}" y="${y(632)}" text-anchor="middle" fill="${COLORS.lime}" font-family="monospace"
      font-size="${f(34)}" font-weight="700">${gamesText}</text>

    <!-- Footer Divider & Action Prompts -->
    <line x1="${x(123)}" y1="${y(731)}" x2="${x(1583)}" y2="${y(731)}" stroke="${COLORS.border}" stroke-width="${f(1.5)}"/>
    <text x="${x(123)}" y="${y(778)}" fill="${COLORS.muted}" font-family="monospace" font-size="${f(18)}"
      font-weight="700">Profile on ${safeWebsite}</text>
    <text x="${x(1583)}" y="${y(778)}" text-anchor="end" fill="${COLORS.lime}" font-family="monospace"
      font-size="${f(18)}" font-weight="700">Can you beat my stats? Play now &#x2192;</text>
  </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

export default generateSoniqAccountCard;
