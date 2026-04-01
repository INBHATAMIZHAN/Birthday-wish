import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Music, Camera, Calendar, Cake, Sparkles, Send, Lock, User, ChevronRight, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from './lib/utils';
import { db, auth, loginWithGoogle, handleFirestoreError, OperationType } from './firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

// --- Types ---
type Scene = 'login' | 'cake' | 'wish' | 'memories' | 'gallery' | 'letter';

interface Memory {
  id: number;
  title: string;
  date: string;
  description: string;
  icon: React.ReactNode;
}

// --- Constants ---
const MEMORIES: Memory[] = [
  { id: 1, title: "Our First Date", date: "", description: "you were the one who called me, and I came just for you ❤️ We walked around together at the temple festival, making beautiful memories 🎡✨ I still wish we could relive those moments again 💭 But I don’t know if that will ever be possible…", icon: <Heart className="text-pink-500" /> },
  { id: 2, title: "Our First Photo", date: "", description: "you were leaning on my shoulder, and that moment felt so beautiful ❤️ No matter how many photos we’ve taken after that, nothing feels as special as that one 📸✨ I still believe we’ll have a moment like that again someday 💫🥰", icon: <Camera className="text-blue-500" /> },
  { id: 3, title: "First trip together", date: "", description: "During our first trip, when you were riding with me on the bike, even though you kept scolding me, I still enjoyed every moment ❤️🏍️ In my mind, it felt like the song “Kadhalai Poma” was playing in the background 🎶✨ That ride is something I’ll always cherish 💫🥰.", icon: <Sparkles className="text-yellow-500" /> },
  { id: 4, title: "Coffee Date", date: "", description: "Even though we never got to have coffee together in real life ☕ I met you in my dreams at a coffee shop 💭✨ That’s one memory I will never forget ❤️🥰.", icon: <Music className="text-purple-500" /> },
];

const PHOTOS = [
  "https://lh3.googleusercontent.com/u/0/d/1S8f2vp85pRF8O45PC3Z6bPdhrljAkyXD",
  "https://lh3.googleusercontent.com/u/0/d/1AFrmFFlROHHowm2GB9OYqByf-lv4sd1i",
  "https://lh3.googleusercontent.com/u/0/d/1NZ-RorVLJGel20uakbfn7rC-g07poLX1",
  "https://lh3.googleusercontent.com/u/0/d/1AVCEvQgTAd5d9IO9YIcSvHs87Ir4vFtP",
  "https://lh3.googleusercontent.com/u/0/d/1YzVRbuuAzJlxDW_9ROYyX0nGW5Hh_Ypj",
  "https://lh3.googleusercontent.com/u/0/d/1mshaNNil9842ZBJTBHZh2RVQmDPq4cHj",
];

interface FirestorePhoto {
  id: string;
  url: string;
  createdAt: any;
  addedBy: string;
}

// --- Components ---

const SparkleTrail = () => {
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([]);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const newSparkle = { id: Date.now(), x: e.clientX, y: e.clientY };
      setSparkles(prev => [...prev.slice(-15), newSparkle]);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      <AnimatePresence>
        {sparkles.map(s => (
          <motion.div
            key={s.id}
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 0, y: s.y + 20 }}
            exit={{ opacity: 0 }}
            className="absolute text-yellow-400"
            style={{ left: s.x, top: s.y }}
          >
            <Sparkles size={12} fill="currentColor" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const HeartRain = ({ active }: { active: boolean }) => {
  if (!active) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -100, x: `${Math.random() * 100}vw`, rotate: 0 }}
          animate={{ y: '110vh', rotate: 360 }}
          transition={{ duration: Math.random() * 3 + 2, repeat: Infinity, ease: "linear", delay: Math.random() * 5 }}
          className="absolute text-rose-500/60"
        >
          <Heart fill="currentColor" size={Math.random() * 30 + 10} />
        </motion.div>
      ))}
    </div>
  );
};

const FloatingHearts = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: '110vh', x: `${Math.random() * 100}vw`, opacity: 0, scale: Math.random() * 0.5 + 0.5 }}
          animate={{ 
            y: '-10vh', 
            opacity: [0, 1, 1, 0],
            rotate: Math.random() * 360
          }}
          transition={{ 
            duration: Math.random() * 10 + 10, 
            repeat: Infinity, 
            delay: Math.random() * 20,
            ease: "linear"
          }}
          className="absolute text-pink-300/20"
        >
          <Heart fill="currentColor" size={Math.random() * 40 + 20} />
        </motion.div>
      ))}
    </div>
  );
};

