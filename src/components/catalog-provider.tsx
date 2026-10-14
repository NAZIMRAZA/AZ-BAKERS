"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { products as seedProducts, type Product } from "@/lib/products";

type CatalogSource = "sample" | "browser" | "google-sheets";
type CatalogContextValue = {
  products: Product[];
  setProducts: (items: Product[]) => void;
  source: CatalogSource;
  refresh: () => Promise<void>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Product[]>(seedProducts);
  const [source, setSource] = useState<CatalogSource>("sample");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/products", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load the bakery menu.");
    const data = await response.json();
    if (!Array.isArray(data.products)) throw new Error("The menu response is not valid.");
    const cached = localStorage.getItem("cw-products");
    if (data.source === "google-sheets" || !cached) {
      setItems(data.products);
      setSource(data.source === "google-sheets" ? "google-sheets" : "sample");
      if (data.source === "google-sheets") localStorage.setItem("cw-products", JSON.stringify(data.products));
    } else {
      setSource("browser");
    }
  }, []);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("cw-products");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setItems(parsed);
          setSource("browser");
        }
      }
    } catch { /* Ignore an invalid local menu and use the sample catalog. */ }
    refresh().catch(() => {
      // A saved browser menu remains available when the optional Sheets API is offline.
    });
  }, [refresh]);

  const setProducts = (next: Product[]) => {
    setItems(next);
    setSource("browser");
    localStorage.setItem("cw-products", JSON.stringify(next));
  };

  return <CatalogContext.Provider value={{ products: items, setProducts, source, refresh }}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("useCatalog must be used inside CatalogProvider.");
  return value;
}
