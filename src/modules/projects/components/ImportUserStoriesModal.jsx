import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { X, UploadCloud, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';

/**
 * ImportUserStoriesModal: Bulk Excel import for user stories.
 * Enforces conditional Sprint column logic based on project.uses_sprints setting.
 */
const ImportUserStoriesModal = ({
  isOpen,
  onClose,
  project: propProject,
  projectId: propProjectId,
  sprintId,
  sprintName,
  onImportSuccess
}) => {
  useLockBodyScroll(isOpen);

  const [project, setProject] = useState(propProject || null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  const activeProjectId = propProject?.id || propProjectId;

  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setParsedRows([]);
      setValidationErrors([]);

      if (!propProject && propProjectId) {
        axios.get(`/projects/${propProjectId}`)
          .then(res => setProject(res.data.data))
          .catch(() => setProject({ id: propProjectId, name: 'Project', uses_sprints: true }));
      } else if (propProject) {
        setProject(propProject);
      }
    }
  }, [isOpen, propProject, propProjectId]);

  const usesSprints = project?.uses_sprints === true || project?.uses_sprints === 'true';

  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setParsedRows([]);
      setValidationErrors([]);
    }
  }, [isOpen]);

  if (!isOpen || !project) return null;

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      const res = await axios.get(`/projects/${project.id}/stories/download-template`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `User_Stories_Template_${project.name.replace(/\s+/g, '_')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Template downloaded');
    } catch {
      toast.error('Failed to download template.');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

        const rows = [];
        const errors = [];

        rawRows.forEach((row, idx) => {
          const rowNum = idx + 2;
          const normalized = {};
          for (const [k, v] of Object.entries(row)) {
            normalized[k.trim().toLowerCase()] = typeof v === 'string' ? v.trim() : v;
          }

          const title = normalized['title'] || normalized['story title'] || normalized['user story'] || '';
          const sprintCol = normalized['sprint'] || normalized['sprint name'] || '';
          const priority = normalized['priority'] || 'Medium';
          const points = normalized['story points'] || normalized['points'] || 0;
          const description = normalized['description'] || '';
          const acceptance = normalized['acceptance criteria'] || normalized['acceptance_criteria'] || '';
          const labels = normalized['labels'] || normalized['tags'] || '';

          const rowErrorMessages = [];
          if (!title) {
            rowErrorMessages.push('Missing Title');
          }

          if (usesSprints && !sprintId && !sprintCol) {
            rowErrorMessages.push('Sprint is required for sprint-based projects');
          }

          if (rowErrorMessages.length > 0) {
            errors.push({ row: rowNum, message: rowErrorMessages.join(', ') });
          }

          rows.push({
            rowNum,
            title,
            description,
            acceptance,
            priority,
            points,
            sprint: sprintCol || sprintName || (usesSprints ? 'Required' : 'N/A'),
            labels,
            isValid: rowErrorMessages.length === 0,
            errors: rowErrorMessages
          });
        });

        setParsedRows(rows);
        setValidationErrors(errors);

        if (rows.length === 0) {
          toast.error('No data rows found in the selected Excel file.');
        } else if (errors.length > 0) {
          toast.error(`Parsed ${rows.length} rows (${errors.length} validation issues found).`);
        } else {
          toast.success(`Successfully parsed ${rows.length} valid User Stories!`);
        }
      } catch {
        toast.error('Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv document.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select an Excel file to import.');
      return;
    }

    const validRowsCount = parsedRows.filter(r => r.isValid).length;
    if (validRowsCount === 0) {
      toast.error('Cannot import: No valid User Stories found in the file.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const endpoint = sprintId
        ? `/projects/${project.id}/sprints/${sprintId}/stories/import-excel`
        : `/projects/${project.id}/stories/import-excel`;

      const res = await axios.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const count = res.data.data?.imported_count || validRowsCount;
      toast.success(`🎉 ${count} User Stories successfully imported into project!`);

      if (onImportSuccess) onImportSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to import User Stories.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 text-slate-900 overflow-y-auto">
      <Card className="w-full max-w-4xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh] border border-slate-100">
        
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between py-5 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Bulk Import User Stories</CardTitle>
              <p className="text-xs text-slate-500 font-medium">
                Project: <strong className="text-slate-800">{project.name}</strong>
                {usesSprints ? <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full">Sprint-Based</span> : <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full">Non-Sprint</span>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 duration-200">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        {/* Content */}
        <CardContent className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/30">
          
          {/* Top Actions & Download Template */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Step 1: Download Sample Excel Template</h4>
              <p className="text-xs text-slate-500">
                {usesSprints
                  ? 'Includes Title, Description, Acceptance Criteria, Priority, Story Points, Sprint, and Labels.'
                  : 'Includes Title, Description, Acceptance Criteria, Priority, Story Points, and Labels (Sprint not required).'
                }
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              disabled={isDownloadingTemplate}
              className="text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50 shrink-0"
            >
              {isDownloadingTemplate ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Download className="w-3.5 h-3.5 mr-1.5" />}
              Download Template (.xlsx)
            </Button>
          </div>

          {/* File Upload Dropzone */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">Step 2: Upload Filled Excel File</h4>
            <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-white rounded-2xl p-8 text-center transition-colors cursor-pointer relative group">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => handleFileSelect(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-8 h-8" />
                </div>
                {selectedFile ? (
                  <div>
                    <p className="text-sm font-bold text-slate-900">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{(selectedFile.size / 1024).toFixed(1)} KB • Click or drag to change file</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-bold text-slate-800">Drop your Excel file here or click to browse</p>
                    <p className="text-xs text-slate-400 mt-0.5">Supports .xlsx, .xls, and .csv files up to 10MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Data Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pre-Import Preview ({parsedRows.filter(r => r.isValid).length} Valid / {parsedRows.length} Total)
                </h4>
                {validationErrors.length > 0 && (
                  <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {validationErrors.length} validation warning(s)
                  </span>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm max-h-60 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono font-bold text-[10px] uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Title</th>
                      {usesSprints && <th className="py-2.5 px-3">Sprint</th>}
                      <th className="py-2.5 px-3">Priority</th>
                      <th className="py-2.5 px-3">Pts</th>
                      <th className="py-2.5 px-3">Labels</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r, i) => (
                      <tr key={i} className={r.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/40'}>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {r.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full" title={r.errors.join(', ')}>
                              <AlertTriangle className="w-3 h-3" /> {r.errors[0]}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-xs truncate">{r.title || <span className="text-rose-500 italic">Empty</span>}</td>
                        {usesSprints && (
                          <td className="py-2.5 px-3 font-medium text-slate-600">{r.sprint}</td>
                        )}
                        <td className="py-2.5 px-3 font-bold text-slate-700">{r.priority}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{r.points}</td>
                        <td className="py-2.5 px-3 text-slate-500 max-w-[120px] truncate">{r.labels || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </CardContent>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 flex items-center justify-between shrink-0">
          <Button variant="ghost" onClick={onClose} className="text-xs font-semibold">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImportSubmit}
            disabled={isUploading || parsedRows.filter(r => r.isValid).length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Importing...
              </>
            ) : (
              `Import ${parsedRows.filter(r => r.isValid).length} User Stories`
            )}
          </Button>
        </div>

      </Card>
    </div>
  );
};

export default ImportUserStoriesModal;
