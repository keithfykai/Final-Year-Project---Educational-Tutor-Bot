'use client';
import Image from 'next/image';
import { CameraIcon, BriefcaseIcon, GitBranchIcon } from 'lucide-react';
import { FooterSection } from '@/components/ui/footer-section';

const footerSections = [
  {
    label: 'Product',
    links: [
      { title: 'Chat', href: '/chat' },
      { title: 'Quiz Mode', href: '/quizmode' },
    ],
  },
  {
    label: 'Company',
    links: [
      { title: 'About Us', href: '/about' },
    ],
  },
  {
    label: 'Social Links',
    links: [
      { title: 'LinkedIn', href: 'https://www.linkedin.com/in/keith-lim-en-kai/', icon: BriefcaseIcon },
      { title: 'GitHub', href: 'https://github.com/keithfykai/Final-Year-Project---Educational-Tutor-Bot', icon: GitBranchIcon },
    ],
  },
];

export default function Footer({
  className = '',
  showLogo = true,
}: {
  className?: string;
  showLogo?: boolean;
}) {
  return (
    <FooterSection
      className={className}
      logo={
        showLogo ? (
          <Image
            src="/Eduble Logo Light.svg"
            alt="Eduble Logo"
            width={60}
            height={10}
          />
        ) : null
      }
      tagline={
        <>© {new Date().getFullYear()} Eduble · Home Grown in Singapore 🇸🇬</>
      }
      sections={footerSections}
    />
  );
}
