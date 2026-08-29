import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ArrowRight, Tag, ArrowUpRight, Trophy } from 'lucide-react';
import type { Product } from '@/types';

export const dynamic = 'force-dynamic';

const getLogoUrl = (url: string) => {
  if (!url) return '/globe.svg';
  try {
    const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    const domain = parsedUrl.hostname.toLowerCase();
    if (domain === 'x.com' || domain === 'twitter.com') {
      const username = parsedUrl.pathname.split('/')[1];
      if (username) {
        return `https://unavatar.io/x/${username}`;
      }
    }
    return `https://icon.horse/icon/${domain}`;
  } catch (e) {
    return `https://icon.horse/icon/${url.replace(/^https?:\/\//, '').split('/')[0]}`;
  }
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data: product } = await supabaseServer
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (!product) {
    return { title: 'Product Not Found | HopUp' };
  }

  const logoUrl = getLogoUrl(product.url || '');

  return {
    title: `${product.name} on HopUp`,
    description: product.description || `See ${product.name} on the HopUp leaderboard.`,
    openGraph: {
      title: `${product.name} on HopUp`,
      description: product.description,
      images: [logoUrl],
      url: `https://hopup.lol/p/${product.id}`,
    },
    twitter: {
      card: 'summary',
      images: [logoUrl],
    }
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Fetch all to get accurate rank
  const { data: allProducts, error } = await supabaseServer
    .from('products')
    .select('*')
    .order('price', { ascending: false })
    .order('created_at', { ascending: true });

  if (error || !allProducts) {
    console.error("ProductPage: supabaseServer error or !allProducts", error);
    return notFound();
  }

  const index = allProducts.findIndex(p => p.id === id);
  if (index === -1) {
    console.warn(`ProductPage: Product with id ${id} not found in allProducts. Total products fetched: ${allProducts.length}`);
    return notFound();
  }

  const product = allProducts[index];
  const rank = index + 1;
  const logoUrl = getLogoUrl(product.url || '');
  const externalUrl = product.url && !product.url.startsWith('http') ? `https://${product.url}` : product.url;

  return (
    <>
      <Navbar />
      <main className="flex flex-col flex-1 w-full relative items-center justify-center min-h-[80vh] px-6 md:px-12 pt-32 pb-20">
        
        {/* Background blobs */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="w-full max-w-3xl bg-white/60 backdrop-blur-md border border-border/50 rounded-[2.5rem] shadow-xl p-8 md:p-12 relative overflow-hidden">
          
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
            {/* Logo */}
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl overflow-hidden border border-border bg-white flex-shrink-0 shadow-md">
              <img src={logoUrl} alt={product.name} className="w-full h-full object-cover" />
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col items-center md:items-start justify-center">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm border border-amber-200 flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  Rank #{rank}
                </span>
                <span className="bg-muted text-secondary text-xs font-semibold px-3 py-1 rounded-full border border-border flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {product.category}
                </span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">
                {product.name}
              </h1>
              
              <p className="text-base md:text-lg text-secondary mb-6 leading-relaxed max-w-lg">
                {product.description}
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                <a 
                  href={externalUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-foreground text-background px-6 py-3 rounded-full font-semibold hover:bg-accent hover:text-foreground transition-all w-full sm:w-auto shadow-md"
                >
                  Visit Website <ArrowUpRight className="w-4 h-4" />
                </a>

                {/* Pre-fill HopUp by dispatching event on homepage */}
                <Link 
                  href={`/?url=${encodeURIComponent(product.url || '')}`}
                  className="flex items-center justify-center gap-2 bg-white text-foreground border border-border/50 px-6 py-3 rounded-full font-semibold hover:bg-muted transition-all w-full sm:w-auto shadow-sm"
                >
                  Outbid & Hop Up <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="mt-12 pt-6 border-t border-border/50 flex items-center justify-around">
            <div className="flex flex-col items-center">
              <span className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Clicks</span>
              <span className="text-2xl font-bold text-foreground">{product.clicks.toLocaleString()}</span>
            </div>
            <div className="w-px h-10 bg-border/50" />
            <div className="flex flex-col items-center">
              <span className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Total Paid</span>
              <span className="text-2xl font-bold text-foreground">${product.price}</span>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
