'use client';

import { useState } from 'react';

// MVP data - 23 parcels from Hudspeth CAD
const parcels = [
  {"owner_name":"MOLINA FRANKLIN C","legal_desc":"56, EL ENCANTO #3 LOTS A-H & J-P & S  ( 8.480 ACRES )","geo_id":"E200-003-0560-00A0","prop_id":"10073","appraised":5003,"acres":8.48,"price_per_acre":590},
  {"owner_name":"MOLINA FRANKLIN C","legal_desc":"55, EL ENCANTO #3 LOTS A-H & J-P & S  ( 8.480 ACRES )","geo_id":"E200-003-0550-00A0","prop_id":"10072","appraised":5003,"acres":8.48,"price_per_acre":590},
  {"owner_name":"PERRY RAY","legal_desc":"51 EL ENCANTO #3 LOTS A-S  ( 8.480 ACRES )","geo_id":"E200-003-0510-00A0","prop_id":"10071","appraised":5003,"acres":8.48,"price_per_acre":590},
  {"owner_name":"DAVIS GENT & DORRINE H 2006 LIVING TRUST","legal_desc":"24, EL ENCANTO #3 LOTS A-S  ( 8.480 ACRES )","geo_id":"E200-003-0240-00A0","prop_id":"10013","appraised":5003,"acres":8.48,"price_per_acre":590},
  {"owner_name":"URBINA JESUS","legal_desc":"28 EL ENCANTO #3 LOTS A-S (8.48 ACRES)","geo_id":"E200-003-0280-00A0","prop_id":"10020","appraised":5003,"acres":8.48,"price_per_acre":590},
  {"owner_name":"RAMIREZ JOSE L OR MARIA J","legal_desc":"40 EL ENCANTO #3 LOTS A-H; J-P; S ( 8.480 ACRES )","geo_id":"E200-003-0400-00A0","prop_id":"10035","appraised":5003,"acres":8.48,"price_per_acre":590},
  {"owner_name":"MOLINA FRANKLIN C","legal_desc":"57, EL ENCANTO #3 LOTS E-H & J-P & S  ( 6.360 ACRES )","geo_id":"E200-003-0570-00E0","prop_id":"10076","appraised":3752,"acres":6.36,"price_per_acre":590},
  {"owner_name":"TABOADA LUZ E","legal_desc":"16 EL ENCANTO #3 LOTS A-H  ( 4.240 ACRES )","geo_id":"E200-003-0160-00A0","prop_id":"10001","appraised":2502,"acres":4.24,"price_per_acre":590},
  {"owner_name":"MOLINA FRANKLIN C","legal_desc":"58, EL ENCANTO #3 LOTS A-H  ( 4.240 ACRES )","geo_id":"E200-003-0580-00A0","prop_id":"10077","appraised":2502,"acres":4.24,"price_per_acre":590},
  {"owner_name":"RAMIREZ JOSE L & MA JOSEFINA","legal_desc":"49 EL ENCANTO #3 LOTS J-P & S  ( 4.240 ACRES )","geo_id":"E200-003-0490-00J0","prop_id":"10068","appraised":2502,"acres":4.24,"price_per_acre":590},
  {"owner_name":"BLANKE ROSEMARY","legal_desc":"59, EL ENCANTO #3 LOTS A-D  ( 2.120 ACRES )","geo_id":"E200-003-0590-00A0","prop_id":"10081","appraised":1251,"acres":2.12,"price_per_acre":590},
  {"owner_name":"BLANKE ROSEMARY","legal_desc":"58, EL ENCANTO #3 LOTS N-P, S   ( 2.120 ACRES )","geo_id":"E200-003-0580-00N0","prop_id":"10080","appraised":1251,"acres":2.12,"price_per_acre":590},
  {"owner_name":"CRONE FREDERICK E & KIMBERLY","legal_desc":"EL ENCANTO #3, BLOCK 50, LOT E-H  ( 2.120 ACRES )","geo_id":"E200-003-0500-00E0","prop_id":"10070","appraised":1251,"acres":2.12,"price_per_acre":590},
  {"owner_name":"WEBB MARIE GIEDINGHAGEN","legal_desc":"50, EL ENCANTO #3 LOTS A-D ( 2.120 ACRES )","geo_id":"E200-003-0500-00A0","prop_id":"10069","appraised":1251,"acres":2.12,"price_per_acre":590},
  {"owner_name":"BLANKE ROSEMARY","legal_desc":"49, EL ENCANTO #3 LOTS D-G  ( 2.120 ACRES )","geo_id":"E200-003-0490-00D0","prop_id":"10066","appraised":1251,"acres":2.12,"price_per_acre":590},
  {"owner_name":"MOLINA FRANKLIN C","legal_desc":"57, EL ENCANTO #3 LOTS A-C  ( 1.590 ACRES )","geo_id":"E200-003-0570-00A0","prop_id":"10074","appraised":938,"acres":1.59,"price_per_acre":590},
  {"owner_name":"FALER TERRY L","legal_desc":"58, EL ENCANTO #3 LOTS J-K  ( 1.060 ACRES )","geo_id":"E200-003-0580-00J0","prop_id":"10078","appraised":625,"acres":1.06,"price_per_acre":590},
  {"owner_name":"KING SYLVIA ESTATE","legal_desc":"EL ENCANTO #3, BLOCK 49, LOT A-B ( 1.060 ACRES )","geo_id":"E200-003-0490-00A0","prop_id":"10064","appraised":625,"acres":1.06,"price_per_acre":590},
  {"owner_name":"ALFARO ROBERTO","legal_desc":"EL ENCANTO #3, BLOCK 59, LOT E ( .530 ACRE )","geo_id":"E200-003-0590-00E0","prop_id":"10082","appraised":313,"acres":0.53,"price_per_acre":591},
  {"owner_name":"OLMEDO MIKE & PETER","legal_desc":"EL ENCANTO #3, BLOCK 58, LOT L ( .530 ACRE )","geo_id":"E200-003-0580-00L0","prop_id":"10079","appraised":313,"acres":0.53,"price_per_acre":591},
  {"owner_name":"VARGAS FERNANDO","legal_desc":"EL ENCANTO #3, BLOCK 57, LOT D ( .530 ACRES )","geo_id":"E200-003-0570-00D0","prop_id":"10075","appraised":313,"acres":0.53,"price_per_acre":591},
  {"owner_name":"SUN CITY INV INC","legal_desc":"49 EL ENCANTO #3 LOT H  ( 0.53 ACRES)","geo_id":"E200-003-0490-00H0","prop_id":"10067","appraised":313,"acres":0.53,"price_per_acre":591},
  {"owner_name":"NORTHBANK HOLDINGS","legal_desc":"49, EL ENCANTO #3 LOT C  ( .530 ACRES )","geo_id":"E200-003-0490-00C0","prop_id":"10065","appraised":313,"acres":0.53,"price_per_acre":591}
];

