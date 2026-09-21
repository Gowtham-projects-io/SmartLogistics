/**
 * Client-side cargo compatibility rules (mirrors backend algorithms/cargo_compatibility.py).
 */

const RULES = [
  ['textiles',       'electronics',    true,  'ok',       'Electronics and textiles can share space safely.'],
  ['textiles',       'packaged_goods', true,  'ok',       'Packaged goods and textiles are fully compatible.'],
  ['electronics',    'packaged_goods', true,  'ok',       'Electronics and packaged goods can be co-loaded.'],
  ['general',        'textiles',       true,  'ok',       'General goods and textiles are compatible.'],
  ['general',        'packaged_goods', true,  'ok',       'General goods and packaged goods are compatible.'],
  ['general',        'electronics',    true,  'ok',       'General goods and electronics are compatible.'],
  ['food',           'textiles',       true,  'warning',  'Food and textiles can co-exist — ensure sealed packaging.'],
  ['food',           'packaged_goods', true,  'warning',  'Food-grade packaging required for co-loading.'],
  ['fragile',        'electronics',    true,  'warning',  'Both fragile — ensure adequate padding.'],
  ['food',           'chemicals',      false, 'rejected', 'Food and chemicals cannot be co-loaded — contamination risk.'],
  ['fragile',        'heavy_machinery',false, 'rejected', 'Fragile goods cannot be co-loaded with heavy machinery.'],
  ['hazardous',      'general',        false, 'rejected', 'Hazardous goods require a dedicated truck.'],
  ['hazardous',      'textiles',       false, 'rejected', 'Hazardous goods cannot be co-loaded with textiles.'],
  ['hazardous',      'electronics',    false, 'rejected', 'Hazardous goods cannot be co-loaded with electronics.'],
  ['hazardous',      'food',           false, 'rejected', 'Hazardous goods cannot be co-loaded with food.'],
  ['chemicals',      'electronics',    false, 'rejected', 'Chemical fumes may damage electronics.'],
]

function normalize(s) {
  return s.trim().toLowerCase().replace(/[\s-]/g, '_')
}

export function checkCargoCompatibility(truckCargo, shipmentCargo) {
  const a = normalize(truckCargo)
  const b = normalize(shipmentCargo)

  if (a === b) {
    return { compatible: true, reason: `Same cargo type (${a}) — fully compatible.`, severity: 'ok' }
  }

  for (const [ra, rb, compatible, severity, reason] of RULES) {
    if ((ra === a && rb === b) || (ra === b && rb === a)) {
      return { compatible, reason, severity }
    }
  }

  return {
    compatible: true,
    reason: `No specific restriction for '${truckCargo}' + '${shipmentCargo}'. Verify with the driver.`,
    severity: 'warning',
  }
}
