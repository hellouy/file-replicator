import { forwardRef } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { WhoisData, PricingData } from './DomainResultCard';

interface ShareCardProps {
  data: WhoisData;
  pricing?: PricingData | null;
}

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(({ data, pricing }, ref) => {
  const { language } = useLanguage();

  const displayStatus = data.statusTranslated || data.status || [];
  const hasRegistrationDate = data.registrationDate && data.registrationDate !== 'N/A';
  const hasExpirationDate = data.expirationDate && data.expirationDate !== 'N/A';
  const hasLastUpdated = data.lastUpdated && data.lastUpdated !== 'N/A';
  const hasRegistrar = data.registrar && data.registrar !== 'N/A' && data.registrar.trim() !== '';
  const hasNameServers = data.nameServers && data.nameServers.length > 0;
  const hasRegistrantInfo = data.registrant && 
    (data.registrant.name || data.registrant.organization || data.registrant.country);

  const getRemainingDaysColor = (days: number | undefined) => {
    if (days === undefined || days === null) return '#6b7280';
    if (days <= 30) return '#ef4444';
    if (days <= 90) return '#f59e0b';
    return '#22c55e';
  };

  return (
    <div
      ref={ref}
      style={{
        width: '380px',
        backgroundColor: '#ffffff',
        color: '#1a1a1a',
        padding: '20px',
        borderRadius: '12px',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      }}
    >
      {/* Price Tags Row */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        alignItems: 'center', 
        gap: '8px',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>
          {language === 'zh' ? '注册' : 'Register'}: 
          <span style={{ color: '#2563eb', fontWeight: 600, marginLeft: '4px' }}>
            {pricing?.registerPrice ? `¥${pricing.registerPrice}` : '-'}
          </span>
        </span>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>
          {language === 'zh' ? '续费' : 'Renew'}: 
          <span style={{ color: '#2563eb', fontWeight: 600, marginLeft: '4px' }}>
            {pricing?.renewPrice ? `¥${pricing.renewPrice}` : '-'}
          </span>
        </span>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>
          {language === 'zh' ? '溢价' : 'Premium'}: 
          <span style={{ fontWeight: 500, marginLeft: '4px' }}>
            {pricing?.isPremium ? (language === 'zh' ? '是' : 'Yes') : (language === 'zh' ? '否' : 'No')}
          </span>
        </span>
        <span style={{
          backgroundColor: '#1a1a1a',
          color: '#ffffff',
          fontSize: '11px',
          padding: '2px 8px',
          borderRadius: '4px',
          fontWeight: 500,
        }}>
          {language === 'zh' ? '已注册' : 'Registered'}
        </span>
        <span style={{
          backgroundColor: '#f3f4f6',
          color: '#374151',
          fontSize: '11px',
          padding: '2px 8px',
          borderRadius: '4px',
          marginLeft: 'auto',
        }}>
          {data.source === 'rdap' ? 'RDAP' : 'WHOIS'}
        </span>
      </div>

      {/* Domain Name Header */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: 700, 
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          margin: 0,
        }}>
          {data.domain}
        </h2>
      </div>

      {/* Domain Info Section */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          marginBottom: '10px',
          fontSize: '13px',
          fontWeight: 600,
          color: '#374151',
        }}>
          <span>ℹ️</span>
          <span>{language === 'zh' ? '域名信息' : 'Domain Info'}</span>
        </div>

        <div style={{ 
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          {/* Registrar */}
          {hasRegistrar && (
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ 
                width: '90px', 
                padding: '10px 12px',
                backgroundColor: '#f9fafb',
                fontSize: '12px',
                color: '#6b7280',
                flexShrink: 0,
              }}>
                {language === 'zh' ? '注册商' : 'Registrar'}
              </div>
              <div style={{ 
                flex: 1,
                padding: '10px 12px',
                fontSize: '13px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {data.registrar}
                </span>
                {data.registrarWebsite && (
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    color: '#6b7280',
                    flexShrink: 0,
                  }}>
                    🔗 {language === 'zh' ? '官网' : 'Website'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Registration Date */}
          {hasRegistrationDate && (
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ 
                width: '90px', 
                padding: '10px 12px',
                backgroundColor: '#f9fafb',
                fontSize: '12px',
                color: '#6b7280',
                flexShrink: 0,
              }}>
                {language === 'zh' ? '注册时间' : 'Registered'}
              </div>
              <div style={{ 
                flex: 1,
                padding: '10px 12px',
                fontSize: '13px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span>{data.registrationDateFormatted || data.registrationDate}</span>
                {data.ageLabel && (
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    color: '#22c55e',
                    borderRadius: '4px',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                  }}>
                    {data.ageLabel}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Last Updated */}
          {hasLastUpdated && (
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ 
                width: '90px', 
                padding: '10px 12px',
                backgroundColor: '#f9fafb',
                fontSize: '12px',
                color: '#6b7280',
                flexShrink: 0,
              }}>
                {language === 'zh' ? '更新时间' : 'Updated'}
              </div>
              <div style={{ 
                flex: 1,
                padding: '10px 12px',
                fontSize: '13px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span>{data.lastUpdatedFormatted || data.lastUpdated}</span>
                {data.updateLabel && (
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    borderRadius: '4px',
                  }}>
                    {data.updateLabel}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Expiration Date */}
          {hasExpirationDate && (
            <div style={{ display: 'flex' }}>
              <div style={{ 
                width: '90px', 
                padding: '10px 12px',
                backgroundColor: '#f9fafb',
                fontSize: '12px',
                color: '#6b7280',
                flexShrink: 0,
              }}>
                {language === 'zh' ? '过期时间' : 'Expires'}
              </div>
              <div style={{ 
                flex: 1,
                padding: '10px 12px',
                fontSize: '13px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span>{data.expirationDateFormatted || data.expirationDate}</span>
                {data.remainingDays !== undefined && data.remainingDays !== null && (
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    color: getRemainingDaysColor(data.remainingDays),
                    backgroundColor: `${getRemainingDaysColor(data.remainingDays)}15`,
                    borderRadius: '4px',
                  }}>
                    {language === 'zh' ? `剩余${data.remainingDays}天` : `${data.remainingDays} days`}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Registrant Info */}
      {hasRegistrantInfo && !data.privacyProtection && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            marginBottom: '10px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#374151',
          }}>
            <span>👤</span>
            <span>{language === 'zh' ? '注册人信息' : 'Registrant'}</span>
          </div>

          <div style={{ 
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            {data.registrant?.name && (
              <div style={{ display: 'flex', borderBottom: data.registrant?.organization || data.registrant?.country ? '1px solid #e5e7eb' : 'none' }}>
                <div style={{ 
                  width: '90px', 
                  padding: '8px 12px',
                  backgroundColor: '#f9fafb',
                  fontSize: '12px',
                  color: '#6b7280',
                  flexShrink: 0,
                }}>
                  {language === 'zh' ? '姓名' : 'Name'}
                </div>
                <div style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}>
                  {data.registrant.name}
                </div>
              </div>
            )}
            {data.registrant?.organization && (
              <div style={{ display: 'flex', borderBottom: data.registrant?.country ? '1px solid #e5e7eb' : 'none' }}>
                <div style={{ 
                  width: '90px', 
                  padding: '8px 12px',
                  backgroundColor: '#f9fafb',
                  fontSize: '12px',
                  color: '#6b7280',
                  flexShrink: 0,
                }}>
                  {language === 'zh' ? '组织' : 'Org'}
                </div>
                <div style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}>
                  {data.registrant.organization}
                </div>
              </div>
            )}
            {data.registrant?.country && (
              <div style={{ display: 'flex' }}>
                <div style={{ 
                  width: '90px', 
                  padding: '8px 12px',
                  backgroundColor: '#f9fafb',
                  fontSize: '12px',
                  color: '#6b7280',
                  flexShrink: 0,
                }}>
                  {language === 'zh' ? '国家' : 'Country'}
                </div>
                <div style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}>
                  {data.registrant.country}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Privacy Protection Notice */}
      {data.privacyProtection && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px dashed #d1d5db',
          }}>
            <span style={{ fontSize: '20px' }}>🔒</span>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', margin: 0 }}>
                {language === 'zh' ? '注册人信息已启用隐私保护' : 'Privacy Protected'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Domain Status */}
      {displayStatus.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            marginBottom: '10px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#374151',
          }}>
            <span>🛡️</span>
            <span>{language === 'zh' ? '域名状态' : 'Status'}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {displayStatus.slice(0, 4).map((status, index) => (
              <span 
                key={index}
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  color: '#374151',
                  backgroundColor: '#ffffff',
                }}
              >
                {status}
              </span>
            ))}
            {displayStatus.length > 4 && (
              <span style={{
                fontSize: '11px',
                padding: '4px 8px',
                color: '#6b7280',
              }}>
                +{displayStatus.length - 4}
              </span>
            )}
          </div>
        </div>
      )}

      {/* DNSSEC */}
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        paddingTop: '12px',
        borderTop: '1px solid #e5e7eb',
        marginBottom: '16px',
      }}>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>DNSSEC:</span>
        <span style={{
          fontSize: '11px',
          padding: '2px 8px',
          borderRadius: '4px',
          backgroundColor: data.dnssec ? '#1a1a1a' : '#f3f4f6',
          color: data.dnssec ? '#ffffff' : '#6b7280',
        }}>
          {data.dnssec ? (language === 'zh' ? '已启用' : 'Enabled') : (language === 'zh' ? '未启用' : 'Disabled')}
        </span>
      </div>

      {/* Name Servers */}
      {hasNameServers && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '10px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#374151',
            }}>
              <span>🖥️</span>
              <span>{language === 'zh' ? '域名服务器' : 'Name Servers'}</span>
            </div>
            {data.dnsProvider && (
              <span style={{
                fontSize: '10px',
                padding: '2px 6px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                color: '#6b7280',
              }}>
                {data.dnsProvider.name}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {data.nameServers.slice(0, 3).map((ns, index) => (
              <div 
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 10px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#374151',
                }}
              >
                <span style={{ color: '#9ca3af', marginRight: '8px' }}>NS{index + 1}:</span>
                <span>{ns.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        paddingTop: '12px',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ fontSize: '11px', color: '#9ca3af' }}>
          RDAP {language === 'zh' ? '域名查询' : 'Domain Lookup'} · rdap.lovable.app
        </span>
      </div>
    </div>
  );
});

ShareCard.displayName = 'ShareCard';

export default ShareCard;
