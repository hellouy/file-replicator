import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { Badge } from '@/components/ui/badge';
import DomainFavicon from './DomainFavicon';

interface RecentQuery {
  domain: string;
  timestamp: number;
  isRegistered?: boolean;
}

interface RecentQueriesProps {
  onSelectDomain: (domain: string) => void;
  refreshTrigger?: number;
}

const MAX_RECENT_QUERIES = 10;
const STORAGE_KEY = 'recent_domain_queries';

/**
 * 添加查询记录（保持你原逻辑）
 */
export const addRecentQuery = (domain: string, isRegistered: boolean = true) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let queries: RecentQuery[] = stored ? JSON.parse(stored) : [];

    queries = queries.filter(
      q => q.domain.toLowerCase() !== domain.toLowerCase()
    );

    queries.unshift({
      domain: domain.toLowerCase(),
      timestamp: Date.now(),
      isRegistered,
    });

    queries = queries.slice(0, MAX_RECENT_QUERIES);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(queries));

    window.dispatchEvent(new CustomEvent('recent-queries-updated'));
  } catch (e) {
    console.error('Failed to save recent query:', e);
  }
};

const RecentQueries = ({ onSelectDomain, refreshTrigger }: RecentQueriesProps) => {

  const [queries, setQueries] = useState<RecentQuery[]>([]);
  const { language } = useLanguage();

  const loadQueries = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setQueries(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to load recent queries:', e);
    }
  };

  useEffect(() => {
    loadQueries();

    const handleUpdate = () => loadQueries();
    window.addEventListener('recent-queries-updated', handleUpdate);

    return () =>
      window.removeEventListener('recent-queries-updated', handleUpdate);

  }, [refreshTrigger]);


  /**
   * ⭐ 更友好的时间显示（核心升级）
   */
  const formatTimeAgo = (timestamp: number) => {

    const diff = Math.floor((Date.now() - timestamp) / 1000);

    if (diff < 30) return language === 'zh' ? '刚刚' : 'Just now';
    if (diff < 60) return language === 'zh' ? `${diff}秒前` : `${diff}s ago`;

    const mins = Math.floor(diff / 60);
    if (mins < 60)
      return language === 'zh' ? `${mins}分钟前` : `${mins}m ago`;

    const hours = Math.floor(mins / 60);
    if (hours < 24)
      return language === 'zh' ? `${hours}小时前` : `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return language === 'zh' ? `${days}天前` : `${days}d ago`;
  };

  if (!queries.length) return null;

  const displayQueries = queries.slice(0, 6);

  return (
    <div className="space-y-3">

      {/* 标题 */}
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>{language === 'zh' ? '最近查询' : 'Recent Queries'}</span>
      </div>

      {/* 网格 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">

        {displayQueries.map((query, index) => (

          <button
            key={`${query.domain}-${index}`}
            onClick={() => onSelectDomain(query.domain)}
            className="
              relative
              flex items-start gap-2
              p-3
              rounded-xl
              border
              bg-card
              hover:bg-muted/40
              active:scale-[0.98]
              transition
              text-left
            "
          >

            <DomainFavicon domain={query.domain} size="sm" />

            <div className="flex-1 min-w-0 pr-8">

              {/* 域名 */}
              <div className="text-xs font-semibold truncate">
                {query.domain}
              </div>

              {/* 时间 */}
              <div className="text-[10px] text-muted-foreground mt-1">
                {formatTimeAgo(query.timestamp)}
              </div>

            </div>

            {/* ⭐ 状态固定右下 */}
            <Badge
              variant="outline"
              className={`
                absolute bottom-1.5 right-1.5
                text-[9px] h-4 px-1
                pointer-events-none
                ${
                  query.isRegistered !== false
                    ? 'text-primary border-primary/30'
                    : 'text-success border-success/30'
                }
              `}
            >
              {query.isRegistered !== false
                ? (language === 'zh' ? '已注册' : 'Registered')
                : (language === 'zh' ? '未注册' : 'Available')}
            </Badge>

          </button>

        ))}

      </div>
    </div>
  );
};

export default RecentQueries;
