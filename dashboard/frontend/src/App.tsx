import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
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

const API_URL = 'http://localhost:3000/api';

function App() {
  const [records, setRecords] = useState<HealingRecord[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recordsRes, summaryRes] = await Promise.all([
        axios.get(`${API_URL}/healings`),
        axios.get(`${API_URL}/healings/summary`)
      ]);
      
      setRecords(recordsRes.data);
      setSummary(summaryRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading dashboard...</div>
      </div>
    );
  }

  const pieData = summary ? Object.entries(summary.pages).map(([name, count]) => ({
    name,
    value: count
  })) : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8">Self-Healing Framework Dashboard</h1>

      {summary && (
        <>
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm">Total Healings</h3>
              <p className="text-3xl font-bold">{summary.totalHealings}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm">Success Rate</h3>
              <p className="text-3xl font-bold text-green-600">{summary.successRate.toFixed(1)}%</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm">Successful</h3>
              <p className="text-3xl font-bold text-green-600">{summary.successfulHealings}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm">Failed</h3>
              <p className="text-3xl font-bold text-red-600">{summary.failedHealings}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Healings by Page</h2>
              <BarChart width={500} height={300} data={Object.entries(summary.pages).map(([name, count]) => ({ name, count }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#0088FE" />
              </BarChart>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Healing Methods</h2>
              <PieChart width={500} height={300}>
                <Pie
                  data={Object.entries(summary.methods).map(([name, value]) => ({ name, value }))}
                  cx={250}
                  cy={150}
                  labelLine={false}
                  label={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </div>
          </div>
        </>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Recent Healing Records</h2>
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">Page</th>
              <th className="px-4 py-2 text-left">Original Locator</th>
              <th className="px-4 py-2 text-left">Healed Locator</th>
              <th className="px-4 py-2 text-left">Method</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Confidence</th>
              <th className="px-4 py-2 text-left">Time</th>
            </tr>
          </thead>
          <tbody>
            {records.slice(0, 20).map(record => (
              <tr key={record.id} className="border-t">
                <td className="px-4 py-2">{record.pageName}</td>
                <td className="px-4 py-2 font-mono text-sm">{record.originalLocator}</td>
                <td className="px-4 py-2 font-mono text-sm text-green-600">{record.healedLocator}</td>
                <td className="px-4 py-2">{record.healingMethod}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded ${record.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {record.status}
                  </span>
                </td>
                <td className="px-4 py-2">{(record.confidenceScore * 100).toFixed(1)}%</td>
                <td className="px-4 py-2 text-sm text-gray-500">
                  {new Date(record.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
