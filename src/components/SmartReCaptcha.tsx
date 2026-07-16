import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, Check, Loader2, Car, TrafficCone, HelpCircle, Eye, Home } from 'lucide-react';

interface SmartReCaptchaProps {
  lang: 'ar' | 'en';
  onVerify: (verified: boolean) => void;
  id?: string;
}

interface Puzzle {
  id: string;
  titleAr: string;
  titleEn: string;
  targetIcon: string; // 'car' | 'cone' | 'home'
  grid: {
    id: number;
    icon: 'car' | 'cone' | 'home' | 'eye';
    labelAr: string;
    labelEn: string;
  }[];
}

const PUZZLES: Puzzle[] = [
  {
    id: 'cars',
    titleAr: 'حدد جميع المربعات التي تحتوي على سيارات',
    titleEn: 'Select all squares with cars',
    targetIcon: 'car',
    grid: [
      { id: 1, icon: 'car', labelAr: 'سيارة', labelEn: 'Car' },
      { id: 2, icon: 'home', labelAr: 'منزل', labelEn: 'Home' },
      { id: 3, icon: 'cone', labelAr: 'قمع مرور', labelEn: 'Traffic Cone' },
      { id: 4, icon: 'eye', labelAr: 'عين', labelEn: 'Eye' },
      { id: 5, icon: 'car', labelAr: 'سيارة دفع رباعي', labelEn: 'SUV Car' },
      { id: 6, icon: 'home', labelAr: 'مبنى', labelEn: 'Building' },
      { id: 7, icon: 'cone', labelAr: 'علامة مرور', labelEn: 'Sign' },
      { id: 8, icon: 'car', labelAr: 'سيارة سباق', labelEn: 'Race Car' },
      { id: 9, icon: 'eye', labelAr: 'رؤية', labelEn: 'Vision' },
    ]
  },
  {
    id: 'cones',
    titleAr: 'حدد جميع المربعات التي تحتوي على أقماع أو علامات مرور',
    titleEn: 'Select all squares with traffic cones/signs',
    targetIcon: 'cone',
    grid: [
      { id: 1, icon: 'cone', labelAr: 'قمع مرور', labelEn: 'Traffic Cone' },
      { id: 2, icon: 'car', labelAr: 'سيارة', labelEn: 'Car' },
      { id: 3, icon: 'home', labelAr: 'منزل', labelEn: 'Home' },
      { id: 4, icon: 'cone', labelAr: 'علامة حظر', labelEn: 'Barrier' },
      { id: 5, icon: 'eye', labelAr: 'مستشعر', labelEn: 'Sensor' },
      { id: 6, icon: 'cone', labelAr: 'أمن الطريق', labelEn: 'Road Safety' },
      { id: 7, icon: 'car', labelAr: 'تاكسي', labelEn: 'Taxi' },
      { id: 8, icon: 'home', labelAr: 'محل تجاري', labelEn: 'Store' },
      { id: 9, icon: 'cone', labelAr: 'عمود مروري', labelEn: 'Bollard' },
    ]
  },
  {
    id: 'homes',
    titleAr: 'حدد جميع المربعات التي تحتوي على منازل أو مبانٍ',
    titleEn: 'Select all squares with houses or buildings',
    targetIcon: 'home',
    grid: [
      { id: 1, icon: 'home', labelAr: 'منزل ريفي', labelEn: 'Cottage' },
      { id: 2, icon: 'car', labelAr: 'حافلة', labelEn: 'Bus' },
      { id: 3, icon: 'home', labelAr: 'عمارة سكنية', labelEn: 'Apartment' },
      { id: 4, icon: 'cone', labelAr: 'حاجز', labelEn: 'Roadblock' },
      { id: 5, icon: 'home', labelAr: 'فيلا حديثة', labelEn: 'Modern Villa' },
      { id: 6, icon: 'eye', labelAr: 'عين سحرية', labelEn: 'Peephole' },
      { id: 7, icon: 'car', labelAr: 'شاحنة', labelEn: 'Truck' },
      { id: 8, icon: 'home', labelAr: 'برج تجاري', labelEn: 'Commercial Tower' },
      { id: 9, icon: 'cone', labelAr: 'أقماع تحذيرية', labelEn: 'Cones' },
    ]
  }
];

