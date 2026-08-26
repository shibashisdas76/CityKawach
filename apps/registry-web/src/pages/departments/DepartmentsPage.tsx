import React, { useState, useEffect } from 'react';
import { Building2, Video, CheckCircle2, ShieldCheck, Mail, MapPin } from 'lucide-react';
import { apiService } from '../../services/apiService';
import { Link } from 'react-router-dom';

export const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState(apiService.getDepartments());
  const [cameras, setCameras] = useState(apiService.getCameras());

  useEffect(() => {
    const unsubscribe = apiService.subscribe(() => {
      setDepartments(apiService.getDepartments());
      setCameras(apiService.getCameras());
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-1">
        <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          <span>State Surveillance Department Management</span>
        </h2>
        <p className="text-xs text-slate-500">
          Government entity asset quotas, regional command nodes, and assigned camera infrastructure
        </p>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {departments.map((dept) => {
          const deptCameras = cameras.filter(
            (c) => c.department_id === dept.id || c.departments?.name === dept.name
          );
          const onlineCount = deptCameras.filter((c) => c.status === 'ONLINE').length;

          return (
            <div key={dept.id} className="bg-white border border-slate-200 p-6 rounded-xl space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {dept.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{dept.name}</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-mono font-bold flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Active Entity</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-400 text-[10px] font-mono block uppercase">District Node</span>
                    <div className="font-bold text-slate-900 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>{dept.district}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-400 text-[10px] font-mono block uppercase">Assigned Cameras</span>
                    <div className="font-bold text-slate-900 flex items-center space-x-1">
                      <Video className="w-3.5 h-3.5 text-blue-600" />
                      <span>{deptCameras.length} Assets</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-500">Operational Rate:</span>
                  <span className="font-bold text-emerald-600 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{deptCameras.length > 0 ? Math.round((onlineCount / deptCameras.length) * 100) : 100}% Operational</span>
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-mono flex items-center space-x-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>admin@{dept.code.toLowerCase()}.gov.in</span>
                </span>
                <Link
                  to={`/cameras`}
                  className="px-3 py-1 rounded bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs transition"
                >
                  View Assets →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
