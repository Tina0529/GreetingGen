import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { generateGreeting, generateCardImage, generateSpeech } from './services/geminiService';
import { GreetingConfig, StyleOption } from './types';

const Header = lazy(() => import('./components/Header').then(m => ({ default: m.Header })));
const Lantern = lazy(() => import('./components/Lantern').then(m => ({ default: m.Lantern })));

const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center h-20">
    <div className="animate-pulse text-primary">
      <span className="material-symbols-outlined text-3xl">hourglass_empty</span>
    </div>
  </div>
);

// Simple confetti component
const Confetti: React.FC<{ active: boolean }> = ({ active }) => {
    if (!active) return null;
    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {[...Array(50)].map((_, i) => (
                <div key={i} className="absolute animate-fall" style={{
                    left: `${Math.random() * 100}%`,
                    top: `-5%`,
                    animationDuration: `${Math.random() * 3 + 2}s`,
                    animationDelay: `${Math.random() * 2}s`
                }}>
                    <div className="text-xl transform rotate-45">
                        {['🧧', '🌸', '✨', '🏮'][Math.floor(Math.random() * 4)]}
                    </div>
                </div>
            ))}
        </div>
    );
};

// Helper to get text styles
const getTextStyle = (style: StyleOption) => {
    switch (style) {
        case StyleOption.Elegant:
            return {
                titleFont: 'font-serif-cn',
                bodyFont: 'font-serif-cn',
                color: 'text-[#F5E6D3]', // Light parchment
                titleColor: 'text-[#D4AF37]', // Gold
                shadow: 'drop-shadow-md',
                container: 'bg-black/60 border-white/10'
            };
        case StyleOption.Creative:
            return {
                titleFont: 'font-calligraphy',
                bodyFont: 'font-cursive-cn',
                color: 'text-white',
                titleColor: 'text-red-500', 
                shadow: 'drop-shadow-xl text-shadow-glow', 
                container: 'bg-white/90 border-red-900/20'
            };
        case StyleOption.Intimate:
            return {
                titleFont: 'font-handwritten',
                bodyFont: 'font-handwritten',
                color: 'text-[#FFF5F5]',
                titleColor: 'text-[#FFD700]',
                shadow: 'drop-shadow-sm',
                container: 'bg-red-900/40 border-pink-200/20'
            };
        case StyleOption.Colloquial:
        default:
            return {
                titleFont: 'font-display',
                bodyFont: 'font-sans',
                color: 'text-white',
                titleColor: 'text-[#FFD700]',
                shadow: 'drop-shadow-lg',
                container: 'bg-black/40 border-white/20'
            };
    }
};

