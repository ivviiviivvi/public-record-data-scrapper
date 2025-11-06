import React, { useEffect, useState } from 'react';

import ProspectCard from '@/components/ProspectCard';
import AdvancedFilters from '@/components/AdvancedFilters';
import { ExportProspects } from '@/lib/exportUtils';

import { loadProspects } from '@/lib/mockData';  // ✅ REAL CSV ONLY

function App() {
  const [prospects, setProspects] = useState([]);
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    async function fetchCSV() {
      const rows = await loadProspects();
      setProspects(rows);
      setFiltered(rows);
    }
    fetchCSV();
  }, []);

  return (
    <div className="app-container">
      <AdvancedFilters prospects={prospects} setFiltered={setFiltered} />

      <ExportProspects prospects={filtered} />

      <div className="prospect-grid">
        {filtered.map((p, i) => (
          <ProspectCard key={p.id ?? i} data={p} />
        ))}
      </div>
    </div>
  );
}

export default App;

