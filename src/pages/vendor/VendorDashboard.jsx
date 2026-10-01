import { useEffect, useState } from "react";
import client from "../../api/client";
import DashboardTabs from "../../components/DashboardTabs";
import VendorPayouts from "../../components/VendorPayouts";
import { VENDOR_TABS } from "./VendorOrders";

const kes = (n) => `KES ${Number(n || 0).toLocaleString()}`;

export default function VendorDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    client.get("/stats/vendor")
      .then((res) => setStats(res.data))
      .catch(() => setError("Couldn't load sales stats."));
  }, []);

  const maxDaily = Math.max(1, ...(stats?.daily.map((d) => d.revenue) || [1]));
  const open = stats ? stats.byStatus.paid + stats.byStatus.shipped : 0;

  return (
    <div className="page">
      <h1>Selling on Fidus</h1>
      <DashboardTabs base="/vendor" tabs={VENDOR_TABS} />
      {error && <p className="error-text" style={{ marginTop: "1rem" }}>{error}</p>}

      {stats && (
        <>
          <div className="stat-cards">
            <div className="stat-card"><p>Total sales</p><strong>{kes(stats.revenue)}</strong></div>
            <div className="stat-card"><p>Units sold</p><strong>{stats.units}</strong></div>
            <div className="stat-card"><p>Orders</p><strong>{stats.orders}</strong></div>
            <div className="stat-card"><p>Needs action</p><strong>{open}</strong></div>
          </div>

          <h2 className="section-title">Last 30 days</h2>
          <div className="card chart" role="img"
            aria-label={`Daily sales for the last 30 days, best day ${kes(maxDaily)}`}>
            {stats.daily.map((d) => (
              <div key={d.date} className="chart__col" title={`${d.date}: ${kes(d.revenue)}`}>
                <div className="chart__bar" style={{ height: `${(d.revenue / maxDaily) * 100}%` }} />
              </div>
            ))}
          </div>

          {stats.topProducts.length > 0 && (
            <>
              <h2 className="section-title" style={{ marginTop: "1.75rem" }}>Top products</h2>
              <div className="card" style={{ padding: "0.4rem 1.1rem" }}>
                {stats.topProducts.map((p) => (
                  <div key={p.id} className="row">
                    <span>{p.name}</span>
                    <span className="muted">{p.units} sold · {kes(p.revenue)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <VendorPayouts />
    </div>
  );
}
