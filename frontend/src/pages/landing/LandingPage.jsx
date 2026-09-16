import Hero from "./sections/Hero";
import WhyChooseUs from "./sections/WhyChooseUs";
import HowItWorks from "./sections/HowItWorks";
import FeaturedHouses from "./sections/FeaturedHouses";
import Universities from "./sections/Universities";
import Testimonials from "./sections/Testimonials";
import CTA from "./sections/CTA";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <WhyChooseUs />
      <HowItWorks />
      <FeaturedHouses />
      <Universities />
      <Testimonials />
      <CTA />
    </>
  );
}