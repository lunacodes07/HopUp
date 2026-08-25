import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-col flex-1 w-full relative pt-32 pb-24 px-6 md:px-12 items-center">
        <div className="w-full max-w-[800px] prose prose-invert">
          <h1 className="text-4xl font-extrabold mb-8 text-foreground">Privacy Policy</h1>
          <p className="text-secondary mb-4">Last updated: August 25, 2026</p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">1. Information We Collect</h2>
          <p className="text-secondary mb-6">
            We collect the URL and category you submit to be listed on our leaderboard. When you process a payment, our payment provider (Dodo Payments) collects necessary billing information. HopUp does not store your credit card details.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">2. How We Use Your Information</h2>
          <p className="text-secondary mb-6">
            We use the URL and category you provide exclusively to generate your public listing on the HopUp leaderboard and to fetch publicly available metadata (like your website's title and description) to display alongside your listing.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">3. Third-Party Services</h2>
          <p className="text-secondary mb-6">
            We use Dodo Payments to securely process your one-time bids. Please refer to Dodo Payments' Privacy Policy for details on how they handle your payment information. We also use Supabase for our database hosting.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">4. Contact Us</h2>
          <p className="text-secondary mb-6">
            If you have any questions about this Privacy Policy, please contact us at @alohaproxy on X.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
