import { useEffect } from 'react';
import Hero from './components/Hero.jsx';
// import Marquee from './components/Marquee.jsx';
import Collection from './components/Collection.jsx';
import FabricsBand from './components/FabricsBand.jsx';
import Process from './components/Process.jsx';
// import Reach from './components/Reach.jsx';
import Contact from './components/Contact.jsx';
import Footer from './components/Footer.jsx';
import About from './components/About.jsx';
import Ourworks from './components/Ourworks.jsx';
import Whychooseus from './components/Whychooseus.jsx';
import FrequentlyAskedQuestions from './components/Frequentlyaskedquestions.jsx';
import ProductPricing from './components/Productpricing.jsx';
import Reviews from './components/Reviews.jsx';

export default function App() {
  // Mouse position drives the 3D tilt of the hero window and the background parallax.
  useEffect(() => {
    const root = document.documentElement;
    const onMove = (e) => {
      root.style.setProperty('--mx', (e.clientX / window.innerWidth - 0.5).toFixed(3));
      root.style.setProperty('--my', (e.clientY / window.innerHeight - 0.5).toFixed(3));
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div className="root">
      <Hero />
      {/* <Marquee /> */}
      <Collection />
      <About/>
      <FabricsBand />
      <ProductPricing/>
      {/* <Process /> */}
      <Ourworks/>
      <Whychooseus/>
      <FrequentlyAskedQuestions/>
      <Reviews/>
      {/* <Reach /> */}
      <Contact />
      <Footer />
    </div>
  );
}
