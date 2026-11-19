import sharp from "sharp";

export type SoniqCardStyle = "immersive" | "poster" | "minimal";

export interface SoniqResultOptions {
	artistName: string;
	coverImageUrl: string;
	score: number;
	correct: number;
	total: number;
	reactionSpeedSeconds: number;
	topStreak: number;
	perfectRun?: boolean;
	style?: SoniqCardStyle;
	width?: number;
	height?: number;
	brandName?: string;
	websiteUrl?: string;
	footerPrompt?: string;
	imageTimeoutMs?: number;
}

const C = {
	bg: "#08080B",
	panel: "#121218",
	border: "#303039",
	lime: "#D1FF27",
	white: "#F5F4F8",
	muted: "#A09EAD",
	purple: "#B79AFF",
};

const xml = (s: string) =>
	s
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");

const number = (n: number) => new Intl.NumberFormat("en-US").format(n);

async function getImage(url: string, timeoutMs: number): Promise<string> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const response = await fetch(url, { signal: controller.signal });
		if (!response.ok)
			throw new Error(`Image request failed: ${response.status}`);
		const type =
			response.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
		if (!type.startsWith("image/"))
			throw new Error(`URL did not return an image (${type})`);
		const bytes = Buffer.from(await response.arrayBuffer());
		if (!bytes.length) throw new Error("Image response was empty");
		return `data:${type};base64,${bytes.toString("base64")}`;
	} finally {
		clearTimeout(timer);
	}
}

function shell(width: number, height: number, body: string, defs = "") {
	return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
    width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>${defs}</defs>${body}</svg>`;
}

function renderImmersive(
	o: Required<
		Pick<
			SoniqResultOptions,
			| "artistName"
			| "score"
			| "correct"
			| "total"
			| "reactionSpeedSeconds"
			| "topStreak"
			| "perfectRun"
			| "brandName"
			| "websiteUrl"
			| "footerPrompt"
		>
	>,
	image: string,
	w: number,
	h: number,
) {
	const accuracy = Math.round((o.correct / o.total) * 100);
	const streak = `${number(o.topStreak)} in a row`;
	const body = `
    <rect width="100%" height="100%" fill="${C.bg}"/>
    <image xlink:href="${image}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"
      opacity=".72" />
    <rect width="100%" height="100%" fill="#07070B" opacity=".72"/>
    <rect x="0" y="0" width="${w}" height="${h}" fill="url(#shade)"/>
    <rect x="38" y="38" width="${w - 76}" height="${h - 76}" rx="34" fill="#09090D" fill-opacity=".70"
      stroke="#D1FF27" stroke-opacity=".45" stroke-width="2"/>
    <text x="82" y="112" fill="${C.white}" font-family="Arial,sans-serif" font-size="38" font-weight="800">${xml(o.brandName.replace(/\.$/, ""))}<tspan fill="${C.lime}">.</tspan></text>
    <text x="${w - 82}" y="108" text-anchor="end" fill="${C.lime}" font-family="monospace" font-size="16" letter-spacing="3">${o.perfectRun ? "PERFECT RUN" : "QUIZ COMPLETE"}</text>
    <text x="84" y="${h * 0.39}" fill="${C.white}" font-family="Arial,sans-serif" font-size="20" font-weight="700" letter-spacing="5">QUIZ CHALLENGE COMPLETED</text>
    <text x="80" y="${h * 0.5}" fill="${C.white}" font-family="Arial,sans-serif" font-size="${Math.min(76, w * 0.055)}" font-weight="800">${xml(o.artistName)}</text>
    <text x="84" y="${h * 0.59}" fill="${C.muted}" font-family="monospace" font-size="18">FINAL SCORE</text>
    <text x="80" y="${h * 0.76}" fill="${C.lime}" font-family="Arial,sans-serif" font-size="${Math.min(126, w * 0.095)}" font-weight="900">${number(o.score)}</text>
    <text x="84" y="${h * 0.83}" fill="${C.white}" font-family="monospace" font-size="20">${o.correct}/${o.total} CORRECT  ·  <tspan fill="${C.lime}">${accuracy}% ACCURACY</tspan></text>
    <rect x="${w - 490}" y="${h * 0.33}" width="365" height="82" rx="22" fill="#111118" fill-opacity=".88" stroke="#FFFFFF" stroke-opacity=".18"/>
    <text x="${w - 307}" y="${h * 0.385}" text-anchor="middle" fill="${C.muted}" font-family="monospace" font-size="14" letter-spacing="2">REACTION SPEED</text>
    <text x="${w - 307}" y="${h * 0.435}" text-anchor="middle" fill="${C.white}" font-family="monospace" font-size="26" font-weight="700">${o.reactionSpeedSeconds.toFixed(2)}s</text>
    <rect x="${w - 490}" y="${h * 0.49}" width="365" height="82" rx="22" fill="#111118" fill-opacity=".88" stroke="#FFFFFF" stroke-opacity=".18"/>
    <text x="${w - 307}" y="${h * 0.545}" text-anchor="middle" fill="${C.muted}" font-family="monospace" font-size="14" letter-spacing="2">TOP STREAK</text>
    <text x="${w - 307}" y="${h * 0.595}" text-anchor="middle" fill="${C.purple}" font-family="monospace" font-size="26" font-weight="700">${xml(streak)}</text>
    <line x1="82" y1="${h - 112}" x2="${w - 82}" y2="${h - 112}" stroke="#FFFFFF" stroke-opacity=".22"/>
    <text x="82" y="${h - 68}" fill="${C.white}" opacity=".75" font-family="monospace" font-size="16">PLAY AT ${xml(o.websiteUrl)}</text>
    <text x="${w - 82}" y="${h - 68}" text-anchor="end" fill="${C.lime}" font-family="monospace" font-size="17" font-weight="700">${xml(o.footerPrompt)}</text>`;
	return shell(
		w,
		h,
		body,
		`<linearGradient id="shade" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#050509" stop-opacity=".25"/><stop offset="1" stop-color="#050509" stop-opacity=".88"/></linearGradient>`,
	);
}

