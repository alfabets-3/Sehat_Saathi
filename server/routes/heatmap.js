import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/data', (req, res) => {
  const { symptom } = req.query;
  
  // Return all heatmap data — no date filter needed for in-memory demo
  let data = db.findAll('heatmap_data');
  
  if (symptom && symptom !== 'all') data = data.filter(d => d.symptom_type === symptom);
  
  // Enrich with village info
  data.forEach(d => {
    const v = db.findOne('villages', v => v.village_id === d.village_id);
    d.village_name = v?.name;
    d.lat = v?.lat;
    d.lng = v?.lng;
    d.district = v?.district;
    d.population = v?.population;
  });
  
  data.sort((a, b) => b.case_count - a.case_count);
  
  // Group by village
  const byVillage = {};
  data.forEach(d => {
    if (!byVillage[d.village_id]) {
      byVillage[d.village_id] = {
        village_id: d.village_id,
        name: d.village_name,
        lat: d.lat,
        lng: d.lng,
        district: d.district,
        population: d.population,
        symptoms: [],
        totalCases: 0,
        maxSeverity: 'GREEN',
      };
    }
    byVillage[d.village_id].symptoms.push({
      type: d.symptom_type,
      count: d.case_count,
      severity: d.severity_level,
    });
    byVillage[d.village_id].totalCases += d.case_count;
    const sevOrder = { GREEN: 0, YELLOW: 1, RED: 2 };
    if ((sevOrder[d.severity_level] || 0) > (sevOrder[byVillage[d.village_id].maxSeverity] || 0)) {
      byVillage[d.village_id].maxSeverity = d.severity_level;
    }
  });
  
  const symptomTypes = [...new Set(data.map(d => d.symptom_type))];
  res.json({ villages: Object.values(byVillage), raw: data, symptomTypes });
});

router.get('/alerts', (req, res) => {
  const red = db.findAll('heatmap_data', h => h.severity_level === 'RED');
  const yellow = db.findAll('heatmap_data', h => h.severity_level === 'YELLOW');
  const alerts = [];
  
  red.forEach(z => {
    const v = db.findOne('villages', v => v.village_id === z.village_id);
    alerts.push({
      level: 'RED',
      type: 'Outbreak Alert',
      village: v?.name,
      district: v?.district,
      symptom: z.symptom_type,
      cases: z.case_count,
      message: `${z.case_count} ${z.symptom_type} cases in ${v?.name} — DHO notification triggered`,
    });
  });
  
  yellow.forEach(z => {
    const v = db.findOne('villages', v => v.village_id === z.village_id);
    alerts.push({
      level: 'YELLOW',
      type: 'Early Warning',
      village: v?.name,
      district: v?.district,
      symptom: z.symptom_type,
      cases: z.case_count,
      message: `Rising ${z.symptom_type} cases (${z.case_count}) in ${v?.name}`,
    });
  });
  
  res.json({ alerts, redCount: red.length, yellowCount: yellow.length });
});

export default router;
