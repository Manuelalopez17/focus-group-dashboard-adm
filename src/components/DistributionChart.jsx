import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

export default function DistributionChart({
  data,
  xKey,
  yKey,
  xLabel,
  yLabel,
  barSize = 20,
  colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b']
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 20, left: 20, bottom: 50 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey={xKey}
          label={{
            value: xLabel,
            position: 'bottom',
            offset: 10
          }}
          interval={0}
          angle={-30}
          textAnchor="end"
        />
        <YAxis
          label={{
            value: yLabel,
            angle: -90,
            position: 'insideLeft',
            offset: 10
          }}
          allowDecimals={false}
        />
        <Tooltip />
        <Legend verticalAlign="top" />
        {data.map((_, idx) => (
          <Bar
            key={idx}
            dataKey={yKey}
            fill={colors[idx % colors.length]}
            barSize={barSize}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
