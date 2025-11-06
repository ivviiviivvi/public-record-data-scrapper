export async function loadProspects() {
  const res = await fetch('/ucc_enriched.csv');

  if (!res.ok) {
    console.error('CSV fetch failed:', res.status, res.statusText);
    return [];
  }

  const text = await res.text();
  const rows = text.trim().split('\n');
  const headers = rows.shift()?.split(',') ?? [];

  return rows.map(row => {
    const values = row.split(',');
    const entry = Object.fromEntries(
      headers.map((h, i) => [h.trim(), values[i]?.trim() ?? ''])
    );

    return {
      id: crypto.randomUUID(),
      companyName: entry['Business Name'] || '',
      address1: entry['Address Line 1'] || '',
      address2: entry['Address Line 2'] || '',
      city: entry['City'] || '',
      state: entry['State'] || '',
      zip: entry['Zip Code'] || '',
      filingDate: entry['Filing Date'] || '',
      phone: entry['Phone'] || '',
      email: entry['Email'] || '',
      owner: entry['Owner Name'] || '',
      lienNumber: entry['Lien Number'] || '',
      fileType: entry['File Type'] || '',
      lienType: entry['Lien Type'] || '',
      score: 100,
      defaultAge: '3y ago',
      growthSignals: 1,
      healthScore: 'B',
      status: 'New'
    };
  });
}

