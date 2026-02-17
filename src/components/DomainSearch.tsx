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

function cleanDomainInput(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[，。]/g, '.')
    .replace(/[, ]+/g, '.')
    .replace(/\.{2,}/g, '.')
    .replace(/[^a-z0-9.-]/g, '');
}

const DomainSearch = ({
  domain,
  setDomain,
  onSearch,
  loading,
}: DomainSearchProps) => {
  const { t } = useLanguage();
  const { allTlds, getSuggestions } = useTldSuggestions();

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [show, setShow] = useState(false);
  const [index, setIndex] = useState(-1);
  const [isComposing, setIsComposing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isComposing) return;

    const id = setTimeout(() => {
      if (!domain.trim()) {
        setSuggestions([]);
        return;
      }
      setSuggestions(getSuggestions(domain));
      setIndex(-1);
    }, 80);

    return () => clearTimeout(id);
  }, [domain, getSuggestions, isComposing]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (
        !inputRef.current?.contains(e.target as Node) &&
        !boxRef.current?.contains(e.target as Node)
      ) setShow(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleSearch = () => {
    let cleaned = cleanDomainInput(domain);
    if (!cleaned) return;
    cleaned = autoCompleteDomain(cleaned, allTlds);
    setDomain(cleaned);
    setShow(false);
    setTimeout(onSearch, 0);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (loading) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShow(true);
      setIndex(i => Math.min(i + 1, suggestions.length - 1));
    }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex(i => Math.max(i - 1, 0));
    }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (show && index >= 0) {
        setDomain(suggestions[index]);
        setShow(false);
      } else {
        handleSearch();
      }
    }
    else if (e.key === 'Escape') setShow(false);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cleaned = cleanDomainInput(raw);
    setDomain(cleaned);
    setShow(true);
  };

  const choose = (s: string) => {
    setDomain(s);
    setShow(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex gap-2">
      <div className="relative flex-1">
        <Input
          ref={inputRef}
          value={domain}
          placeholder={t('search.placeholder')}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={() => suggestions.length && setShow(true)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={(e) => {
            setIsComposing(false);
            setDomain(cleanDomainInput(e.currentTarget.value));
          }}
          autoComplete="off"
          disabled={loading}
        />

        {show && suggestions.length > 0 && (
          <div
            ref={boxRef}
            className="
              absolute top-full left-0 right-0 mt-1
              bg-popover border rounded-xl
              shadow-xl z-50 overflow-hidden
            "
          >
            {suggestions.slice(0, 8).map((s, i) => (
              <div
                key={s}
                onClick={() => choose(s)}
                className={cn(
                  "px-3 py-2 text-sm cursor-pointer",
                  "hover:bg-accent transition",
                  i === index && "bg-accent"
                )}
              >
                {s}
              </div>
            ))}

            <div className="px-3 py-1.5 text-xs text-muted-foreground border-t bg-muted/30">
              ↑↓ 选择 · Enter 搜索 · Esc 关闭
            </div>
          </div>
        )}
      </div>

      <Button
        onClick={handleSearch}
        disabled={loading}
        className="min-w-[72px]"
      >
        {loading
          ? <Loader2 className="h-4 w-4 animate-spin"/>
          : t('search.button')}
      </Button>
    </div>
  );
};

export default DomainSearch;
