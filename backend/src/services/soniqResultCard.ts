import sharp from "sharp";

/**
 * Soniq quiz-result card renderer.
 *
 * Install:
 *   npm install sharp
 *
 * Usage:
 *   const png = await generateSoniqResultCard({
 *     artistName: "BoyWithUke",
 *     coverImageUrl: "https://example.com/cover.jpg",
 *     score: 3817,
 *     correct: 10,
 *     total: 10,
 *     reactionSpeedSeconds: 2.86,
 *     topStreak: 0,
 *     perfectRun: true,
 *   });
 *   await fs.promises.writeFile("soniq-result.png", png);
 */

export interface SoniqResultCardOptions {
  /** Artist, playlist, or quiz title shown beside the cover art. */
  artistName: string;
  /** Publicly accessible image URL for the square cover artwork. */
  coverImageUrl: string;
  score: number;
  correct: number;
  total: number;
  reactionSpeedSeconds: number;
  topStreak: number;
  perfectRun?: boolean;
  /** Optional overrides. Defaults reproduce the supplied reference layout. */
  width?: number;
  height?: number;
  brandName?: string;
  websiteUrl?: string;
  footerPrompt?: string;
  /** Optional request timeout for downloading cover art. Defaults to 10 seconds. */
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
      throw new Error(`Could not fetch cover image (${response.status} ${response.statusText})`);
    }

    const contentType = response.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
    if (!contentType.startsWith("image/")) {
      throw new Error(`Cover URL did not return an image (content-type: ${contentType})`);
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length === 0) throw new Error("Cover image response was empty");
    return `data:${contentType};base64,${bytes.toString("base64")}`;
  } finally {
    clearTimeout(timeout);
  }
}

