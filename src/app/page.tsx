import { ChapterIndicator } from "@/components/layout/ChapterIndicator";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Audience } from "@/components/sections/Audience";
import { CTA } from "@/components/sections/CTA";
import { Customization } from "@/components/sections/Customization";
import { Gallery } from "@/components/sections/Gallery";
import { Hero } from "@/components/sections/Hero";
import { Manifesto } from "@/components/sections/Manifesto";
import { Process } from "@/components/sections/Process";
import { ProductShowcase } from "@/components/sections/ProductShowcase";
import { Statement } from "@/components/sections/Statement";
import { Trust } from "@/components/sections/Trust";
import { Cursor } from "@/components/ui/Cursor";
import { RevealController } from "@/components/ui/RevealController";

/**
 * One continuous story, told in chapters:
 * hero → belief → range → craft → process → work → people → proof → why → yours.
 */
export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Navbar />
      <main id="main">
        <Hero />
        <Statement />
        <ProductShowcase />
        <Customization />
        <Process />
        <Gallery />
        <Audience />
        <Trust />
        <Manifesto />
        <CTA />
      </main>
      <Footer />
      <ChapterIndicator />
      <RevealController />
      <Cursor />
    </>
  );
}
