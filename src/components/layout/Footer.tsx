'use client';

import { Mail, Phone, MapPin, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';
import Link from 'next/link';

const footerLinks = {
  product: [
    { name: 'Courses', href: '#courses' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Verify Certificate', href: '#verify' }
  ],
  company: [
    { name: 'About Us', href: '#about' },
    { name: 'Careers', href: '#careers' },
    { name: 'Blog', href: '#blog' },
    { name: 'Press Kit', href: '#press' }
  ],
  support: [
    { name: 'Help Center', href: '#support' },
    { name: 'Contact Us', href: '#contact' },
    { name: 'FAQ', href: '#faq' },
    { name: 'Community', href: '#community' }
  ],
  legal: [
    { name: 'Terms of Service', href: '#terms' },
    { name: 'Privacy Policy', href: '#privacy' },
    { name: 'Cookie Policy', href: '#cookies' },
    { name: 'Refund Policy', href: '#refund' }
  ]
};

const socialLinks = [
  { icon: Instagram, href: '#', color: 'from-pink-500 to-rose-500' },
  { icon: Linkedin, href: '#', color: 'from-blue-600 to-blue-700' },
  { icon: Twitter, href: '#', color: 'from-sky-400 to-blue-500' },
  { icon: Youtube, href: '#', color: 'from-red-500 to-red-600' }
];

export function Footer() {
  return (
    <footer className="relative bg-linear-to-br from-gray-900 via-purple-900 to-gray-900 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob"
        />
        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob animation-delay-2000"
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        {/* Top Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6 animate-fade-in">
              <img
                src="/images/mainlogo1-C1oyx5qb.png"
                alt="Logo"
                className="h-12 w-auto"
              />
            </div>

            <p
              className="text-gray-400 mb-6 animate-fade-in animation-delay-100"
              style={{ 
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 400,
                fontSize: '15px',
                lineHeight: '1.7'
              }}
            >
              Transform your career with industry-standard tools and real-world projects in just 14 days.
            </p>

            {/* Social Links */}
            <div className="flex gap-3 animate-fade-in animation-delay-200">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all group hover:scale-110 hover:-translate-y-0.5 active:scale-95"
                >
                  <social.icon className="w-5 h-5 text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links], categoryIndex) => (
            <div
              key={category}
              className="animate-fade-in"
              style={{ animationDelay: `${categoryIndex * 100}ms` }}
            >
              <h4
                className="mb-6 text-white"
                style={{ 
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: '16px',
                  textTransform: 'capitalize'
                }}
              >
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-all inline-block relative group hover:translate-x-1"
                      style={{ 
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 400,
                        fontSize: '14px'
                      }}
                    >
                      {link.name}
                      <span className="absolute bottom-0 left-0 w-0 h-px bg-linear-to-r from-purple-500 to-blue-500 group-hover:w-full transition-all duration-300" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Info */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 animate-fade-in">
          {[
            { icon: Mail, text: 'support@sprintern.com', label: 'Email' },
            { icon: Phone, text: '+91 98765 43210', label: 'Phone' },
            { icon: MapPin, text: 'Lucknow, India', label: 'Location' }
          ].map((contact, index) => (
            <div
              key={index}
              className="flex items-center gap-4 transition-transform duration-200 hover:translate-x-1"
            >
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0">
                <contact.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div
                  className="text-gray-400 mb-1"
                  style={{ 
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 400,
                    fontSize: '12px'
                  }}
                >
                  {contact.label}
                </div>
                <div
                  className="text-white"
                  style={{ 
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: '14px'
                  }}
                >
                  {contact.text}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-white/10 animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p
              className="text-gray-400 text-center md:text-left"
              style={{ 
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 400,
                fontSize: '14px'
              }}
            >
              © 2026 SPRINTERN. All rights reserved. Built with ❤️ for Core Engineers.
            </p>

            <div className="flex items-center gap-6">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-all hover:-translate-y-0.5"
                style={{ 
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 400,
                  fontSize: '14px'
                }}
              >
                Status
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-all hover:-translate-y-0.5"
                style={{ 
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 400,
                  fontSize: '14px'
                }}
              >
                Sitemap
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
