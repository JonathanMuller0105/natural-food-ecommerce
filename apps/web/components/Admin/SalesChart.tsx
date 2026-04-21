'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Seg', vendas: 450 },
  { name: 'Ter', vendas: 800 },
  { name: 'Qua', vendas: 600 },
  { name: 'Qui', vendas: 950 },
  { name: 'Sex', vendas: 1200 },
];

export default function SalesChart() {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-gray-600 text-sm font-bold mb-4 uppercase tracking-wider">Vendas da Semana</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="#A0AEC0" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#A0AEC0" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
            <Tooltip cursor={{ fill: '#F7FAFC' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
            <Bar dataKey="vendas" fill="#2D5A27" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}