export function SmartReCaptcha({ lang, onVerify, id }: SmartReCaptchaProps) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'verified' | 'challenge'>('idle');
  const [showModal, setShowModal] = useState(false);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle>(PUZZLES[0]);
  const [selectedCells, setSelectedCells] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset states
  const handleReset = () => {
    setStatus('idle');
    setShowModal(false);
    setSelectedCells([]);
    setErrorMessage('');
    onVerify(false);
  };

  const selectRandomPuzzle = () => {
    const idx = Math.floor(Math.random() * PUZZLES.length);
    setCurrentPuzzle(PUZZLES[idx]);
    setSelectedCells([]);
    setErrorMessage('');
  };

  const handleCheckboxClick = () => {
    if (status === 'verified' || status === 'checking') return;

    setStatus('checking');

    // Simulate smart browser fingerprinting & security checking delay
    setTimeout(() => {
      // 75% chance of instant success (No puzzle needed!)
      // 25% chance of triggering the visual security check
      const triggersChallenge = Math.random() < 0.25;

      if (triggersChallenge) {
        selectRandomPuzzle();
        setStatus('challenge');
        setShowModal(true);
      } else {
        setStatus('verified');
        onVerify(true);
      }
    }, 1100);
  };

  const handleCellToggle = (cellId: number) => {
    if (selectedCells.includes(cellId)) {
      setSelectedCells(selectedCells.filter(id => id !== cellId));
    } else {
      setSelectedCells([...selectedCells, cellId]);
    }
  };

  const handleVerifyPuzzle = () => {
    const targetIcon = currentPuzzle.targetIcon;
    
    // Get IDs of all cells that actually match the target
    const correctCellIds = currentPuzzle.grid
      .filter(cell => cell.icon === targetIcon)
      .map(cell => cell.id);

    // Check if the user selected exactly all the correct cells and no wrong ones
    const isCorrect = 
      selectedCells.length === correctCellIds.length &&
      selectedCells.every(id => correctCellIds.includes(id));

    if (isCorrect) {
      setShowModal(false);
      setStatus('verified');
      onVerify(true);
    } else {
      setErrorMessage(
        lang === 'ar'
          ? 'الرجاء المحاولة مرة أخرى. لم يتم تحديد جميع العناصر المطلوبة بشكل دقيق.'
          : 'Please try again. Not all matching items were selected correctly.'
      );
      // Stagger and select another puzzle
      setTimeout(() => {
        selectRandomPuzzle();
      }, 1000);
    }
  };

  const renderIcon = (type: 'car' | 'cone' | 'home' | 'eye') => {
    const iconClass = "w-7 h-7 text-slate-700 transition group-hover:scale-110";
    switch (type) {
      case 'car':
        return <Car className={iconClass} />;
      case 'cone':
        return <TrafficCone className={iconClass} />;
      case 'home':
        return <Home className={iconClass} />;
      case 'eye':
        return <Eye className={iconClass} />;
      default:
        return <HelpCircle className={iconClass} />;
    }
  };

  const isRtl = lang === 'ar';

  return (
    <div id={id} className="w-full select-none" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      {/* reCAPTCHA Checkbox Anchor Widget */}
      <div className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl shadow-sm transition-all">
        <div className="flex items-center gap-3.5">
          {/* Checkbox / Spinner / Checkmark Container */}
          <button
            type="button"
            onClick={handleCheckboxClick}
            disabled={status === 'verified'}
            className={`w-7 h-7 rounded border transition-all flex items-center justify-center shrink-0 ${
              status === 'verified'
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : status === 'checking'
                ? 'border-slate-300 bg-white'
                : 'border-slate-400 bg-white hover:border-indigo-500 active:ring-4 active:ring-indigo-100'
            }`}
          >
            {status === 'verified' && (
              <Check className="w-4.5 h-4.5 stroke-[3] animate-[scaleIn_0.25s_ease-out]" />
            )}
            {status === 'checking' && (
              <Loader2 className="w-4.5 h-4.5 text-indigo-600 animate-spin" />
            )}
            {status === 'challenge' && (
              <div className="w-3.5 h-3.5 bg-amber-500 rounded-sm animate-pulse" />
            )}
          </button>

          {/* Label */}
          <span 
            onClick={status !== 'verified' ? handleCheckboxClick : undefined}
            className={`text-xs font-bold cursor-pointer select-none ${
              status === 'verified' ? 'text-emerald-700' : 'text-slate-700'
            }`}
          >
            {status === 'verified' ? (
              isRtl ? 'تم التحقق بنجاح!' : 'Successfully Verified!'
            ) : status === 'checking' ? (
              isRtl ? 'جاري التحقق التلقائي الذكي...' : 'Verifying smart signals...'
            ) : (
              isRtl ? 'أنا لست برنامج روبوت' : "I'm not a robot"
            )}
          </span>
        </div>

        {/* reCAPTCHA Logo & Brand Badge */}
        <div className="flex flex-col items-center justify-center shrink-0 border-r border-slate-200 pr-3 mr-1 select-none" style={{ borderRightWidth: isRtl ? '0px' : '1px', borderLeftWidth: isRtl ? '1px' : '0px', paddingRight: isRtl ? '0px' : '12px', paddingLeft: isRtl ? '12px' : '0px', borderColor: '#e2e8f0' }}>
          <Shield className="w-5 h-5 text-indigo-500" />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">reCAPTCHA</span>
          <span className="text-[7px] text-slate-400 font-semibold mt-0.5">
            {isRtl ? 'الخصوصية - الشروط' : 'Privacy - Terms'}
          </span>
        </div>
      </div>

      {/* Verification Puzzle Modal Pop-up */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div 
            className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-[scaleIn_0.2s_ease-out] text-right"
            style={{ direction: isRtl ? 'rtl' : 'ltr' }}
          >
            {/* Header / Instructions */}
            <div className="bg-indigo-600 text-white p-5">
              <span className="text-[10px] font-black tracking-widest uppercase text-indigo-200 block mb-1">
                {isRtl ? 'التحقق البصري الأمني' : 'VISUAL SECURITY CHECK'}
              </span>
              <h4 className="text-base font-black leading-snug">
                {isRtl ? currentPuzzle.titleAr : currentPuzzle.titleEn}
              </h4>
              <p className="text-[11px] text-indigo-100 mt-1 font-semibold">
                {isRtl 
                  ? 'إذا لم تكن هناك أي صور مطابقة، انقر فوق تخطي أو تحديث.' 
                  : 'If there are none, click skip or refresh.'}
              </p>
            </div>

            {/* Error banner if failed */}
            {errorMessage && (
              <div className="bg-rose-50 border-y border-rose-200 text-rose-700 text-xs px-4 py-2.5 font-bold text-center animate-pulse">
                {errorMessage}
              </div>
            )}

            {/* 3x3 Grid of Icons */}
            <div className="p-4 bg-slate-50">
              <div className="grid grid-cols-3 gap-2.5">
                {currentPuzzle.grid.map((cell) => {
                  const isSelected = selectedCells.includes(cell.id);
                  return (
                    <button
                      key={cell.id}
                      type="button"
                      onClick={() => handleCellToggle(cell.id)}
                      className={`aspect-square rounded-xl border-2 transition-all duration-150 flex flex-col items-center justify-center p-2 relative group ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 ring-4 ring-indigo-100 scale-95'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      {/* Checkmark inside individual cell */}
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 bg-indigo-600 text-white rounded-full p-0.5 animate-[scaleIn_0.15s_ease-out]">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      
                      {renderIcon(cell.icon)}
                      
                      <span className="text-[9px] text-slate-400 font-bold mt-1.5">
                        {isRtl ? cell.labelAr : cell.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer with Actions */}
            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
              {/* Utility Tools */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={selectRandomPuzzle}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  title={isRtl ? 'تحديث الأحجية' : 'Refresh Puzzle'}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title={isRtl ? 'إلغاء وإعادة تعيين' : 'Cancel and Reset'}
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
              </div>

              {/* Verify Button */}
              <button
                type="button"
                onClick={handleVerifyPuzzle}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
              >
                {selectedCells.length > 0 
                  ? (isRtl ? 'تحقق' : 'Verify')
                  : (isRtl ? 'تخطي' : 'Skip')
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes scaleIn {
          0% { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
