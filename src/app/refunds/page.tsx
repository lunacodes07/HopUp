import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function RefundsPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-col flex-1 w-full relative pt-32 pb-24 px-6 md:px-12 items-center">
        <div className="w-full max-w-[800px] prose prose-invert">
          <h1 className="text-4xl font-extrabold mb-8 text-foreground">Refund & Cancellation Policy</h1>
          <p className="text-secondary mb-4">Last updated: August 25, 2026</p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">1. All Sales Are Final</h2>
          <p className="text-secondary mb-6">
            HopUp provides a digital leaderboard placement service. Due to the real-time, competitive nature of the leaderboard, once a payment is made and a product is listed or ranked up, the digital service is considered fully delivered and consumed. Therefore, <strong>all sales are final and non-refundable</strong>.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">2. No Subscriptions</h2>
          <p className="text-secondary mb-6">
            HopUp does not charge any recurring subscription fees. All payments are one-time, user-initiated bids. There are no subscriptions to cancel.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">3. Leaderboard Dynamics</h2>
          <p className="text-secondary mb-6">
            Your position on the leaderboard is determined solely by the total amount you have paid compared to other users. You acknowledge that other users may place higher bids immediately after your purchase, which will cause your rank to drop. We do not offer refunds for loss of rank.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">4. Exceptions</h2>
          <p className="text-secondary mb-6">
            In the rare event of a technical billing error (e.g., you were charged but your product was not listed on the board due to a system failure), please contact our support team within 7 days of the transaction at @alohaproxy on X with your proof of purchase. We will manually correct your listing or issue a refund at our sole discretion.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
