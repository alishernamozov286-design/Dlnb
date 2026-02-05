import React, { useState, useEffect } from 'react';
import { X, Gift, MessageSquare, Sparkles, Send } from 'lucide-react';
import { t } from '@/lib/transliteration';

interface BirthdaySmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  phoneNumber: string;
}

const BirthdaySmsModal: React.FC<BirthdaySmsModalProps> = ({
  isOpen,
  onClose,
  customerName,
  phoneNumber
}) => {
  const [language] = useState<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  });

  const [selectedTemplate, setSelectedTemplate] = useState(0);

  // Modal ochilganda orqa scroll'ni bloklash
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // SMS shablonlari
  const templates = [
    `Tabriklaymiz, ${customerName}! Tug'ilgan kuningiz bilan! 🎂🎉 Avtojon Service`,
    `Hurmatli ${customerName}! Sizni tug'ilgan kuningiz bilan chin dildan tabriklaymiz! Sog'lik va baxt tilaymiz! 🎉 Avtojon Service`,
    `${customerName}, tug'ilgan kuningiz muborak! Omad va muvaffaqiyatlar tilaymiz! 🎂 Avtojon Service`,
    `Aziz ${customerName}! Tug'ilgan kuningiz bilan! Har doim sog' bo'ling! 🎉🎂 Avtojon Service`
  ];

  const handleSendSms = () => {
    // Telefon raqamini tozalash (faqat raqamlar)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // SMS ilovasini ochish
    const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(templates[selectedTemplate])}`;
    window.open(smsUrl, '_blank');
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 px-5 py-3.5 relative overflow-hidden rounded-t-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          <div className="flex items-center justify-between relative">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Gift className="h-6 w-6 animate-bounce" />
              {t('SMS yuborish', language)}
              <Sparkles className="h-5 w-5 animate-pulse" />
            </h3>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors hover:rotate-90 duration-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-5 space-y-4">
          {/* Mijoz ma'lumotlari */}
          <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 rounded-lg p-4 border border-pink-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-full p-2.5 shadow-sm">
                <Gift className="h-5 w-5 text-pink-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">{t('Mijoz', language)}</p>
                <p className="text-base font-bold text-gray-900 truncate">{customerName}</p>
                <p className="text-sm text-gray-600">{phoneNumber}</p>
              </div>
            </div>
          </div>

          {/* Shablon tanlash */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2.5 flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              {t('Shablon tanlang', language)}
            </label>
            <div className="space-y-2.5">
              {templates.map((template, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedTemplate(index)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedTemplate === index
                      ? 'border-pink-500 bg-gradient-to-r from-pink-50 to-purple-50 shadow-md scale-[1.02]'
                      : 'border-gray-200 bg-white hover:border-pink-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      selectedTemplate === index
                        ? 'border-pink-500 bg-pink-500 shadow-sm'
                        : 'border-gray-300'
                    }`}>
                      {selectedTemplate === index && (
                        <Send className="w-2.5 h-2.5 text-white" />
                      )}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed flex-1">{template}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              {t('Bekor qilish', language)}
            </button>
            <button
              type="button"
              onClick={handleSendSms}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all text-sm font-medium shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
            >
              <Send className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              {t('Yuborish', language)}
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BirthdaySmsModal;
