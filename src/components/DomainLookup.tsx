import { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Star, CheckCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import DomainSearch from './DomainSearch';
import DomainResultCard, { WhoisData, PricingData } from './DomainResultCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { addRecentQuery } from './RecentQueries';
import { getFromCache, saveToCache } from '@/hooks/useQueryCache';
import { useTldSuggestions, autoCompleteDomain } from '@/hooks/useTldSuggestions';
import { queryRdapLocal } from '@/services/rdapService';

interface DomainLookupProps {
  initialDomain?: string;
  onFavoriteAdded?: () => void;
  onDomainQueried?: (domain: string) => void;
}

const DomainLookup = ({ initialDomain, onFavoriteAdded, onDomainQueried }: DomainLookupProps) => {
  const [domain, setDomain] = useState(initialDomain || '');
  const [loading, setLoading] = useState(false);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [result, setResult] = useState<WhoisData | null>(null);
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [error, setError] = useState<string>('');
  const [isAvailable, setIsAvailable] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { allTlds } = useTldSuggestions();

  useEffect(() => {
    if (initialDomain) {
      setDomain(initialDomain);
      handleLookupWithDomain(initialDomain);
    }
  }, [initialDomain]);
  
  useEffect(() => {
    if (initialDomain && !result && !loading && !error) {
      handleLookupWithDomain(initialDomain);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateDomain = (input: string): boolean => {
    const domainRegex = /^[a-zA-Z0-9\u4e00-\u9fa5][a-zA-Z0-9\u4e00-\u9fa5-]{0,61}[a-zA-Z0-9\u4e00-\u9fa5]?\.[a-zA-Z\u4e00-\u9fa5]{2,}$/;
    return domainRegex.test(input.trim());
  };

  const checkIsFavorite = async (domainName: string) => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('domain_name', domainName.toLowerCase())
        .single();
      setIsFavorite(!!data);
    } catch (e) {
      setIsFavorite(false);
    }
  };

  const saveToHistory = async (domainName: string, whoisData: WhoisData) => {
    if (!user) return;
    try {
      await supabase.from('domain_history').insert({
        user_id: user.id,
        domain_name: domainName.toLowerCase(),
        registrar: whoisData.registrar,
        expiration_date: whoisData.expirationDate,
        source: whoisData.source,
      });
    } catch (e) {
      console.error('Failed to save to cloud history', e);
    }
  };

  // 增强的 ccTLD 判断
  const isCcTLD = (domain: string): boolean => {
    const tld = domain.split('.').pop()?.toLowerCase() || '';
    return tld.length === 2;
  };

  const handleLookupWithDomain = async (domainToLookup: string) => {
    setError('');
    setResult(null);
    setPricing(null);
    setIsFavorite(false);
    setIsAvailable(false);
    setFromCache(false);

    if (!domainToLookup.trim()) {
      setError(t('error.enterDomain'));
      return;
    }

    if (!validateDomain(domainToLookup.trim())) {
      setError(t('error.invalidFormat'));
      return;
    }

    const normalizedDomain = domainToLookup.trim().toLowerCase();

    // 1. 缓存层逻辑
    const cached = getFromCache(normalizedDomain);
    if (cached) {
      setResult(cached.whoisData);
      setPricing(cached.pricing);
      setFromCache(true);
      onDomainQueried?.(normalizedDomain);
      
      // 增强：根据缓存数据更新三态查询记录
      addRecentQuery(normalizedDomain, cached.isRegistered ? 'registered' : 'available');
      
      await checkIsFavorite(normalizedDomain);
      if (Date.now() - cached.timestamp > 10 * 60 * 1000) {
        refreshInBackground(normalizedDomain);
      }
      return;
    }

    setLoading(true);

    try {
      // 2. 策略一：本地浏览器直连 RDAP (高性能加速)
      console.log(`[Lookup] Attempting local RDAP query for: ${normalizedDomain}`);
      const rdapResult = await queryRdapLocal(normalizedDomain);
      
      if (rdapResult.success && rdapResult.data) {
        const whoisData: WhoisData = {
          domain: rdapResult.data.domain || normalizedDomain,
          registrar: rdapResult.data.registrar || 'N/A',
          registrationDate: rdapResult.data.registrationDate || 'N/A',
          expirationDate: rdapResult.data.expirationDate || 'N/A',
          lastUpdated: rdapResult.data.lastUpdated || 'N/A',
          nameServers: rdapResult.data.nameServers || [],
          status: rdapResult.data.status || [],
          statusTranslated: rdapResult.data.statusTranslated || [],
          registrant: rdapResult.data.registrant,
          dnssec: rdapResult.data.dnssec || false,
          source: 'rdap',
          registrarWebsite: rdapResult.data.registrarWebsite,
          registrarIanaId: rdapResult.data.registrarIanaId,
          dnsProvider: rdapResult.data.dnsProvider,
          privacyProtection: rdapResult.data.privacyProtection,
          ageLabel: rdapResult.data.ageLabel,
          updateLabel: rdapResult.data.updateLabel,
          remainingDays: rdapResult.data.remainingDays,
          registrationDateFormatted: rdapResult.data.registrationDateFormatted,
          expirationDateFormatted: rdapResult.data.expirationDateFormatted,
          lastUpdatedFormatted: rdapResult.data.lastUpdatedFormatted,
          rawData: rdapResult.data.rawData,
        };
        
        setResult(whoisData);
        // 增强：添加最近查询记录 (已注册)
        addRecentQuery(normalizedDomain, 'registered');
        onDomainQueried?.(normalizedDomain);
        
        saveToCache(normalizedDomain, whoisData, null, true);
        fetchPricingAsync(normalizedDomain, whoisData);
        await saveToHistory(normalizedDomain, whoisData);
        await checkIsFavorite(normalizedDomain);
        setLoading(false);
        return;
      }

      // 如果 RDAP 判定未注册
      if (rdapResult.isAvailable) {
        setIsAvailable(true);
        addRecentQuery(normalizedDomain, 'available');
        setError(language === 'zh' ? `域名 ${normalizedDomain} 未注册` : `Domain ${normalizedDomain} is available`);
        setLoading(false);
        return;
      }

      // 3. 策略二：云端 Edge Function 兜底查询 (应对复杂后缀)
      console.log(`[Lookup] Local RDAP failed, falling back to cloud: ${normalizedDomain}`);
      const skipInitialPricing = isCcTLD(normalizedDomain);
      
      const { data, error: fnError } = await supabase.functions.invoke('domain-lookup', {
        body: { 
          domain: normalizedDomain,
          skipPricing: skipInitialPricing,
        }
      });

      if (fnError) {
        console.error('Edge function error:', fnError);
        setError(t('error.serviceUnavailable'));
        addRecentQuery(normalizedDomain, 'failed');
        setLoading(false);
        return;
      }

      if (data.error) {
        if (data.isAvailable) {
          setIsAvailable(true);
          addRecentQuery(normalizedDomain, 'available');
        } else {
          addRecentQuery(normalizedDomain, 'failed');
        }
        setError(data.error);
        setLoading(false);
        return;
      }

      if (data.primary) {
        // 详尽的数据映射，确保不丢失标签信息
        const whoisData: WhoisData = {
          domain: data.primary.domain,
          registrar: data.primary.registrar || 'N/A',
          registrationDate: data.primary.registrationDate || 'N/A',
          expirationDate: data.primary.expirationDate || 'N/A',
          lastUpdated: data.primary.lastUpdated || 'N/A',
          nameServers: data.primary.nameServers || [],
          status: data.primary.status || [],
          statusTranslated: data.primary.statusTranslated || [],
          registrant: data.primary.registrant,
          dnssec: data.primary.dnssec || false,
          source: data.primary.source || 'whois',
          registrarWebsite: data.primary.registrarWebsite,
          registrarIanaId: data.primary.registrarIanaId,
          dnsProvider: data.primary.dnsProvider,
          privacyProtection: data.primary.privacyProtection,
          ageLabel: data.primary.ageLabel,
          updateLabel: data.primary.updateLabel,
          remainingDays: data.primary.remainingDays,
          registrationDateFormatted: data.primary.registrationDateFormatted,
          expirationDateFormatted: data.primary.expirationDateFormatted,
          lastUpdatedFormatted: data.primary.lastUpdatedFormatted,
          rawData: data.primary.rawData,
        };
        
        setResult(whoisData);
        
        // 分离定价逻辑
        if (data.pricing) {
          setPricing(data.pricing);
          saveToCache(normalizedDomain, whoisData, data.pricing, true);
        } else {
          saveToCache(normalizedDomain, whoisData, null, true);
          fetchPricingAsync(normalizedDomain, whoisData);
        }
        
        onDomainQueried?.(normalizedDomain);
        addRecentQuery(normalizedDomain, 'registered');
        
        await saveToHistory(normalizedDomain, whoisData);
        await checkIsFavorite(normalizedDomain);
      } else {
        setError(t('error.notFound'));
        addRecentQuery(normalizedDomain, 'failed');
      }
    } catch (err) {
      console.error('Lookup error:', err);
      setError(t('error.queryFailed'));
      addRecentQuery(normalizedDomain, 'failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchPricingAsync = async (domainName: string, whoisData: WhoisData) => {
    setPricingLoading(true);
    try {
      const { data } = await supabase.functions.invoke('domain-lookup', {
        body: { 
          domain: domainName,
          pricingOnly: true,
        }
      });
      
      if (data?.pricing) {
        setPricing(data.pricing);
        saveToCache(domainName, whoisData, data.pricing, true);
      }
    } catch (e) {
      console.log('Pricing fetch failed:', e);
    } finally {
      setPricingLoading(false);
    }
  };

  const refreshInBackground = async (domainName: string) => {
    try {
      const { data } = await supabase.functions.invoke('domain-lookup', {
        body: { domain: domainName }
      });
      
      if (data?.primary) {
        const whoisData: WhoisData = {
          domain: data.primary.domain,
          registrar: data.primary.registrar || 'N/A',
          registrationDate: data.primary.registrationDate || 'N/A',
          expirationDate: data.primary.expirationDate || 'N/A',
          lastUpdated: data.primary.lastUpdated || 'N/A',
          nameServers: data.primary.nameServers || [],
          status: data.primary.status || [],
          statusTranslated: data.primary.statusTranslated || [],
          registrant: data.primary.registrant,
          dnssec: data.primary.dnssec || false,
          source: data.primary.source || 'rdap',
          registrarWebsite: data.primary.registrarWebsite,
          registrarIanaId: data.primary.registrarIanaId,
          dnsProvider: data.primary.dnsProvider,
          privacyProtection: data.primary.privacyProtection,
          ageLabel: data.primary.ageLabel,
          updateLabel: data.primary.updateLabel,
          remainingDays: data.primary.remainingDays,
          registrationDateFormatted: data.primary.registrationDateFormatted,
          expirationDateFormatted: data.primary.expirationDateFormatted,
          lastUpdatedFormatted: data.primary.lastUpdatedFormatted,
          rawData: data.primary.rawData,
        };
        saveToCache(domainName, whoisData, data.pricing || null, true);
      }
    } catch (e) {
      console.log('Background refresh failed:', e);
    }
  };

  const handleLookup = async () => {
    // 调用更新后的智能补全逻辑：不画蛇添足
    const completedDomain = autoCompleteDomain(domain);
    if (completedDomain !== domain) {
      setDomain(completedDomain);
    }
    await handleLookupWithDomain(completedDomain);
  };

  const toggleFavorite = async () => {
    if (!user || !result) {
      toast({ description: t('error.loginRequired'), variant: 'destructive' });
      return;
    }

    setFavoriteLoading(true);

    try {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('domain_name', result.domain.toLowerCase());
        
        setIsFavorite(false);
        toast({ description: t('favorites.remove') });
      } else {
        await supabase.from('favorites').insert({
          user_id: user.id,
          domain_name: result.domain.toLowerCase(),
          registrar: result.registrar,
          expiration_date: result.expirationDate,
        });
        
        setIsFavorite(true);
        toast({ description: t('favorites.addSuccess') });
        onFavoriteAdded?.();
      }
    } catch (err) {
      console.error('Favorite error:', err);
      toast({ description: t('error.operationFailed'), variant: 'destructive' });
    } finally {
      setFavoriteLoading(false);
    }
  };

  const showResultArea = loading || result || error;

  return (
    <div className="w-full space-y-4">
      <DomainSearch
        domain={domain}
        setDomain={setDomain}
        onSearch={handleLookup}
        loading={loading}
      />

      {showResultArea && (
        <div className="min-h-[300px]">
          {error && !loading && (
            <div className={`flex items-start gap-3 p-3 border rounded-lg animate-in fade-in-0 duration-300 ${
              isAvailable 
                ? 'border-success/20 bg-success/5' 
                : 'border-destructive/20 bg-destructive/5'
            }`}>
              {isAvailable ? (
                <CheckCircle className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm ${isAvailable ? 'text-success' : 'text-destructive'}`}>
                  {error}
                </p>
                {isAvailable && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-success border-success text-xs">
                      {t('pricing.available')}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      {language === 'zh' ? '溢价状态: 以实际购买为准' : 'Premium: Subject to registry'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">
                {t('misc.loading')}
              </p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              {user && (
                <div className="flex items-center justify-between">
                  {fromCache && (
                    <span className="text-xs text-muted-foreground">
                      ⚡ {language === 'zh' ? '来自缓存' : 'From cache'}
                    </span>
                  )}
                  <div className="flex-1" />
                  <Button
                    variant={isFavorite ? "default" : "outline"}
                    size="sm"
                    onClick={toggleFavorite}
                    disabled={favoriteLoading}
                    className="gap-1.5 h-8 text-xs"
                  >
                    <Star className={`h-3.5 w-3.5 ${isFavorite ? 'fill-current' : ''}`} />
                    {isFavorite ? t('favorites.added') : t('favorites.add')}
                  </Button>
                </div>
              )}
              <DomainResultCard 
                data={result} 
                pricing={pricing} 
                pricingLoading={pricingLoading}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DomainLookup;
