// src/components/Chart.jsx
import {
  LineChart, Line,
  XAxis, YAxis,
  Tooltip, ResponsiveContainer
} from 'recharts'

export default function Chart({ data, dataKey, xKey, title }) {
  return (
    <div style={{ width: '100%', height: 300, marginBottom: 20 }}>
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey={dataKey} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
