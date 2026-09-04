import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { rasterLogoDataUri } from "@/lib/resolve-logo";
import { rankLabel } from "@/lib/share";

export const SHARE_CARD_SIZE = { width: 1200, height: 630 };

export type ShareCardInput = {
  name: string;
  rank: number;
  price: number;
  host?: string | null;
  pageUrl?: string | null;
  kind?: "hop" | "sponsored";
};

type ShareCardRender = ShareCardInput & {
  logoSrc?: string | null;
  hopupLogoSrc?: string | null;
};

function cardTitle(name: string) {
  const short = name.split(/\s[—–-]\s/)[0]?.trim() || name;
  return (short.length >= 2 ? short : name).slice(0, 42);
}

async function loadOutfit() {
  const dir = join(process.cwd(), "src/lib/fonts");
  const [semibold, bold] = await Promise.all([
    readFile(join(dir, "Outfit-SemiBold.ttf")),
    readFile(join(dir, "Outfit-Bold.ttf")),
  ]);

  return [
    { name: "Outfit", data: semibold, weight: 600 as const, style: "normal" as const },
    { name: "Outfit", data: bold, weight: 700 as const, style: "normal" as const },
  ];
}

let outfitFonts: Awaited<ReturnType<typeof loadOutfit>> | null = null;
let hopupLogoData: string | null = null;

async function fonts() {
  if (!outfitFonts) outfitFonts = await loadOutfit();
  return outfitFonts;
}

async function hopupLogo() {
  if (!hopupLogoData) {
    const file = await readFile(join(process.cwd(), "public/hoplogo.png"));
    hopupLogoData = `data:image/png;base64,${file.toString("base64")}`;
  }
  return hopupLogoData;
}

export function shareCardElement(card: ShareCardRender) {
  const isHof = card.rank === 0;
  const isSponsored = card.kind === "sponsored";
  const spot = isSponsored ? "Sponsored" : rankLabel(card.rank);
  const bid = `$${card.price.toLocaleString()}`;
  const eyebrow = isSponsored ? "ON THE BOARD" : isHof ? "HALL OF FAME" : "JUST HOPPED";
  const title = cardTitle(card.name);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px 64px",
        backgroundColor: "#141210",
        backgroundImage:
          "radial-gradient(circle at 92% 8%, rgba(255, 140, 115, 0.32) 0%, rgba(255, 140, 115, 0) 38%), radial-gradient(circle at 8% 92%, rgba(255, 140, 115, 0.14) 0%, rgba(255, 140, 115, 0) 36%)",
        color: "#FAF8F5",
        fontFamily: "Outfit",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: "0.2em",
            color: isHof ? "#E8C36A" : "#FF8C73",
          }}
        >
          {eyebrow}
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          {card.hopupLogoSrc ? (
            <img
              src={card.hopupLogoSrc}
              width={44}
              height={44}
              alt=""
              style={{
                width: 44,
                height: 44,
                marginRight: 12,
                objectFit: "contain",
              }}
            />
          ) : null}
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 600,
              color: "rgba(250,248,245,0.72)",
            }}
          >
            hopup.lol
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
        {card.logoSrc ? (
          <img
            src={card.logoSrc}
            width={104}
            height={104}
            alt=""
            style={{
              width: 104,
              height: 104,
              borderRadius: 24,
              objectFit: "cover",
              backgroundColor: "#ffffff",
              marginRight: 28,
            }}
          />
        ) : (
          <div
            style={{
              width: 104,
              height: 104,
              borderRadius: 24,
              marginRight: 28,
              backgroundColor: "#2A2623",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 42,
              fontWeight: 700,
              color: "#FF8C73",
            }}
          >
            {(title[0] || "H").toUpperCase()}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", width: 880 }}>
          <div
            style={{
              display: "flex",
              fontSize: title.length > 22 ? 44 : 58,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
            }}
          >
            {title}
          </div>
          {card.host ? (
            <div
              style={{
                display: "flex",
                marginTop: 8,
                fontSize: 24,
                fontWeight: 600,
                color: "rgba(250,248,245,0.48)",
              }}
            >
              {card.host}
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: isHof ? 52 : 80,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              color: isHof ? "#E8C36A" : "#FAF8F5",
              lineHeight: 1,
            }}
          >
            {spot}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 6,
              fontSize: 20,
              fontWeight: 600,
              color: "rgba(250,248,245,0.42)",
            }}
          >
            {isSponsored ? "featured slot" : "on the board"}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            {bid}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 6,
              fontSize: 20,
              fontWeight: 600,
              color: "rgba(250,248,245,0.42)",
            }}
          >
            current bid
          </div>
        </div>
      </div>
    </div>
  );
}

export async function shareCardImage(card: ShareCardInput) {
  const pageUrl = card.pageUrl || (card.host ? `https://${card.host}` : null);
  const [loaded, brandLogo, siteLogo] = await Promise.all([
    fonts(),
    hopupLogo().catch(() => null),
    rasterLogoDataUri(pageUrl).catch(() => null),
  ]);
  const render = (logoSrc: string | null) =>
    new ImageResponse(shareCardElement({ ...card, logoSrc, hopupLogoSrc: brandLogo }), {
      ...SHARE_CARD_SIZE,
      fonts: loaded,
    });

  try {
    return render(siteLogo);
  } catch (err) {
    if (siteLogo) {
      console.error("Share card logo failed, retrying without it:", err);
      return render(null);
    }
    throw err;
  }
}
