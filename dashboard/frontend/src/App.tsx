import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

interface HealingRecord {
  id: string;
  testName: string;
  pageName: string;
  originalLocator: string;
  healedLocator: string;
  confidenceScore: number;
  healingMethod: string;
  status: string;
  timestamp: string;
}

interface Summary {
  totalHealings: number;
  successfulHealings: number;
  failedHealings: number;
  successRate: number;
  pages: Record<string, number>;
  methods: Record<string, number>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#22d3ee', '#c084fc', '#f472b6'];

const icons = {
  total: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  rate: 'M13 10V3L4 14h7v7l9-11h-7z',
  success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  failed: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
};

function StatCard({ label, value, sub, color, icon, delay }: { label: string; value: string | number; sub?: string; color: string; icon: string; delay: number }) {
  return (
    <div className={`animate-fade-in animate-delay-${delay} group relative overflow-hidden rounded-2xl border border-dash-border bg-gradient-to-br from-dash-surface-light to-dash-surface p-5 transition-all duration-300 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5`}>
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-[0.03] transition-all duration-500 group-hover:scale-150" style={{ background: `radial-gradient(circle, ${color.replace('text-', '').replace('indigo', '#818cf8').replace('green', '#34d399').replace('red', '#f87171')}, transparent 70%)` }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-dash-text">{label}</p>
          <p className={`mt-2 text-2xl font-bold tracking-tight sm:text-3xl ${color}`}>{value}</p>
          {sub && <p className="mt-1 text-xs text-dash-text">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color.replace('text-', 'bg-').replace('indigo', 'indigo').replace('green', 'green').replace('red', 'red')}/10`}>
          <svg className={`h-5 w-5 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isSuccess = status === 'success';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
      isSuccess ? 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20' : 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${isSuccess ? 'bg-green-400' : 'bg-red-400'}`} />
      {status}
    </span>
  );
}

const pulseBg = 'animate-pulse rounded-xl bg-slate-700/50';

export default function App() {
  const [records, setRecords] = useState<HealingRecord[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    if (!error) setLoading(true);
    try {
      const [recordsRes, summaryRes] = await Promise.all([
        axios.get(`${API_URL}/healings`),
        axios.get(`${API_URL}/healings/summary`)
      ]);
      setRecords(recordsRes.data);
      setSummary(summaryRes.data);
      setLastUpdated(new Date());
      setError(null);
    } catch {
      if (!error) setError('Failed to connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-surface">
        <div className="animate-fade-in rounded-2xl border border-dash-border bg-dash-surface-light p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-dash-heading">Connection Error</h2>
          <p className="mt-2 max-w-xs text-sm text-dash-text">{error}</p>
          <button onClick={fetchData} className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-surface">
      <header className="relative border-b border-dash-border bg-gradient-to-r from-dash-surface via-dash-surface-light to-dash-surface">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.08),transparent_50%)]" />
        <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-sm font-bold text-white shadow-lg shadow-indigo-500/25">
              SH
            </div>
            <div>
              <h1 className="text-lg font-semibold text-dash-heading">Self-Healing Dashboard</h1>
              <p className="text-xs text-dash-text">AI-Powered Test Automation Framework</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1.5 sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs text-dash-text">Live</span>
              {lastUpdated && (
                <span className="text-xs text-dash-text/60 ml-1">
                  {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
            <button onClick={fetchData} className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-dash-border bg-dash-surface-light px-3.5 py-2 text-xs font-medium text-dash-text-light transition-all hover:border-indigo-500/30 hover:text-white hover:shadow-lg hover:shadow-indigo-500/5 active:scale-95">
              <svg className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {loading ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => <div key={i} className={`${pulseBg} h-28`} />)}
            </div>
            <div className={`${pulseBg} h-80`} />
            <div className={`${pulseBg} h-96`} />
          </>
        ) : summary ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total Healings" value={summary.totalHealings} color="text-indigo-400" icon={icons.total} delay={100} />
              <StatCard label="Success Rate" value={`${summary.successRate.toFixed(1)}%`} sub={`${summary.successfulHealings} successful`} color="text-emerald-400" icon={icons.rate} delay={200} />
              <StatCard label="Successful" value={summary.successfulHealings} color="text-emerald-400" icon={icons.success} delay={300} />
              <StatCard label="Failed" value={summary.failedHealings} color="text-red-400" icon={icons.failed} delay={400} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="animate-fade-in animate-delay-200 rounded-2xl border border-dash-border bg-gradient-to-br from-dash-surface-light to-dash-surface p-5">
                <h2 className="mb-1 text-sm font-semibold text-dash-heading">Healings by Page</h2>
                <p className="mb-4 text-xs text-dash-text">Distribution across application pages</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(summary.pages).map(([name, count]) => ({ name, count }))}>
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 13, color: '#f1f5f9' }}
                      cursor={{ fill: 'rgba(99,102,241,0.1)' }}
                    />
                    <Bar dataKey="count" fill="#818cf8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="animate-fade-in animate-delay-300 rounded-2xl border border-dash-border bg-gradient-to-br from-dash-surface-light to-dash-surface p-5">
                <h2 className="mb-1 text-sm font-semibold text-dash-heading">Healing Methods</h2>
                <p className="mb-4 text-xs text-dash-text">Similarity vs AI-powered healing</p>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(summary.methods).map(([name, value]) => ({ name, value }))}
                      cx="50%" cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      label={(entry: { name?: string; percent?: number }) => `${entry.name ?? ''} ${((entry.percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {Object.entries(summary.methods).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 13, color: '#f1f5f9' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : null}

        <div className="animate-fade-in animate-delay-400 rounded-2xl border border-dash-border bg-gradient-to-br from-dash-surface-light to-dash-surface">
          <div className="flex items-center justify-between border-b border-dash-border px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-dash-heading">Recent Healing Records</h2>
              <p className="text-xs text-dash-text">Last 20 healing events</p>
            </div>
            {records.length > 0 && (
              <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs text-indigo-400 ring-1 ring-indigo-500/20">{records.length} total</span>
            )}
          </div>
          {loading ? (
            <div className="space-y-3 p-5">
              {[...Array(5)].map((_, i) => <div key={i} className={`${pulseBg} h-10`} />)}
            </div>
          ) : records.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <svg className="mx-auto h-12 w-12 text-dash-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-sm font-medium text-dash-heading">No healing records yet</p>
              <p className="mt-1 text-xs text-dash-text">Records appear here once the healing engine processes locator failures.</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-dash-border text-xs font-medium uppercase tracking-wider text-dash-text">
                      <th className="px-5 py-3.5">Page</th>
                      <th className="px-5 py-3.5">Original Locator</th>
                      <th className="px-5 py-3.5">Healed Locator</th>
                      <th className="px-5 py-3.5">Method</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Confidence</th>
                      <th className="px-5 py-3.5">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dash-border/50">
                    {records.slice(0, 20).map((record) => (
                      <tr key={record.id} className="transition-colors hover:bg-white/[0.02]">
                        <td className="px-5 py-3.5 font-medium text-dash-heading">{record.pageName}</td>
                        <td className="max-w-[180px] truncate px-5 py-3.5 font-mono text-xs text-dash-text" title={record.originalLocator}>{record.originalLocator}</td>
                        <td className="max-w-[180px] truncate px-5 py-3.5 font-mono text-xs text-emerald-400" title={record.healedLocator}>{record.healedLocator}</td>
                        <td className="px-5 py-3.5 capitalize text-dash-text-light">{record.healingMethod}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={record.status} /></td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-700/50">
                              <div className={`h-full rounded-full transition-all duration-500 ${record.confidenceScore >= 0.8 ? 'bg-emerald-400' : record.confidenceScore >= 0.5 ? 'bg-amber-400' : 'bg-red-400'}`}
                                style={{ width: `${record.confidenceScore * 100}%` }} />
                            </div>
                            <span className="text-xs text-dash-text">{(record.confidenceScore * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-xs text-dash-text">{new Date(record.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-dash-border/50 md:hidden">
                {records.slice(0, 10).map((record) => (
                  <div key={record.id} className="space-y-2 px-4 py-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-dash-heading">{record.pageName}</span>
                      <StatusBadge status={record.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-dash-text">Original</p>
                        <p className="mt-0.5 font-mono text-dash-text-light truncate" title={record.originalLocator}>{record.originalLocator}</p>
                      </div>
                      <div>
                        <p className="text-dash-text">Healed</p>
                        <p className="mt-0.5 font-mono text-emerald-400 truncate" title={record.healedLocator}>{record.healedLocator}</p>
                      </div>
                      <div>
                        <p className="text-dash-text">Method</p>
                        <p className="mt-0.5 capitalize text-dash-text-light">{record.healingMethod}</p>
                      </div>
                      <div>
                        <p className="text-dash-text">Confidence</p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-700/50">
                            <div className={`h-full rounded-full ${record.confidenceScore >= 0.8 ? 'bg-emerald-400' : record.confidenceScore >= 0.5 ? 'bg-amber-400' : 'bg-red-400'}`}
                              style={{ width: `${record.confidenceScore * 100}%` }} />
                          </div>
                          <span className="text-dash-text">{(record.confidenceScore * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-dash-text">{new Date(record.timestamp).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