function renderPoster(
	o: Required<
		Pick<
			SoniqResultOptions,
			| "artistName"
			| "score"
			| "correct"
			| "total"
			| "reactionSpeedSeconds"
			| "topStreak"
			| "perfectRun"
			| "brandName"
			| "websiteUrl"
			| "footerPrompt"
		>
	>,
	image: string,
	w: number,
	h: number,
) {
	const accuracy = Math.round((o.correct / o.total) * 100);
	const pad = Math.round(w * 0.055);
	const artSize = Math.round(Math.min(w * 0.39, h * 0.67));
	const artX = w - pad - artSize;
	const artY = Math.round((h - artSize) / 2);
	const body = `
    <rect width="100%" height="100%" fill="#0A0A0E"/>
    <circle cx="${w * 0.14}" cy="${h * 0.13}" r="${w * 0.19}" fill="#D1FF27" opacity=".07"/>
    <image xlink:href="${image}" x="${artX}" y="${artY}" width="${artSize}" height="${artSize}"
      preserveAspectRatio="xMidYMid slice" clip-path="url(#artClip)"/>
    <rect x="${artX}" y="${artY}" width="${artSize}" height="${artSize}" rx="30" fill="none" stroke="#D1FF27" stroke-opacity=".65" stroke-width="2"/>
    <text x="${pad}" y="${h * 0.15}" fill="${C.white}" font-family="Arial,sans-serif" font-size="34" font-weight="800">${xml(o.brandName.replace(/\.$/, ""))}<tspan fill="${C.lime}">.</tspan></text>
    <text x="${pad}" y="${h * 0.28}" fill="${C.lime}" font-family="monospace" font-size="15" letter-spacing="4">${o.perfectRun ? "★ PERFECT RUN" : "QUIZ COMPLETE"}</text>
    <text x="${pad}" y="${h * 0.4}" fill="${C.white}" font-family="Arial,sans-serif" font-size="${Math.min(58, w * 0.052)}" font-weight="800">${xml(o.artistName)}</text>
    <text x="${pad}" y="${h * 0.49}" fill="${C.muted}" font-family="monospace" font-size="14" letter-spacing="3">YOUR FINAL SCORE</text>
    <text x="${pad}" y="${h * 0.66}" fill="${C.lime}" font-family="Arial,sans-serif" font-size="${Math.min(112, w * 0.1)}" font-weight="900">${number(o.score)}</text>
    <text x="${pad}" y="${h * 0.73}" fill="${C.white}" font-family="monospace" font-size="17">${o.correct}/${o.total} correct · ${accuracy}% accuracy</text>
    <rect x="${pad}" y="${h * 0.8}" width="190" height="54" rx="15" fill="#17171F" stroke="#353540"/>
    <text x="${pad + 95}" y="${h * 0.835}" text-anchor="middle" fill="${C.muted}" font-family="monospace" font-size="11">REACTION</text>
    <text x="${pad + 95}" y="${h * 0.87}" text-anchor="middle" fill="${C.white}" font-family="monospace" font-size="18" font-weight="700">${o.reactionSpeedSeconds.toFixed(2)}s</text>
    <rect x="${pad + 205}" y="${h * 0.8}" width="190" height="54" rx="15" fill="#17171F" stroke="#353540"/>
    <text x="${pad + 300}" y="${h * 0.835}" text-anchor="middle" fill="${C.muted}" font-family="monospace" font-size="11">TOP STREAK</text>
    <text x="${pad + 300}" y="${h * 0.87}" text-anchor="middle" fill="${C.purple}" font-family="monospace" font-size="18" font-weight="700">${number(o.topStreak)}</text>
    <text x="${w - pad}" y="${h - 38}" text-anchor="end" fill="${C.lime}" font-family="monospace" font-size="15" font-weight="700">${xml(o.footerPrompt)}</text>`;
	return shell(
		w,
		h,
		body,
		`<clipPath id="artClip"><rect x="${artX}" y="${artY}" width="${artSize}" height="${artSize}" rx="30"/></clipPath>`,
	);
}

