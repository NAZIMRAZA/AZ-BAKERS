import type { Metadata } from "next";
import { MenuPage } from "@/components/menu";
export const metadata: Metadata = { title: "Menu & prices", description: "Browse the AZ BAKERS menu with current product prices." };
export default function Page() { return <MenuPage />; }