const Login = ({ onLogin }: { onLogin: (name: string) => void }) => {
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedName = name.trim().toLowerCase();
    if ((normalizedName === 'abi' || normalizedName === 'abinaya') && birthday === '01-04-2007') {
      onLogin(name);
    } else {
      setError('Incorrect name or birthday! 🌸');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="max-w-[92vw] w-full sm:max-w-[420px] bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] text-center relative z-10 mx-4"
    >
      {/* Animated Heart Emoji with Virtual Effects */}
      <div className="mb-8 relative flex justify-center items-center h-32">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative z-10"
        >
          <span className="text-7xl drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]">❤️</span>
        </motion.div>
        
        {/* Virtual Glow Effects */}
        <motion.div
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute w-24 h-24 bg-rose-400/30 rounded-full blur-2xl"
        />
        
        {/* Popping Hearts Effect */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0, y: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0.5, 1.2, 0.8],
              y: -80 - Math.random() * 40,
              x: (Math.random() - 0.5) * 100
            }}
            transition={{ 
              duration: 2 + Math.random(), 
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeOut"
            }}
            className="absolute text-2xl"
          >
            {['💖', '💗', '💓', '💕', '✨'][i % 5]}
          </motion.div>
        ))}
      </div>

      <h1 className="text-3xl sm:text-4xl font-serif text-gray-800 mb-4">
        Welcome
      </h1>
      
      <div className="space-y-1 mb-8">
        <p className="text-gray-500 text-sm sm:text-base font-medium">
          Every story is beautiful, but ours is my favourite 💖
        </p>
        <p className="text-gray-400 text-xs sm:text-sm">
          Prove it's really you to see what's inside 🌸
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6 text-left">
        <div>
          <label className="block text-gray-600 text-sm font-semibold mb-2 ml-1">Lovable Name</label>
          <input 
            type="text" 
            placeholder="Enter Lovable Name..." 
            className="w-full px-5 py-4 rounded-2xl bg-[#f0e9e9] border-none focus:ring-2 focus:ring-pink-300 outline-none transition-all text-gray-700 placeholder:text-gray-400"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-gray-600 text-sm font-semibold mb-2 ml-1">
            Password <span className="text-pink-500 font-normal">(Date of Birthday)</span>
          </label>
          <input 
            type="text" 
            placeholder="DD-MM-YYYY" 
            className="w-full px-5 py-4 rounded-2xl bg-[#f0e9e9] border-none focus:ring-2 focus:ring-pink-300 outline-none transition-all text-gray-700 placeholder:text-gray-400"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
          />
          <button 
            type="button" 
            onClick={() => setError('Unn DOB theriyatha thendom')}
            className="text-pink-500 text-xs font-bold mt-3 ml-1 hover:underline"
          >
            Need a hint? 💝
          </button>
        </div>

        {error && <p className="text-red-500 text-xs font-medium text-center">{error}</p>}
        
        <button 
          type="submit"
          className="w-full bg-gradient-to-r from-[#e11d48] to-[#a855f7] text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
        >
          💖 Open My Heart
        </button>
      </form>
    </motion.div>
  );
};