function renderMinimal(
	o: Required<
		Pick<
			SoniqResultOptions,
			| "artistName"
			| "score"
			| "correct"
			| "total"
			| "reactionSpeedSeconds"
			| "topStreak"
			| "perfectRun"
			| "brandName"
			| "websiteUrl"
			| "footerPrompt"
		>
	>,
	image: string,
	w: number,
	h: number,
) {
	const accuracy = Math.round((o.correct / o.total) * 100);
	const body = `
    <rect width="100%" height="100%" fill="#F1F0EA"/>
    <rect x="32" y="32" width="${w - 64}" height="${h - 64}" rx="28" fill="#FAF9F4" stroke="#D8D6CD" stroke-width="2"/>
    <text x="76" y="105" fill="#111116" font-family="Arial,sans-serif" font-size="32" font-weight="900">${xml(o.brandName.replace(/\.$/, ""))}<tspan fill="#A4D900">.</tspan></text>
    <text x="${w - 76}" y="101" text-anchor="end" fill="#55545A" font-family="monospace" font-size="14" letter-spacing="2">${o.perfectRun ? "PERFECT RUN" : "QUIZ COMPLETE"}</text>
    <image x="76" y="160" width="210" height="210" xlink:href="${image}" preserveAspectRatio="xMidYMid slice" clip-path="url(#miniClip)"/>
    <text x="326" y="225" fill="#77757B" font-family="monospace" font-size="14" letter-spacing="3">YOU JUST PLAYED</text>
    <text x="326" y="282" fill="#111116" font-family="Arial,sans-serif" font-size="48" font-weight="800">${xml(o.artistName)}</text>
    <text x="326" y="333" fill="#55545A" font-family="monospace" font-size="16">${o.correct}/${o.total} correct · ${accuracy}% accuracy</text>
    <text x="76" y="${h * 0.67}" fill="#77757B" font-family="monospace" font-size="14" letter-spacing="3">FINAL SCORE</text>
    <text x="76" y="${h * 0.83}" fill="#111116" font-family="Arial,sans-serif" font-size="105" font-weight="900">${number(o.score)}</text>
    <line x1="${w * 0.59}" y1="${h * 0.65}" x2="${w * 0.59}" y2="${h * 0.87}" stroke="#D8D6CD" stroke-width="2"/>
    <text x="${w * 0.65}" y="${h * 0.72}" fill="#77757B" font-family="monospace" font-size="13" letter-spacing="2">REACTION SPEED</text>
    <text x="${w * 0.65}" y="${h * 0.78}" fill="#111116" font-family="monospace" font-size="27" font-weight="700">${o.reactionSpeedSeconds.toFixed(2)}s</text>
    <text x="${w * 0.65}" y="${h * 0.84}" fill="#77757B" font-family="monospace" font-size="13" letter-spacing="2">TOP STREAK  <tspan fill="#8764D8" font-size="20">${number(o.topStreak)}</tspan></text>
    <text x="76" y="${h - 63}" fill="#77757B" font-family="monospace" font-size="14">${xml(o.websiteUrl)}</text>
    <text x="${w - 76}" y="${h - 63}" text-anchor="end" fill="#111116" font-family="monospace" font-size="15" font-weight="700">${xml(o.footerPrompt)}</text>`;
	return shell(
		w,
		h,
		body,
		`<clipPath id="miniClip"><rect x="76" y="160" width="210" height="210" rx="24"/></clipPath>`,
	);
}

