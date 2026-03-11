import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  const isHe = navigator.language.startsWith('he');

  return (
    <div className="relative group">
      <div className="absolute top-0 bottom-0 flex items-center px-4 text-white/20 group-hover:text-cyan-400 transition-colors">
        <Search size={16} />
      </div>
      <input 
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full bg-[#0a0a0a] border border-white/10 rounded-2xl py-3.5 
          ${isHe ? 'pr-11 pl-4' : 'pl-11 pr-4'} 
          outline-none focus:border-cyan-500/50 hover:border-white/20 
          transition-all text-sm font-medium text-white placeholder-white/20 shadow-lg
        `}
        placeholder={placeholder || (isHe ? 'חיפוש...' : 'Search...')}
        dir="auto"
      />
    </div>
  );
}
