import React, { useEffect, useState } from 'react';
import { loadProspects } from '@/lib/mockData';  // ✅ REAL CSV ONLY

function AgenticDashboard() {
  const [prospects, setProspects] = useState([]);

  useEffect(() => {
    async function fetchCSV() {
      const rows = await loadProspects();
      setProspects(rows);
    }
    fetchCSV();
  }, []);

  if (prospects.length === 0) {
    return <div style={{ color: 'white', padding: 20 }}>Loading real UCC filings…</div>;
  }

  return (
    <div style={{ color: 'white', padding: 20 }}>
      <h2>Real UCC Leads Loaded</h2>
      <p>{prospects.length} total filings</p>
    </div>
  );
}

export default AgenticDashboard;

