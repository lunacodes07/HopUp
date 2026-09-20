import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Mail, MessageSquare } from "lucide-react";

export const dynamic = "force-static";

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-col flex-1 w-full relative pt-32 pb-24 px-6 md:px-12 items-center">
        <div className="w-full max-w-[800px] flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-foreground">Contact Support</h1>
          <p className="text-secondary text-lg mb-12 max-w-[600px]">
            Have a question about your listing or need help? We're here for you. Reach out to us and we'll get back to you as soon as possible.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-[700px]">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-accent mb-5">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold mb-3 text-foreground">Email Support</h2>
              <p className="text-secondary text-base mb-5">
                The best way to reach us is via email. We typically respond within 24 hours.
              </p>
              <a href="mailto:lunacodes07@gmail.com" className="text-accent font-semibold hover:underline">
                lunacodes07@gmail.com
              </a>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-accent mb-5">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold mb-3 text-foreground">Social Media</h2>
              <p className="text-secondary text-base mb-5">
                Reach out to us on X (Twitter) for quick questions or to stay updated.
              </p>
              <a href="https://x.com/alohaproxy" className="text-accent font-semibold hover:underline">
                @alohaproxy
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