const App: React.FC = () => {
    const [hasKey, setHasKey] = useState(false);
    const [config, setConfig] = useState<GreetingConfig>({
        recipient: '家人',
        style: StyleOption.Elegant,
        length: 60,
        customText: ''
    });

    const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
    const [resultText, setResultText] = useState<string | null>(null);
    const [bgImage, setBgImage] = useState<string | null>(null);
    const [audioData, setAudioData] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    
    // Audio context ref
    const audioContextRef = useRef<AudioContext | null>(null);

    // API Key Check
    useEffect(() => {
        const checkKey = async () => {
            const aistudio = (window as any).aistudio;
            if (aistudio && aistudio.hasSelectedApiKey) {
                const selected = await aistudio.hasSelectedApiKey();
                setHasKey(selected);
            } else {
                // If not running in the specific environment, assume key is present via .env
                setHasKey(true);
            }
        };
        checkKey();
    }, []);

    const handleSelectKey = async () => {
        const aistudio = (window as any).aistudio;
        if (aistudio && aistudio.openSelectKey) {
            await aistudio.openSelectKey();
            // Race condition mitigation: assume success
            setHasKey(true);
        }
    };

    const handleGenerate = async () => {
        setStatus('generating');
        setResultText(null);
        setAudioData(null);
        setIsPlaying(false);

        let hasError = false;
        let generatedText = '';

        // 文字生成 - 核心功能
        try {
            generatedText = await generateGreeting(config);
            setResultText(generatedText);
        } catch (e: any) {
            console.error("Text generation failed:", e);
            hasError = true;
            const errorMsg = e.message || JSON.stringify(e);
            if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("403") || errorMsg.includes("PERMISSION_DENIED") || errorMsg.includes("API key not valid")) {
                setHasKey(false);
                alert("API Key 验证失败，请检查您的 API Key。");
                setStatus('error');
                return;
            }
            alert("文字生成失败: " + errorMsg);
        }

        // 图片生成 - 独立处理，失败不影响文字显示
        try {
            const image = await generateCardImage(config.style);
            if (image) setBgImage(image);
        } catch (e: any) {
            console.error("Image generation failed (using default background):", e);
            // 图片失败时不中断流程，使用默认背景
        }

        // 语音生成 - 异步处理
        if (generatedText) {
            generateSpeech(generatedText).then(audio => {
                if (audio) setAudioData(audio);
            }).catch(e => {
                console.error("Speech generation failed:", e);
            });
        }

        if (!hasError && generatedText) {
            setStatus('success');
            setTimeout(() => setStatus('idle'), 5000);
        } else {
            setStatus('error');
        }
    };

    const playAudio = async () => {
        if (!audioData || isPlaying) return;
        
        try {
            setIsPlaying(true);
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
            }
            const ctx = audioContextRef.current;
            
            const binaryString = atob(audioData);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            const dataInt16 = new Int16Array(bytes.buffer);
            const frameCount = dataInt16.length; 
            const buffer = ctx.createBuffer(1, frameCount, 24000);
            const channelData = buffer.getChannelData(0);
            for (let i = 0; i < frameCount; i++) {
                channelData[i] = dataInt16[i] / 32768.0;
            }

            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.onended = () => setIsPlaying(false);
            source.start(0);

        } catch (e) {
            console.error("Audio playback failed", e);
            setIsPlaying(false);
        }
    };

    const handleCopy = () => {
        if (resultText) {
            navigator.clipboard.writeText(resultText);
            alert("已复制到剪贴板！");
        }
    };

    // --- Key Selection Screen ---
    if (!hasKey) {
        return (
            <>
                <Suspense fallback={<LoadingFallback />}>
                    <div className="fixed inset-0 bg-background-light dark:bg-background-dark flex items-center justify-center z-50 p-4">
                         <Lantern type="fu" className="absolute top-0 left-8 z-40" />
                         <Lantern type="chun" className="absolute top-0 right-8 z-40" delay />
                     
                     <div className="max-w-md w-full bg-white dark:bg-[#2a1212] rounded-3xl p-8 shadow-2xl border border-red-100 dark:border-red-900/30 text-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: "radial-gradient(#d92828 1px, transparent 1px)", backgroundSize: "24px 24px" }}></div>
                        
                        <div className="relative z-10 flex flex-col items-center gap-6">
                            <div className="size-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-2 animate-float">
                                <span className="material-symbols-outlined text-4xl text-primary">diamond</span>
                            </div>
                            
                            <div>
                                <h2 className="text-2xl font-black text-[#181111] dark:text-white mb-3">开启 Pro 级体验</h2>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                                    本应用使用 <strong>Gemini 3 Pro Image</strong> 模型为您生成极致画质的新春贺卡。此模型需要连接您的 Google Cloud API Key。
                                </p>
                            </div>

                            <button 
                                onClick={handleSelectKey}
                                className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">key</span>
                                连接 API Key
                            </button>

                            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline font-bold">
                                了解关于 API 计费的信息
                            </a>
                        </div>
                     </div>
                </div>
                </Suspense>
            </>
        );
    }

    const textStyles = getTextStyle(config.style);

    return (
        <>
            <style>{`
                @keyframes fall {
                    0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
                }
                .animate-fall { animation: fall linear forwards; }
                .text-shadow-glow { text-shadow: 0 0 10px rgba(255,0,0,0.5); }
                /* Custom Scrollbar for the preview text area */
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 4px; }
            `}</style>

            <Confetti active={status === 'success'} />
            <Suspense fallback={<LoadingFallback />}>
                <Lantern type="fu" className="hidden lg:block absolute top-0 left-8 z-40" />
                <Lantern type="chun" className="hidden lg:block absolute top-0 right-8 z-40" delay />
            </Suspense>

            <Suspense fallback={<LoadingFallback />}>
                <Header />
            </Suspense>

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 md:py-12 flex flex-col items-center z-10">
                {/* Hero Section */}
                <div className="w-full max-w-4xl text-center mb-10 relative">
                    <div className="absolute -top-10 -right-10 w-24 h-24 opacity-20 pointer-events-none animate-pulse-slow">
                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <path d="M50 0 L50 20 M50 80 L50 100 M0 50 L20 50 M80 50 L100 50 M15 15 L29 29 M71 71 L85 85 M15 85 L29 71 M71 29 L85 15" stroke="#d92828" strokeWidth="2"></path>
                        </svg>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-bold uppercase tracking-wider mb-4 border border-red-100 dark:border-red-900/50 shadow-sm">
                        <img src="/icon-celebration.png" alt="" className="w-5 h-5 object-contain" /> 2026 骏马腾飞
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight mb-4 text-[#181111] dark:text-white drop-shadow-sm">
                        定制完美的 <span className="text-primary relative inline-block">新春祝福
                            <svg className="absolute -bottom-2 w-full h-3 text-primary opacity-40 left-0" preserveAspectRatio="none" viewBox="0 0 100 10">
                                <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="3"></path>
                            </svg>
                        </span>
                    </h1>
                    <p className="text-lg text-[#666] dark:text-[#aaa] max-w-2xl mx-auto leading-relaxed">
                        AI 生成定制文案、<span className="text-primary font-bold">Pro级质感绘图</span>与语音祝福。让您的心意在指尖传递。
                    </p>
                </div>

                {/* Main Card */}
                <div className="w-full max-w-6xl bg-white dark:bg-[#2a1212] rounded-2xl shadow-2xl shadow-red-900/5 border border-[#e6dbdb] dark:border-[#3a1d1d] overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
                        
                        {/* LEFT: Config Panel */}
                        <div className="lg:col-span-7 p-6 md:p-8 lg:p-10 flex flex-col justify-between">
                            <div className="flex flex-col gap-8">
                                <div className="flex items-center justify-between border-b border-[#f5f0f0] dark:border-[#3a1d1d] pb-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                                        <span className="material-symbols-outlined text-primary">tune</span> 
                                        精心定制您的新年祝福
                                    </h3>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <label className="flex flex-col gap-2 group">
                                        <span className="text-sm font-bold text-[#181111] dark:text-[#eee] flex items-center gap-1">节日</span>
                                        <div className="relative transition-transform duration-200 focus-within:scale-[1.02]">
                                            <img src="/icon-celebration.png" alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 object-contain" />
                                            <input className="w-full pl-10 h-12 bg-background-light dark:bg-[#221010] border border-transparent rounded-xl text-[#181111] dark:text-white font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-not-allowed opacity-80" readOnly type="text" value="农历新年 (马年)" />
                                        </div>
                                    </label>
                                    <label className="flex flex-col gap-2 group">
                                        <div className="flex justify-between">
                                            <span className="text-sm font-bold text-[#181111] dark:text-[#eee]">接收对象</span>
                                        </div>
                                        <div className="relative transition-transform duration-200 focus-within:scale-[1.02]">
                                            <img src="/icon-recipient.png" alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 object-contain" />
                                            <select 
                                                value={config.recipient}
                                                onChange={(e) => setConfig({...config, recipient: e.target.value})}
                                                className="w-full pl-10 h-12 bg-white dark:bg-[#331818] border border-[#e6dbdb] dark:border-[#4a2b2b] rounded-xl text-[#181111] dark:text-white font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer hover:border-primary/50 transition-colors"
                                            >
                                                <option>家人</option>
                                                <option>朋友</option>
                                                <option>同事</option>
                                                <option>长辈</option>
                                                <option>商业伙伴</option>
                                                <option>爱人</option>
                                            </select>
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#8a6060] pointer-events-none">expand_more</span>
                                        </div>
                                    </label>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <span className="text-sm font-bold text-[#181111] dark:text-[#eee] flex items-center gap-2"><img src="/icon-style.png" alt="" className="w-5 h-5 object-contain" />祝福风格 (同时决定字体与绘图风格)</span>
                                    <div className="flex flex-wrap gap-3">
                                        {[
                                            { val: StyleOption.Creative, icon: 'brush', label: '文采斐然' },
                                            { val: StyleOption.Elegant, icon: 'landscape', label: '古风典雅' },
                                            { val: StyleOption.Colloquial, icon: 'celebration', label: '通俗口语' },
                                            { val: StyleOption.Intimate, icon: 'favorite', label: '亲密温馨' },
                                        ].map((opt) => (
                                            <label key={opt.val} className="cursor-pointer group relative">
                                                <input 
                                                    type="radio" 
                                                    name="style" 
                                                    className="peer sr-only" 
                                                    checked={config.style === opt.val}
                                                    onChange={() => setConfig({...config, style: opt.val})}
                                                />
                                                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-background-light dark:bg-[#331818] border border-transparent peer-checked:bg-red-50 peer-checked:border-primary peer-checked:text-primary dark:peer-checked:bg-red-900/20 hover:bg-white hover:shadow-md hover:-translate-y-0.5 dark:hover:bg-[#3d2020] transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/50">
                                                    <span className="material-symbols-outlined text-[20px]">{opt.icon}</span>
                                                    <span className="text-sm font-bold">{opt.label}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 p-5 rounded-xl bg-background-light dark:bg-[#221010]/50 border border-transparent focus-within:border-primary/30 focus-within:bg-white dark:focus-within:bg-[#221010] transition-all duration-300 shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-[#181111] dark:text-[#eee] flex items-center gap-2"><img src="/icon-length.png" alt="" className="w-5 h-5 object-contain" />篇幅长度</span>
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary text-sm">equalizer</span>
                                            <span className="text-sm font-bold text-primary">约 {config.length} 字</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={() => setConfig({...config, length: Math.max(20, config.length - 10)})}
                                            className="size-9 flex items-center justify-center rounded-full bg-white dark:bg-[#331818] border border-[#e6dbdb] dark:border-[#4a2b2b] text-[#666] hover:text-primary hover:border-primary transition-all"
                                        >
                                            <span className="material-symbols-outlined text-lg">remove</span>
                                        </button>
                                        <input 
                                            type="range" 
                                            min="20" 
                                            max="150" 
                                            value={config.length}
                                            onChange={(e) => setConfig({...config, length: parseInt(e.target.value)})}
                                            className="w-full appearance-none bg-transparent focus:outline-none z-10" 
                                        />
                                        <button 
                                            onClick={() => setConfig({...config, length: Math.min(150, config.length + 10)})}
                                            className="size-9 flex items-center justify-center rounded-full bg-white dark:bg-[#331818] border border-[#e6dbdb] dark:border-[#4a2b2b] text-[#666] hover:text-primary hover:border-primary transition-all"
                                        >
                                            <span className="material-symbols-outlined text-lg">add</span>
                                        </button>
                                    </div>
                                </div>

                                <label className="flex flex-col gap-2">
                                    <span className="text-sm font-bold text-[#181111] dark:text-[#eee] flex items-center gap-2"><img src="/icon-custom.png" alt="" className="w-5 h-5 object-contain" />专属定制 (可选)</span>
                                    <textarea 
                                        value={config.customText}
                                        onChange={(e) => setConfig({...config, customText: e.target.value})}
                                        className="w-full p-4 bg-white dark:bg-[#331818] border border-[#e6dbdb] dark:border-[#4a2b2b] rounded-xl text-[#181111] dark:text-white font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none h-28 placeholder:text-[#8a6060]/50 transition-shadow invalid:border-primary invalid:animate-shake" 
                                        placeholder="添加姓名、特定祝福（如身体健康、财源广进）或只有你们懂的梗..."
                                    ></textarea>
                                </label>
                            </div>

                            <div className="flex flex-col gap-6 pt-8 mt-6 border-t border-[#f5f0f0] dark:border-[#3a1d1d]">
                                <button 
                                    onClick={handleGenerate}
                                    disabled={status === 'generating'}
                                    className={`group w-full h-14 bg-gradient-to-r from-primary to-red-600 text-white text-lg font-bold rounded-full shadow-xl shadow-red-600/30 hover:shadow-red-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 focus:ring-4 focus:ring-primary/30 outline-none relative overflow-hidden ${status === 'generating' ? 'opacity-75 cursor-wait' : ''}`}
                                >
                                    <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full"></span>
                                    <span className={`material-symbols-outlined relative z-10 ${status === 'generating' ? 'animate-spin' : 'animate-pulse'}`}>
                                        {status === 'generating' ? 'sync' : 'stars'}
                                    </span>
                                    <span className="relative z-10">
                                        {status === 'generating' ? 'AI 正在创作 (Pro版绘图)...' : '一键生成祝福'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* RIGHT: Preview Panel */}
                        <div className="lg:col-span-5 relative bg-gradient-to-br from-[#fcfcfc] to-[#fff5f5] dark:from-[#1a0a0a] dark:to-[#221010] flex flex-col items-center justify-center p-8 min-h-[500px] lg:min-h-auto border-l border-[#f5f0f0] dark:border-[#3a1d1d]">
                            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: "radial-gradient(#d92828 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>

                            <div className="relative z-10 w-full max-w-[340px] flex flex-col gap-8 items-center text-center">
                                {/* The Card/Image */}
                                <div className={`w-full aspect-[4/5] bg-white dark:bg-[#331818] rounded-2xl shadow-2xl shadow-red-900/10 border-4 border-white dark:border-[#4a2b2b] p-2 flex flex-col items-center relative overflow-hidden group hover:shadow-3xl hover:shadow-red-900/20 transition-all duration-500 animate-float ${resultText ? '' : 'justify-center'}`}>
                                    <div className="absolute inset-2 rounded-xl overflow-hidden bg-gray-100">
                                        {/* Background Image */}
                                        <div 
                                            className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-[2s] group-hover:scale-110 ease-out" 
                                            style={{ 
                                                backgroundImage: `url('${bgImage || "/horse-year-2026-bg.png"}')` 
                                            }} 
                                        ></div>
                                        
                                        {/* Overlay Gradient (Dynamic) */}
                                        <div className={`absolute inset-0 z-10 ${textStyles.container === 'bg-white/90 border-red-900/20' ? 'bg-white/80' : 'bg-gradient-to-b from-black/10 via-black/30 to-black/80'}`}></div>

                                        {/* Content Layer */}
                                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6">
                                             {!resultText ? (
                                                <div className="relative z-20 text-white flex flex-col items-center gap-4 animate-pulse">
                                                    <div className="size-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-lg">
                                                        <span className="material-symbols-outlined text-3xl text-white drop-shadow-md">visibility</span>
                                                    </div>
                                                    <div className="px-4 py-1.5 rounded-full bg-black/30 backdrop-blur-sm border border-white/10">
                                                        <p className="text-sm font-bold tracking-wide text-white">实时预览</p>
                                                    </div>
                                                </div>
                                             ) : (
                                                <div className="w-full h-full flex flex-col justify-end overflow-y-auto custom-scrollbar pb-4 relative z-30">
                                                    {/* Text Container */}
                                                    <div className={`p-4 rounded-xl backdrop-blur-sm border transition-all duration-500 ${textStyles.container}`}>
                                                        <h4 className={`text-2xl mb-4 tracking-widest text-center ${textStyles.titleFont} ${textStyles.titleColor} ${textStyles.shadow}`}>
                                                            {config.style === StyleOption.Elegant ? '新春大吉' : 
                                                             config.style === StyleOption.Creative ? '福蛇迎春' : 
                                                             config.style === StyleOption.Intimate ? '幸福安康' : '恭喜发财'}
                                                        </h4>
                                                        <p className={`text-lg leading-loose text-justify whitespace-pre-wrap ${textStyles.bodyFont} ${textStyles.color} ${textStyles.shadow}`}>
                                                            {resultText}
                                                        </p>
                                                    </div>
                                                </div>
                                             )}
                                        </div>
                                    </div>
                                </div>

                                {/* Status/Action Text */}
                                {resultText ? (
                                    <div className="flex gap-2 w-full justify-center">
                                        <button onClick={handleCopy} className="flex-1 flex items-center justify-center gap-2 text-sm text-primary font-bold bg-white/80 hover:bg-white dark:bg-black/40 px-4 py-3 rounded-full backdrop-blur-sm shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer border border-primary/10">
                                            <span className="material-symbols-outlined text-lg">content_copy</span>
                                            复制
                                        </button>
                                        {audioData && (
                                            <button 
                                                onClick={playAudio} 
                                                disabled={isPlaying}
                                                className="flex-1 flex items-center justify-center gap-2 text-sm text-white font-bold bg-primary hover:bg-red-700 px-4 py-3 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <span className={`material-symbols-outlined text-lg ${isPlaying ? 'animate-pulse' : ''}`}>
                                                    {isPlaying ? 'volume_up' : 'play_circle'}
                                                </span>
                                                {isPlaying ? '播放中' : '听祝福'}
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-sm text-[#8a6060] font-medium bg-white/50 dark:bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
                                        <span className="material-symbols-outlined text-lg animate-spin-slow">sync</span>
                                        {status === 'generating' ? 'AI 正在思考中...' : '输入信息以预览效果...'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="w-full py-8 text-center border-t border-[#f5f0f0] dark:border-[#3a1d1d] mt-auto bg-white dark:bg-[#2a1212]">
                <p className="text-xs text-[#8a6060] flex items-center justify-center gap-1 font-medium">
                    <span>© 2026 马年大吉.</span>
                    <span className="text-primary font-bold">Powered by Gemini Pro Vision.</span>
                </p>
            </footer>
        </>
    );
};

export default App;