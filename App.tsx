
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Phone, Mail, MapPin, CheckCircle2, Menu, X, ChevronRight, Loader2, 
  Award, Clock, ShieldCheck, ThumbsUp, Wrench, MessageSquare, Send, 
  Globe, ExternalLink 
} from 'lucide-react';
import { EL_LOGO, COMPANY_NAME, TAGLINE, PHONE_NUMBER, EMAIL, ADDRESS, SERVICES } from './constants';
import { generatePlumbingImage } from './services/geminiService';
import { GoogleGenAI } from "@google/genai";

// IndexedDB Helper for high-capacity local storage
const DB_NAME = 'ELPlumbingDB';
const STORE_NAME = 'images';
const STORAGE_KEY = 'el_plumbing_images_v2';

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const persistImages = async (images: Record<string, string>) => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(images, STORAGE_KEY);
  } catch (err) { console.error(err); }
};

const loadPersistedImages = async (): Promise<Record<string, string> | null> => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(STORAGE_KEY);
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch (err) { return null; }
};

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const App: React.FC = () => {
  const [images, setImages] = useState<Record<string, string>>({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello! I am your E/L Plumbing assistant. How can I help you today?' }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [groundingInfo, setGroundingInfo] = useState<{text: string, links: any[]}>({ text: '', links: [] });
  const [isLoadingGrounding, setIsLoadingGrounding] = useState(false);
  
  const generationAttempted = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Helper for smooth scrolling without triggering URL hash changes (Fixes iframe 'refused to connect')
  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Nav height
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

  const fetchImages = useCallback(async () => {
    if (generationAttempted.current) return;
    generationAttempted.current = true;

    const savedImages = await loadPersistedImages();
    if (savedImages && Object.keys(savedImages).length > 0) {
      setImages(savedImages);
      return;
    }

    setIsGenerating(true);
    const newImages: Record<string, string> = {};
    try {
      const heroUrl = await generatePlumbingImage("Close-up high-quality architectural photography of a professional plumber's hands working on a modern, clean kitchen sink faucet in a high-end Cape Town home. Soft natural lighting, professional uniform, hyper-realistic.");
      if (heroUrl) newImages['hero'] = heroUrl;

      for (const service of SERVICES) {
        const url = await generatePlumbingImage(service.imagePrompt);
        if (url) newImages[service.id] = url;
      }
      setImages(newImages);
      await persistImages(newImages);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const fetchGrounding = useCallback(async () => {
    setIsLoadingGrounding(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Provide a short professional summary of the Dunoon and Milnerton area in Cape Town for a plumbing company website. Mention that we provide 24/7 service to these neighborhoods.`,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: { latitude: -33.826, longitude: 18.528 }
            }
          }
        }
      });
      setGroundingInfo({
        text: response.text || '',
        links: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingGrounding(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
    fetchGrounding();
  }, [fetchImages, fetchGrounding]);

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
        model: 'gemini-3-pro-preview',
        config: {
          systemInstruction: `You are the AI assistant for E/L Plumbing, based in Cape Town. 
          Company: ${COMPANY_NAME}. Location: ${ADDRESS}. Phone: ${PHONE_NUMBER}.
          Services: ${SERVICES.map(s => s.title).join(', ')}.
          Tone: Professional, helpful, industrial, knowledgeable.`
        }
      });

      const response = await chat.sendMessage({ message: userMsg });
      setChatMessages(prev => [...prev, { role: 'model', text: response.text || "Please call us directly for immediate assistance." }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'model', text: "Service temporarily unavailable. Please call 075 195 7680." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const whyChooseUs = [
    { title: 'Fast Response Time', desc: 'Emergency response when you need it most.', icon: <Clock className="w-6 h-6" /> },
    { title: 'Clean & Professional', desc: 'We leave your home exactly as we found it.', icon: <ThumbsUp className="w-6 h-6" /> },
    { title: 'Affordable Pricing', desc: 'Upfront, transparent quotes without hidden fees.', icon: <ShieldCheck className="w-6 h-6" /> },
    { title: 'Local Cape Town Plumbers', desc: 'Deeply rooted in the local community.', icon: <MapPin className="w-6 h-6" /> },
    { title: 'Guaranteed Quality', desc: 'Expert workmanship that stands the test of time.', icon: <Award className="w-6 h-6" /> },
    { title: '24/7 Support', desc: 'Ready to solve your problems at any hour.', icon: <Wrench className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen bg-white text-brand-navy font-body selection:bg-brand-orange selection:text-white">
      {/* Industrial Background Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg py-2' : 'bg-transparent py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex-shrink-0 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
              <EL_LOGO className="h-14 md:h-20" />
            </div>
            
            <div className="hidden md:flex items-center space-x-10">
              {['Services', 'About', 'Contact'].map((item) => (
                <button 
                  key={item} 
                  onClick={() => scrollTo(item.toLowerCase())} 
                  className="text-brand-navy font-bold hover:text-brand-orange transition-colors uppercase tracking-wider text-sm outline-none"
                >
                  {item}
                </button>
              ))}
              <a 
                href={`tel:${PHONE_NUMBER.replace(/\s/g, '')}`} 
                className="bg-brand-orange text-white px-7 py-3 rounded-lg font-black hover:bg-orange-600 transition-all transform hover:-translate-y-0.5 shadow-[0_10px_20px_-10px_rgba(245,130,32,0.5)] flex items-center gap-2 group"
              >
                <Phone className="w-4 h-4 group-hover:rotate-12 transition-transform" /> {PHONE_NUMBER}
              </a>
            </div>

            <div className="md:hidden">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="text-brand-navy p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isMenuOpen ? <X size={32} /> : <Menu size={32} />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 p-4 space-y-4 animate-fade-in shadow-xl">
            {['Services', 'About', 'Contact'].map((item) => (
              <button 
                key={item} 
                onClick={() => scrollTo(item.toLowerCase())}
                className="block w-full text-left px-4 py-3 text-brand-navy font-black text-xl border-b border-gray-50 last:border-0"
              >
                {item}
              </button>
            ))}
            <a href={`tel:${PHONE_NUMBER.replace(/\s/g, '')}`} className="flex items-center justify-center w-full bg-brand-orange text-white py-4 rounded-xl font-black gap-2">
              <Phone size={20} /> {PHONE_NUMBER}
            </a>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-lg bg-orange-50 border border-orange-100 text-brand-orange font-black text-xs tracking-[0.2em] uppercase mb-8">
                <div className="w-2 h-2 rounded-full bg-brand-orange mr-3 animate-pulse"></div>
                Available Now in Cape Town
              </div>
              <h1 className="text-5xl lg:text-8xl font-black text-brand-navy leading-[1.1] mb-8">
                Reliable Plumbing <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-navy to-brand-orange">Services You Can Trust</span>
              </h1>
              <p className="text-xl text-gray-500 mb-12 leading-relaxed max-w-xl font-medium">
                {TAGLINE} Professional workmanship across Milnerton, Dunoon, and the Greater Cape Town area. Fast response when you need it most.
              </p>
              <div className="flex flex-col sm:flex-row gap-5">
                <a href={`tel:${PHONE_NUMBER.replace(/\s/g, '')}`} className="bg-brand-navy text-white px-10 py-5 rounded-2xl font-black text-xl hover:bg-[#0a1e33] transition-all flex items-center justify-center gap-4 shadow-2xl group relative overflow-hidden">
                  <span className="relative z-10 flex items-center gap-3">
                    <Phone className="w-6 h-6" /> Call {PHONE_NUMBER}
                  </span>
                </a>
                <button onClick={() => scrollTo('contact')} className="bg-white text-brand-navy border-2 border-brand-navy/10 px-10 py-5 rounded-2xl font-black text-xl hover:border-brand-orange hover:text-brand-orange transition-all flex items-center justify-center gap-2 group">
                  Get a Free Quote <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-brand-orange/5 rounded-[3rem] rotate-2"></div>
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(15,43,72,0.3)] bg-gray-100 aspect-[4/5] lg:aspect-square">
                {images.hero ? (
                  <img src={images.hero} alt="Professional Plumber" className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-brand-orange" /></div>
                )}
                <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-xl flex items-center justify-between border border-white/50">
                  <div>
                    <div className="font-black text-brand-navy uppercase tracking-widest text-xs">Verified Service</div>
                    <div className="font-black text-brand-orange text-lg">Dunoon & Milnerton</div>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-brand-orange" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-32 bg-brand-navy relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-20 text-center">
            <h2 className="text-4xl lg:text-6xl font-black text-white mb-6">Expert <span className="text-brand-orange">Plumbing</span> Solutions</h2>
            <p className="text-blue-100/40 text-lg max-w-2xl mx-auto font-medium">Clean, professional service for all residential and commercial needs.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {SERVICES.map((service) => (
              <div key={service.id} className="group bg-[#163a5f] rounded-[2rem] overflow-hidden border border-white/5 hover:border-brand-orange/30 transition-all duration-500 flex flex-col">
                <div className="h-64 overflow-hidden relative">
                  {images[service.id] ? (
                    <img src={images[service.id]} alt={service.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" />
                  ) : (
                    <div className="w-full h-full bg-brand-navy flex items-center justify-center"><Loader2 className="animate-spin text-brand-orange" /></div>
                  )}
                  <div className="absolute top-6 left-6 w-12 h-12 bg-brand-orange text-white rounded-xl flex items-center justify-center shadow-lg">
                    {service.icon}
                  </div>
                </div>
                <div className="p-10 flex flex-col flex-grow">
                  <h3 className="text-2xl font-black text-white mb-4">{service.title}</h3>
                  <p className="text-blue-100/60 mb-8 leading-relaxed font-medium flex-grow">{service.description}</p>
                  <a href={`tel:${PHONE_NUMBER.replace(/\s/g, '')}`} className="w-full py-4 rounded-xl border border-white/10 text-white font-black text-center group-hover:bg-brand-orange group-hover:border-brand-orange transition-all">
                    Book Now
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="grid grid-cols-2 gap-6">
              {whyChooseUs.map((item, idx) => (
                <div key={idx} className={`p-8 rounded-[2.5rem] border border-gray-100 transition-all hover:shadow-2xl ${idx % 2 === 1 ? 'lg:translate-y-12' : ''}`}>
                  <div className="w-14 h-14 bg-blue-50 text-brand-navy rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                    {item.icon}
                  </div>
                  <h4 className="text-xl font-black text-brand-navy mb-3">{item.title}</h4>
                  <p className="text-gray-500 font-medium text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <div>
              <h2 className="text-4xl lg:text-6xl font-black text-brand-navy mb-8 leading-tight">Trusted Local <br/>Cape Town Plumbers</h2>
              <p className="text-xl text-gray-500 mb-12 leading-relaxed font-medium">
                At {COMPANY_NAME}, we pride ourselves on being the first call for families and businesses in Dunoon and Milnerton. We treat every home as if it were our own.
              </p>
              
              {/* Grounding Info (Localized Insights) */}
              {(groundingInfo.text || isLoadingGrounding) && (
                <div className="bg-brand-light p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Globe className="w-12 h-12" /></div>
                   <h5 className="font-black uppercase tracking-widest text-xs text-brand-orange mb-4 flex items-center gap-2">
                     <Globe size={16} /> Area Context & Verification
                   </h5>
                   {isLoadingGrounding ? (
                     <div className="animate-pulse space-y-2">
                       <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                       <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                     </div>
                   ) : (
                     <div>
                       <p className="text-brand-navy/70 text-sm font-bold leading-relaxed mb-4">{groundingInfo.text}</p>
                       <div className="flex flex-wrap gap-2">
                         {groundingInfo.links.map((chunk: any, i: number) => (
                           chunk.maps && (
                             <a 
                                key={i} href={chunk.maps.uri} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase text-gray-500 hover:text-brand-orange transition-colors"
                             >
                               <MapPin size={12} /> {chunk.maps.title || 'Source'}
                             </a>
                           )
                         ))}
                       </div>
                     </div>
                   )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20">
            <div>
              <h2 className="text-4xl lg:text-6xl font-black text-brand-navy mb-8">Get In Touch</h2>
              <div className="space-y-8 mb-16">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white shadow-md text-brand-navy rounded-2xl flex items-center justify-center shrink-0">
                    <Phone className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-black text-brand-navy text-sm uppercase tracking-widest mb-1">Call Us</h4>
                    <p className="text-2xl font-black text-gray-700">{PHONE_NUMBER}</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-white shadow-md text-brand-navy rounded-2xl flex items-center justify-center shrink-0">
                    <MapPin className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-black text-brand-navy text-sm uppercase tracking-widest mb-1">Location</h4>
                    <p className="text-xl font-black text-gray-700">{ADDRESS}</p>
                  </div>
                </div>
              </div>
              
              {/* Map Replacement (External Link to avoid frame errors) */}
              <div className="rounded-[2.5rem] overflow-hidden h-80 bg-brand-navy relative border-4 border-white shadow-2xl group flex items-center justify-center text-center p-10">
                 <div className="absolute inset-0 opacity-20 grayscale bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80')] bg-cover"></div>
                 <div className="relative z-10">
                   <MapPin className="w-16 h-16 text-brand-orange mx-auto mb-6" />
                   <h4 className="text-white text-2xl font-black mb-4 uppercase tracking-widest">Find Us On Google Maps</h4>
                   <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-brand-orange text-white px-8 py-4 rounded-xl font-black inline-flex items-center gap-2 hover:scale-105 transition-transform shadow-xl"
                   >
                     Open Map <ExternalLink size={20} />
                   </a>
                 </div>
              </div>
            </div>

            <div className="bg-white p-10 lg:p-16 rounded-[3rem] shadow-2xl shadow-brand-navy/5">
              <h3 className="text-3xl font-black text-brand-navy mb-10">Request a Service</h3>
              <form className="space-y-8" onSubmit={e => e.preventDefault()}>
                <input type="text" className="w-full bg-gray-50 px-6 py-4 rounded-2xl border-2 border-transparent focus:border-brand-orange outline-none transition-all font-bold" placeholder="Your Name" />
                <input type="tel" className="w-full bg-gray-50 px-6 py-4 rounded-2xl border-2 border-transparent focus:border-brand-orange outline-none transition-all font-bold" placeholder="Phone Number" />
                <textarea rows={5} className="w-full bg-gray-50 px-6 py-4 rounded-2xl border-2 border-transparent focus:border-brand-orange outline-none transition-all font-bold resize-none" placeholder="Service Details..."></textarea>
                <button type="submit" className="w-full bg-brand-navy text-white py-6 rounded-[1.5rem] font-black text-xl hover:bg-[#0a1e33] transition-all">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-navy text-white pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-16 mb-20 text-center lg:text-left">
            <div className="lg:col-span-2 flex flex-col items-center lg:items-start">
              <EL_LOGO className="h-20 invert brightness-0 mb-8" />
              <p className="text-xl text-blue-100/40 max-w-sm font-medium italic">"{TAGLINE}"</p>
            </div>
            <div>
              <h4 className="text-lg font-black uppercase tracking-widest mb-8">Navigation</h4>
              <ul className="space-y-4 text-blue-100/40 font-bold">
                <li><button onClick={() => scrollTo('services')} className="hover:text-brand-orange outline-none">Services</button></li>
                <li><button onClick={() => scrollTo('about')} className="hover:text-brand-orange outline-none">About Us</button></li>
                <li><button onClick={() => scrollTo('contact')} className="hover:text-brand-orange outline-none">Contact</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-black uppercase tracking-widest mb-8">Emergency</h4>
              <p className="text-brand-orange font-black text-xl mb-2">{PHONE_NUMBER}</p>
              <p className="text-blue-100/20 text-sm font-bold uppercase tracking-widest">Available 24/7 for burst pipes and blockages.</p>
            </div>
          </div>
          <div className="pt-12 border-t border-white/5 text-center text-blue-100/20 font-bold tracking-widest text-xs uppercase">
            © {new Date().getFullYear()} {COMPANY_NAME}. All Rights Reserved.
          </div>
        </div>
      </footer>

      {/* Floating Chat Bot */}
      <div className={`fixed bottom-8 right-8 z-[100] transition-all duration-500 ${isChatOpen ? 'w-full sm:w-[400px]' : 'w-16 h-16'}`}>
        {!isChatOpen ? (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="w-16 h-16 bg-brand-orange text-white rounded-full shadow-[0_15px_30px_-10px_rgba(245,130,32,0.8)] flex items-center justify-center hover:scale-110 transition-transform"
          >
            <MessageSquare size={32} />
          </button>
        ) : (
          <div className="bg-white rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(15,43,72,0.4)] border border-gray-100 overflow-hidden flex flex-col max-h-[600px] animate-fade-in">
            {/* Chat Header */}
            <div className="bg-brand-navy p-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center shadow-lg"><Wrench size={24} /></div>
                <div>
                  <h5 className="font-black text-sm uppercase tracking-widest leading-none mb-1">Expert Assistant</h5>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Active Now</span></div>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X size={24} /></button>
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-gray-50 min-h-[300px]">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-bold leading-relaxed ${
                    msg.role === 'user' ? 'bg-brand-orange text-white' : 'bg-white text-brand-navy border border-gray-100 shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-white border border-gray-100 p-4 rounded-2xl flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-75"></div>
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-gray-100 flex gap-3">
              <input 
                type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-grow bg-gray-100 px-5 py-3 rounded-xl outline-none focus:ring-2 ring-brand-orange/20 font-black text-sm text-brand-navy"
              />
              <button 
                type="submit" disabled={isChatLoading || !chatInput.trim()}
                className="w-12 h-12 bg-brand-navy text-white rounded-xl flex items-center justify-center hover:bg-brand-orange transition-colors disabled:opacity-50"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        )}
      </div>

      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default App;
