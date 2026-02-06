import { useState } from 'react';
import { MessageSquare, Car, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { aiApi } from '../../lib/api';
import toast from 'react-hot-toast';

export default function AIDiagnostic() {
  const [carModel, setCarModel] = useState('');
  const [problem, setProblem] = useState('');
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!problem.trim()) {
      toast.error('Iltimos, mashina muammosini kiriting');
      return;
    }

    setLoading(true);
    setAdvice('');

    try {
      const response = await aiApi.getDiagnosticAdvice({
        problem: problem.trim(),
        carModel: carModel.trim() || undefined
      });

      setAdvice(response.advice);
      toast.success('AI maslahat olindi!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'AI maslahat olishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const formatAdvice = (text: string) => {
    // Icon mapping
    const iconMap: { [key: string]: JSX.Element } = {
      '[CAR]': <Car className="w-4 h-4 inline text-blue-600" />,
      '[ALERT]': <AlertCircle className="w-4 h-4 inline text-red-600" />,
      '[CLIPBOARD]': <MessageSquare className="w-4 h-4 inline text-purple-600" />,
      '[SEARCH]': <Sparkles className="w-4 h-4 inline text-indigo-600" />,
      '[WRENCH]': <Car className="w-4 h-4 inline text-green-600" />,
      '[WARNING]': <AlertCircle className="w-4 h-4 inline text-orange-600" />,
      '[LIGHTBULB]': <Sparkles className="w-4 h-4 inline text-yellow-600" />,
    };

    return text.split('\n').map((line, index) => {
      // Replace icon tags with actual icons
      let processedLine = line;
      Object.keys(iconMap).forEach(tag => {
        if (processedLine.includes(tag)) {
          const parts = processedLine.split(tag);
          return (
            <div key={index} className="flex items-start gap-2 mb-2">
              {iconMap[tag]}
              <span className="flex-1">{parts.join('')}</span>
            </div>
          );
        }
      });

      if (line.trim().startsWith('###')) {
        return <h3 key={index} className="text-lg font-bold text-gray-900 mt-4 mb-2">{line.replace(/###/g, '').trim()}</h3>;
      }
      if (line.trim().startsWith('##')) {
        return <h2 key={index} className="text-xl font-bold text-gray-900 mt-6 mb-3">{line.replace(/##/g, '').trim()}</h2>;
      }
      if (line.trim().startsWith('#')) {
        return <h1 key={index} className="text-2xl font-bold text-gray-900 mt-6 mb-4">{line.replace(/#/g, '').trim()}</h1>;
      }
      if (line.trim().startsWith('-') || line.trim().startsWith('*') || line.trim().startsWith('•')) {
        return <li key={index} className="ml-6 text-gray-700 mb-1">{line.replace(/^[-*•]\s*/, '').trim()}</li>;
      }
      if (line.trim().match(/^\d+\./)) {
        return <li key={index} className="ml-6 text-gray-700 list-decimal mb-1">{line.replace(/^\d+\.\s*/, '').trim()}</li>;
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      return <p key={index} className="text-gray-700 mb-2">{processedLine}</p>;
    });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">AI Diagnostika</h1>
        </div>
        <p className="text-gray-600">
          Mashina muammosini kiriting va AI'dan professional maslahat oling
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Car className="w-4 h-4" />
                Mashina modeli (ixtiyoriy)
              </label>
              <input
                type="text"
                value={carModel}
                onChange={(e) => {
                  const value = e.target.value;
                  // Birinchi harfni katta qilish
                  if (value.length === 1 || (value.trim().length === 1 && carModel.trim().length === 0)) {
                    setCarModel(value.charAt(0).toUpperCase() + value.slice(1));
                  } else {
                    setCarModel(value);
                  }
                }}
                placeholder="Masalan: Toyota Camry 2015"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                autoCapitalize="words"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="w-4 h-4" />
                Muammo tavsifi *
              </label>
              <textarea
                value={problem}
                onChange={(e) => {
                  const value = e.target.value;
                  const prevValue = problem;
                  
                  // Birinchi harfni katta qilish
                  if (value.length === 1 || (value.trim().length === 1 && prevValue.trim().length === 0)) {
                    setProblem(value.charAt(0).toUpperCase() + value.slice(1));
                  }
                  // Nuqta, savol yoki undov belgisidan keyin katta harf
                  else if (value.length > prevValue.length) {
                    const lastChars = prevValue.slice(-2);
                    const newChar = value.slice(-1);
                    
                    // Agar oxirgi belgi nuqta/savol/undov + bo'shliq bo'lsa va yangi harf kiritilsa
                    if ((lastChars.match(/[.!?]\s$/) || prevValue.match(/[.!?]$/)) && newChar.match(/[a-zA-Z]/)) {
                      setProblem(value.slice(0, -1) + newChar.toUpperCase());
                    } else {
                      setProblem(value);
                    }
                  } else {
                    setProblem(value);
                  }
                }}
                placeholder="Mashina muammosini batafsil yozing. Masalan: Dvigatel ishga tushganda g'alati tovush chiqaradi, ayniqsa sovuq havoda..."
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={loading}
                required
                autoCapitalize="sentences"
              />
              <p className="text-xs text-gray-500 mt-1">
                Kamida 5 ta belgi kiriting
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !problem.trim()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI tahlil qilmoqda...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  AI'dan maslahat ol
                </>
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Maslahat:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Muammoni aniq va batafsil yozing</li>
                  <li>Qanday tovushlar yoki belgilar borligini aytib bering</li>
                  <li>Qachon muammo paydo bo'lganini ko'rsating</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* AI Response */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            AI Maslahati
          </h2>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
              <p className="text-lg font-medium">AI tahlil qilmoqda...</p>
              <p className="text-sm">Bu bir necha soniya davom etishi mumkin</p>
            </div>
          )}

          {!loading && !advice && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <MessageSquare className="w-16 h-16 mb-4" />
              <p className="text-lg">AI javob bu yerda ko'rinadi</p>
              <p className="text-sm">Muammoni kiriting va "AI'dan maslahat ol" tugmasini bosing</p>
            </div>
          )}

          {!loading && advice && (
            <div className="prose prose-sm max-w-none">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span>AI tomonidan yaratilgan maslahat</span>
                </p>
              </div>
              <div className="text-gray-800 space-y-2 whitespace-pre-wrap">
                {formatAdvice(advice)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
