function getMergedParams(rawQuery) {
  const raw = new URLSearchParams(rawQuery);
  const merged = {};

  for (const [key, value] of raw.entries()) {
    const values = value.split(',').map(v => v.trim());
    if (merged[key]) {
      merged[key].push(...values);
    } else {
      merged[key] = [...values];
    }
  }

  // Rimuove duplicati e unisce in stringhe CSV
  for (const key in merged) {
    merged[key] = [...new Set(merged[key])].join(',');
  }

  return merged;
}

exports.handler = async (event, context) => {
  const mergedParams = getMergedParams(event.rawQuery || '');

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      parameters: mergedParams
    })
  };
};