/**
 * Render one of three share-card directions:
 * - immersive: full-bleed artwork, dark overlay, floating stats
 * - poster: bold editorial layout with large artwork on the right
 * - minimal: light, restrained layout with strong typography
 */
export async function generateSoniqResultCard(
	options: SoniqResultOptions,
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
		style = "immersive",
		width = 1600,
		height = 900,
		brandName = "soniq.",
		websiteUrl = "soniq.dibbu.dev",
		footerPrompt = "CAN YOU BEAT MY SCORE?",
		imageTimeoutMs = 10_000,
	} = options;

	if (!artistName.trim()) throw new Error("artistName is required");
	if (!coverImageUrl.trim()) throw new Error("coverImageUrl is required");
	if (
		!Number.isFinite(score) ||
		!Number.isFinite(reactionSpeedSeconds) ||
		!Number.isFinite(topStreak)
	)
		throw new Error("Score, reaction speed, and streak must be valid numbers");
	if (
		!Number.isInteger(total) ||
		total <= 0 ||
		!Number.isInteger(correct) ||
		correct < 0 ||
		correct > total
	)
		throw new Error("Expected integer total > 0 and 0 <= correct <= total");
	if (width < 1000 || height < 600)
		throw new Error("Use dimensions of at least 1000x600");

	const image = await getImage(coverImageUrl, imageTimeoutMs);
	const normalized = {
		artistName,
		score,
		correct,
		total,
		reactionSpeedSeconds,
		topStreak,
		perfectRun,
		brandName,
		websiteUrl,
		footerPrompt,
	};
	const svg =
		style === "poster"
			? renderPoster(normalized, image, width, height)
			: style === "minimal"
				? renderMinimal(normalized, image, width, height)
				: renderImmersive(normalized, image, width, height);

	return sharp(Buffer.from(svg)).png().toBuffer();
}

export default generateSoniqResultCard;
