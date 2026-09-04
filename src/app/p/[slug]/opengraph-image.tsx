import { displayHost } from "@/lib/product-path";
import { findProductBySlug, getRankedProducts, withBoardRanks } from "@/lib/products-server";
import { SHARE_CARD_SIZE, shareCardImage } from "@/lib/share-card";

export const alt = "HopUp listing";
export const size = SHARE_CARD_SIZE;
export const contentType = "image/png";
export const revalidate = 60;

type ImageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ListingCard({ params }: ImageProps) {
  const { slug } = await params;
  const products = withBoardRanks(await getRankedProducts());
  const product = findProductBySlug(products, slug);
  const host = displayHost(product?.url);

  return shareCardImage({
    name: product?.name || "HopUp listing",
    rank: product?.rank ?? 1,
    price: product?.price || 2,
    host,
    logoSrc: host
      ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`
      : null,
  });
}
