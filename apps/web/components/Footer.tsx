import Link from 'next/link';
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  Phone
} from 'lucide-react';

export default function Footer() {
  const footerSections = [
    {
      title: 'Home',
      links: [
        { label: 'Company', href: '/company' },
        { label: 'About us', href: '/about' },
        { label: 'Refund policy', href: '/refund' },
        { label: 'Integrations', href: '/integrations' }
      ]
    },
    {
      title: 'Register your college',
      links: [
        { label: 'Claim your college', href: '/register/college' },
        { label: 'Privacy policy', href: '/privacy' },
        { label: 'Careers', href: '/careers' },
        { label: 'Terms & Conditions', href: '/terms' }
      ]
    },
    {
      title: 'Contact us',
      isContact: true,
      content: (
        <div className="space-y-4">
          {/* Phone */}
          <div className="flex items-center space-x-3 text-gray-300">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span>+91 6362606464</span>
          </div>
          {/* Email */}
          <div className="flex items-center space-x-3 text-gray-300">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <a
              href="mailto:contactus@campuspe.com"
              className="hover:text-white transition-colors duration-200"
            >
              contactus@campuspe.com
            </a>
          </div>
        </div>
      )
    }
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Youtube, href: '#', label: 'YouTube' }
  ];

  return (
    <footer className="bg-[#263238] text-white">
      {/* Main Footer Content */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-12 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="col-span-2 lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center space-x-2">
              <img
                src="/logo1.svg"
                alt="CampusPe"
                className="h-12 w-auto"
              />
            </Link>

            <div className="text-sm font-semibold leading-relaxed">
              <p>CampusPe – From admissions to Placements, we've got you.</p>
              <div className="text-sm flex gap-4 mt-4">
                <Link href="/company">
                  <span> Explore colleges</span>
                </Link>
                <Link href="/fees">
                  <span> Pay fees</span>
                </Link>
                <Link href="/placements">
                  <span> Campus placements</span>
                </Link>
              </div>
            </div>

            {/* Social Media (desktop / lg+) */}
            <div className="hidden lg:block">
              <h4 className="text-white font-semibold mb-4">Social Media</h4>
              <div className="flex space-x-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <Link
                      key={social.label}
                      href={social.href}
                      className="w-10 h-10 bg-gray-700 rounded-md flex items-center justify-center hover:bg-blue-600 transition-colors duration-200 group"
                      aria-label={social.label}
                    >
                      <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
          {/* Footer Links */}
          {footerSections.map((section) => (
            <div
              key={section.title}
              className={`space-y-4 text-sm ${section.isContact ? 'col-span-2 lg:col-span-1' : ''}`}
            >
              <h3 className="font-semibold text-sm text-white">
                {section.title}
              </h3>

              {section.isContact ? (
                section.content
              ) : (
                <ul className="space-y-3">
                  {section.links?.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {/* Social Media (mobile only) */}
          <div className="col-span-2 block lg:hidden space-y-4 mt-2">
            <h4 className="text-white font-semibold">Social Media</h4>
            <div className="flex space-x-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  className="w-10 h-10 bg-gray-700 rounded-md flex items-center justify-center hover:bg-blue-600 transition-colors duration-200 group"
                  aria-label={label}
                >
                  <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-gray-700 pt-4 flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
          <p>© {new Date().getFullYear()} CampusPe. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <Link href="/privacy" className="hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms of Service
            </Link>
            <Link
              href="/admin/login"
              className="hover:text-white opacity-50 hover:opacity-100 transition-opacity"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
