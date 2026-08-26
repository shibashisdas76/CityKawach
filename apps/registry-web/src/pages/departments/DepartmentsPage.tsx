import React, { useState, useEffect } from 'react';
import { Building2, Video, CheckCircle2, ShieldCheck, Mail, MapPin, ArrowRight } from 'lucide-react';
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
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-saasable space-y-1">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2.5 tracking-tight">
          <Building2 className="w-6 h-6 text-indigo-600" />
          <span>State Surveillance Department Management</span>
        </h2>
        <p className="text-xs text-slate-500 font-medium">
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
            <div key={dept.id} className="saasable-card p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3.5">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-mono font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                      {dept.code}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1.5 tracking-tight">{dept.name}</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-emerald-100/80 text-emerald-800 text-xs font-mono font-extrabold flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Active Entity</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
                    <span className="text-slate-400 text-[10px] font-mono block uppercase font-bold tracking-wider">District Node</span>
                    <div className="font-extrabold text-slate-900 flex items-center space-x-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{dept.district}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
                    <span className="text-slate-400 text-[10px] font-mono block uppercase font-bold tracking-wider">Assigned Cameras</span>
                    <div className="font-extrabold text-slate-900 flex items-center space-x-1.5 mt-0.5">
                      <Video className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{deptCameras.length} Assets</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-500 font-medium">Operational Rate:</span>
                  <span className="font-bold text-emerald-600 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{deptCameras.length > 0 ? Math.round((onlineCount / deptCameras.length) * 100) : 100}% Operational</span>
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-mono flex items-center space-x-1.5 font-medium">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>admin@{dept.code.toLowerCase()}.gov.in</span>
                </span>
                <Link
                  to={`/cameras`}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition inline-flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  <span>View Assets</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

