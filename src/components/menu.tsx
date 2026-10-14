"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { BakingImage } from "@/components/store";
import { money } from "@/lib/products";
import { useCatalog } from "@/components/catalog-provider";

export function MenuPage() {
  const { products } = useCatalog();
  const groups = [...new Set(products.map(product => product.category))];
  return <main className="page-wrap menu-page">
    <div className="page-kicker"><Link href="/">Home</Link><span>/</span><span>Menu & prices</span></div>
    <header className="menu-hero"><span className="eyebrow">THE AZ BAKERS LINEUP</span><h1>Good things.<br/><em>Clear prices.</em></h1><p>Everything on the menu, made in small batches and priced right here. Choose a bake to see ingredients, servings and availability.</p><Link href="/shop" className="btn btn-primary">Shop the bakery <ArrowRight size={16}/></Link></header>
    <div className="price-list-intro"><span>{products.length} bakes on the menu</span><span>Prices in Indian rupees · per item or pack shown</span></div>
    {groups.map(category => <section className="price-group" key={category}><h2>{category}<span>✳</span></h2><div className="price-rows">{products.filter(product => product.category === category).map(product => <Link className="price-row" href={`/product/${product.id}`} key={product.id}><div className="price-thumb"><BakingImage src={product.image || "/images/bake-placeholder.svg"} alt="" fill sizes="72px"/></div><div className="price-copy"><strong>{product.name}</strong><span>{product.serves} · {product.description}</span></div><span className="price-value">{money(product.price)}</span><ArrowUpRight size={16}/></Link>)}</div></section>)}
    <p className="menu-footnote">All prices and availability follow the current bakery menu. For ingredient and allergen details, open an item before ordering.</p>
  </main>;
}
