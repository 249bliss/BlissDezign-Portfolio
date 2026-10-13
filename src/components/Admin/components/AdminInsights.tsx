import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { TrendingUp, Users, Mail, Eye, RefreshCw } from 'lucide-react';

interface TimelinePoint {
  date: string;
  views: number;
  leads: number;
}

export const AdminInsights: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [viewsCount, setViewsCount] = useState(0);
  const [leadsCount, setLeadsCount] = useState(0);
  const [subsCount, setSubsCount] = useState(0);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      let dateFilter: string | null = null;
      const now = new Date();

      if (timeframe === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFilter = startOfDay.toISOString();
      } else if (timeframe === '7d') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        dateFilter = d.toISOString();
      } else if (timeframe === '30d') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        dateFilter = d.toISOString();
      }

      // 1. Fetch Analytics
      let aQuery = supabase.from('analytics').select('created_at, event_type');
      if (dateFilter) aQuery = aQuery.gte('created_at', dateFilter);
      const { data: aData } = await aQuery;

      // 2. Fetch Messages
      let mQuery = supabase.from('messages').select('created_at');
      if (dateFilter) mQuery = mQuery.gte('created_at', dateFilter);
      const { data: mData } = await mQuery;

      // 3. Fetch Subscribers
      let sQuery = supabase.from('subscribers').select('created_at');
      if (dateFilter) sQuery = sQuery.gte('created_at', dateFilter);
      const { data: sData } = await sQuery;

      const views = aData?.filter((r) => r.event_type === 'view').length || aData?.length || 0;
      const leads = mData?.length || 0;
      const subs = sData?.length || 0;

      setViewsCount(views);
      setLeadsCount(leads);
      setSubsCount(subs);

      // Build daily timeline
      const daysCount = timeframe === 'today' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 14 : 30;
      const points: TimelinePoint[] = [];

      for (let i = daysCount - 1; i >= 0; i--) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - i);
        const dateStr = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const dateMatch = targetDate.toDateString();

        const dayViews = aData?.filter((item) => new Date(item.created_at).toDateString() === dateMatch).length || 0;
        const dayLeads = (mData?.filter((item) => new Date(item.created_at).toDateString() === dateMatch).length || 0) +
                         (sData?.filter((item) => new Date(item.created_at).toDateString() === dateMatch).length || 0);

        points.push({
          date: dateStr,
          views: dayViews,
          leads: dayLeads,
        });
      }

      setTimeline(points);
    } catch (err) {
      console.error('Failed to load insights:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [timeframe]);

  const totalInteractions = leadsCount + subsCount;
  const conversionRate = viewsCount > 0 ? ((totalInteractions / viewsCount) * 100).toFixed(1) : '0.0';

  // SVG Chart Dimensions & Computations
  const maxView = Math.max(...timeline.map((p) => p.views), 10);
  const chartHeight = 160;
  const chartWidth = 600;

  const pointsSvg = timeline.map((p, index) => {
    const x = (index / Math.max(timeline.length - 1, 1)) * chartWidth;
    const y = chartHeight - (p.views / maxView) * (chartHeight - 20) - 10;
    return `${x},${y}`;
  }).join(' ');

  const areaSvg = pointsSvg ? `0,${chartHeight} ${pointsSvg} ${chartWidth},${chartHeight}` : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Header & Range Filters */}
      <div className="adm-panel-head">
        <div className="adm-panel-title-area">
          <span className="adm-panel-eyebrow">Studio Analytics</span>
          <h2 className="adm-panel-title">Audience & Reach</h2>
          <p className="adm-panel-desc">Real-time engagement, portfolio views, and direct client leads.</p>
        </div>

        <div className="adm-panel-actions">
          <div className="adm-filter-pills">
            {(['today', '7d', '30d', 'all'] as const).map((t) => (
              <button
                key={t}
                className={`adm-filter-pill ${timeframe === t ? 'active' : ''}`}
                onClick={() => setTimeframe(t)}
              >
                {t === 'today' ? 'Today' : t === '7d' ? 'Past 7 Days' : t === '30d' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          <button
            className="adm-icon-btn"
            onClick={loadData}
            title="Refresh Insights"
            disabled={isLoading}
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 4 Core Metrics */}
      <div className="adm-metrics-grid">
        <div className="adm-metric-card">
          <div className="adm-metric-top">
            <span className="adm-metric-label">Unique Reach</span>
            <Eye size={17} />
          </div>
          <h3 className="adm-metric-value">{viewsCount.toLocaleString()}</h3>
          <span className="adm-metric-sub">Portfolio Impressions</span>
        </div>

        <div className="adm-metric-card">
          <div className="adm-metric-top">
            <span className="adm-metric-label">Direct Leads</span>
            <Mail size={17} />
          </div>
          <h3 className="adm-metric-value">{leadsCount.toLocaleString()}</h3>
          <span className="adm-metric-sub">Inquiries Submitted</span>
        </div>

        <div className="adm-metric-card">
          <div className="adm-metric-top">
            <span className="adm-metric-label">Subscribers</span>
            <Users size={17} />
          </div>
          <h3 className="adm-metric-value">{subsCount.toLocaleString()}</h3>
          <span className="adm-metric-sub">Newsletter Audience</span>
        </div>

        <div className="adm-metric-card">
          <div className="adm-metric-top">
            <span className="adm-metric-label">Conversion</span>
            <TrendingUp size={17} />
          </div>
          <h3 className="adm-metric-value">{conversionRate}%</h3>
          <span className="adm-metric-sub">Visitor-to-Lead Ratio</span>
        </div>
      </div>

      {/* Interactive Trend Chart Card */}
      <div className="adm-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--adm-font-display)' }}>
              Traffic & Growth Trajectory
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--adm-text-muted)' }}>
              Historical volume over {timeframe === 'today' ? 'today' : timeframe}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.78rem', color: 'var(--adm-text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--adm-text-primary)' }} />
              Views
            </span>
          </div>
        </div>

        {/* SVG Sparkline Graph */}
        <div style={{ width: '100%', height: chartHeight, position: 'relative', overflow: 'hidden' }}>
          {timeline.length > 1 ? (
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area */}
              <polygon points={areaSvg} fill="url(#viewsGradient)" style={{ color: 'var(--adm-text-primary)' }} />

              {/* Line */}
              <polyline
                fill="none"
                stroke="var(--adm-text-primary)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsSvg}
              />

              {/* Points */}
              {timeline.map((p, idx) => {
                const x = (idx / Math.max(timeline.length - 1, 1)) * chartWidth;
                const y = chartHeight - (p.views / maxView) * (chartHeight - 20) - 10;
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r="3.5"
                    fill="var(--adm-surface)"
                    stroke="var(--adm-text-primary)"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--adm-text-muted)' }}>
              No timeline data recorded yet.
            </div>
          )}
        </div>

        {/* X-Axis Dates */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: '0.72rem', color: 'var(--adm-text-muted)' }}>
          {timeline.length > 0 && (
            <>
              <span>{timeline[0]?.date}</span>
              <span>{timeline[Math.floor(timeline.length / 2)]?.date}</span>
              <span>{timeline[timeline.length - 1]?.date}</span>
            </>
          )}
        </div>
      </div>

      {/* Focus & Practice Distribution */}
      <div className="adm-card">
        <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--adm-font-display)' }}>
          Core Discipline Inquiries
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Mobile App Architecture & Systems', share: 85 },
            { label: 'High-Impact Web Platforms', share: 72 },
            { label: 'UX Strategy & Conversion Audits', share: 48 },
            { label: 'Fintech & Design Systems', share: 36 },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 500 }}>
                <span>{item.label}</span>
                <span style={{ color: 'var(--adm-text-muted)' }}>{item.share}%</span>
              </div>
              <div style={{ width: '100%', height: 6, borderRadius: 100, background: 'var(--adm-surface-active)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${item.share}%`,
                    height: '100%',
                    borderRadius: 100,
                    background: 'var(--adm-accent-primary)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
