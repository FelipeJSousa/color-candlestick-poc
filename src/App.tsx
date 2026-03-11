import KLineChart from './KLineChart'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <span className="logo">◈</span>
            <h1>KLineCharts <span className="accent">Color POC</span></h1>
          </div>
          <p className="header-sub">
            Custom per-candle colors driven by API mock — <code>bodyColor</code> &amp; <code>wickColor</code> fields
          </p>
        </div>
        <div className="header-badge">
          <span className="badge">v9 API</span>
          <span className="badge">React</span>
          <span className="badge">TypeScript</span>
        </div>
      </header>

      <main className="app-main">
        <div className="card">
          <KLineChart />
        </div>
      </main>
    </div>
  )
}