const CakeScene = ({ onCut, onCakeCut }: { onCut: () => void, onCakeCut: () => void }) => {
  const [isCandleOff, setIsCandleOff] = useState(false);
  const [isCut, setIsCut] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cakeRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isCut) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setMousePos({ x: clientX, y: clientY });
  };

  const handleClick = () => {
    if (!isCandleOff) {
      setIsCandleOff(true);
      // Small poof of smoke effect could be added here or via CSS/Motion
      return;
    }
    
    if (!isCut) {
      setIsCut(true);
      onCakeCut(); // Trigger music change
      confetti({
        particleCount: 200,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#ff69b4', '#ff1493', '#ffc0cb', '#ffffff', '#ffd700']
      });
      setTimeout(onCut, 3500);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="text-center z-10 px-4 w-full max-w-lg mx-auto"
      onMouseMove={handleMouseMove}
      onTouchMove={handleMouseMove}
    >
      <h2 className="text-2xl sm:text-4xl font-bold text-white mb-8 sm:mb-16 drop-shadow-lg font-serif">
        {!isCandleOff ? "Make a Wish & Blow the Candle!" : "Now, Cut the Cake! ❤️"}
      </h2>
      
      <div 
        ref={cakeRef}
        className="relative cursor-none touch-none py-20" 
        onClick={handleClick}
      >
        {/* Realistic Cake Container */}
        <div className="relative w-64 h-48 sm:w-80 sm:h-56 mx-auto">
          
          {/* Left Half of Cake */}
          <motion.div 
            animate={isCut ? { x: -40, rotate: -5, opacity: 0.9 } : {}}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute inset-0 w-1/2 overflow-hidden z-20"
          >
            <div className="w-[200%] h-full bg-[#fce7f3] rounded-t-[4rem] border-b-[12px] border-pink-300 shadow-2xl relative">
              {/* Frosting Top */}
              <div className="absolute top-0 left-0 w-full h-12 bg-white rounded-t-[4rem] shadow-inner" />
              
              {/* Drip Effect */}
              <div className="absolute top-10 left-4 w-4 h-12 bg-white rounded-full" />
              <div className="absolute top-10 left-12 w-3 h-8 bg-white rounded-full" />
              <div className="absolute top-10 left-20 w-4 h-16 bg-white rounded-full" />
              
              {/* Middle Cream Layer */}
              <div className="absolute top-1/2 left-0 w-full h-4 bg-white/60 shadow-sm" />
              
              {/* Sprinkles */}
              <div className="absolute top-16 left-8 w-1.5 h-1.5 bg-pink-400 rounded-full" />
              <div className="absolute top-24 left-16 w-1.5 h-1.5 bg-blue-300 rounded-full" />
              <div className="absolute top-32 left-4 w-1.5 h-1.5 bg-yellow-300 rounded-full" />
              <div className="absolute top-20 left-24 w-1.5 h-1.5 bg-purple-400 rounded-full" />
              
              {/* Strawberries */}
              <div className="absolute top-4 left-1/4 w-8 h-10 bg-rose-500 rounded-full rotate-12 shadow-md">
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white/30 rounded-full" />
              </div>
              <div className="absolute top-6 left-1/2 w-8 h-10 bg-rose-400 rounded-full -rotate-12 shadow-md">
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white/30 rounded-full" />
              </div>

              {/* Bottom Cream Detail */}
              <div className="absolute bottom-0 left-0 w-full h-4 flex justify-around">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-8 h-8 bg-white rounded-full -mb-4 shadow-sm" />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Half of Cake */}
          <motion.div 
            animate={isCut ? { x: 40, rotate: 5, opacity: 0.9 } : {}}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute inset-0 left-1/2 w-1/2 overflow-hidden z-20"
          >
            <div className="w-[200%] h-full bg-[#fce7f3] rounded-t-[4rem] border-b-[12px] border-pink-300 shadow-2xl relative -left-full">
              {/* Frosting Top */}
              <div className="absolute top-0 left-0 w-full h-12 bg-white rounded-t-[4rem] shadow-inner" />
              
              {/* Drip Effect */}
              <div className="absolute top-10 left-[60%] w-4 h-14 bg-white rounded-full" />
              <div className="absolute top-10 left-[75%] w-3 h-10 bg-white rounded-full" />
              <div className="absolute top-10 left-[90%] w-4 h-12 bg-white rounded-full" />

              {/* Middle Cream Layer */}
              <div className="absolute top-1/2 left-0 w-full h-4 bg-white/60 shadow-sm" />
              
              {/* Sprinkles */}
              <div className="absolute top-18 left-[65%] w-1.5 h-1.5 bg-green-300 rounded-full" />
              <div className="absolute top-28 left-[80%] w-1.5 h-1.5 bg-orange-300 rounded-full" />
              <div className="absolute top-14 left-[95%] w-1.5 h-1.5 bg-pink-400 rounded-full" />
              
              {/* Strawberries */}
              <div className="absolute top-4 left-[60%] w-8 h-10 bg-rose-500 rounded-full -rotate-12 shadow-md">
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white/30 rounded-full" />
              </div>
              <div className="absolute top-6 left-[80%] w-8 h-10 bg-rose-400 rounded-full rotate-12 shadow-md">
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white/30 rounded-full" />
              </div>

              {/* Bottom Cream Detail */}
              <div className="absolute bottom-0 left-0 w-full h-4 flex justify-around">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-8 h-8 bg-white rounded-full -mb-4 shadow-sm" />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Candle (Centered) */}
          <AnimatePresence>
            {!isCut && (
              <motion.div 
                exit={{ opacity: 0, y: -20 }}
                className="absolute -top-16 left-1/2 -translate-x-1/2 z-30"
              >
                <AnimatePresence>
                  {!isCandleOff && (
                    <motion.div 
                      initial={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0, y: 20 }}
                      className="w-3 h-20 bg-gradient-to-b from-pink-100 to-pink-300 rounded-full mx-auto relative shadow-md"
                    >
                      {/* Flame */}
                      <AnimatePresence>
                        {!isCandleOff && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ 
                              opacity: [0.8, 1, 0.8],
                              scale: [1, 1.2, 1],
                              rotate: [-2, 2, -2]
                            }}
                            exit={{ opacity: 0, scale: 0, y: -10 }}
                            transition={{ repeat: Infinity, duration: 0.5 }}
                            className="absolute -top-6 left-1/2 -translate-x-1/2"
                          >
                            <div className="w-5 h-8 bg-orange-500 rounded-full blur-[2px]" />
                            <div className="w-3 h-5 bg-yellow-300 rounded-full absolute top-2 left-1/2 -translate-x-1/2" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Smoke Effect when blown out */}
                <AnimatePresence>
                  {isCandleOff && !isCut && (
                    <motion.div 
                      initial={{ opacity: 0, y: 0 }}
                      animate={{ opacity: [0, 0.5, 0], y: -40, x: [0, 10, -10, 5] }}
                      transition={{ duration: 2, ease: "easeOut" }}
                      className="absolute -top-10 left-1/2 -translate-x-1/2"
                    >
                      <div className="w-4 h-4 bg-gray-400/30 rounded-full blur-md" />
                      <div className="w-6 h-6 bg-gray-300/20 rounded-full blur-lg mt-2" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Plate */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[120%] h-12 bg-gradient-to-b from-white/80 to-gray-100/50 backdrop-blur-md rounded-[100%] shadow-xl z-10" />
        </div>

        {/* Realistic Knife (Follows Mouse) */}
        {isCandleOff && !isCut && (
          <motion.div 
            className="fixed pointer-events-none z-[100] hidden sm:block"
            style={{ 
              left: mousePos.x, 
              top: mousePos.y,
              x: '-50%',
              y: '-50%',
              rotate: -45
            }}
          >
            <div className="relative">
              {/* Blade */}
              <div className="w-32 h-6 bg-gradient-to-r from-gray-300 to-gray-100 rounded-r-full border-b-2 border-gray-400 shadow-lg" />
              {/* Handle */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full w-12 h-8 bg-amber-900 rounded-l-lg shadow-md" />
            </div>
          </motion.div>
        )}

        {/* Mobile Knife Hint */}
        {isCandleOff && !isCut && (
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="sm:hidden absolute top-0 left-1/2 -translate-x-1/2 text-white/80 font-bold flex flex-col items-center gap-2"
          >
            <ChevronRight className="rotate-90" size={32} />
            <span>Tap to Slice!</span>
          </motion.div>
        )}
        
        {/* Mobile Candle Hint */}
        {!isCandleOff && (
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="sm:hidden absolute top-0 left-1/2 -translate-x-1/2 text-white/80 font-bold flex flex-col items-center gap-2"
          >
            <Sparkles className="text-yellow-300" size={32} />
            <span>Tap to Blow!</span>
          </motion.div>
        )}
      </div>

      <p className="text-pink-100 text-lg sm:text-xl font-medium animate-pulse">
        {isCut ? "Delicious! ❤️" : !isCandleOff ? "Tap the candle to blow it out!" : "Now tap the cake to cut it!"}
      </p>
    </motion.div>
  );
};

const WishScene = ({ onNext, name }: { onNext: () => void, name: string }) => {
  useEffect(() => {
    const interval = setInterval(() => {
      confetti({
        particleCount: 40,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#ff0000', '#ffa500', '#ffff00', '#008000', '#0000ff', '#4b0082', '#ee82ee']
      });
      confetti({
        particleCount: 40,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#ff0000', '#ffa500', '#ffff00', '#008000', '#0000ff', '#4b0082', '#ee82ee']
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center z-10 p-4 sm:p-6"
    >
      <motion.div
        animate={{ 
          color: ['#ffff00', '#ffffff', '#ffff00', '#00ffff', '#ffff00'],
          scale: [1, 1.05, 1],
          textShadow: [
            '0 0 15px rgba(255,255,0,0.8)',
            '0 0 30px rgba(255,255,255,0.8)',
            '0 0 15px rgba(255,255,0,0.8)'
          ]
        }}
        transition={{ duration: 3, repeat: Infinity }}
        className="text-4xl sm:text-6xl md:text-8xl font-black mb-6 sm:mb-8 font-serif drop-shadow-[0_5px_15px_rgba(255,255,255,0.3)]"
      >
        Happy Birthday, Korangu Kutty❤️!
      </motion.div>
      
      <div className="text-lg sm:text-xl md:text-2xl text-white font-medium mb-10 sm:mb-12 max-w-3xl mx-auto leading-relaxed drop-shadow-md px-4 space-y-2">
        <p>Happy Birthday chello 💕</p>
        <p>You’re the most beautiful part of my life and my biggest happiness 🥰</p>
        <p>Every moment with you feels special, just like you ✨</p>
        <p>You make my life brighter and my heart happier every single day.</p>
        <p>I’m so lucky to have you by my side.</p>
        <p>May your day be filled with everything you dream of.</p>
        <p>I wish you endless joy, love, and laughter today and always 🎂💖</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button 
          onClick={() => {
            confetti({
              particleCount: 400,
              spread: 160,
              origin: { y: 0.6 },
              shapes: ['circle', 'square'],
              colors: ['#ff69b4', '#ff1493', '#ffc0cb', '#ffffff', '#ffd700']
            });
          }}
          className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-3.5 sm:px-10 sm:py-4 rounded-full font-bold text-lg sm:text-xl shadow-2xl hover:scale-105 active:scale-95 transition-transform flex items-center gap-3"
        >
          Tap for Surprise! <Sparkles size={20} />
        </button>
        
        <button 
          onClick={onNext}
          className="bg-white text-pink-600 px-8 py-3.5 sm:px-10 sm:py-4 rounded-full font-bold text-lg sm:text-xl shadow-2xl hover:scale-105 active:scale-95 transition-transform flex items-center gap-3"
        >
          See Our Memories <ChevronRight size={20} />
        </button>
      </div>
    </motion.div>
  );
};

const MemoriesScene = ({ onNext }: { onNext: () => void }) => {
  return (
    <div className="z-10 w-full max-w-4xl px-4 py-8">
      <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-10 sm:mb-12 font-serif">Our Journey</h2>
      
      <div className="space-y-6 sm:space-y-8">
        {MEMORIES.map((memory, index) => (
          <motion.div
            key={memory.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className={cn(
              "flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-white/90 backdrop-blur-sm p-5 sm:p-6 rounded-[2rem] shadow-xl",
              index % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse sm:text-right"
            )}
          >
            <div className="p-3 sm:p-4 bg-pink-50 rounded-2xl shadow-inner shrink-0">
              {memory.icon}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 my-1">{memory.title}</h3>
              <p className="text-gray-600 italic text-sm sm:text-base whitespace-pre-line">{memory.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 sm:mt-16 text-center">
        <button 
          onClick={onNext}
          className="bg-pink-500 text-white px-8 py-3.5 sm:px-10 sm:py-4 rounded-full font-bold text-lg sm:text-xl shadow-2xl hover:bg-pink-600 active:scale-95 transition-all flex items-center gap-3 mx-auto"
        >
          View Our Photos <Camera size={20} />
        </button>
      </div>
    </div>
  );
};

const GalleryScene = ({ onNext }: { onNext: () => void }) => {
  const [photos, setPhotos] = useState<FirestorePhoto[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    const q = query(collection(db, 'photos'), orderBy('createdAt', 'desc'));
    const unsubscribePhotos = onSnapshot(q, (snapshot) => {
      const photoData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirestorePhoto[];
      setPhotos(photoData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'photos');
    });

    return () => {
      unsubscribeAuth();
      unsubscribePhotos();
    };
  }, []);

  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;
    try {
      await deleteDoc(doc(db, 'photos', photoId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `photos/${photoId}`);
    }
  };

  return (
    <div className="z-10 w-full max-w-5xl px-4 py-8">
      <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-10 sm:mb-12 font-serif">Captured Moments</h2>
      
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {/* Default Photos (Your Drive Links) */}
          {PHOTOS.map((src, i) => (
            <motion.div
              key={`default-${i}`}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.03 }}
              className="aspect-square rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border-2 sm:border-4 border-white"
            >
              <img src={src} alt="Memory" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </motion.div>
          ))}

          {/* User Added Photos (from Database) */}
          {photos.map((photo) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.03 }}
              className="group relative aspect-square rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border-2 sm:border-4 border-white"
            >
              <img src={photo.url} alt="Memory" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              {user && user.uid === photo.addedBy && (
                <button 
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-12 sm:mt-16 text-center">
        <button 
          onClick={onNext}
          className="bg-white text-rose-500 px-8 py-3.5 sm:px-10 sm:py-4 rounded-full font-bold text-lg sm:text-xl shadow-2xl hover:scale-105 active:scale-95 transition-transform flex items-center gap-3 mx-auto"
        >
          A Special Letter <Send size={20} />
        </button>
      </div>
    </div>
  );
};

const LetterScene = ({ name }: { name: string }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="z-10 max-w-2xl w-[92vw] sm:w-full bg-[#fffcf5] p-8 sm:p-16 rounded-xl shadow-2xl relative border-l-[12px] sm:border-l-[20px] border-rose-200 mx-4"
    >
      <div className="absolute top-4 right-4 text-rose-300">
        <Heart fill="currentColor" size={24} />
      </div>
      
      <div className="font-serif text-gray-800 space-y-4 sm:space-y-6 text-base sm:text-lg leading-relaxed italic">
        <p className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-rose-600">Dear chella kutty ❤️,</p>
        
        <p>
          Even if you come to me like a mother and gently touch my head 🤍<br />
          I feel like I want to be born again in your lap 🥺
        </p>
        
        <p>
          You are the one who gave meaning to my life 💫<br />
          My days exist only because of you 🌸
        </p>
        
        <p>
          This is not love… it is not just desire ❤️🔥<br />
          This bond we share has no name in this world 🌍✨
        </p>
        
        <p>
          If you just look at me once and walk away 👀<br />
          My feet can’t even stand on the ground anymore 💔
        </p>
        
        <p>
          Melt into my heart 💞<br />
          Blend into my breath 🌬️<br />
          Like the stars in the sky ✨<br />
          Lift me up and make me shine 🌌
        </p>
        
        <p>
          If I pause and look at you 👀<br />
          Will you bloom like a little flower for me? 🌼
        </p>
        
        <p>
          If I say just one word 💬<br />
          All my pain disappears, my thango.... my chello 💞🥰
        </p>
        
        <div className="pt-8 sm:pt-12 text-right">
          <p className="text-lg sm:text-xl">With all my love,</p>
          <p className="text-2xl sm:text-3xl font-bold text-rose-600 mt-2">Forever Yours ❤️</p>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [scene, setScene] = useState<Scene>('login');
  const [userName, setUserName] = useState('');
  const [bgIndex, setBgIndex] = useState(0);
  const [isHeartRain, setIsHeartRain] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [songTitle, setSongTitle] = useState('Othaiyadi Pathayila');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const backgrounds = [
    'bg-[#fbcfe8]', // Soft pink background for login
    'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900',
    'bg-gradient-to-br from-rose-500 via-pink-500 to-orange-500',
    'bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600',
    'bg-gradient-to-br from-slate-900 to-rose-900',
    'bg-gradient-to-br from-amber-100 to-rose-200',
  ];

  const [audioError, setAudioError] = useState<string | null>(null);

  const playSong = (url: string, title: string) => {
    if (audioRef.current) {
      setAudioError(null);
      // If it's already the same song, just play it if paused
      if (audioRef.current.src === url) {
        if (audioRef.current.paused) {
          audioRef.current.play().catch(err => {
            if (err.name !== 'NotAllowedError') {
              console.error("Audio play failed (same song):", err);
              setAudioError("Failed to play audio. Please try again.");
            }
            setIsMusicPlaying(false);
          });
          setIsMusicPlaying(true);
        }
        return;
      }

      audioRef.current.pause();
      audioRef.current.src = url;
      audioRef.current.load();
      
      // Use a slightly longer timeout to allow source to initialize
      setTimeout(() => {
        const playPromise = audioRef.current?.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsMusicPlaying(true);
              setSongTitle(title);
              setAudioError(null);
            })
            .catch(err => {
              if (err.name === 'NotAllowedError') {
                // This is expected if no interaction has happened yet
                setIsMusicPlaying(false);
              } else {
                console.error("Audio play failed (new song):", err);
                setAudioError("Could not load this song. The link might be expired.");
                setIsMusicPlaying(false);
              }
            });
        }
      }, 200);
    }
  };

  // Stable music URLs (using placeholders that are more reliable than temporary download links)
  const MUSIC_URLS = {
    login: "https://www.masstamilan.dev/downloader/4Qvcd34-tre2Bj-fEBtgig/1775012287/d128_cdn/16979/MjQwMTo0OTAwOjYzNDA6ZDlmMjpiMDRiOjIwOTQ6Y2U2YTo0MmVl", // Othaiyadi Pathayila
    cake: "https://www.masstamilan.dev/downloader/_hzfHvf_n5nw-JCtPMmDbQ/1775012244/d128_cdn/9707/MjQwMTo0OTAwOjYzNDA6ZDlmMjpiMDRiOjIwOTQ6Y2U2YTo0MmVl", // Celebration Start
    memories: "https://www.masstamilan.dev/downloader/CUR03X7fGcPV7PwqH9xr1A/1774982128/d128_cdn/18351/MjQwOTo0MGY0OmFlOmYzMjU6ODAwMDo6", // Our Memories
    gallery: "https://www.masstamilan.dev/downloader/FsZIvycVgFZW_VN8msB5lw/1774982103/d128_cdn/8385/MjAwMTo0ODYwOjc6ODA1OjplNg==", // Gallery Moments
    birthday: "https://www.masstamilan.dev/downloader/hT1LW2GluN2_CoJNO5IZbA/1775012273/d128_cdn/9174/MjQwMTo0OTAwOjYzNDA6ZDlmMjpiMDRiOjIwOTQ6Y2U2YTo0MmVl", // Happy Birthday
  };

  useEffect(() => {
    let playInterval: any;
    
    const attemptPlay = () => {
      if (scene === 'login' && !isMusicPlaying) {
        playSong(MUSIC_URLS.login, 'Othaiyadi Pathayila');
      }
    };

    // Try immediately
    attemptPlay();

    // Retry every 1.5s in case of block/delay
    playInterval = setInterval(() => {
      if (!isMusicPlaying && scene === 'login') {
        attemptPlay();
      } else {
        clearInterval(playInterval);
      }
    }, 1500);

    // Fallback for browsers that block autoplay: play on first interaction
    const handleFirstInteraction = () => {
      if (scene === 'login' && !isMusicPlaying) {
        attemptPlay();
      }
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      clearInterval(playInterval);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      clearInterval(playInterval);
    };
  }, [scene]); // Removed isMusicPlaying from dependencies to avoid infinite loops

  useEffect(() => {
    const sceneToBg: Record<Scene, number> = {
      login: 0,
      cake: 1,
      wish: 2,
      memories: 3,
      gallery: 4,
      letter: 5,
    };
    setBgIndex(sceneToBg[scene]);
    
    // Auto-trigger heart rain on wish scene
    if (scene === 'wish') {
      setIsHeartRain(true);
    }

    // Handle Music Changes for Scenes
    if (scene === 'login') {
      playSong(MUSIC_URLS.login, 'Othaiyadi Pathayila');
    } else if (scene === 'cake') {
      playSong(MUSIC_URLS.cake, 'Celebration Start!');
    } else if (scene === 'memories') {
      playSong(MUSIC_URLS.memories, 'Our Memories Song');
    } else if (scene === 'gallery') {
      playSong(MUSIC_URLS.gallery, 'Gallery Moments Song');
    }
  }, [scene]);

  const handleBack = () => {
    const scenes: Scene[] = ['cake', 'wish', 'memories', 'gallery', 'letter'];
    const currentIndex = scenes.indexOf(scene);
    if (currentIndex > 0) {
      setScene(scenes[currentIndex - 1]);
    } else if (currentIndex === 0) {
      // If on cake, don't go back to login
      return;
    }
  };

  const handleCakeCut = () => {
    // Change to a celebratory birthday song after cake cutting
    playSong(MUSIC_URLS.birthday, 'Happy Birthday Celebration!');
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => console.log("Audio play failed:", err));
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  return (
    <div className={cn(
      "min-h-screen w-full flex flex-col items-center justify-center transition-colors duration-1000 overflow-x-hidden relative py-10",
      backgrounds[bgIndex]
    )}>
      <SparkleTrail />
      <FloatingHearts />
      <HeartRain active={isHeartRain} />
      
      {/* Background Music Indicator & Visualizer */}
      <div className="fixed top-4 sm:top-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-2">
        <button 
          onClick={toggleMusic}
          className={cn(
            "flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 backdrop-blur-md rounded-full text-white border border-white/10 transition-all relative",
            isMusicPlaying ? "bg-pink-500/40 shadow-lg shadow-pink-500/20" : "bg-white/20"
          )}
          title={songTitle}
        >
          <Music size={18} className={cn(isMusicPlaying && "animate-spin-slow")} />
          <div className="absolute -bottom-1 -right-1">
            {isMusicPlaying ? <Sparkles size={12} className="text-yellow-300" /> : <Lock size={10} className="text-white/50" />}
          </div>
        </button>
        
        {isMusicPlaying && (
          <div className="flex gap-1 h-4 items-end px-2">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ height: [4, 16, 8, 14, 6] }}
                transition={{ repeat: Infinity, duration: 0.5 + i * 0.1, ease: "easeInOut" }}
                className="w-1 bg-white/60 rounded-full"
              />
            ))}
          </div>
        )}
      </div>

      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef}
        src={MUSIC_URLS.login}
        loop
        preload="auto"
        onError={() => {
          console.error("Audio element error: failed to load source");
          setAudioError("The music link has expired. Please update it with a new one.");
          setIsMusicPlaying(false);
        }}
      />

      <AnimatePresence mode="wait">
        {scene === 'login' && (
          <div className="w-full flex flex-col items-center">
            <motion.div 
              key="login" 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full flex justify-center"
            >
              <Login onLogin={(name) => { 
                setUserName(name); 
                setScene('cake');
                // Trigger music immediately on user interaction
                playSong(MUSIC_URLS.cake, 'Celebration Start!');
              }} />
            </motion.div>
            
            {!isMusicPlaying && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => playSong(MUSIC_URLS.login, 'Othaiyadi Pathayila')}
                className="mt-6 px-6 py-3 bg-pink-500 text-white rounded-full shadow-lg shadow-pink-500/30 flex items-center gap-2 font-bold animate-bounce"
              >
                <Music size={18} />
                {audioError ? "Retry Music 🎵" : "Tap to Play Music 🎵"}
              </motion.button>
            )}

            {audioError && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-pink-600 text-sm font-medium text-center max-w-xs"
              >
                {audioError}
              </motion.p>
            )}
          </div>
        )}
        
        {scene === 'cake' && (
          <motion.div 
            key="cake" 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full flex justify-center"
          >
            <CakeScene onCut={() => setScene('wish')} onCakeCut={handleCakeCut} />
          </motion.div>
        )}

        {scene === 'wish' && (
          <motion.div 
            key="wish" 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full flex justify-center"
          >
            <WishScene name={userName} onNext={() => setScene('memories')} />
          </motion.div>
        )}

        {scene === 'memories' && (
          <motion.div 
            key="memories" 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full flex justify-center"
          >
            <MemoriesScene onNext={() => setScene('gallery')} />
          </motion.div>
        )}

        {scene === 'gallery' && (
          <motion.div 
            key="gallery" 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full flex justify-center"
          >
            <GalleryScene onNext={() => setScene('letter')} />
          </motion.div>
        )}

        {scene === 'letter' && (
          <motion.div 
            key="letter" 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full flex justify-center"
          >
            <LetterScene name={userName} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation for testing/skipping if needed */}
      {scene !== 'login' && (
        <div className="fixed bottom-4 sm:bottom-6 left-4 sm:left-6 flex gap-4 z-50">
          {scene !== 'cake' && (
            <button 
              onClick={handleBack}
              className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 active:scale-90 transition-all border border-white/10"
              title="Previous Page"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {scene === 'letter' && (
             <button 
             onClick={() => setIsHeartRain(!isHeartRain)}
             className={cn(
               "p-3 rounded-full transition-all border border-white/10",
               isHeartRain ? "bg-rose-500 text-white" : "bg-white/10 backdrop-blur-md text-white"
             )}
             title="Toggle Heart Rain"
           >
             <Heart size={20} fill={isHeartRain ? "currentColor" : "none"} />
           </button>
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(0.5) sepia(1) saturate(5) hue-rotate(300deg);
        }
      `}} />
    </div>
  );
}