/** Generate a Soniq-style quiz result card as a PNG Buffer. */
export async function generateSoniqResultCard(
  options: SoniqResultCardOptions,
): Promise<Buffer> {
  const {
    artistName,
    coverImageUrl,
    score,
    correct,
    total,
    reactionSpeedSeconds,
    topStreak,
    perfectRun = correct === total,
    width = 1706,
    height = 896,
    brandName = "soniq.",
    websiteUrl = "soniq.dibbu.dev",
    footerPrompt = "Can you beat my score?",
    imageTimeoutMs = 10_000,
  } = options;

  if (!artistName.trim()) throw new Error("artistName is required");
  if (!coverImageUrl.trim()) throw new Error("coverImageUrl is required");
  if (total <= 0 || correct < 0 || correct > total) {
    throw new Error("Expected total > 0 and 0 <= correct <= total");
  }
  if (width < 900 || height < 500) {
    throw new Error("Card dimensions are too small; use at least 900x500");
  }

  const coverDataUri = await fetchImageAsDataUri(coverImageUrl, imageTimeoutMs);
  const accuracy = Math.round((correct / total) * 100);

  // The reference image is 1706x896. Coordinates scale with the requested size.
  const sx = width / 1706;
  const sy = height / 896;
  const s = Math.min(sx, sy);
  const x = (n: number) => +(n * sx).toFixed(2);
  const y = (n: number) => +(n * sy).toFixed(2);
  const f = (n: number) => +(n * s).toFixed(2);

  const safeArtist = escapeXml(artistName);
  const safeBrand = escapeXml(brandName);
  const safeWebsite = escapeXml(websiteUrl);
  const safePrompt = escapeXml(footerPrompt);
  const scoreText = escapeXml(formatNumber(score));
  const reactionText = `${reactionSpeedSeconds.toFixed(2)}s`;
  const streakText = `${formatNumber(topStreak)} in a row`;

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <filter id="glow" x="-300%" y="-300%" width="700%" height="700%">
        <feGaussianBlur stdDeviation="${f(12)}" result="blur" />
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <clipPath id="coverClip"><rect x="${x(124)}" y="${y(263)}" width="${x(182)}" height="${y(182)}" rx="${f(39)}"/></clipPath>
    </defs>

    <rect width="100%" height="100%" fill="${COLORS.background}"/>
    <rect x="${x(52)}" y="${y(52)}" width="${x(1602)}" height="${y(792)}" rx="${f(49)}"
      fill="none" stroke="#526A0B" stroke-width="${f(2.8)}"/>

    <!-- Brand -->
    <circle cx="${x(132)}" cy="${y(139)}" r="${f(10)}" fill="${COLORS.lime}" filter="url(#glow)"/>
    <text x="${x(160)}" y="${y(155)}" fill="${COLORS.white}" font-size="${f(43)}" font-weight="750"
      font-family="Inter, Arial, sans-serif">${safeBrand.replace(/\.$/, "")}<tspan fill="${COLORS.lime}">.</tspan></text>

    <!-- Perfect run pill -->
    <rect x="${x(1384)}" y="${y(113)}" width="${x(199)}" height="${y(53)}" rx="${f(28)}"
      fill="${COLORS.panel}" stroke="${COLORS.border}" stroke-width="${f(1.5)}"/>
    <text x="${x(1483.5)}" y="${y(146)}" text-anchor="middle" fill="${perfectRun ? COLORS.lime : COLORS.muted}"
      font-family="monospace" font-size="${f(17)}" font-weight="700" letter-spacing="${f(2)}">${perfectRun ? "PERFECT RUN" : "QUIZ COMPLETE"}</text>

    <!-- Cover art -->
    <rect x="${x(122)}" y="${y(261)}" width="${x(186)}" height="${y(186)}" rx="${f(41)}"
      fill="#17171D" stroke="#555560" stroke-width="${f(2.5)}"/>
    <image href="${coverDataUri}" x="${x(125)}" y="${y(264)}" width="${x(180)}" height="${y(180)}"
      preserveAspectRatio="xMidYMid slice" clip-path="url(#coverClip)"/>

    <!-- Quiz title -->
    <text x="${x(341)}" y="${y(323)}" fill="${COLORS.muted}" font-family="monospace" font-size="${f(16)}"
      font-weight="700" letter-spacing="${f(2.3)}">QUIZ CHALLENGE COMPLETED</text>
    <text x="${x(341)}" y="${y(390)}" fill="${COLORS.white}" font-family="Inter, Arial, sans-serif"
      font-size="${f(59)}" font-weight="750">${safeArtist}</text>

    <!-- Score card -->
    <rect x="${x(1088)}" y="${y(246)}" width="${x(495)}" height="${y(217)}" rx="${f(39)}"
      fill="${COLORS.panelDark}" stroke="${COLORS.border}" stroke-width="${f(1.5)}"/>
    <text x="${x(1335.5)}" y="${y(292)}" text-anchor="middle" fill="${COLORS.muted}" font-family="monospace"
      font-size="${f(15)}" font-weight="700" letter-spacing="${f(2.5)}">FINAL SCORE</text>
    <text x="${x(1335.5)}" y="${y(386)}" text-anchor="middle" fill="${COLORS.lime}" font-family="Inter, Arial, sans-serif"
      font-size="${f(91)}" font-weight="800">${scoreText}</text>
    <text x="${x(1335.5)}" y="${y(427)}" text-anchor="middle" fill="${COLORS.white}" font-family="monospace"
      font-size="${f(19)}" font-weight="700">${correct}/${total} Correct<tspan fill="${COLORS.muted}">  •  </tspan><tspan fill="${COLORS.lime}">${accuracy}% Accuracy</tspan></text>

    <!-- Stats panels -->
    <rect x="${x(123)}" y="${y(541)}" width="${x(716)}" height="${y(127)}" rx="${f(30)}"
      fill="${COLORS.panel}" stroke="${COLORS.border}" stroke-width="${f(1.5)}"/>
    <rect x="${x(868)}" y="${y(541)}" width="${x(715)}" height="${y(127)}" rx="${f(30)}"
      fill="${COLORS.panel}" stroke="${COLORS.border}" stroke-width="${f(1.5)}"/>

    <text x="${x(481)}" y="${y(582)}" text-anchor="middle" fill="${COLORS.muted}" font-family="monospace"
      font-size="${f(15)}" font-weight="700" letter-spacing="${f(1.5)}">REACTION SPEED</text>
    <text x="${x(481)}" y="${y(632)}" text-anchor="middle" fill="${COLORS.white}" font-family="monospace"
      font-size="${f(34)}" font-weight="700">${escapeXml(reactionText)}</text>

    <text x="${x(1225.5)}" y="${y(582)}" text-anchor="middle" fill="${COLORS.muted}" font-family="monospace"
      font-size="${f(15)}" font-weight="700" letter-spacing="${f(1.5)}">TOP STREAK</text>
    <text x="${x(1225.5)}" y="${y(632)}" text-anchor="middle" fill="${COLORS.purple}" font-family="monospace"
      font-size="${f(34)}" font-weight="700">${escapeXml(streakText)}</text>

    <!-- Footer -->
    <line x1="${x(123)}" y1="${y(731)}" x2="${x(1583)}" y2="${y(731)}" stroke="${COLORS.border}" stroke-width="${f(1.5)}"/>
    <text x="${x(123)}" y="${y(778)}" fill="${COLORS.muted}" font-family="monospace" font-size="${f(18)}"
      font-weight="700">Play speed music trivia free at ${safeWebsite}</text>
    <text x="${x(1583)}" y="${y(778)}" text-anchor="end" fill="${COLORS.lime}" font-family="monospace"
      font-size="${f(18)}" font-weight="700">${safePrompt}</text>
  </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

export default generateSoniqResultCard;
