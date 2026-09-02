import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ListingNotFound() {
  return (
    <>
      <Navbar />
      <main className="w-full px-4 md:px-8 pt-24 md:pt-28 pb-20">
        <div className="w-full max-w-[520px] mx-auto text-center">
          <h1 className="text-[28px] md:text-[34px] font-semibold tracking-tight text-foreground">
            Listing not found
          </h1>
          <p className="mt-2 text-sm md:text-base text-secondary">
            That product is no longer on the board.
          </p>
          <Link
            href="/p"
            className="inline-flex mt-6 bg-foreground text-background px-5 py-2 rounded-full text-sm font-semibold hover:bg-accent hover:text-foreground transition-colors"
          >
            See all listings
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