export default function LandPage() {
  const [sortBy, setSortBy] = useState<'acres' | 'appraised'>('acres');
  const [filterMinAcres, setFilterMinAcres] = useState(0);

  const sorted = [...parcels]
    .filter(p => p.acres >= filterMinAcres)
    .sort((a, b) => sortBy === 'acres' ? b.acres - a.acres : b.appraised - a.appraised);

  const totalAcres = sorted.reduce((sum, p) => sum + p.acres, 0);
  const totalValue = sorted.reduce((sum, p) => sum + p.appraised, 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Texas Land Parcels</h1>
        <p className="text-gray-400 mb-6">Hudspeth County • El Encanto #3 Subdivision • 23 parcels</p>
        
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{sorted.length}</div>
            <div className="text-gray-400 text-sm">Parcels</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{totalAcres.toFixed(1)}</div>
            <div className="text-gray-400 text-sm">Total Acres</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">${totalValue.toLocaleString()}</div>
            <div className="text-gray-400 text-sm">Total Appraised</div>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <select 
            className="bg-gray-800 rounded px-3 py-2"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'acres' | 'appraised')}
          >
            <option value="acres">Sort by Acres</option>
            <option value="appraised">Sort by Value</option>
          </select>
          <select 
            className="bg-gray-800 rounded px-3 py-2"
            value={filterMinAcres}
            onChange={(e) => setFilterMinAcres(Number(e.target.value))}
          >
            <option value="0">All sizes</option>
            <option value="1">1+ acres</option>
            <option value="2">2+ acres</option>
            <option value="5">5+ acres</option>
            <option value="8">8+ acres</option>
          </select>
        </div>

        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="text-left p-3">Owner</th>
                <th className="text-right p-3">Acres</th>
                <th className="text-right p-3">Appraised</th>
                <th className="text-right p-3">$/Acre</th>
                <th className="text-left p-3">Legal Description</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <tr key={p.prop_id} className={i % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}>
                  <td className="p-3 font-medium">{p.owner_name}</td>
                  <td className="p-3 text-right text-blue-400">{p.acres.toFixed(2)}</td>
                  <td className="p-3 text-right text-green-400">${p.appraised.toLocaleString()}</td>
                  <td className="p-3 text-right text-yellow-400">${p.price_per_acre}</td>
                  <td className="p-3 text-gray-400 text-sm truncate max-w-xs">{p.legal_desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-gray-500 text-sm mt-4">
          Data source: Hudspeth County Appraisal District • Tax Year 2025
        </p>
      </div>
    </div>
  );
}
