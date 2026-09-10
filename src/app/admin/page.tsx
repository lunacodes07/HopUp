import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminLogos from "@/components/AdminLogos";
import AdminLogin from "@/components/AdminLogin";
import { ADMIN_COOKIE, adminMustAuthenticate, adminSecret, isAdminToken } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Admin — HopUp",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (process.env.NODE_ENV === "production" && !adminSecret()) {
    notFound();
  }

  const unlocked =
    !adminMustAuthenticate() ||
    (await isAdminToken((await cookies()).get(ADMIN_COOKIE)?.value));

  return (
    <>
      <Navbar />
      {unlocked ? <AdminLogos /> : <AdminLogin />}
      <Footer />
    </>
  );
}
