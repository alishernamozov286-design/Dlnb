import { useState } from 'react';
import { ArrowLeftRight, Copy, Check, Languages } from 'lucide-react';
import { latinToCyrillic, cyrillicToLatin, detectScript } from '@/lib/transliteration';

export default function TransliterationConverter() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [mode, setMode] = useState<'latin-to-cyrillic' | 'cyrillic-to-latin'>('latin-to-cyrillic');
  const [copied, setCopied] = useState(false);

  const handleConvert = (text: string) => {
    setInputText(text);
    
    if (!text.trim()) {
      setOutputText('');
      return;
    }

    let result = '';
    if (mode === 'latin-to-cyrillic') {
      result = latinToCyrillic(text);
    } else {
      result = cyrillicToLatin(text);
    }
    
    setOutputText(result);
  };

  const handleSwapMode = () => {
    const newMode = mode === 'latin-to-cyrillic' ? 'cyrillic-to-latin' : 'latin-to-cyrillic';
    setMode(newMode);
    
    // Swap input and output
    const temp = inputText;
    setInputText(outputText);
    setOutputText(temp);
  };

  const handleCopy = async () => {
    if (outputText) {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAutoDetect = () => {
    if (!inputText.trim()) return;
    
    const script = detectScript(inputText);
    
    if (script === 'cyrillic' && mode === 'latin-to-cyrillic') {
      setMode('cyrillic-to-latin');
      setOutputText(cyrillicToLatin(inputText));
    } else if (script === 'latin' && mode === 'cyrillic-to-latin') {
      setMode('latin-to-cyrillic');
      setOutputText(latinToCyrillic(inputText));
    }
  };

  const examples = mode === 'latin-to-cyrillic' 
    ? [
        { text: "salom", label: "Salom" },
        { text: "o'qituvchi", label: "O'qituvchi" },
        { text: "kitob", label: "Kitob" },
        { text: "maktab", label: "Maktab" },
      ]
    : [
        { text: "салом", label: "Салом" },
        { text: "ўқитувчи", label: "Ўқитувчи" },
        { text: "китоб", label: "Китоб" },
        { text: "мактаб", label: "Мактаб" },
      ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Languages className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Transliteratsiya</h2>
                <p className="text-blue-100 text-sm">O'zbekcha lotin ⇄ kirill</p>
              </div>
            </div>
            <button
              onClick={handleAutoDetect}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-all backdrop-blur-sm"
            >
              Avtomatik aniqlash
            </button>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-center space-x-4">
            <div className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              mode === 'latin-to-cyrillic' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-white text-gray-600'
            }`}>
              Lotin (ABC)
            </div>
            
            <button
              onClick={handleSwapMode}
              className="p-3 bg-white rounded-xl hover:bg-gray-100 transition-all shadow-md hover:shadow-lg group"
              title="Yo'nalishni almashtirish"
            >
              <ArrowLeftRight className="h-5 w-5 text-gray-600 group-hover:rotate-180 transition-transform duration-300" />
            </button>
            
            <div className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              mode === 'cyrillic-to-latin' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-white text-gray-600'
            }`}>
              Kirill (АБВ)
            </div>
          </div>
        </div>

        {/* Input/Output Area */}
        <div className="grid md:grid-cols-2 gap-6 p-6">
          {/* Input */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              {mode === 'latin-to-cyrillic' ? 'Lotin harflari' : 'Kirill harflari'}
            </label>
            <textarea
              value={inputText}
              onChange={(e) => handleConvert(e.target.value)}
              placeholder={mode === 'latin-to-cyrillic' 
                ? "Matnni kiriting... (masalan: salom)" 
                : "Матнни киритинг... (масалан: салом)"}
              className="w-full h-48 p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none text-lg"
            />
            <div className="text-sm text-gray-500">
              {inputText.length} belgi
            </div>
          </div>

          {/* Output */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-700">
                {mode === 'latin-to-cyrillic' ? 'Kirill harflari' : 'Lotin harflari'}
              </label>
              <button
                onClick={handleCopy}
                disabled={!outputText}
                className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-all"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Nusxalandi</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Nusxalash</span>
                  </>
                )}
              </button>
            </div>
            <div className="w-full h-48 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl overflow-y-auto text-lg">
              {outputText || (
                <span className="text-gray-400">
                  Natija bu yerda ko'rinadi...
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {outputText.length} belgi
            </div>
          </div>
        </div>

        {/* Examples */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Misollar:</h3>
          <div className="flex flex-wrap gap-2">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => handleConvert(example.text)}
                className="px-4 py-2 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg text-sm font-medium transition-all"
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="p-6 bg-blue-50 border-t border-blue-100">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Languages className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">Qo'llab-quvvatlanadigan harflar:</h4>
              <p className="text-sm text-gray-600">
                <strong>Maxsus harflar:</strong> o' → ў, g' → ғ, sh → ш, ch → ч, ng → нг
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Avtomatik:</strong> Kichik va katta harflar avtomatik o'giriladi
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
