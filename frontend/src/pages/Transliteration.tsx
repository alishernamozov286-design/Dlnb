import TransliterationConverter from '@/components/TransliterationConverter';
import { ArrowLeft, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Transliteration() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link 
          to="/" 
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-blue-600 mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-semibold">Orqaga</span>
        </Link>

        {/* Converter */}
        <TransliterationConverter />

        {/* Additional Info */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
            <h3 className="font-semibold text-gray-900 mb-1">Aniqlik</h3>
            <p className="text-sm text-gray-600">
              Barcha o'zbek harflari to'g'ri transliteratsiya qilinadi
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="text-3xl font-bold text-indigo-600 mb-2">2x</div>
            <h3 className="font-semibold text-gray-900 mb-1">Yo'nalish</h3>
            <p className="text-sm text-gray-600">
              Lotin → Kirill va Kirill → Lotin ikkala yo'nalishda ishlaydi
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="mb-2">
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Tezkor</h3>
            <p className="text-sm text-gray-600">
              Real vaqtda transliteratsiya, hech qanday kechikishsiz
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
