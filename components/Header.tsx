import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="w-full bg-white/90 backdrop-blur-sm dark:bg-[#2a1212]/90 border-b border-[#f5f0f0] dark:border-[#3a1d1d] px-4 py-3 sticky top-0 z-30">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-9 text-primary flex items-center justify-center rounded-lg bg-primary/10 group hover:bg-primary hover:text-white transition-colors cursor-pointer">
                        <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">auto_awesome</span>
                    </div>
                    <h2 className="text-lg font-extrabold leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-orange-600">
                        新春祝福
                    </h2>
                </div>
                <nav className="hidden md:flex items-center gap-8">
                    {['首页', '画廊', '关于'].map((item) => (
                        <a key={item} href="#" className="text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-primary transition-colors relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-primary hover:after:w-full after:transition-all">
                            {item}
                        </a>
                    ))}
                </nav>
                <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/30 hover:bg-red-700 hover:scale-105 active:scale-95 transition-all focus:ring-4 focus:ring-primary/20 outline-none">
                    <span className="truncate">登录</span>
                </button>
            </div>
        </header>
    );
};
