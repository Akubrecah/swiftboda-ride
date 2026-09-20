import React, { useState } from 'react';

export default function AdminDashboardApp() {
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'DISPATCH' | 'SURGE' | 'DRIVERS' | 'RIDERS' | 'TRANSACTIONS' | 'SAFETY'>('TELEMETRY');
  
  const [telemetry] = useState({
    activeDrivers: 48,
    onlineDrivers: 62,
    activeTrips: 19,
    completedTripsToday: 1420,
    grossRevenueToday: 8450.00,
    platformCommissionToday: 1267.50,
    openSosIncidents: 1,
    avgEtaMinutes: 2.8,
  });

  const [surgeMultiplier, setSurgeMultiplier] = useState(1.8);
  const [surgeZoneActive, setSurgeZoneActive] = useState(true);

  const [driverApprovals, setDriverApprovals] = useState([
    { id: 'drv-101', name: 'Peter Omondi', phone: '+254722112233', plate: 'KMD 882X', vehicle: 'TVS HLX 150', category: 'BODA_STANDARD', nationalId: '32984102', dlNumber: 'DL-A2-8921', logbookVerified: true, insuranceExpiry: '2026-11-30', status: 'PENDING' },
    { id: 'drv-102', name: 'Grace Wambui', phone: '+254733445566', plate: 'KCF 112Z', vehicle: 'Bajaj Boxer 150', category: 'BODA_COMFORT', nationalId: '29817420', dlNumber: 'DL-A2-4412', logbookVerified: true, insuranceExpiry: '2026-10-15', status: 'PENDING' },
    { id: 'drv-103', name: 'Hassan Ali', phone: '+254788990011', plate: 'KME 504Y', vehicle: 'Boxer 150 XL', category: 'BODA_XL', nationalId: '34102941', dlNumber: 'DL-A2-1082', logbookVerified: false, insuranceExpiry: '2026-08-01', status: 'REJECTED' },
  ]);

  const [riderVerifications, setRiderVerifications] = useState([
    { id: 'usr-001', name: 'Amina Mohamed', phone: '+254712345678', email: 'amina@swiftboda.ke', tripsCount: 38, mpesaKycVerified: true, riskScore: 'LOW', status: 'VERIFIED' },
    { id: 'usr-003', name: 'Faith Wanjiku', phone: '+254733445566', email: 'faith@swiftboda.ke', tripsCount: 12, mpesaKycVerified: false, riskScore: 'MEDIUM', status: 'PENDING_KYC' },
    { id: 'usr-004', name: 'Brian Kiprono', phone: '+254799887766', email: 'brian@swiftboda.ke', tripsCount: 1, mpesaKycVerified: false, riskScore: 'HIGH', status: 'FLAGGED' },
  ]);

  const [transactions, setTransactions] = useState([
    { id: 'tx-801', mpesaReceiptNo: 'QK89XP4021', tripId: 'trip-901', riderName: 'Amina Mohamed', driverName: 'John Kamau', grossAmount: 250.00, platformFee: 37.50, driverPayout: 212.50, paymentMethod: 'MPESA', timestamp: 'Today 12:45 PM', status: 'SETTLED' },
    { id: 'tx-802', mpesaReceiptNo: 'MP9912AZ88', tripId: 'trip-902', riderName: 'Faith Wanjiku', driverName: 'David Ochieng', grossAmount: 480.00, platformFee: 72.00, driverPayout: 408.00, paymentMethod: 'MPESA', timestamp: 'Today 11:30 AM', status: 'SETTLED' },
    { id: 'tx-803', mpesaReceiptNo: 'QK77TR1092', tripId: 'trip-903', riderName: 'Alex Mercer', driverName: 'Peter Omondi', grossAmount: 160.00, platformFee: 24.00, driverPayout: 136.00, paymentMethod: 'WALLET', timestamp: 'Today 10:15 AM', status: 'SETTLED' },
  ]);

  const [sosAlerts] = useState([
    { id: 'sos-901', tripId: 'trip-781', riderName: 'Alex Rider', driverName: 'Kipchoge Boda', location: 'Westlands Karuna Rd', time: '10 mins ago', status: 'INVESTIGATING' },
  ]);

  const handleApproveDriver = (id: string) => {
    setDriverApprovals((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'APPROVED' } : d))
    );
  };

  const handleRejectDriver = (id: string) => {
    setDriverApprovals((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'REJECTED' } : d))
    );
  };

  const handleVerifyRider = (id: string) => {
    setRiderVerifications((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'VERIFIED', mpesaKycVerified: true, riskScore: 'LOW' } : r))
    );
  };

  const handleFlagRider = (id: string) => {
    setRiderVerifications((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: r.status === 'FLAGGED' ? 'PENDING_KYC' : 'FLAGGED', riskScore: r.status === 'FLAGGED' ? 'MEDIUM' : 'HIGH' } : r
      )
    );
  };

  const handleReconcileTx = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'SETTLED' } : t))
    );
    alert('Daraja B2C / C2B Ledger Reconciled successfully.');
  };

  return (
    <div style={styles.container}>
      {/* Top Neumorphic Navbar */}
      <header style={styles.navbar}>
        <div style={styles.navBrand}>
          <span style={styles.logoBadge}>⚡</span>
          <span style={styles.brandName}>SWIFT BODA</span>
          <span style={styles.envTag}>OPERATIONS & VERIFICATION PORTAL</span>
        </div>

        <div style={styles.navStats}>
          <div style={styles.miniStatNeumorphic}>
            <span style={styles.miniStatLabel}>ACTIVE TRIPS</span>
            <span style={styles.miniStatValue}>{telemetry.activeTrips}</span>
          </div>
          <div style={styles.miniStatNeumorphic}>
            <span style={styles.miniStatLabel}>GROSS REVENUE</span>
            <span style={{ ...styles.miniStatValue, color: '#10B981' }}>KES {telemetry.grossRevenueToday.toLocaleString()}</span>
          </div>
          <div style={styles.miniStatNeumorphic}>
            <span style={styles.miniStatLabel}>EMERGENCY SOS</span>
            <span style={{ ...styles.miniStatValue, color: telemetry.openSosIncidents > 0 ? '#EF4444' : '#10B981' }}>
              {telemetry.openSosIncidents} OPEN
            </span>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div style={styles.mainLayout}>
        <aside style={styles.sidebar}>
          <nav style={styles.sidebarNav}>
            <button
              style={activeTab === 'TELEMETRY' ? styles.tabBtnActiveNeumorphic : styles.tabBtnNeumorphic}
              onClick={() => setActiveTab('TELEMETRY')}
            >
              📊 Live Telemetry & Spatial Heatmap
            </button>
            <button
              style={activeTab === 'DISPATCH' ? styles.tabBtnActiveNeumorphic : styles.tabBtnNeumorphic}
              onClick={() => setActiveTab('DISPATCH')}
            >
              🗺️ Dispatch & Active Rides
            </button>
            <button
              style={activeTab === 'SURGE' ? styles.tabBtnActiveNeumorphic : styles.tabBtnNeumorphic}
              onClick={() => setActiveTab('SURGE')}
            >
              🔥 Dynamic Surge Controller
            </button>
            <button
              style={activeTab === 'DRIVERS' ? styles.tabBtnActiveNeumorphic : styles.tabBtnNeumorphic}
              onClick={() => setActiveTab('DRIVERS')}
            >
              👨‍✈️ Driver Verification ({driverApprovals.filter((d) => d.status === 'PENDING').length})
            </button>
            <button
              style={activeTab === 'RIDERS' ? styles.tabBtnActiveNeumorphic : styles.tabBtnNeumorphic}
              onClick={() => setActiveTab('RIDERS')}
            >
              👤 Rider KYC & Trust ({riderVerifications.filter((r) => r.status === 'PENDING_KYC').length})
            </button>
            <button
              style={activeTab === 'TRANSACTIONS' ? styles.tabBtnActiveNeumorphic : styles.tabBtnNeumorphic}
              onClick={() => setActiveTab('TRANSACTIONS')}
            >
              💳 M-Pesa Audits ({transactions.length})
            </button>
            <button
              style={activeTab === 'SAFETY' ? styles.tabBtnActiveNeumorphic : styles.tabBtnNeumorphic}
              onClick={() => setActiveTab('SAFETY')}
            >
              🚨 Emergency Response ({sosAlerts.length})
            </button>
          </nav>
        </aside>

        <main style={styles.contentArea}>
          {activeTab === 'TELEMETRY' && (
            <div>
              <h2 style={styles.sectionHeader}>Platform Live Telemetry & Performance</h2>

              <div style={styles.grid4}>
                <div style={styles.kpiCardNeumorphic}>
                  <span style={styles.kpiTitle}>Active Drivers Online</span>
                  <span style={styles.kpiValue}>{telemetry.onlineDrivers}</span>
                  <span style={styles.kpiSub}>48 Currently On Trips</span>
                </div>
                <div style={styles.kpiCardNeumorphic}>
                  <span style={styles.kpiTitle}>Trips Completed Today</span>
                  <span style={styles.kpiValue}>{telemetry.completedTripsToday}</span>
                  <span style={styles.kpiSub}>+14% vs yesterday</span>
                </div>
                <div style={styles.kpiCardNeumorphic}>
                  <span style={styles.kpiTitle}>Platform Commission (15%)</span>
                  <span style={{ ...styles.kpiValue, color: '#10B981' }}>${telemetry.platformCommissionToday.toFixed(2)}</span>
                  <span style={styles.kpiSub}>Net Platform Profit</span>
                </div>
                <div style={styles.kpiCardNeumorphic}>
                  <span style={styles.kpiTitle}>Average Pickup ETA</span>
                  <span style={styles.kpiValue}>{telemetry.avgEtaMinutes} mins</span>
                  <span style={styles.kpiSub}>Target &lt; 3.5 mins</span>
                </div>
              </div>

              <div style={styles.panelBoxNeumorphic}>
                <h3 style={styles.panelTitle}>Nairobi Metropolitan Live Spatial Demand Density</h3>
                <div style={styles.mockHeatmap}>
                  <div style={styles.surgeZoneOverlay}>
                    <span>🔥 WESTLANDS HIGH DEMAND SURGE ZONE (1.8x)</span>
                  </div>
                  <div style={styles.heatmapPoint1}>📍 NBO Airport Cluster</div>
                  <div style={styles.heatmapPoint2}>📍 CBD Central Corridor</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'SURGE' && (
            <div>
              <h2 style={styles.sectionHeader}>Dynamic Surge Pricing Controller</h2>
              <div style={styles.panelBoxNeumorphic}>
                <h3 style={styles.panelTitle}>Westlands & Kilimani Multiplier Override</h3>
                
                <div style={styles.controlRow}>
                  <label style={styles.label}>Active Multiplier: </label>
                  <span style={styles.multiplierBadge}>{surgeMultiplier.toFixed(1)}x</span>
                  <input
                    type="range"
                    min="1.0"
                    max="4.0"
                    step="0.1"
                    value={surgeMultiplier}
                    onChange={(e) => setSurgeMultiplier(parseFloat(e.target.value))}
                    style={styles.slider}
                  />
                </div>

                <div style={{ marginTop: '20px' }}>
                  <button
                    style={surgeZoneActive ? styles.activeZoneBtn : styles.inactiveZoneBtn}
                    onClick={() => setSurgeZoneActive(!surgeZoneActive)}
                  >
                    {surgeZoneActive ? 'DISABLE DYNAMIC SURGE ZONE' : 'ENABLE DYNAMIC SURGE ZONE'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'DRIVERS' && (
            <div>
              <h2 style={styles.sectionHeader}>Driver Document & Identity Verification Pipeline</h2>
              <div style={styles.panelBoxNeumorphic}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thRow}>
                      <th style={styles.th}>Driver ID</th>
                      <th style={styles.th}>Name & Contact</th>
                      <th style={styles.th}>Plate & Model</th>
                      <th style={styles.th}>Category</th>
                      <th style={styles.th}>National ID</th>
                      <th style={styles.th}>DL & Class</th>
                      <th style={styles.th}>Logbook</th>
                      <th style={styles.th}>Insurance Exp</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {driverApprovals.map((drv) => (
                      <tr key={drv.id} style={styles.tr}>
                        <td style={styles.td}>{drv.id}</td>
                        <td style={styles.td}>
                          <strong>{drv.name}</strong>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>{drv.phone}</div>
                        </td>
                        <td style={styles.td}>
                          <strong>{drv.plate}</strong>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>{drv.vehicle}</div>
                        </td>
                        <td style={styles.td}>{drv.category}</td>
                        <td style={styles.td}>{drv.nationalId}</td>
                        <td style={styles.td}>
                          <span style={styles.verifiedTag}>{drv.dlNumber}</span>
                        </td>
                        <td style={styles.td}>
                          {drv.logbookVerified ? (
                            <span style={styles.verifiedTag}>✓ Verified</span>
                          ) : (
                            <span style={styles.failedTag}>✗ Unconfirmed</span>
                          )}
                        </td>
                        <td style={styles.td}>{drv.insuranceExpiry}</td>
                        <td style={styles.td}>
                          <span
                            style={{
                              color:
                                drv.status === 'APPROVED'
                                  ? '#10B981'
                                  : drv.status === 'PENDING'
                                  ? '#F59E0B'
                                  : '#EF4444',
                              fontWeight: 'bold',
                              fontSize: '12px',
                            }}
                          >
                            {drv.status}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {drv.status === 'PENDING' ? (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                style={styles.approveBtnNeumorphic}
                                onClick={() => handleApproveDriver(drv.id)}
                              >
                                APPROVE
                              </button>
                              <button
                                style={{ ...styles.resolveBtnNeumorphic, padding: '8px 12px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' }}
                                onClick={() => handleRejectDriver(drv.id)}
                              >
                                REJECT
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#64748B' }}>Decision Recorded</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'RIDERS' && (
            <div>
              <h2 style={styles.sectionHeader}>Passenger KYC & Identity Verification Desk</h2>
              <div style={styles.panelBoxNeumorphic}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thRow}>
                      <th style={styles.th}>User ID</th>
                      <th style={styles.th}>Name & Email</th>
                      <th style={styles.th}>Phone</th>
                      <th style={styles.th}>Trips Taken</th>
                      <th style={styles.th}>M-Pesa KYC Match</th>
                      <th style={styles.th}>Risk Level</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riderVerifications.map((rider) => (
                      <tr key={rider.id} style={styles.tr}>
                        <td style={styles.td}>{rider.id}</td>
                        <td style={styles.td}>
                          <strong>{rider.name}</strong>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>{rider.email}</div>
                        </td>
                        <td style={styles.td}>{rider.phone}</td>
                        <td style={styles.td}>{rider.tripsCount} trips</td>
                        <td style={styles.td}>
                          {rider.mpesaKycVerified ? (
                            <span style={styles.verifiedTag}>✓ Safaricom Match</span>
                          ) : (
                            <span style={styles.failedTag}>✗ Pending Validation</span>
                          )}
                        </td>
                        <td style={styles.td}>
                          <span
                            style={{
                              color:
                                rider.riskScore === 'LOW'
                                  ? '#10B981'
                                  : rider.riskScore === 'MEDIUM'
                                  ? '#F59E0B'
                                  : '#EF4444',
                              fontWeight: 'bold',
                            }}
                          >
                            {rider.riskScore}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span
                            style={{
                              color:
                                rider.status === 'VERIFIED'
                                  ? '#10B981'
                                  : rider.status === 'PENDING_KYC'
                                  ? '#F59E0B'
                                  : '#EF4444',
                              fontWeight: 'bold',
                            }}
                          >
                            {rider.status}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {rider.status !== 'VERIFIED' && (
                              <button
                                style={styles.approveBtnNeumorphic}
                                onClick={() => handleVerifyRider(rider.id)}
                              >
                                VERIFY KYC
                              </button>
                            )}
                            <button
                              style={{
                                ...styles.resolveBtnNeumorphic,
                                padding: '8px 12px',
                                backgroundColor: rider.status === 'FLAGGED' ? '#3B82F6' : 'rgba(245, 158, 11, 0.2)',
                                color: rider.status === 'FLAGGED' ? '#FFF' : '#F59E0B',
                              }}
                              onClick={() => handleFlagRider(rider.id)}
                            >
                              {rider.status === 'FLAGGED' ? 'UNFLAG' : 'FLAG RISK'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'TRANSACTIONS' && (
            <div>
              <h2 style={styles.sectionHeader}>Safaricom M-Pesa Daraja Settlement & Auditing Ledger</h2>
              <div style={styles.panelBoxNeumorphic}>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                  <div style={{ ...styles.kpiCardNeumorphic, flex: 1 }}>
                    <span style={styles.kpiTitle}>Total Audited Gross</span>
                    <span style={styles.kpiValue}>
                      KES {transactions.reduce((s, t) => s + t.grossAmount, 0).toFixed(2)}
                    </span>
                  </div>
                  <div style={{ ...styles.kpiCardNeumorphic, flex: 1 }}>
                    <span style={styles.kpiTitle}>Driver Disbursements (85%)</span>
                    <span style={{ ...styles.kpiValue, color: '#38BDF8' }}>
                      KES {transactions.reduce((s, t) => s + t.driverPayout, 0).toFixed(2)}
                    </span>
                  </div>
                  <div style={{ ...styles.kpiCardNeumorphic, flex: 1 }}>
                    <span style={styles.kpiTitle}>Platform Commission (15%)</span>
                    <span style={{ ...styles.kpiValue, color: '#10B981' }}>
                      KES {transactions.reduce((s, t) => s + t.platformFee, 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thRow}>
                      <th style={styles.th}>Receipt #</th>
                      <th style={styles.th}>Trip ID</th>
                      <th style={styles.th}>Passenger</th>
                      <th style={styles.th}>Driver</th>
                      <th style={styles.th}>Gross Fare</th>
                      <th style={styles.th}>Driver (85%)</th>
                      <th style={styles.th}>Fee (15%)</th>
                      <th style={styles.th}>Gateway</th>
                      <th style={styles.th}>Timestamp</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Daraja Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} style={styles.tr}>
                        <td style={styles.td}>
                          <strong style={{ color: '#10B981' }}>{tx.mpesaReceiptNo}</strong>
                        </td>
                        <td style={styles.td}>#{tx.tripId}</td>
                        <td style={styles.td}>{tx.riderName}</td>
                        <td style={styles.td}>{tx.driverName}</td>
                        <td style={styles.td}>
                          <strong>KES {tx.grossAmount.toFixed(2)}</strong>
                        </td>
                        <td style={{ ...styles.td, color: '#38BDF8' }}>KES {tx.driverPayout.toFixed(2)}</td>
                        <td style={{ ...styles.td, color: '#10B981' }}>KES {tx.platformFee.toFixed(2)}</td>
                        <td style={styles.td}>{tx.paymentMethod}</td>
                        <td style={styles.td}>{tx.timestamp}</td>
                        <td style={styles.td}>
                          <span style={styles.verifiedTag}>{tx.status}</span>
                        </td>
                        <td style={styles.td}>
                          <button
                            style={styles.approveBtnNeumorphic}
                            onClick={() => handleReconcileTx(tx.id)}
                          >
                            RECONCILE
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'SAFETY' && (
            <div>
              <h2 style={styles.sectionHeader}>Emergency SOS & Incident Response Desk</h2>
              <div style={styles.panelBoxNeumorphic}>
                {sosAlerts.map((sos) => (
                  <div key={sos.id} style={styles.sosCardNeumorphic}>
                    <div style={styles.sosCardHeader}>
                      <span style={styles.sosBadge}>🚨 EMERGENCY SOS ALERT • {sos.id}</span>
                      <span style={styles.sosTime}>{sos.time}</span>
                    </div>
                    <p style={{ marginTop: '6px' }}><strong>Rider:</strong> {sos.riderName} | <strong>Driver:</strong> {sos.driverName}</p>
                    <p style={{ color: '#94A3B8', fontSize: '13px', marginTop: '4px' }}>Location: {sos.location}</p>
                    <div style={{ marginTop: '14px', display: 'flex', gap: '12px' }}>
                      <button style={styles.dispatchEmergencyBtnNeumorphic}>DISPATCH EMERGENCY TEAM</button>
                      <button style={styles.resolveBtnNeumorphic}>MARK AS RESOLVED</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0E1420', color: '#F8FAFC' },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#131B2E', padding: '14px 28px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' },
  navBrand: { display: 'flex', alignItems: 'center', gap: '12px' },
  logoBadge: { backgroundColor: '#10B981', padding: '4px 8px', borderRadius: '8px', fontSize: '18px' },
  brandName: { fontSize: '22px', fontWeight: '900', color: '#10B981', letterSpacing: '1.2px' },
  envTag: { backgroundColor: '#0A0E17', color: '#34D399', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', border: '1px solid #10B981' },

  navStats: { display: 'flex', gap: '18px' },
  miniStatNeumorphic: { backgroundColor: '#0A0E17', padding: '8px 14px', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', border: '1px solid #1E293B' },
  miniStatLabel: { fontSize: '10px', color: '#94A3B8', fontWeight: 'bold' },
  miniStatValue: { fontSize: '16px', fontWeight: '900', color: '#FFF' },

  mainLayout: { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebar: { width: '280px', backgroundColor: '#131B2E', borderRight: '1px solid rgba(255, 255, 255, 0.08)', padding: '18px' },
  sidebarNav: { display: 'flex', flexDirection: 'column', gap: '10px' },
  tabBtnNeumorphic: { background: '#0A0E17', border: '1px solid #1E293B', color: '#94A3B8', textAlign: 'left', padding: '14px', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  tabBtnActiveNeumorphic: { backgroundColor: '#10B981', color: '#FFF', textAlign: 'left', padding: '14px', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', border: 'none' },

  contentArea: { flex: 1, padding: '28px', overflowY: 'auto' },
  sectionHeader: { fontSize: '24px', fontWeight: 'bold', marginBottom: '22px' },

  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px', marginBottom: '28px' },
  kpiCardNeumorphic: { backgroundColor: '#131B2E', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column' },
  kpiTitle: { fontSize: '12px', color: '#94A3B8', fontWeight: 'bold' },
  kpiValue: { fontSize: '28px', fontWeight: '900', color: '#FFF', margin: '8px 0' },
  kpiSub: { fontSize: '11px', color: '#64748B' },

  panelBoxNeumorphic: { backgroundColor: '#131B2E', padding: '22px', borderRadius: '18px', border: '1px solid rgba(255, 255, 255, 0.08)' },
  panelTitle: { fontSize: '17px', fontWeight: 'bold', marginBottom: '18px' },
  mockHeatmap: { height: '260px', backgroundColor: '#0A0E17', borderRadius: '14px', position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #1E293B' },
  surgeZoneOverlay: { backgroundColor: 'rgba(239, 68, 68, 0.25)', border: '2px dashed #EF4444', padding: '14px 28px', borderRadius: '24px', color: '#FCA5A5', fontWeight: 'bold' },
  heatmapPoint1: { position: 'absolute', top: '30px', right: '40px', color: '#38BDF8', fontSize: '12px', fontWeight: 'bold' },
  heatmapPoint2: { position: 'absolute', bottom: '30px', left: '40px', color: '#34D399', fontSize: '12px', fontWeight: 'bold' },

  controlRow: { display: 'flex', alignItems: 'center', gap: '16px' },
  label: { fontSize: '14px', fontWeight: 'bold' },
  multiplierBadge: { fontSize: '24px', fontWeight: '900', color: '#F59E0B' },
  slider: { flex: 1 },
  activeZoneBtn: { backgroundColor: '#DC2626', color: '#FFF', padding: '12px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold' },
  inactiveZoneBtn: { backgroundColor: '#10B981', color: '#FFF', padding: '12px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold' },

  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { borderBottom: '1px solid #1E293B', textAlign: 'left' },
  th: { padding: '14px', color: '#94A3B8', fontSize: '12px', fontWeight: 'bold' },
  tr: { borderBottom: '1px solid #1E293B' },
  td: { padding: '14px', fontSize: '13px' },
  verifiedTag: { color: '#34D399', fontWeight: '600', fontSize: '12px' },
  failedTag: { color: '#EF4444', fontWeight: '600', fontSize: '12px' },
  approveBtnNeumorphic: { backgroundColor: '#10B981', color: '#FFF', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' },

  sosCardNeumorphic: { backgroundColor: '#3F0707', border: '1px solid #991B1B', borderRadius: '14px', padding: '18px' },
  sosCardHeader: { display: 'flex', justifyContent: 'space-between' },
  sosBadge: { color: '#FCA5A5', fontWeight: '900', fontSize: '14px' },
  sosTime: { color: '#F87171', fontSize: '12px' },
  dispatchEmergencyBtnNeumorphic: { backgroundColor: '#DC2626', color: '#FFF', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
  resolveBtnNeumorphic: { backgroundColor: '#1E293B', color: '#CBD5E1', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
};
