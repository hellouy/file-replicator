import { useState, useEffect, useRef } from 'react';
import { Clock, Trash2, CheckCircle2, XCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import DomainFavicon from './DomainFavicon';

// 定义明确的状态类型
type QueryStatus = 'registered' | 'available' | 'failed';

interface RecentQuery {
  domain: string;
  timestamp: number;
  status: QueryStatus;
}

interface RecentQueriesProps {
  onSelectDomain: (domain: string) => void;
  refreshTrigger?: number;
}

const STORAGE_KEY = 'recent_domain_queries';

/** 智能保存逻辑：确保状态准确 */
export const addRecentQuery = (domain: string, status: QueryStatus = 'failed') => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let queries: RecentQuery[] = stored ? JSON.parse(stored) : [];

    // 去重并置顶最新记录
    queries = queries.filter(q => q.domain.toLowerCase() !== domain.toLowerCase());
    queries.unshift({
      domain: domain.toLowerCase(),
      timestamp: Date.now(),
      status,
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(queries.slice(0, 30)));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('LocalStorage Save Error', e);
  }
};

const RecentQueries = ({ onSelectDomain, refreshTrigger }: RecentQueriesProps) => {
  const [queries, setQueries] = useState<RecentQuery[]>([]);
  const { language } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadQueries = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setQueries(stored ? JSON.parse(stored) : []);
    } catch {
      setQueries([]);
    }
  };

  useEffect(() => {
    loadQueries();
    window.addEventListener('storage', loadQueries);
    return () => window.removeEventListener('storage', loadQueries);
  }, [refreshTrigger]);

  const handleDelete = (domain: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = queries.filter(q => q.domain !== domain);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setQueries(updated);
  };

  const handleClearAll = () => {
    if (confirm(language === 'zh' ? '确定清空所有查询历史？' : 'Clear all search history?')) {
      localStorage.removeItem(STORAGE_KEY);
      setQueries([]);
    }
  };

  if (queries.length === 0) return null;

  return (
    <div className="w-full space-y-3 py-4 animate-in fade-in slide-in-from-bottom-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold tracking-tight">
            {language === 'zh' ? '最近查询' : 'Recent'} 
            <span className="ml-2 text-xs font-normal text-muted-foreground">{queries.length}</span>
          </h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleClearAll}
          className="h-7 text-[11px] text-muted-foreground hover:text-destructive"
        >
          {language === 'zh' ? '清空全部' : 'Clear All'}
        </Button>
      </div>

      {/* 响应式容器：手机端横滑，桌面端网格 */}
      <div 
        ref={scrollRef}
        className={cn(
          "flex overflow-x-auto pb-2 gap-3 snap-x no-scrollbar", // 手机端
          "md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:pb-0" // 桌面端
        )}
      >
        {queries.map((query) => (
          <div
            key={`${query.domain}-${query.timestamp}`}
            onClick={() => onSelectDomain(query.domain)}
            className={cn(
              "relative flex-shrink-0 w-[240px] md:w-auto snap-start group",
              "flex items-center gap-3 p-3 rounded-xl border bg-card/50 backdrop-blur-sm",
              "hover:border-primary/40 hover:bg-accent/5 transition-all cursor-pointer shadow-sm"
            )}
          >
            {/* Favicon Area */}
            <div className="shrink-0 w-10 h-10 rounded-lg bg-background flex items-center justify-center border shadow-inner">
              <DomainFavicon domain={query.domain} size="sm" />
            </div>

            {/* Info Area */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm font-bold truncate tracking-tight">{query.domain}</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
              </div>
              
              <div className="flex items-center gap-2">
                {/* 状态徽章：严格区分 */}
                {query.status === 'available' && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] h-4 px-1 px-1.5 font-medium">
                    <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                    {language === 'zh' ? '未注册' : 'Available'}
                  </Badge>
                )}
                {query.status === 'registered' && (
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] h-4 px-1.5 font-medium">
                    <XCircle className="w-2.5 h-2.5 mr-1" />
                    {language === 'zh' ? '已注册' : 'Registered'}
                  </Badge>
                )}
                {query.status === 'failed' && (
                  <Badge variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] h-4 px-1.5 font-medium">
                    <AlertCircle className="w-2.5 h-2.5 mr-1" />
                    {language === 'zh' ? '查询失败' : 'Failed'}
                  </Badge>
                )}
              </div>
            </div>

            {/* Delete Button */}
            <button
              onClick={(e) => handleDelete(query.domain, e)}
              className="absolute -top-1.5 -right-1.5 p-1.5 rounded-full bg-background border shadow-sm opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentQueries;
