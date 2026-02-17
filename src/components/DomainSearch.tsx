import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useTldSuggestions, autoCompleteDomain } from '@/hooks/useTldSuggestions';
import { cn } from '@/lib/utils';

interface DomainSearchProps {
  domain: string;
  setDomain: (domain: string) => void;
  onSearch: () => void;
  loading: boolean;
}

const DomainSearch = ({ domain, setDomain, onSearch, loading }: DomainSearchProps) => {
  const { t } = useLanguage();
  const { allTlds, getSuggestions } = useTldSuggestions();

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isComposing, setIsComposing] = useState(false);
  const [rawInput, setRawInput] = useState(domain);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const cleanDomain = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[，。]/g, '.')
      .replace(/[, ]+/g, '.')
      .replace(/\.{2,}/g, '.')
      .replace(/[^a-z0-9.-]/g, '');

  useEffect(() => {
    if (isComposing || !domain.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      setSuggestions(getSuggestions(domain));
      setSelectedIndex(-1);
    }, 120);

    return () => clearTimeout(timer);
  }, [domain, getSuggestions, isComposing]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        !inputRef.current?.contains(e.target as Node) &&
        !suggestionsRef.current?.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    if (!domain.trim() && !rawInput.trim()) return;

    let final = cleanDomain(domain || rawInput);
    setDomain(final);
    setRawInput(final);

    const completed = autoCompleteDomain(final, allTlds);
    if (completed !== final) {
      setDomain(completed);
      setRawInput(completed);
    }

    setShowSuggestions(false);
    setTimeout(onSearch, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (loading) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowSuggestions(true);
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showSuggestions && selectedIndex >= 0) {
        const chosen = suggestions[selectedIndex];
        setDomain(chosen);
        setRawInput(chosen);
        setShowSuggestions(false);
      } else {
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === 'Tab' && showSuggestions && suggestions.length > 0) {
      e.preventDefault();
      const idx = selectedIndex >= 0 ? selectedIndex : 0;
      const chosen = suggestions[idx];
      setDomain(chosen);
      setRawInput(chosen);
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRawInput(value);
    setShowSuggestions(true);

    if (!isComposing) {
      setDomain(cleanDomain(value));
    }
  };

  const handleCompositionStart = () => setIsComposing(true);

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    const cleaned = cleanDomain(e.currentTarget.value);
    setDomain(cleaned);
    setRawInput(cleaned);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setDomain(suggestion);
    setRawInput(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    if (domain.trim() && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const highlightMatch = (suggestion: string) => {
    const input = domain.toLowerCase().trim();
    const suggestionLower = suggestion.toLowerCase();

    if (input.includes('.')) {
      const parts = input.split('.');
      const tldPart = parts[parts.length - 1];

      const dotIndex = suggestion.indexOf('.');
      if (dotIndex !== -1) {
        const suggestionTld = suggestion.slice(dotIndex + 1);
        const matchLength = tldPart.length;

        return (
          <>
            <span className="text-muted-foreground">{suggestion.slice(0, dotIndex + 1)}</span>
            <span className="text-foreground font-medium">{suggestionTld.slice(0, matchLength)}</span>
            <span className="text-muted-foreground">{suggestionTld.slice(matchLength)}</span>
          </>
        );
      }
    }

    const matchIndex = suggestionLower.indexOf(input);
    if (matchIndex !== -1) {
      return (
        <>
          <span className="text-foreground font-medium">{suggestion.slice(0, input.length)}</span>
          <span className="text-muted-foreground">{suggestion.slice(input.length)}</span>
        </>
      );
    }

    return <span className="text-muted-foreground">{suggestion}</span>;
  };

  return (
    <div className="relative flex gap-2">
      <div className="relative flex-1">
        <Input
          ref={inputRef}
          id="domain"
          type="text"
          placeholder={t('search.placeholder')}
          value={isComposing ? rawInput : domain}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          className="w-full"
          disabled={loading}
          autoComplete="off"
        />

        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 overflow-hidden"
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  "px-3 py-2 cursor-pointer text-sm transition-colors",
                  "hover:bg-accent",
                  index === selectedIndex && "bg-accent"
                )}
              >
                {highlightMatch(suggestion)}
              </div>
            ))}
            <div className="px-3 py-1.5 text-xs text-muted-foreground border-t border-border bg-muted/30">
              ↑↓ 选择 · Tab/Enter 确认 · Esc 关闭
            </div>
          </div>
        )}
      </div>

      <Button onClick={handleSearch} disabled={loading} className="min-w-[72px]">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('search.button')}
      </Button>
    </div>
  );
};

export default DomainSearch;
