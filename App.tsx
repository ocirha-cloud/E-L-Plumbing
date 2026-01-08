
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Phone, Mail, MapPin, CheckCircle2, Menu, X, ChevronRight, Loader2, 
  Award, Clock, ShieldCheck, ThumbsUp, Wrench, MessageSquare, Send, 
  Globe, ExternalLink, Droplet, Search, Bath, Hammer
} from 'lucide-react';
import { EL_LOGO, COMPANY_NAME, TAGLINE, PHONE_NUMBER, EMAIL, ADDRESS, SERVICES } from './constants';
import { GoogleGenAI } from "@google/genai";

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const App: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Welcome to E/L Plumbing! How can I assist you with your plumbing needs in Cape Town today?' }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [groundingInfo, setGroundingInfo] = useState<{text: string, links: any[]}>({ text: '', links: [] });
  const [isLoadingGrounding, setIsLoadingGrounding] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Using local image paths based on the provided photos to ensure they stay the same
  const staticImages = {
    hero: "images/Modern-bathroom-vanity.png",
    general: "images/Plumbing-tools-on-workbench.png",
    leak: "images/Digital-leak-detection.png",
    blocked: "images/High-pressure-jetter.png",
    bathroom: "images/Plumber-hands-on-sink.png",
    pipes: "images/Copper-pipe-installation.png",
    emergency: "images/Plumbing-service-van.png"
  };

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; 
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setIsMenuOpen(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchGrounding = useCallback(async () => {
    setIsLoadingGrounding(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // FIX: Maps grounding is only supported in Gemini 2.5 series models. 
      // Changed model from 'gemini-3-flash-preview' to 'gemini-2.5-flash'.
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Briefly describe why E/L Plumbing is the most reliable choice for Dunoon and Milnerton, Cape Town residents, mentioning their 24/7 service availability and professional standard.`,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: { retrievalConfig: { latLng: { latitude: -33.826, longitude: 18.528 } } }
        }
      });
      setGroundingInfo({
        text: response.text || '',
        links: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
      });
    } catch (e) { 
      console.error("Grounding error:", e); 
    }
    finally { setIsLoadingGrounding(false); }
  }, []);

  useEffect(() => { fetchGrounding(); }, [fetchGrounding]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: `You are the helpful AI assistant for E/L Plumbing, a professional plumbing company in Cape Town. 
          Address: ${ADDRESS}. Primary Services: Leak detection, blocked drains, bathroom/kitchen installs, and 24/7 emergency response.
          Tone: Professional, expert, and reassuring. Always encourage the user to call ${PHONE_NUMBER} for urgent matters.`
        }
      });
      const response = await chat.sendMessage({ message: userMsg });
      setChatMessages(prev => [...prev, { role: 'model', text: response.text || `Please contact us directly at ${PHONE_NUMBER} for immediate assistance.` }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting right now. Please call us at " + PHONE_NUMBER + " for help!" }]);
    } finally { setIsChatLoading(false); }
  };

  const whyChooseUs = [
    { title: 'Rapid 24/7 Support', desc: 'Emergency response when every minute counts.', icon: <Clock className="w-6 h-6" /> },
    { title: 'Meticulous Cleanliness', desc: 'We leave your property spotless after every job.', icon: <ThumbsUp className="w-6 h-6" /> },
    { title: 'Transparent Quotes', desc: 'Clear, upfront pricing with no hidden surprises.', icon: <ShieldCheck className="w-6 h-6" /> },
    { title: 'Cape Town Local', desc: 'Proudly serving Dunoon, Milnerton, and surrounds.', icon: <MapPin className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen bg-white text-brand-navy font-body selection:bg-brand-orange selection:text-white">
      {/* Subtle Engineering Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Modern Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-xl shadow-2xl py-2' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex-shrink-0 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
              <EL_LOGO className="h-16 md:h-24 transition-transform hover:scale-105" />
            </div>
            
            <div className="hidden lg:flex items-center space-x-12">
              {['Services', 'About', 'Contact'].map((item) => (
                <button 
                  key={item} 
                  onClick={() => scrollTo(item.toLowerCase())} 
                  className="text-brand-navy font-extrabold hover:text-brand-orange transition-all uppercase tracking-widest text-xs outline-none relative group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-orange transition-all group-hover:w-full"></span>
                </button>
              ))}
              <a 
                href={`tel:${PHONE_NUMBER.replace(/\s/g, '')}`} 
                className="bg-brand-navy text-white px-8 py-4 rounded-xl font-black hover:bg-brand-orange transition-all transform hover:-translate-y-1 shadow-xl flex items-center gap-3 active:scale-95"
              >
                <Phone className="w-5 h-5" /> {PHONE_NUMBER}
              </a>
            </div>

            <div className="lg:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-brand-navy p-2 bg-gray-100 rounded-xl">
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white shadow-2xl p-8 space-y-4 animate-fade-in border-t border-gray-100">
            {['Services', 'About', 'Contact'].map((item) => (
              <button 
                key={item} 
                onClick={() => scrollTo(item.toLowerCase())}
                className="block w-full text-left py-4 text-brand-navy font-black text-3xl border-b border-gray-50 last:border-0 hover:text-brand-orange transition-colors"
              >
                {item}
              </button>
            ))}
            <a 
              href={`tel:${PHONE_NUMBER.replace(/\s/g, '')}`} 
              className="block w-full bg-brand-orange text-white text-center py-6 rounded-2xl font-black text-xl shadow-lg mt-6"
            >
              Call {PHONE_NUMBER}
            </a>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-44 pb-20 lg:pt-64 lg:pb-40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-orange-50 border border-orange-200 text-brand-orange font-black text-[10px] tracking-[0.3em] uppercase mb-10 shadow-sm">
                <span className="flex h-2 w-2 mr-3 bg-brand-orange rounded-full animate-ping"></span>
                Emergency Plumbers: Cape Town
              </div>
              <h1 className="text-6xl lg:text-[100px] font-black text-brand-navy leading-[0.9] mb-10 tracking-tight">
                Quality You <br/>
                <span className="text-brand-orange italic">Can Trust.</span>
              </h1>
              <p className="text-xl text-gray-500 mb-14 leading-relaxed max-w-xl font-medium mx-auto lg:mx-0">
                {TAGLINE} We provide professional, clean, and reliable plumbing solutions for your home or business in Milnerton and Dunoon.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                <a href={`tel:${PHONE_NUMBER.replace(/\s/g, '')}`} className="bg-brand-navy text-white px-12 py-6 rounded-[2rem] font-black text-xl hover:bg-brand-orange transition-all flex items-center justify-center gap-4 shadow-2xl group hover:scale-105 active:scale-95">
                  <Phone className="w-6 h-6 group-hover:animate-shake" /> Call {PHONE_NUMBER}
                </a>
                <button onClick={() => scrollTo('contact')} className="bg-white text-brand-navy border-4 border-brand-navy/5 px-12 py-6 rounded-[2rem] font-black text-xl hover:border-brand-orange/20 hover:text-brand-orange transition-all shadow-sm">
                  Request a Quote
                </button>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-10 bg-brand-orange/10 rounded-[4rem] -rotate-3 blur-3xl"></div>
              <div className="relative rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(15,43,72,0.3)] bg-gray-200 aspect-[4/5] lg:aspect-square">
                <img 
                  src={staticImages.hero} 
                  alt="Modern Bathroom Vanity" 
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-[2000ms] ease-out" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/40 to-transparent"></div>
                <div className="absolute bottom-10 left-10 right-10 bg-white/80 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl flex items-center justify-between border border-white/40">
                  <div>
                    <div className="font-black text-brand-navy uppercase tracking-[0.2em] text-[10px] mb-2 opacity-60">Verified Area Expert</div>
                    <div className="font-black text-brand-navy text-lg">Dunoon & Milnerton</div>
                  </div>
                  <div className="w-14 h-14 bg-brand-orange text-white rounded-2xl flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="py-40 bg-brand-navy relative overflow-hidden">
        {/* Abstract design elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-orange/5 rounded-full blur-[150px] -mr-[400px] -mt-[400px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-24 text-center">
            <h2 className="text-5xl lg:text-7xl font-black text-white mb-8 tracking-tighter">Professional <span className="text-brand-orange">Services</span></h2>
            <p className="text-blue-100/40 text-xl max-w-3xl mx-auto font-medium leading-relaxed">From emergency leak detection to full-scale kitchen and bathroom installations, we handle it all with industrial precision.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {SERVICES.map((service) => (
              <div key={service.id} className="group bg-[#163a5f] rounded-[3rem] overflow-hidden border border-white/5 hover:border-brand-orange/50 transition-all duration-700 flex flex-col hover:-translate-y-4 shadow-2xl">
                <div className="h-72 overflow-hidden relative">
                  <img 
                    src={staticImages[service.id as keyof typeof staticImages]} 
                    alt={service.title} 
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#163a5f] via-transparent to-transparent"></div>
                  <div className="absolute top-8 left-8 w-14 h-14 bg-brand-orange text-white rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:rotate-12 transition-transform">
                    {service.icon}
                  </div>
                </div>
                <div className="p-12 flex flex-col flex-grow">
                  <h3 className="text-3xl font-black text-white mb-5 group-hover:text-brand-orange transition-colors">{service.title}</h3>
                  <p className="text-blue-100/60 mb-10 leading-relaxed font-medium flex-grow text-lg">{service.description}</p>
                  <a href={`tel:${PHONE_NUMBER.replace(/\s/g, '')}`} className="w-full py-5 rounded-2xl border-2 border-white/10 text-white font-black text-center group-hover:bg-brand-orange group-hover:border-brand-orange transition-all text-sm uppercase tracking-widest">
                    Inquire Now
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About & Grounding */}
      <section id="about" className="py-40 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="grid grid-cols-2 gap-8">
              {whyChooseUs.map((item, idx) => (
                <div key={idx} className={`p-10 rounded-[3rem] border border-gray-100 bg-gray-50/50 transition-all hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] hover:bg-white ${idx % 2 === 1 ? 'lg:translate-y-16' : ''} group`}>
                  <div className="w-16 h-16 bg-white shadow-xl text-brand-navy rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:bg-brand-orange group-hover:text-white transition-all transform group-hover:-rotate-6">
                    {item.icon}
                  </div>
                  <h4 className="text-2xl font-black text-brand-navy mb-4 tracking-tight">{item.title}</h4>
                  <p className="text-gray-500 font-medium text-base leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            
            <div className="lg:pl-10">
              <h2 className="text-5xl lg:text-7xl font-black text-brand-navy mb-10 leading-[1.1] tracking-tighter">Precision in Every <span className="text-brand-orange italic">Pipeline.</span></h2>
              <p className="text-2xl text-gray-500 mb-12 leading-relaxed font-medium">
                At {COMPANY_NAME}, we believe in more than just fixing pipes. We believe in providing peace of mind through expert craftsmanship and absolute reliability.
              </p>
              
              {/* Local Area Grounding Component */}
              {groundingInfo.text && (
                <div className="bg-brand-navy p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                   <h5 className="font-black uppercase tracking-[0.3em] text-[10px] text-brand-orange mb-6 flex items-center gap-3">
                     <Globe size={18} /> Area Context & Expertise
                   </h5>
                   <div className="prose prose-invert max-w-none mb-8">
                     <p className="text-blue-50/80 text-lg font-bold leading-relaxed">{groundingInfo.text}</p>
                   </div>
                   <div className="flex flex-wrap gap-3">
                     {groundingInfo.links.map((chunk: any, i: number) => (
                       chunk.maps && (
                         <a 
                           key={i} 
                           href={chunk.maps.uri} 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white transition-all hover:scale-105 active:scale-95"
                         >
                           <MapPin size={14} className="text-brand-orange" /> {chunk.maps.title}
                         </a>
                       )
                     ))}
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Booking Section */}
      <section id="contact" className="py-40 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-24">
            <div>
              <h2 className="text-5xl lg:text-7xl font-black text-brand-navy mb-10 tracking-tighter">Let's Talk <span className="text-brand-orange">Plumbing</span></h2>
              <div className="space-y-10 mb-20">
                <div className="flex items-center gap-8 group">
                  <div className="w-20 h-20 bg-white shadow-2xl text-brand-navy rounded-[2rem] flex items-center justify-center transition-transform group-hover:scale-110"><Phone className="w-8 h-8 text-brand-orange" /></div>
                  <div>
                    <h4 className="font-black text-brand-navy text-xs uppercase tracking-[0.3em] mb-2 opacity-50">24/7 Hotline</h4>
                    <p className="text-4xl font-black text-gray-800 tracking-tight">{PHONE_NUMBER}</p>
                  </div>
                </div>
                <div className="flex items-start gap-8 group">
                  <div className="w-20 h-20 bg-white shadow-2xl text-brand-navy rounded-[2rem] flex items-center justify-center transition-transform group-hover:scale-110"><MapPin className="w-8 h-8 text-brand-orange" /></div>
                  <div>
                    <h4 className="font-black text-brand-navy text-xs uppercase tracking-[0.3em] mb-2 opacity-50">Office HQ</h4>
                    <p className="text-2xl font-black text-gray-800 leading-snug">{ADDRESS}</p>
                  </div>
                </div>
              </div>
              
              {/* Map Preview Image */}
              <div className="rounded-[3rem] overflow-hidden h-96 bg-brand-navy relative border-8 border-white shadow-3xl group flex items-center justify-center text-center p-12">
                 <div className="absolute inset-0 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-1000 bg-[url('images/Plumbing-service-van.png')] bg-cover bg-center"></div>
                 <div className="absolute inset-0 bg-brand-navy/60 backdrop-blur-[2px]"></div>
                 <div className="relative z-10">
                   <div className="w-20 h-20 bg-brand-orange text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl animate-bounce">
                     <MapPin className="w-10 h-10" />
                   </div>
                   <h4 className="text-white text-3xl font-black mb-6 uppercase tracking-widest">Find Us On Maps</h4>
                   <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-brand-navy px-10 py-5 rounded-2xl font-black inline-flex items-center gap-3 hover:bg-brand-orange hover:text-white transition-all shadow-2xl hover:scale-105"
                   >
                     Get Directions <ExternalLink size={20} />
                   </a>
                 </div>
              </div>
            </div>

            <div className="bg-white p-12 lg:p-20 rounded-[4rem] shadow-[0_100px_80px_-40px_rgba(0,0,0,0.05)] border border-gray-100">
              <h3 className="text-4xl font-black text-brand-navy mb-12 tracking-tight">Request an <span className="text-brand-orange">Emergency Callout</span></h3>
              <form className="space-y-10" onSubmit={e => e.preventDefault()}>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Full Name</label>
                    <input type="text" className="w-full bg-gray-50 px-8 py-5 rounded-2xl outline-none focus:ring-4 ring-brand-orange/10 border border-gray-100 font-bold placeholder:text-gray-300" placeholder="John Doe" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Contact Number</label>
                    <input type="tel" className="w-full bg-gray-50 px-8 py-5 rounded-2xl outline-none focus:ring-4 ring-brand-orange/10 border border-gray-100 font-bold placeholder:text-gray-300" placeholder="082 123 4567" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Describe Your Problem</label>
                  <textarea rows={5} className="w-full bg-gray-50 px-8 py-5 rounded-2xl outline-none focus:ring-4 ring-brand-orange/10 border border-gray-100 font-bold resize-none placeholder:text-gray-300" placeholder="Burst pipe, blocked drain, installation..."></textarea>
                </div>
                <button type="submit" className="w-full bg-brand-navy text-white py-8 rounded-3xl font-black text-2xl hover:bg-brand-orange transition-all shadow-2xl active:scale-[0.98] transform hover:-translate-y-1">
                  Send Booking Request
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-navy text-white pt-32 pb-16 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-orange"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-20 mb-24 text-center lg:text-left">
            <div className="lg:col-span-2">
              <EL_LOGO className="h-24 invert brightness-0 mb-10 mx-auto lg:mx-0" />
              <p className="text-2xl text-blue-100/30 font-extrabold italic leading-relaxed max-w-md">"{TAGLINE}"</p>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.4em] mb-10 text-brand-orange">Service Areas</h4>
              <ul className="space-y-4 text-blue-100/40 font-bold text-base">
                <li>Dunoon</li>
                <li>Milnerton</li>
                <li>Table View</li>
                <li>Blouberg</li>
                <li>Century City</li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.4em] mb-10 text-brand-orange">Emergency</h4>
              <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
                <p className="text-brand-orange font-black text-2xl mb-3">{PHONE_NUMBER}</p>
                <p className="text-blue-100/20 text-[10px] font-black uppercase tracking-widest">Technician available 24/7</p>
              </div>
            </div>
          </div>
          <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-blue-100/20 font-black tracking-[0.3em] text-[10px] uppercase">
              © {new Date().getFullYear()} {COMPANY_NAME}. Licensed Cape Town Plumbing Contractors.
            </div>
            <div className="flex gap-8">
               {['Privacy', 'Terms', 'Sitemap'].map(t => (
                 <a key={t} href="#" className="text-blue-100/20 hover:text-brand-orange font-black text-[10px] uppercase tracking-widest transition-colors">{t}</a>
               ))}
            </div>
          </div>
        </div>
      </footer>

      {/* AI Chatbot Assistant */}
      <div className={`fixed bottom-10 right-10 z-[100] transition-all duration-700 ${isChatOpen ? 'w-full sm:w-[450px]' : 'w-20 h-20'}`}>
        {!isChatOpen ? (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="w-20 h-20 bg-brand-orange text-white rounded-[2rem] shadow-[0_20px_50px_rgba(245,130,32,0.4)] flex items-center justify-center hover:scale-110 active:scale-90 transition-all group"
          >
            <MessageSquare size={36} className="group-hover:rotate-12 transition-transform" />
          </button>
        ) : (
          <div className="bg-white rounded-[3rem] shadow-[0_50px_100px_rgba(15,43,72,0.2)] border border-gray-100 overflow-hidden flex flex-col max-h-[700px] animate-fade-in">
            <div className="bg-brand-navy p-8 flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-orange rounded-2xl flex items-center justify-center shadow-xl"><Wrench size={28} /></div>
                <div>
                  <h5 className="font-black text-sm uppercase tracking-[0.2em]">E/L Assistant</h5>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div><span className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Active Now</span></div>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="hover:rotate-90 transition-transform"><X size={28} /></button>
            </div>
            <div className="flex-grow overflow-y-auto p-8 space-y-6 bg-gray-50/80 min-h-[400px]">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-5 rounded-3xl text-sm font-bold shadow-sm ${
                    msg.role === 'user' ? 'bg-brand-navy text-white rounded-tr-none' : 'bg-white text-brand-navy border border-gray-100 rounded-tl-none'
                  }`}>{msg.text}</div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-5 rounded-3xl rounded-tl-none border border-gray-100 flex items-center gap-3">
                    <Loader2 className="animate-spin text-brand-orange w-4 h-4" />
                    <span className="text-[10px] font-black uppercase text-gray-400">Typing...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-8 bg-white border-t border-gray-100 flex gap-4">
              <input 
                type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask us anything..."
                className="flex-grow bg-gray-100 px-6 py-4 rounded-2xl outline-none font-bold text-sm text-brand-navy focus:ring-4 ring-brand-orange/5"
              />
              <button type="submit" disabled={isChatLoading || !chatInput.trim()} className="w-14 h-14 bg-brand-orange text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-brand-orange/20"><Send size={24} /></button>
            </form>
          </div>
        )}
      </div>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes shake { 0%, 100% { transform: rotate(0deg); } 20% { transform: rotate(15deg); } 40% { transform: rotate(-15deg); } 60% { transform: rotate(10deg); } 80% { transform: rotate(-10deg); } }
        .animate-shake { animation: shake 0.6s ease-in-out; }
        .shadow-3xl { shadow-box: 0 50px 100px -20px rgba(0,0,0,0.4); }
      `}</style>
    </div>
  );
};

export default App;
