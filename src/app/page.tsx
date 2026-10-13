import BootIntro from '@/components/BootIntro';
import Snow from '@/components/Snow';
import DogCursor from '@/components/DogCursor';
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import Ticker from '@/components/Ticker';
import Projects from '@/components/Projects';
import Skills from '@/components/Skills';
import ChatDemo from '@/components/ChatDemo';
import Process from '@/components/Process';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';

export default function Page() {
  return (
    <>
      <BootIntro />
      <Snow />
      <DogCursor />
      <Nav />
      <main>
        <Hero />
        <Ticker />
        <Projects />
        <Skills />
        <ChatDemo />
        <Process />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
