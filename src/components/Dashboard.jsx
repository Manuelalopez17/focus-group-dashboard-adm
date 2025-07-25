import React, { useEffect, useState, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts'

const ETAPAS = [
  'Abastecimiento','Prefactibilidad y Factibilidad','Planeación',
  'Contratación y Adquisición','Diseño','Fabricación',
  'Logística y Transporte','Montaje','Construcción',
  'Puesta en Marcha','Disposición Final'
]

const SESIONES = ['1.1','1.2','2.1','2.2','3.1','3.2']

const VIEWS = [
  { id: 'impacto_riesgo',      label: 'Impacto por Riesgo' },
  { id: 'frecuencia_riesgo',   label: 'Frecuencia por Riesgo' },
  { id: 'impacto_promedio',    label: 'Impacto Promedio (μ)' },
  { id: 'frecuencia_promedio', label: 'Frecuencia Promedio (μ)' },
  { id: 'impacto_sd',          label: 'Impacto Desviación (σ)' },
  { id: 'frecuencia_sd',       label: 'Frecuencia Desviación (σ)' },
  { id: 'riesgo_total',        label: 'Riesgo Total (μ×μ)' },
  { id: 'consenso',            label: 'Consenso Impacto/Frecuencia' }
]

const BAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Dashboard() {
  // Estados
  const [tab, setTab]                 = useState('riesgo')
  const [rows, setRows]               = useState([])
  const [consensusData, setConsensus] = useState([])
  const [summaryEtapa, setSummary]    = useState([])

  const [etapa,  setEtapa]  = useState(ETAPAS[0])
  const [sesion, setSesion] = useState(SESIONES[0])
  const [riesgo, setRiesgo] = useState('')
  const [view,   setView]   = useState(VIEWS[0].id)

  // Carga inicial de datos
  useEffect(() => {
    supabase.from('focus_group_db').select('*')
      .then(({ data, error }) => error ? console.error(error) : setRows(data || []))
    supabase.from('vista_analisis_delphi').select('*')
      .then(({ data, error }) => error ? console.error(error) : setConsensus(data || []))
  }, [])

  // Carga del resumen por etapa al cambiar sesión
  useEffect(() => {
    supabase.from('summary_por_etapa')
      .select('sesion, etapa, mu_impacto, sd_impacto, mu_frecuencia, sd_frecuencia')
      .eq('sesion', sesion)
      .then(({ data, error }) => {
        if (error) return console.error(error)
        const round2 = x => Number(x).toFixed(2)
        setSummary((data || []).map(r => ({
          etapa:         r.etapa,
          mu_impacto:    round2(r.mu_impacto),
          sd_impacto:    round2(r.sd_impacto),
          mu_frecuencia: round2(r.mu_frecuencia),
          sd_frecuencia: round2(r.sd_frecuencia),
        })))
      })
  }, [sesion])

  // Helper de distribución
  const dist = (data, key) =>
    [1,2,3,4,5].map((v, i) => ({
      category: String(v),
      value: data.filter(r => r[key] === v).length,
      color: BAR_COLORS[i]
    }))

  // Filtrado por etapa y sesión
  const filtered = useMemo(
    () => rows.filter(r => r.etapa === etapa && r.sesion === sesion),
    [rows, etapa, sesion]
  )
  const risks = useMemo(
    () => Array.from(new Set(filtered.map(r => r.riesgo))).sort(),
    [filtered]
  )
  useEffect(() => { if (risks.length) setRiesgo(risks[0]) }, [risks])

  // Datos actuales de consenso
  const current = consensusData.find(
    i => i.etapa === etapa && i.sesion === sesion && i.riesgo === riesgo
  ) || {}

  // Datos para cada vista
  const chartData = {
    impacto_riesgo:    dist(filtered.filter(r=>r.riesgo===riesgo), 'impacto'),
    frecuencia_riesgo: dist(filtered.filter(r=>r.riesgo===riesgo), 'frecuencia'),
    impacto_promedio:  [{ category: 'Impacto',    μ: Number(current.impacto_promedio   ||0).toFixed(2) }],
    frecuencia_promedio:[{ category: 'Frecuencia', μ: Number(current.frecuencia_promedio||0).toFixed(2) }],
    impacto_sd:        [{ category: 'Impacto',    σ: Number(current.sd_impacto||0).toFixed(2) }],
    frecuencia_sd:     [{ category: 'Frecuencia', σ: Number(current.sd_frecuencia||0).toFixed(2) }],
    riesgo_total:      [{ category: 'Total',      value: Number((current.impacto_promedio||0)*(current.frecuencia_promedio||0)).toFixed(2) }],
    consenso: [
      { category: 'Impacto',    μ: Number(current.impacto_promedio   ||0).toFixed(2), σ: Number(current.sd_impacto  ||0).toFixed(2) },
      { category: 'Frecuencia', μ: Number(current.frecuencia_promedio||0).toFixed(2), σ: Number(current.sd_frecuencia||0).toFixed(2) }
    ],
    por_etapa: summaryEtapa.map(r => ({
      etapa: r.etapa,
      μ:     r.mu_impacto,
      σ:     r.sd_impacto,
      μf:    r.mu_frecuencia,
      σf:    r.sd_frecuencia
    }))
  }

  // Etiquetas dinámicas para los ejes
  const axisLabel = view === 'impacto_riesgo'
    ? 'Impacto (1‑5)'
    : view === 'frecuencia_riesgo'
    ? 'Frecuencia (1‑5)'
    : 'Categoría'
  const yLabel = ['impacto_riesgo','frecuencia_riesgo'].includes(view)
    ? 'Expertos'
    : view.includes('promedio')
    ? 'Promedio (μ)'
    : view.includes('sd')
    ? 'Desviación (σ)'
    : 'Valor'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Título */}
      <header className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 p-8 rounded-b-xl shadow-lg">
        <h1 className="text-5xl font-extrabold text-white text-center" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
          🎯 Panel Administrador Focus Group
        </h1>
      </header>

      <main className="max-w-5xl mx-auto mt-8 space-y-12 px-4">

        {/* Pestañas */}
        <nav className="flex justify-center gap-6 mb-6">
          <button
            onClick={() => setTab('riesgo')}
            className={`px-4 py-2 rounded-full ${
              tab === 'riesgo' ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Por Riesgo
          </button>
          <button
            onClick={() => setTab('etapa')}
            className={`px-4 py-2 rounded-full ${
              tab === 'etapa' ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Por Etapa
          </button>
        </nav>

        {/* ======== RIESGO ======== */}
        {tab === 'riesgo' && (
          <>
            {/* Selectores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Etapa',    value: etapa,  onChange: setEtapa,    options: ETAPAS },
                { label: 'Sesión',   value: sesion, onChange: setSesion,   options: SESIONES },
                { label: 'Riesgo',   value: riesgo, onChange: setRiesgo,   options: risks },
                { label: 'Vista',    value: view,   onChange: setView,     options: VIEWS.map(v=>v.id), labels: VIEWS }
              ].map(({ label, value, onChange, options, labels }) => (
                <div key={label} className="flex flex-col bg-white p-4 rounded-lg shadow">
                  <label className="mb-2 font-medium text-gray-700">{label}</label>
                  <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                  >
                    {options.map(opt => {
                      const text = labels?.find(l=>l.id===opt)?.label || opt
                      return <option key={opt} value={opt}>{text}</option>
                    })}
                  </select>
                </div>
              ))}
            </div>

            {/* Gráfico */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-semibold mb-4 text-center">
                {VIEWS.find(v=>v.id===view).label}
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chartData[view]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="category"
                    label={{ value: axisLabel, position:'bottom', dy:20, fill:'#555' }}
                    tick={{ fill:'#333' }}
                  />
                  <YAxis
                    label={{ value: yLabel, angle:-90, position:'insideLeft', dx:-10, fill:'#555' }}
                    tick={{ fill:'#333' }}
                  />
                  <Tooltip />
                  <Legend verticalAlign="top" />

                  {(view === 'impacto_riesgo' || view === 'frecuencia_riesgo') ? (
                    <Bar dataKey="value" barSize={20}>
                      {chartData[view].map((e, i) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Bar>
                  ) : (
                    chartData[view].map((e, i) => {
                      const key = Object.keys(e).find(k => k !== 'category')
                      return (
                        <Bar
                          key={key}
                          dataKey={key}
                          fill={BAR_COLORS[i % BAR_COLORS.length]}
                          barSize={20}
                        />
                      )
                    })
                  )}
                </BarChart>
              </ResponsiveContainer>

              {/* Tabla resumen */}
              <div className="overflow-auto mt-6 mx-auto">
                <h3 className="text-lg font-medium mb-2">Resumen</h3>
                <table className="mx-auto min-w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2">{axisLabel}</th>
                      <th className="border border-gray-300 px-4 py-2">Expertos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData[view].map((row, r) => (
                      <tr key={r} className={r % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-4 py-2">{row.category}</td>
                        <td className="border border-gray-300 px-4 py-2">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ======== ETAPA ======== */}
        {tab === 'etapa' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold">Análisis por Etapa</h2>
            {/* Selectores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Selector Etapa */}
              <div className="flex flex-col bg-white p-4 rounded-lg shadow">
                <label className="mb-2 font-medium text-gray-700">Etapa</label>
                <select
                  value={etapa}
                  onChange={e=>setEtapa(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                >
                  {ETAPAS.map(o=> <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              {/* Selector Sesión */}
              <div className="flex flex-col bg-white p-4 rounded-lg shadow">
                <label className="mb-2 font-medium text-gray-700">Sesión</label>
                <select
                  value={sesion}
                  onChange={e=>setSesion(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                >
                  {SESIONES.map(o=> <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* Promedios por Etapa */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4 text-center">
                Promedios por Etapa (μ Impacto y μ Frecuencia)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={summaryEtapa} margin={{ top:20, right:20, left:20, bottom:50 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="etapa" label={{ value:'Etapa', position:'bottom', dy:10 }} interval={0} />
                  <YAxis label={{ value:'Valor (μ)', angle:-90, position:'insideLeft', dx:-10 }} />
                  <Tooltip />
                  <Legend verticalAlign="top" />
                  <Bar dataKey="mu_impacto" name="μ Impacto" fill="#3b82f6" barSize={20} />
                  <Bar dataKey="mu_frecuencia" name="μ Frecuencia" fill="#10b981" barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Desviaciones por Etapa */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4 text-center">
                Desviaciones por Etapa (σ Impacto y σ Frecuencia)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={summaryEtapa} margin={{ top:20, right:20, left:20, bottom:50 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="etapa" label={{ value:'Etapa', position:'bottom', dy:10 }} interval={0} />
                  <YAxis label={{ value:'Valor (σ)', angle:-90, position:'insideLeft', dx:-10 }} />
                  <Tooltip />
                  <Legend verticalAlign="top" />
                  <Bar dataKey="sd_impacto" name="σ Impacto" fill="#ef4444" barSize={20} />
                  <Bar dataKey="sd_frecuencia" name="σ Frecuencia" fill="#f59e0b" barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Umbrales Delphi */}
            <div className="bg-white p-6 rounded-lg shadow overflow-auto">
              <h3 className="text-xl font-semibold mb-4">Umbrales Delphi</h3>
              <table className="min-w-full border-collapse border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2">Indicador</th>
                    <th className="border border-gray-300 px-4 py-2">Regla</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="border px-4 py-2">σ Impacto</td>
                    <td className="border px-4 py-2">
                      {'≤3.0=Alto | ≤1.5=Medio | ≤2.0=Bajo | >2.0=Sin Consenso'}
                    </td>
                  </tr>
                  <tr className="border-b bg-gray-50">
                    <td className="border px-4 py-2">σ Frecuencia</td>
                    <td className="border px-4 py-2">
                      {'≤3.0=Alto | ≤1.5=Medio | ≤2.0=Bajo | >2.0=Sin Consenso'}
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-4 py-2">σ Riesgo Total</td>
                    <td className="border px-4 py-2">
                      {'≤3.0=Alto | ≤5.0=Medio | ≤7.0=Bajo | >7.0=Sin Consenso'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
