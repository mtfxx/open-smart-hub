'use client';
import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Device = {
  id: number;
  name: string;
  type: 'light' | 'plug';
  state: boolean;
  power: number;
};

type DevicesMap = {
  [room: string]: Device[];
};

const initialDevices: DevicesMap = {
  'Хол': [
    { id: 1, name: 'Лампа хол', type: 'light', state: true, power: 12 },
    { id: 2, name: 'Контакт TV', type: 'plug', state: true, power: 87 },
    { id: 3, name: 'Лампа ъгъл', type: 'light', state: false, power: 0 },
  ],
  'Спалня': [
    { id: 4, name: 'Лампа спалня', type: 'light', state: false, power: 0 },
    { id: 5, name: 'Контакт зарядно', type: 'plug', state: true, power: 18 },
  ],
  'Кухня': [
    { id: 6, name: 'Лампа кухня', type: 'light', state: true, power: 9 },
    { id: 7, name: 'Контакт кафемашина', type: 'plug', state: false, power: 0 },
  ],
};

const navItems = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'energy', label: 'Energy', icon: '⚡' },
  { id: 'automations', label: 'Automations', icon: '🤖' },
  { id: 'api', label: 'API', icon: '🔌' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

const mockEnergyData = [
  { time: '00:00', watts: 120 },
  { time: '04:00', watts: 80 },
  { time: '08:00', watts: 350 },
  { time: '12:00', watts: 210 },
  { time: '16:00', watts: 190 },
  { time: '20:00', watts: 450 },
  { time: '23:59', watts: 150 },
];

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState('home');
  const [activeRoom, setActiveRoom] = useState('Хол');
  const [devices, setDevices] = useState<DevicesMap>(initialDevices);

  const toggleDevice = (room: string, id: number) => {
    setDevices((prev) => ({
      ...prev,
      [room]: prev[room].map((d) =>
        d.id === id
          ? { ...d, state: !d.state, power: !d.state ? (d.type === 'light' ? 12 : 45) : 0 }
          : d
      ),
    }));
  };

  const totalPower = Object.values(devices)
    .flat()
    .reduce((acc, d) => acc + d.power, 0);

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <span className="text-blue-400 font-bold tracking-tight">⚡ Open Smart Hub</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
                activeNav === item.id
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-5 border-t border-gray-800">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>System Online</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex justify-between items-center px-8 py-4 border-b border-gray-800 bg-gray-900">
          <h1 className="font-semibold text-lg">
            {navItems.find((n) => n.id === activeNav)?.label}
          </h1>
          <div className="flex items-center gap-4 text-sm font-mono text-gray-400">
            <span>{Object.values(devices).flat().filter((d) => d.state).length} активни</span>
            <span className="text-gray-600">|</span>
            <span className="text-green-400">● API Online</span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {/* HOME TAB */}
          {activeNav === 'home' && (
            <>
              <div className="flex gap-2 mb-6">
                {Object.keys(devices).map((room) => (
                  <button
                    key={room}
                    onClick={() => setActiveRoom(room)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeRoom === room
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                    }`}
                  >
                    {room}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {devices[activeRoom].map((device) => (
                  <button
                    key={device.id}
                    onClick={() => toggleDevice(activeRoom, device.id)}
                    className={`p-5 rounded-xl border text-left transition-all ${
                      device.state
                        ? 'bg-blue-600/10 border-blue-600/40 hover:bg-blue-600/20'
                        : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="text-2xl mb-3">{device.type === 'light' ? '💡' : '🔌'}</div>
                    <div className="text-sm font-medium text-gray-200 mb-1">{device.name}</div>
                    <div className={`text-xs font-mono mb-2 ${device.state ? 'text-green-400' : 'text-gray-600'}`}>
                      {device.state ? '● ON' : '○ OFF'}
                    </div>
                    <div className="text-xs font-mono text-gray-500">{device.power}W</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ENERGY TAB */}
          {activeNav === 'energy' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
                  <div className="text-gray-400 text-sm mb-1">Текуща консумация</div>
                  <div className="text-3xl font-mono text-blue-400">{totalPower} W</div>
                </div>
                <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
                  <div className="text-gray-400 text-sm mb-1">Разход за деня</div>
                  <div className="text-3xl font-mono text-gray-200">1.45 лв</div>
                </div>
                <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
                  <div className="text-gray-400 text-sm mb-1">Прогноза (месец)</div>
                  <div className="text-3xl font-mono text-gray-200">42.80 лв</div>
                </div>
              </div>
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
                <div className="text-gray-400 text-sm mb-4">Консумация — последните 24 часа</div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockEnergyData}>
                      <XAxis dataKey="time" stroke="#4b5563" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#4b5563" fontSize={12} tickLine={false} axisLine={false} unit="W" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px' }}
                        itemStyle={{ color: '#60a5fa' }}
                      />
                      <Line type="monotone" dataKey="watts" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#1d4ed8' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* OTHER TABS */}
          {activeNav !== 'home' && activeNav !== 'energy' && (
            <div className="flex h-full items-center justify-center text-gray-600 font-mono text-sm">
              [ {navItems.find((n) => n.id === activeNav)?.label} — coming soon ]
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
