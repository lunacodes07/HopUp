import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function RefundsPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-col flex-1 w-full relative pt-32 pb-24 px-6 md:px-12 items-center">
        <div className="w-full max-w-[800px] prose prose-invert">
          <h1 className="text-4xl font-extrabold mb-8 text-foreground">Refund & Cancellation Policy</h1>
          <p className="text-secondary mb-4">Last updated: September 7, 2026</p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">1. We do not refund anything</h2>
          <p className="text-secondary mb-4">
            Every payment on HopUp is a one-time bid for digital placement. Once you pay, the sale is final. We do not refund hops, hop-overs, sponsored spots, Brand My Stanley spots, or any other purchase.
          </p>
          <p className="text-secondary mb-6">
            If someone hops your rank or takes your Stanley spot, you do not get your money back. You paid for the placement you had. The next person paid more to take it. We also do not refund because you changed your mind, got fewer clicks than you wanted, or lost a spot later.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">2. No subscriptions</h2>
          <p className="text-secondary mb-6">
            HopUp does not charge recurring fees. There is nothing to cancel. A payment is a bid, not a subscription.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">3. Ranks and spots move</h2>
          <p className="text-secondary mb-6">
            Placement is whoever has paid the most right now. Another buyer can hop you at any time. That is the product. Losing rank or losing a Stanley spot is not a billing error and is not refundable.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">4. Charged and never listed</h2>
          <p className="text-secondary mb-6">
            If a payment went through and we never placed you — a system failure, not a hop — write @alohaproxy on X within 7 days with proof of purchase. We may fix the listing. Getting hopped or outbid is not this case.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
