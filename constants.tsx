
import React from 'react';
import { Droplet, Search, ShieldAlert, Bath, Hammer, Clock } from 'lucide-react';
import { ServiceCard } from './types';

export const COMPANY_NAME = 'E/L Plumbing';
export const TAGLINE = 'Fast. Clean. Professional.';
export const PHONE_NUMBER = '075 195 7680';
export const EMAIL = 'zurumaephraim9@gmail.com';
export const ADDRESS = '15 Tulp Street, Dunoon, 7441, Milnerton, Cape Town';

export const EL_LOGO = ({ className = "" }: { className?: string }) => (
  <div className={`flex flex-col items-center ${className}`}>
    <svg 
      viewBox="0 0 300 220" 
      className="w-full h-auto" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background/Canvas Spacer */}
      
      {/* Colors: Navy #0f2b48, Orange #f58220 */}
      
      {/* Letter E (Pipe Style) */}
      <g fill="#0f2b48">
        <path d="M20 30 h90 v25 h-65 v20 h50 v25 h-50 v20 h65 v25 h-90 Z" />
        {/* Connection Flanges */}
        <rect x="15" y="30" width="5" height="25" />
        <rect x="15" y="125" width="5" height="25" />
        <rect x="105" y="30" width="5" height="25" />
        <rect x="105" y="125" width="5" height="25" />
      </g>
      
      {/* Droplet Circle inside E */}
      <circle cx="65" cy="87.5" r="18" fill="#0f2b48" stroke="white" strokeWidth="1" />
      <path 
        d="M65 77 c-4 5 -8 10 -8 14 a8 8 0 1 0 16 0 c0 -4 -4 -9 -8 -14 Z" 
        fill="white" 
      />
      
      {/* Vertical Orange Pipe Segment */}
      <rect x="135" y="30" width="18" height="120" rx="9" fill="#f58220" />
      
      {/* Letter L (Pipe Style) */}
      <g fill="#0f2b48">
        <path d="M175 30 h25 v95 h60 v25 h-85 Z" />
        {/* Connection Flanges */}
        <rect x="170" y="30" width="5" height="25" />
        <rect x="255" y="125" width="5" height="25" />
      </g>

      {/* PLUMBING Text */}
      <text 
        x="150" 
        y="200" 
        fontFamily="Outfit, sans-serif" 
        fontSize="54" 
        fontWeight="800" 
        fill="#0f2b48" 
        textAnchor="middle" 
        letterSpacing="2"
      >
        PLUMBING
      </text>
    </svg>
  </div>
);

export const SERVICES: ServiceCard[] = [
  {
    id: 'general',
    title: 'General Plumbing',
    description: 'Comprehensive solutions for every residential and commercial plumbing need.',
    imagePrompt: 'Professional plumbing tools and copper pipes neatly arranged on a clean workbench, soft neutral lighting, hyper-realistic, 4k.',
    icon: <Droplet className="w-6 h-6" />
  },
  {
    id: 'leak',
    title: 'Leak Detection & Repairs',
    description: 'Non-invasive leak detection using advanced acoustic and thermal technology.',
    imagePrompt: 'A professional plumber using a modern digital leak detection device on a clean tiled wall, professional lighting, realistic style.',
    icon: <Search className="w-6 h-6" />
  },
  {
    id: 'blocked',
    title: 'Blocked Drains',
    description: 'High-pressure jetting and drain cleaning for stubborn obstructions.',
    imagePrompt: 'A close-up of a high-pressure water jetter being used by a professional plumber in a clean kitchen drain environment, 4k resolution.',
    icon: <ShieldAlert className="w-6 h-6" />
  },
  {
    id: 'bathroom',
    title: 'Bathroom & Kitchen Plumbing',
    description: 'Full installations and repairs for sinks, faucets, showers, and appliances.',
    imagePrompt: 'A modern, clean bathroom vanity with a sparkling chrome faucet and a white sink, professional architectural photography style.',
    icon: <Bath className="w-6 h-6" />
  },
  {
    id: 'pipes',
    title: 'Pipe Repairs & Installations',
    description: 'Expert pipework using high-quality materials for long-lasting durability.',
    imagePrompt: 'Clean copper pipes professionally installed in a residential plumbing system, sharp focus, industrial and tidy look.',
    icon: <Hammer className="w-6 h-6" />
  },
  {
    id: 'emergency',
    title: 'Emergency Plumbing',
    description: '24/7 rapid response for urgent plumbing issues that cannot wait.',
    imagePrompt: 'A white plumbing service van parked in a clean suburban Cape Town street during the day, professional branding on the van, clear lighting.',
    icon: <Clock className="w-6 h-6" />
  }
];
