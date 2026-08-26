import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Papa from 'papaparse';
import { z } from 'zod';
import { MOCK_DEPARTMENTS } from '../../services/supabaseClient';
import { apiService } from '../../services/apiService';
import { Camera, CameraType, CameraStatus } from '../../types/camera.types';
import {
  ArrowLeft,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  Download
} from 'lucide-react';

const csvRowSchema = z.object({
  camera_id: z.string().min(3),
  camera_name: z.string().min(3),
  camera_type: z.enum(['FIXED_BULLET', 'FIXED_DOME', 'PTZ', 'ANPR_SPECIAL', 'THERMAL', 'PANORAMIC_360']),
  departmentCode: z.string().min(2),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  ip_address: z.string().optional(),
  rtsp_url: z.string().optional()
});

interface ParsedRowResult {
  rowIndex: number;
  data: any;
  isValid: boolean;
  errors: string[];
}

export const CameraBulkImportPage: React.FC = () => {
  const navigate = useNavigate();

  const [parsedRows, setParsedRows] = useState<ParsedRowResult[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  const sampleCsvContent = `camera_id,camera_name,camera_type,departmentCode,latitude,longitude,ip_address,rtsp_url
GJ-AHM-POL-101,SG Highway Drive Junction,ANPR_SPECIAL,DEPT-AMD-TRAFFIC,23.0310,72.5080,10.120.10.101,rtsp://admin:pass@10.120.10.101:554/live/ch0
GJ-GND-TRN-102,Sector 10 Capital Park,PTZ,DEPT-GND-SMART,23.2210,72.6410,10.130.20.102,rtsp://admin:pass@10.130.20.102:554/live/ch0
GJ-SRT-MNC-103,Adajan Main Circle,FIXED_BULLET,DEPT-SRT-PORT,21.1980,72.7950,10.140.30.103,rtsp://admin:pass@10.140.30.103:554/live/ch0`;

  const downloadSampleTemplate = () => {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_cctv_bulk_import.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (file: File) => {
    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: ParsedRowResult[] = results.data.map((rawRow: any, index: number) => {
          const validation = csvRowSchema.safeParse(rawRow);
          let errs: string[] = [];

          if (!validation.success) {
            errs = validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
          }

          const dept = MOCK_DEPARTMENTS.find((d: any) => d.code === rawRow.departmentCode);
          if (!dept && validation.success) {
            errs.push(`Unknown department code '${rawRow.departmentCode}'`);
          }

          return {
            rowIndex: index + 2,
            data: rawRow,
            isValid: validation.success && errs.length === 0,
            errors: errs
          };
        });

        setParsedRows(rows);
      }
    });
  };

  const executeImport = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert('No valid rows available to import!');
      return;
    }

    const newCameras: Camera[] = validRows.map(r => {
      const data = r.data;
      const dept = MOCK_DEPARTMENTS.find((d: any) => d.code === data.departmentCode) || MOCK_DEPARTMENTS[0];

      return {
        id: `c-bulk-${Date.now()}-${r.rowIndex}`,
        camera_id: data.camera_id,
        camera_name: data.camera_name,
        department_id: dept.id,
        departments: { name: dept.name, code: dept.code },
        camera_type: data.camera_type as CameraType,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        address: dept.district,
        district: dept.district,
        city: dept.district,
        ward: 'Central',
        pin_code: '380001',
        status: 'ONLINE' as CameraStatus,
        connectivity_type: 'FIBER_OPTIC',
        storage_type: 'CENTRAL_NVR',
        resolution: '1080P',
        ip_address: data.ip_address,
        rtsp_url: data.rtsp_url,
        retention_days: 30,
        installation_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        ai_capabilities: ['ANPR', 'CROWD_DENSITY'],
        ping_latency_ms: 14,
        stream_status: 'ACTIVE'
      };
    });

    apiService.bulkAddCameras(newCameras);

    alert(`Successfully imported ${newCameras.length} camera records into central registry!`);
    navigate('/cameras');
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/cameras"
          className="inline-flex items-center space-x-2 text-xs font-medium text-slate-500 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Camera Registry</span>
        </Link>
        <button
          onClick={downloadSampleTemplate}
          className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-2 shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Sample CSV</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-2 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <UploadCloud className="w-5 h-5 text-blue-600" />
          <span>Bulk CSV Camera Asset Ingestion</span>
        </h2>
        <p className="text-xs text-slate-500">
          Batch parse camera records using PapaParse and execute validated imports.
        </p>
      </div>

      <div className="bg-white border-2 border-dashed border-slate-300 hover:border-blue-500 transition p-8 rounded-xl text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 mx-auto flex items-center justify-center text-blue-600">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Upload CCTV Metadata CSV File</h3>
          <p className="text-xs text-slate-500 mt-1">Select a `.csv` file from your workstation</p>
        </div>

        <input
          type="file"
          accept=".csv"
          id="csv-file-input"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />

        <label
          htmlFor="csv-file-input"
          className="inline-block px-5 py-2 rounded-lg bg-blue-700 text-white font-semibold text-xs cursor-pointer hover:bg-blue-800 transition shadow-sm"
        >
          Select CSV File
        </label>

        {fileName && (
          <div className="text-xs font-mono text-blue-700 pt-2 font-medium">
            Selected: {fileName}
          </div>
        )}
      </div>

      {parsedRows.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">CSV Parsing Results</h3>
              <div className="text-xs font-mono mt-1 space-x-4">
                <span className="text-emerald-600 font-bold">✓ {validCount} Valid</span>
                <span className="text-rose-600 font-bold">✕ {invalidCount} Invalid</span>
              </div>
            </div>

            <button
              onClick={executeImport}
              disabled={validCount === 0}
              className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 disabled:opacity-40 transition shadow-sm flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Import {validCount} Records</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-3">Line #</th>
                  <th className="py-2.5 px-3">Camera ID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Dept Code</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Diagnostic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {parsedRows.map((r) => (
                  <tr key={r.rowIndex} className={r.isValid ? 'hover:bg-slate-50' : 'bg-rose-50'}>
                    <td className="py-2.5 px-3 font-bold text-slate-500">Line {r.rowIndex}</td>
                    <td className="py-2.5 px-3 text-blue-700 font-bold">{r.data.camera_id || 'N/A'}</td>
                    <td className="py-2.5 px-3 text-slate-900">{r.data.camera_name || 'N/A'}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.data.departmentCode || 'N/A'}</td>
                    <td className="py-2.5 px-3">
                      {r.isValid ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                          VALID
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 font-bold">
                          INVALID
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {r.isValid ? 'Ready for ingestion' : r.errors.join(' | ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
