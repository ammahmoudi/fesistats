"use client";

import { useLanguage } from '@/lib/LanguageContext';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LanguageToggle() {
  const { language, setLanguage, isRTL } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fa' : 'en');
  };

  return (
    <Button
      onClick={toggleLanguage}
      variant="outline"
      size="sm"
      className={`fixed top-4 z-50 bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 transition-all duration-300 ${
        isRTL ? 'right-auto left-4' : 'right-4 left-auto'
      }`}
    >
      <Languages className="w-4 h-4 mr-2" />
      {language === 'en' ? 'فارسی' : 'English'}
    </Button>
  );
}
