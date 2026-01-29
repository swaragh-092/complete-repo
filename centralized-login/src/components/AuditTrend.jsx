import { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts';
import { format } from 'date-fns';

function normaliseHistory(history = []) {
  const buckets = history.reduce((acc, item) => {
    const ts = item.timestamp ? new Date(item.timestamp) : null;
    if (!ts || Number.isNaN(ts.getTime())) return acc;
    const key = format(ts, 'MMM dd');
    const bucket = acc.get(key) || { label: key, logins: 0, failures: 0 };
    if (item.action === 'SUSPICIOUS_LOGIN_DETECTED' || item.suspicious) {
      bucket.failures += 1;
    } else {
      bucket.logins += 1;
    }
    acc.set(key, bucket);
    return acc;
  }, new Map());

  return Array.from(buckets.values()).slice(-14); // last 2 weeks
}

export function AuditTrend({ history }) {
  const data = useMemo(() => normaliseHistory(history), [history]);

  if (!data.length) {
    return <div style={{ padding: 16, textAlign: 'center' }}>No recent login activity</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="loginGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1976d2" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="failureGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#d32f2f" stopOpacity={0.45} />
            <stop offset="95%" stopColor="#d32f2f" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
        <XAxis dataKey="label" stroke="#888" />
        <YAxis allowDecimals={false} stroke="#888" />
        <Tooltip cursor={{ stroke: '#1976d2', strokeWidth: 0.5 }} />
        <Area type="monotone" dataKey="logins" stroke="#1976d2" fill="url(#loginGradient)" strokeWidth={2} />
        <Area type="monotone" dataKey="failures" stroke="#d32f2f" fill="url(#failureGradient)" strokeWidth={2} />
        <Line type="monotone" dataKey="logins" stroke="#1976d2" strokeWidth={0.5} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="failures" stroke="#d32f2f" strokeWidth={0.5} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default AuditTrend;

