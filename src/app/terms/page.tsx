import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-col flex-1 w-full relative pt-32 pb-24 px-6 md:px-12 items-center">
        <div className="w-full max-w-[800px] prose prose-invert">
          <h1 className="text-4xl font-extrabold mb-8 text-foreground">Terms of Service</h1>
          <p className="text-secondary mb-4">Last updated: August 25, 2026</p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">1. Acceptance of Terms</h2>
          <p className="text-secondary mb-6">
            By accessing and using HopUp, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">2. Service Description</h2>
          <p className="text-secondary mb-6">
            HopUp provides a paid public leaderboard for products. Users can pay a one-time listing fee to place their product link on the board. The position on the leaderboard is determined solely by the total cumulative bid amount associated with that product link.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">3. Payments and Bidding</h2>
          <p className="text-secondary mb-6">
            All payments made to HopUp are one-time bids. There are no recurring subscriptions. By making a payment, you are purchasing a digital placement on the leaderboard. Ranks are dynamic and subject to change based on the bids of other users. HopUp does not guarantee any specific duration for holding a specific rank.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">4. Content Guidelines</h2>
          <p className="text-secondary mb-6">
            You agree not to submit URLs linking to illegal, explicit, harmful, or malicious content. HopUp reserves the right to remove any product listing that violates these guidelines without notice and without refund.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">5. Disclaimer of Warranties</h2>
          <p className="text-secondary mb-6">
            HopUp is provided "as is" without any warranties, express or implied. We do not guarantee any specific amount of traffic, clicks, or conversions resulting from your placement on the leaderboard.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
