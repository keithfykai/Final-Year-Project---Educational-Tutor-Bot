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
      { title: 'Features', href: '/#features' },
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
      { title: 'LinkedIn', href: '#', icon: BriefcaseIcon },
      { title: 'GitHub', href: '#', icon: GitBranchIcon },
    ],
  },
];

export default function Footer() {
  return (
    <FooterSection
      logo={
        <Image
          src="/Eduble Logo Light.svg"
          alt="Eduble Logo"
          width={120}
          height={20}
        />
      }
      tagline={
        <>© {new Date().getFullYear()} Eduble · Home Grown in Singapore 🇸🇬</>
      }
      sections={footerSections}
    />
  );
}
