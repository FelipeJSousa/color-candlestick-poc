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

        <div className="info-grid">
          <div className="info-card">
            <h3>📡 API Schema</h3>
            <pre className="code-block">{`{
  timestamp: number,
  open:      number,
  high:      number,
  low:       number,
  close:     number,
  volume:    number,
  bodyColor: "#FF9800",  // ← custom
  wickColor: "#FFC107"   // ← custom
}`}</pre>
          </div>

          <div className="info-card">
            <h3>🎨 How It Works</h3>
            <ol className="how-list">
              <li>
                <strong>Mock API</strong> returns candles with <code>bodyColor</code> &amp; <code>wickColor</code>
              </li>
              <li>
                <strong>KLineCharts</strong> passes entire data object to the chart (ignores unknown fields)
              </li>
              <li>
                <strong>Custom Indicator</strong> reads those color fields in its <code>draw()</code> callback
              </li>
              <li>
                <strong>Canvas</strong> paints each candle with its individual color
              </li>
            </ol>
          </div>

          <div className="info-card">
            <h3>💡 Key Insight</h3>
            <p>
              KLineCharts <code>applyNewData()</code> accepts any extra fields on candle objects.
              The built-in renderer ignores them, but a registered{' '}
              <strong>custom indicator</strong> can read <code>k.bodyColor</code>,{' '}
              <code>k.wickColor</code>, etc. inside its <code>draw()</code> function —
              giving you full per-candle color control with zero hacks.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
