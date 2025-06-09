import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';
import { Upload, Save, AlertCircle, CheckCircle, FileText, Camera, Send } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import debounce from 'lodash.debounce';
import toast from 'react-hot-toast';

type AuditItem = {
  id: string;
  rowIndex: number;
  auditDetails: string;
  observation: string;
  remark: 'yes' | 'no' | 'not_applicable' | 'unavailable' | null;
  evidence: {
    id: string;
    fileName: string;
    filePath: string;
  }[];
  originalData: Record<string, any>;
};

type ChecklistAudit = {
  id: string;
  title: string;
  status: string;
  template: {
    structure: any[];
  };
};

const remarkOptions = [
  { value: 'yes', label: 'Yes', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'no', label: 'No', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'not_applicable', label: 'Not Applicable', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  { value: 'unavailable', label: 'Unavailable', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
];

const ChecklistAudit: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [auditData, setAuditData] = useState<AuditItem[]>([]);
  const [currentAudit, setCurrentAudit] = useState<ChecklistAudit | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    noRemarks: 0,
    evidenceCount: 0,
    completion: 0,
  });

  const columnHelper = createColumnHelper<AuditItem>();

  // Function to handle file upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        // Create template
        const { data: templateData, error: templateError } = await supabase
          .from('checklist_templates')
          .insert({
            title: file.name.replace(/\.[^/.]+$/, ''),
            description: `Uploaded checklist from ${file.name}`,
            structure: jsonData,
            created_by: user?.id,
          })
          .select()
          .single();

        if (templateError) throw templateError;

        // Create audit
        const { data: auditData, error: auditError } = await supabase
          .from('checklist_audits')
          .insert({
            template_id: templateData.id,
            title: `Audit - ${file.name.replace(/\.[^/.]+$/, '')}`,
            auditor_id: user?.id,
            status: 'in_progress',
          })
          .select()
          .single();

        if (auditError) throw auditError;

        // Create audit items
        const auditItems = jsonData.map((row: any, index: number) => ({
          audit_id: auditData.id,
          row_index: index,
          original_data: row,
          audit_details: '',
          observation: '',
          remark: null,
          last_modified_by: user?.id,
        }));

        const { error: itemsError } = await supabase
          .from('checklist_audit_items')
          .insert(auditItems);

        if (itemsError) throw itemsError;

        toast.success('Checklist uploaded successfully');
        fetchAuditData();
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Error uploading checklist:', error);
      toast.error('Failed to upload checklist');
      setLoading(false);
    }
  }, [user]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  // Auto-save function
  const saveChanges = useCallback(
    debounce(async (itemId: string, changes: Partial<AuditItem>) => {
      try {
        setSaving(true);
        const { error } = await supabase
          .from('checklist_audit_items')
          .update({
            ...changes,
            updated_at: new Date().toISOString(),
            last_modified_by: user?.id,
          })
          .eq('id', itemId);

        if (error) throw error;

        // Update local state
        setAuditData(prev => prev.map(item => 
          item.id === itemId ? { ...item, ...changes } : item
        ));

        // Recalculate stats
        calculateStats();
      } catch (error) {
        console.error('Error saving changes:', error);
        toast.error('Failed to save changes');
      } finally {
        setSaving(false);
      }
    }, 1000),
    [user]
  );

  // Handle evidence upload
  const handleEvidenceUpload = async (itemId: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${itemId}-${Date.now()}.${fileExt}`;
      const filePath = `evidence/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('audit-evidence')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save evidence record
      const { error: dbError } = await supabase
        .from('audit_evidence')
        .insert({
          audit_item_id: itemId,
          file_path: filePath,
          file_name: file.name,
          file_type: file.type,
          uploaded_by: user?.id,
        });

      if (dbError) throw dbError;

      toast.success('Evidence uploaded successfully');
      fetchAuditData();
    } catch (error) {
      console.error('Error uploading evidence:', error);
      toast.error('Failed to upload evidence');
    }
  };

  // Submit audit for review
  const submitAudit = async () => {
    if (!currentAudit) return;

    // Check if all "No" remarks have evidence
    const noRemarksWithoutEvidence = auditData.filter(
      item => item.remark === 'no' && item.evidence.length === 0
    );

    if (noRemarksWithoutEvidence.length > 0) {
      toast.error('Please upload evidence for all "No" remarks before submitting');
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('checklist_audits')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', currentAudit.id);

      if (error) throw error;

      toast.success('Audit submitted for review successfully');
      fetchAuditData();
    } catch (error) {
      console.error('Error submitting audit:', error);
      toast.error('Failed to submit audit');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate statistics
  const calculateStats = useCallback(() => {
    const total = auditData.length;
    const completed = auditData.filter(item => item.remark).length;
    const noRemarks = auditData.filter(item => item.remark === 'no').length;
    const evidenceCount = auditData.reduce((acc, item) => acc + item.evidence.length, 0);

    setStats({
      total,
      completed,
      noRemarks,
      evidenceCount,
      completion: total > 0 ? Math.round((completed / total) * 100) : 0,
    });
  }, [auditData]);

  // Define table columns
  const columns = React.useMemo(() => {
    if (!auditData.length || !auditData[0]?.originalData) return [];

    const originalDataKeys = Object.keys(auditData[0].originalData);
    
    return [
      // Original checklist columns (read-only)
      ...originalDataKeys.map(key =>
        columnHelper.accessor(
          row => row.originalData[key],
          {
            id: key,
            header: () => (
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                {key}
              </div>
            ),
            cell: info => (
              <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
                {String(info.getValue() || '')}
              </div>
            ),
            enableSorting: false,
            size: 200,
          }
        )
      ),
      // Editable audit columns
      columnHelper.accessor('auditDetails', {
        header: () => (
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
            Details of Audit (Reference of the data)
          </div>
        ),
        cell: info => (
          <textarea
            value={info.getValue() || ''}
            onChange={e => {
              const newValue = e.target.value;
              const item = info.row.original;
              item.auditDetails = newValue;
              saveChanges(item.id, { audit_details: newValue });
            }}
            className="w-full min-h-[100px] p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Enter audit details and references..."
            disabled={currentAudit?.status !== 'in_progress'}
          />
        ),
        size: 300,
      }),
      columnHelper.accessor('observation', {
        header: () => (
          <div className="text-xs font-semibold text-green-700 uppercase tracking-wider">
            Auditor's Observation
          </div>
        ),
        cell: info => (
          <textarea
            value={info.getValue() || ''}
            onChange={e => {
              const newValue = e.target.value;
              const item = info.row.original;
              item.observation = newValue;
              saveChanges(item.id, { observation: newValue });
            }}
            className="w-full min-h-[100px] p-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            placeholder="Enter your observations..."
            disabled={currentAudit?.status !== 'in_progress'}
          />
        ),
        size: 300,
      }),
      columnHelper.accessor('remark', {
        header: () => (
          <div className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
            Remarks by Auditor
          </div>
        ),
        cell: info => (
          <div className="space-y-3">
            <select
              value={info.getValue() || ''}
              onChange={e => {
                const newValue = e.target.value as AuditItem['remark'];
                const item = info.row.original;
                item.remark = newValue;
                saveChanges(item.id, { remark: newValue });
              }}
              className="w-full p-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={currentAudit?.status !== 'in_progress'}
            >
              <option value="">Select Remark...</option>
              {remarkOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            {info.getValue() && (
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                remarkOptions.find(opt => opt.value === info.getValue())?.color || 'bg-gray-100 text-gray-800'
              }`}>
                {remarkOptions.find(opt => opt.value === info.getValue())?.label}
              </div>
            )}
            
            {info.getValue() === 'no' && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-red-600 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Evidence Required
                </div>
                <input
                  type="file"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleEvidenceUpload(info.row.original.id, file);
                    }
                  }}
                  accept="image/*,.pdf,.doc,.docx"
                  className="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                  disabled={currentAudit?.status !== 'in_progress'}
                />
                <div className="space-y-1">
                  {info.row.original.evidence.map((file: any) => (
                    <div key={file.id} className="flex items-center text-xs text-blue-600 bg-blue-50 p-2 rounded border">
                      <FileText className="h-3 w-3 mr-1" />
                      {file.fileName}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ),
        size: 250,
      }),
    ];
  }, [auditData, currentAudit?.status, saveChanges, handleEvidenceUpload]);

  const table = useReactTable({
    data: auditData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Fetch audit data
  const fetchAuditData = async () => {
    try {
      setLoading(true);
      
      // Fetch latest audit for current user
      const { data: auditData, error: auditError } = await supabase
        .from('checklist_audits')
        .select(`
          *,
          template:checklist_templates(structure)
        `)
        .eq('auditor_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (auditError) {
        if (auditError.code === 'PGRST116') {
          // No audit found
          setCurrentAudit(null);
          setAuditData([]);
          return;
        }
        throw auditError;
      }

      setCurrentAudit(auditData);

      // Fetch audit items with evidence
      const { data: items, error: itemsError } = await supabase
        .from('checklist_audit_items')
        .select(`
          *,
          evidence:audit_evidence(*)
        `)
        .eq('audit_id', auditData.id)
        .order('row_index');

      if (itemsError) throw itemsError;

      const formattedItems = (items || []).map(item => ({
        id: item.id,
        rowIndex: item.row_index,
        auditDetails: item.audit_details || '',
        observation: item.observation || '',
        remark: item.remark,
        evidence: item.evidence || [],
        originalData: item.original_data || {},
      }));

      setAuditData(formattedItems);
    } catch (error) {
      console.error('Error fetching audit data:', error);
      toast.error('Failed to load audit data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAuditData();
    }
  }, [user]);

  useEffect(() => {
    calculateStats();
  }, [auditData, calculateStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading audit data...</p>
        </div>
      </div>
    );
  }

  if (!currentAudit) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6">
            <Upload className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Checklist</h3>
          <p className="text-gray-600 mb-8">Get started by uploading your audit checklist file</p>
        </div>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
            isDragActive 
              ? 'border-blue-500 bg-blue-50 scale-105' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
              isDragActive ? 'bg-blue-500' : 'bg-gray-400'
            }`}>
              <Upload className={`h-8 w-8 ${isDragActive ? 'text-white' : 'text-white'}`} />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Drop your file here' : 'Drag & drop your checklist file here'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or click to browse and select a file
              </p>
            </div>
            <div className="flex justify-center space-x-4 text-xs text-gray-400">
              <span className="bg-gray-100 px-2 py-1 rounded">Excel (.xlsx, .xls)</span>
              <span className="bg-gray-100 px-2 py-1 rounded">CSV</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{currentAudit.title}</h2>
            <p className="text-gray-600 mt-1">Checklist-based audit in progress</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              currentAudit.status === 'in_progress' 
                ? 'bg-blue-100 text-blue-800' 
                : currentAudit.status === 'submitted'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {currentAudit.status === 'in_progress' ? 'In Progress' : 
               currentAudit.status === 'submitted' ? 'Submitted' : 'Completed'}
            </div>
            {currentAudit.status === 'in_progress' && stats.completion === 100 && (
              <button
                onClick={submitAudit}
                disabled={submitting}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-blue-600">{stats.completion}%</div>
              <div className="text-sm text-gray-500">Completion</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-green-600">{stats.completed}/{stats.total}</div>
              <div className="text-sm text-gray-500">Items Completed</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-red-600">{stats.noRemarks}</div>
              <div className="text-sm text-gray-500">Issues Found</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Camera className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-purple-600">{stats.evidenceCount}</div>
              <div className="text-sm text-gray-500">Evidence Files</div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-left border-b border-gray-200"
                      style={{ width: header.getSize() }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200">
              {table.getRowModel().rows.map((row, index) => (
                <tr key={row.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 border-b border-gray-100"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save indicator */}
      {saving && (
        <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl p-4 flex items-center border border-gray-200">
          <Save className="h-5 w-5 text-blue-600 animate-spin mr-3" />
          <span className="text-sm font-medium text-gray-700">Saving changes...</span>
        </div>
      )}
    </div>
  );
};

export default ChecklistAudit;