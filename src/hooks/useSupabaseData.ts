import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { PatientData, Case, UploadedFile } from '@/lib/storage';

export interface FullCase {
  id: string;
  caseName: string;
  patientId: string;
  patient: PatientData;
  files: UploadedFile[];
  status: 'Pending' | 'In Review' | 'Completed';
  createdDate: string;
  clinicalSummary?: string;
  ownerId?: string;
}

interface DbDocument {
  id: string;
  case_id: string;
  file_name: string;
  file_type: string;
  file_category: string | null;
  page_count: number;
  storage_path: string | null;
  anonymized_file_url: string | null;
  digitized_text: Record<string, string> | null;
  is_anonymized: boolean;
  is_digitized: boolean;
  created_at: string;
  last_modified_at: string;
}

export function useSupabaseData() {
  const { user } = useAuth();
  const [cases, setCases] = useState<FullCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all cases for the current user
  const fetchCases = useCallback(async () => {
    if (!user) {
      setCases([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch cases with the new schema
      const { data: casesData, error: casesError } = await supabase
        .from('cases')
        .select('*')
        .eq('created_by', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (casesError) throw casesError;

      if (!casesData || casesData.length === 0) {
        setCases([]);
        setLoading(false);
        return;
      }

      const caseIds = casesData.map(c => c.id);

      // Fetch patients for these cases
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .in('case_id', caseIds);

      if (patientsError) throw patientsError;

      // Fetch documents for these cases
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .in('case_id', caseIds);

      if (documentsError) throw documentsError;

      // Build full cases
      const fullCases: FullCase[] = casesData.map((caseRow) => {
        const patient = patientsData?.find(p => p.case_id === caseRow.id);
        const caseDocuments = (documentsData?.filter((d: DbDocument) => d.case_id === caseRow.id) || []) as DbDocument[];

        // Map status from active to Pending for display
        let displayStatus: 'Pending' | 'In Review' | 'Completed' = 'Pending';
        if (caseRow.status === 'archived') {
          displayStatus = 'Completed';
        }

        return {
          id: caseRow.id,
          caseName: caseRow.case_name,
          patientId: patient?.id || '',
          patient: {
            name: patient?.anonymized_name || '',
            age: patient?.age?.toString() || '',
            sex: patient?.sex || '',
            cancerType: caseRow.cancer_type || '',
            caseName: caseRow.case_name,
          },
          files: caseDocuments.map((doc: DbDocument) => ({
            id: doc.id,
            name: doc.file_name,
            size: 0, // Size not stored in current schema
            type: doc.file_type === 'pdf' ? 'application/pdf' : 'image/png',
            dataURL: doc.anonymized_file_url || '', // Will be loaded from storage
            fileCategory: doc.file_category || '',
            extractedData: doc.digitized_text || undefined,
            anonymizedVisited: doc.is_anonymized,
            digitizedVisited: doc.is_digitized,
          })),
          status: displayStatus,
          createdDate: caseRow.created_at,
          ownerId: caseRow.created_by,
        };
      });

      setCases(fullCases);
    } catch (err) {
      console.error('Error fetching cases:', err);
      setError('Failed to load cases');
      toast.error('Failed to load cases');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Upload a file to storage and return signed URL (private bucket)
  // For PDFs with anonymized pages, uploads each page separately and returns paths/URLs
  const uploadFileToStorage = async (
    file: UploadedFile,
    caseId: string
  ): Promise<{ storagePath: string; signedUrl: string; pageUrls?: string[] } | null> => {
    if (!user) {
      console.error('[uploadFileToStorage] No user found');
      return null;
    }

    try {
      const isPdf = file.type === 'application/pdf';
      const hasAnonymizedPages = isPdf && file.anonymizedPages && file.anonymizedPages.length > 0;

      // For PDFs with anonymized pages, upload each page as a separate image IN PARALLEL
      if (hasAnonymizedPages) {
        console.log('[uploadFileToStorage] Uploading anonymized PDF pages in parallel for:', file.name);
        
        // Filter out blob: URLs and prepare upload promises
        const validPages = file.anonymizedPages!
          .map((pageDataURL, i) => ({ pageDataURL, index: i }))
          .filter(({ pageDataURL }) => !pageDataURL.startsWith('blob:'));

        // Upload all pages in parallel
        const uploadPromises = validPages.map(async ({ pageDataURL, index }) => {
          try {
            const response = await fetch(pageDataURL);
            const blob = await response.blob();
            
            const storagePath = `${user.id}/${caseId}/${file.id}_page_${index}.png`;
            
            const { error: uploadError } = await supabase.storage
              .from('case-documents')
              .upload(storagePath, blob, {
                contentType: 'image/png',
                upsert: true,
              });

            if (uploadError) {
              console.error(`[uploadFileToStorage] Error uploading page ${index}:`, uploadError);
              return { index, signedUrl: null };
            }

            const { data: signedData } = await supabase.storage
              .from('case-documents')
              .createSignedUrl(storagePath, 3600);

            return { index, signedUrl: signedData?.signedUrl || null };
          } catch (err) {
            console.error(`[uploadFileToStorage] Error processing page ${index}:`, err);
            return { index, signedUrl: null };
          }
        });

        const results = await Promise.all(uploadPromises);
        
        // Sort by index and extract URLs
        const pageUrls = results
          .sort((a, b) => a.index - b.index)
          .map(r => r.signedUrl)
          .filter((url): url is string => url !== null);

        console.log('[uploadFileToStorage] Uploaded', pageUrls.length, 'pages for PDF in parallel');
        
        const mainStoragePath = `${user.id}/${caseId}/${file.id}_page_0.png`;
        return {
          storagePath: mainStoragePath,
          signedUrl: pageUrls[0] || '',
          pageUrls,
        };
      }

      // For regular images or non-anonymized PDFs, use anonymized version if available
      const dataURL = file.anonymizedDataURL || file.dataURL;
      if (!dataURL) {
        console.error('[uploadFileToStorage] No dataURL found for file:', file.name);
        return null;
      }

      // Skip blob: URLs as they can't be fetched
      if (dataURL.startsWith('blob:')) {
        console.warn('[uploadFileToStorage] Skipping blob URL for file:', file.name);
        return null;
      }

      console.log('[uploadFileToStorage] Converting dataURL to blob for:', file.name);
      const response = await fetch(dataURL);
      const blob = await response.blob();
      console.log('[uploadFileToStorage] Blob created, size:', blob.size);

      // Generate storage path: userId/caseId/fileName
      const fileExt = file.name.split('.').pop() || 'png';
      const storagePath = `${user.id}/${caseId}/${file.id}.${fileExt}`;
      console.log('[uploadFileToStorage] Uploading to path:', storagePath);

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('case-documents')
        .upload(storagePath, blob, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        console.error('[uploadFileToStorage] Storage upload error:', uploadError);
        return null;
      }

      console.log('[uploadFileToStorage] Upload successful:', uploadData);

      // Get signed URL for private bucket (1 hour expiry for immediate use)
      const { data: signedData, error: signedError } = await supabase.storage
        .from('case-documents')
        .createSignedUrl(storagePath, 3600);

      if (signedError) {
        console.error('[uploadFileToStorage] Signed URL error:', signedError);
        // Return path even without signed URL
        return { storagePath, signedUrl: '' };
      }

      console.log('[uploadFileToStorage] Signed URL created successfully');
      return {
        storagePath,
        signedUrl: signedData?.signedUrl || '',
      };
    } catch (err) {
      console.error('[uploadFileToStorage] Error uploading file:', err);
      return null;
    }
  };

  // Create a new case with patient and documents - ONLY called on "Create Case" click
  const createPatientAndCase = async (
    patientData: PatientData,
    files: UploadedFile[],
    clinicalSummary?: string
  ): Promise<FullCase | null> => {
    console.log('=== [createPatientAndCase] START ===');
    console.log('[createPatientAndCase] User:', user?.id);
    console.log('[createPatientAndCase] Patient data:', patientData);
    console.log('[createPatientAndCase] Files count:', files.length);

    if (!user) {
      console.error('[createPatientAndCase] No user logged in');
      toast.error('You must be logged in to create a case');
      return null;
    }

    try {
      // 1. Create case record first
      console.log('[createPatientAndCase] Step 1: Creating case record...');
      const { data: newCase, error: caseError } = await supabase
        .from('cases')
        .insert({
          case_name: patientData.caseName || patientData.name,
          cancer_type: patientData.cancerType || null,
          created_by: user.id,
          status: 'active',
        })
        .select()
        .single();

      if (caseError) {
        console.error('[createPatientAndCase] Case insert error:', caseError);
        throw caseError;
      }
      console.log('[createPatientAndCase] Case created:', newCase);

      // 2. Create patient record linked to case
      console.log('[createPatientAndCase] Step 2: Creating patient record...');
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert({
          case_id: newCase.id,
          anonymized_name: patientData.name,
          age: patientData.age ? parseInt(patientData.age, 10) : null,
          sex: patientData.sex || null,
        })
        .select()
        .single();

      if (patientError) {
        console.error('[createPatientAndCase] Patient insert error:', patientError);
        throw patientError;
      }
      console.log('[createPatientAndCase] Patient created:', patient);

      // 3. Upload files to storage IN PARALLEL and create document records
      console.log('[createPatientAndCase] Step 3: Processing', files.length, 'documents in parallel...');
      
      const uploadPromises = files.map(async (file) => {
        console.log(`[createPatientAndCase] Starting upload for:`, file.name);
        const uploadResult = await uploadFileToStorage(file, newCase.id);
        console.log('[createPatientAndCase] Upload result for', file.name, ':', uploadResult ? 'success' : 'failed');
        
        const isPdf = file.type === 'application/pdf';
        const pageCount = isPdf ? (file.pdfPages?.length || file.anonymizedPages?.length || 1) : 1;

        return {
          case_id: newCase.id,
          file_name: file.name,
          file_type: isPdf ? 'pdf' : 'image',
          file_category: file.fileCategory || null,
          page_count: pageCount,
          storage_path: uploadResult?.storagePath || null,
          anonymized_file_url: uploadResult?.signedUrl || null,
          digitized_text: file.extractedData || null,
          is_anonymized: file.anonymizedVisited || false,
          is_digitized: file.digitizedVisited || false,
        };
      });

      const documentRecords = await Promise.all(uploadPromises);

      console.log('[createPatientAndCase] Document records prepared:', documentRecords.length);

      if (documentRecords.length > 0) {
        console.log('[createPatientAndCase] Step 4: Inserting document records...');
        const { data: documents, error: documentsError } = await supabase
          .from('documents')
          .insert(documentRecords)
          .select();

        if (documentsError) {
          console.error('[createPatientAndCase] Documents insert error:', documentsError);
          throw documentsError;
        }
        console.log('[createPatientAndCase] Documents created:', documents?.length);

        // 5. Create edit tracking records for each document
        if (documents && documents.length > 0) {
          console.log('[createPatientAndCase] Step 5: Creating edit tracking records...');
          const trackingRecords = documents.map(doc => ({
            document_id: doc.id,
            last_edited_stage: 'digitize' as const,
            requires_revisit: false,
          }));

          const { error: trackingError } = await supabase
            .from('document_edit_tracking')
            .insert(trackingRecords);

          if (trackingError) {
            console.error('[createPatientAndCase] Tracking insert error:', trackingError);
            // Non-fatal, continue
          } else {
            console.log('[createPatientAndCase] Tracking records created');
          }
        }
      }

      // 6. Create audit log
      console.log('[createPatientAndCase] Step 6: Creating audit log...');
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          entity_type: 'case',
          entity_id: newCase.id,
          edited_by: user.id,
          change_summary: `Case "${patientData.caseName || patientData.name}" created with ${files.length} document(s)`,
        });

      if (auditError) {
        console.error('[createPatientAndCase] Audit log error:', auditError);
        // Non-fatal, continue
      } else {
        console.log('[createPatientAndCase] Audit log created');
      }

      const fullCase: FullCase = {
        id: newCase.id,
        caseName: patientData.caseName || patientData.name,
        patientId: patient.id,
        patient: patientData,
        files: files,
        status: 'Pending',
        createdDate: newCase.created_at,
        ownerId: user.id,
        clinicalSummary,
      };

      // Update local state
      setCases(prev => [fullCase, ...prev]);
      
      console.log('=== [createPatientAndCase] SUCCESS ===');
      console.log('[createPatientAndCase] Case ID:', newCase.id);
      toast.success('Case created successfully');

      return fullCase;
    } catch (err: any) {
      console.error('=== [createPatientAndCase] FAILED ===');
      console.error('[createPatientAndCase] Error:', err);
      if (err?.code === '23505') {
        toast.error('A case with this name already exists');
      } else {
        toast.error('Failed to create case');
      }
      return null;
    }
  };

  // Modify an existing case - ONLY called on "Modify Case" click
  // Edit flow now behaves like create: delete all old documents and replace with new ones
  const modifyCase = async (
    caseId: string,
    patientData: PatientData,
    files: UploadedFile[],
    editedFileIds: string[],
    originalFiles: UploadedFile[]
  ): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to modify a case');
      return false;
    }

    try {
      // 1. Update case record
      await supabase
        .from('cases')
        .update({
          case_name: patientData.caseName || patientData.name,
          cancer_type: patientData.cancerType || null,
        })
        .eq('id', caseId)
        .eq('created_by', user.id);

      // 2. Update patient record
      await supabase
        .from('patients')
        .update({
          anonymized_name: patientData.name || '',
          age: patientData.age ? parseInt(patientData.age, 10) : null,
          sex: patientData.sex || null,
        })
        .eq('case_id', caseId);

      // 3. Delete all existing documents and their storage files
      console.log('[modifyCase] Removing all existing documents for case:', caseId);
      const { data: existingDocs } = await supabase
        .from('documents')
        .select('id, storage_path, page_count, file_type')
        .eq('case_id', caseId);

      if (existingDocs && existingDocs.length > 0) {
        // Collect all storage paths including multi-page PDF paths
        const storagePaths: string[] = [];
        for (const doc of existingDocs) {
          if (doc.storage_path) {
            const isPdf = doc.file_type === 'pdf';
            const hasPagePattern = doc.storage_path.includes('_page_');
            
            if (isPdf && hasPagePattern && doc.page_count > 1) {
              // Multi-page PDF - collect all page paths
              const basePath = doc.storage_path.replace(/_page_\d+\.png$/, '');
              for (let i = 0; i < doc.page_count; i++) {
                storagePaths.push(`${basePath}_page_${i}.png`);
              }
            } else {
              storagePaths.push(doc.storage_path);
            }
          }
        }

        // Delete from storage
        if (storagePaths.length > 0) {
          await supabase.storage.from('case-documents').remove(storagePaths);
        }

        // Delete document records (this will cascade to document_edit_tracking)
        await supabase.from('documents').delete().eq('case_id', caseId);
      }

      // 4. Upload and create all new documents (like create flow)
      console.log('[modifyCase] Creating', files.length, 'new documents');
      
      const uploadPromises = files.map(async (file) => {
        const uploadResult = await uploadFileToStorage(file, caseId);
        const isPdf = file.type === 'application/pdf';
        const pageCount = isPdf ? (file.pdfPages?.length || file.anonymizedPages?.length || 1) : 1;

        return {
          case_id: caseId,
          file_name: file.name,
          file_type: isPdf ? 'pdf' : 'image',
          file_category: file.fileCategory || null,
          page_count: pageCount,
          storage_path: uploadResult?.storagePath || null,
          anonymized_file_url: uploadResult?.signedUrl || null,
          digitized_text: file.extractedData || null,
          is_anonymized: file.anonymizedVisited || false,
          is_digitized: file.digitizedVisited || false,
        };
      });

      const documentRecords = await Promise.all(uploadPromises);

      if (documentRecords.length > 0) {
        const { data: documents, error: documentsError } = await supabase
          .from('documents')
          .insert(documentRecords)
          .select();

        if (documentsError) {
          console.error('[modifyCase] Documents insert error:', documentsError);
          throw documentsError;
        }

        // Create edit tracking records for new documents
        if (documents && documents.length > 0) {
          const trackingRecords = documents.map(doc => ({
            document_id: doc.id,
            last_edited_stage: 'digitize' as const,
            requires_revisit: false,
          }));

          await supabase.from('document_edit_tracking').insert(trackingRecords);
        }
      }

      // 5. Create audit log
      await supabase
        .from('audit_logs')
        .insert({
          entity_type: 'case',
          entity_id: caseId,
          edited_by: user.id,
          change_summary: `Case updated with ${files.length} new document(s)`,
        });

      // Refresh cases
      await fetchCases();
      toast.success('Case updated successfully');
      return true;
    } catch (err) {
      console.error('Error modifying case:', err);
      toast.error('Failed to update case');
      return false;
    }
  };

  // Delete a case
  const deleteCase = async (caseId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Delete from storage first
      const { data: documents } = await supabase
        .from('documents')
        .select('storage_path')
        .eq('case_id', caseId);

      if (documents) {
        const paths = documents
          .filter(d => d.storage_path)
          .map(d => d.storage_path as string);

        if (paths.length > 0) {
          await supabase.storage
            .from('case-documents')
            .remove(paths);
        }
      }

      // Create audit log before deletion
      await supabase
        .from('audit_logs')
        .insert({
          entity_type: 'case',
          entity_id: caseId,
          edited_by: user.id,
          change_summary: 'Case deleted',
        });

      // Delete case (cascades to patients, documents, tracking)
      const { error } = await supabase
        .from('cases')
        .delete()
        .eq('id', caseId)
        .eq('created_by', user.id);

      if (error) throw error;

      setCases(prev => prev.filter(c => c.id !== caseId));
      toast.success('Case deleted');
      return true;
    } catch (err) {
      console.error('Error deleting case:', err);
      toast.error('Failed to delete case');
      return false;
    }
  };

  // Update case status (archive/activate)
  const updateCaseStatus = async (
    caseId: string,
    status: 'active' | 'archived'
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('cases')
        .update({ status })
        .eq('id', caseId)
        .eq('created_by', user.id);

      if (error) throw error;

      // Map to display status
      const displayStatus = status === 'archived' ? 'Completed' : 'Pending';
      setCases(prev =>
        prev.map(c => (c.id === caseId ? { ...c, status: displayStatus } : c))
      );

      await supabase
        .from('audit_logs')
        .insert({
          entity_type: 'case',
          entity_id: caseId,
          edited_by: user.id,
          change_summary: `Case status changed to ${status}`,
        });

      return true;
    } catch (err) {
      console.error('Error updating case status:', err);
      toast.error('Failed to update case');
      return false;
    }
  };

  // Load a case for editing (fetch full document data with storage URLs)
  const loadCaseForEditing = useCallback(
    async (caseId: string): Promise<FullCase | null> => {
      if (!user) {
        console.error('[loadCaseForEditing] No user found');
        return null;
      }

      try {
        console.log('[loadCaseForEditing] Loading case:', caseId);
        
        // Fetch case - RLS policies handle access control (own cases + MTB shared cases)
        const { data: caseData, error: caseError } = await supabase
          .from('cases')
          .select('*')
          .eq('id', caseId)
          .single();

        if (caseError) {
          console.error('[loadCaseForEditing] Case fetch error:', caseError);
          throw caseError;
        }

        // Fetch patient
        const { data: patient, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('case_id', caseId)
          .single();

        if (patientError) {
          console.error('[loadCaseForEditing] Patient fetch error:', patientError);
          throw patientError;
        }

        // Fetch documents
        const { data: documents, error: documentsError } = await supabase
          .from('documents')
          .select('*')
          .eq('case_id', caseId);

        if (documentsError) {
          console.error('[loadCaseForEditing] Documents fetch error:', documentsError);
          throw documentsError;
        }
        
        console.log('[loadCaseForEditing] Fetched', documents?.length || 0, 'documents');

        // Build files with signed URLs for private bucket access
        const files: UploadedFile[] = await Promise.all(
          (documents || []).map(async (doc: DbDocument) => {
            let dataURL = '';
            let anonymizedPages: string[] | undefined;

            const isPdf = doc.file_type === 'pdf';

            if (doc.storage_path) {
              try {
                // Check if this is a multi-page anonymized PDF by looking for _page_ pattern
                const hasPagePattern = doc.storage_path.includes('_page_');

                if (isPdf && hasPagePattern && doc.page_count > 1) {
                  // Multi-page anonymized PDF - load all pages in parallel
                  const basePath = doc.storage_path.replace(/_page_\d+\.png$/, '');

                  const pagePromises = Array.from({ length: doc.page_count }, (_, i) => {
                    const pagePath = `${basePath}_page_${i}.png`;
                    return supabase.storage
                      .from('case-documents')
                      .createSignedUrl(pagePath, 3600)
                      .then(({ data }) => data?.signedUrl || null)
                      .catch(() => null);
                  });

                  const pageResults = await Promise.all(pagePromises);
                  anonymizedPages = pageResults.filter((url): url is string => url !== null);

                  // Use first page as main dataURL for backwards compatibility
                  if (anonymizedPages.length > 0) {
                    dataURL = anonymizedPages[0];
                  }
                } else {
                  // Single file (image, non-anonymized PDF, or single-page anonymized PDF)
                  const { data: signedData } = await supabase.storage
                    .from('case-documents')
                    .createSignedUrl(doc.storage_path, 3600);

                  if (signedData?.signedUrl) {
                    dataURL = signedData.signedUrl;

                    // For single-page anonymized PDFs, also set anonymizedPages
                    if (isPdf && hasPagePattern) {
                      anonymizedPages = [dataURL];
                    }
                  }
                }
              } catch (err) {
                console.error('[loadCaseForEditing] Error loading file:', doc.file_name, err);
                // Don't throw - continue with other files and show what we can
              }
            }

            return {
              id: doc.id,
              name: doc.file_name,
              size: 0,
              type: isPdf ? 'application/pdf' : 'image/png',
              dataURL,
              anonymizedPages,
              fileCategory: doc.file_category || '',
              extractedData: doc.digitized_text || undefined,
              anonymizedVisited: doc.is_anonymized,
              digitizedVisited: doc.is_digitized,
              createdAt: doc.created_at,
              uploadedAt: doc.created_at,
              lastModifiedAt: doc.last_modified_at,
            };
          })
        );
        
        console.log('[loadCaseForEditing] Successfully loaded', files.length, 'files');

        return {
          id: caseData.id,
          caseName: caseData.case_name,
          patientId: patient.id,
          patient: {
            name: patient.anonymized_name,
            age: patient.age?.toString() || '',
            sex: patient.sex || '',
            cancerType: caseData.cancer_type || '',
            caseName: caseData.case_name,
          },
          files,
          status: caseData.status === 'archived' ? 'Completed' : 'Pending',
          createdDate: caseData.created_at,
          ownerId: caseData.created_by,
        };
      } catch (err) {
        console.error('Error loading case for editing:', err);
        toast.error('Failed to load case');
        return null;
      }
    },
    [user]
  );


  // Check if case name already exists
  const checkCaseNameExists = async (caseName: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('cases')
        .select('id')
        .eq('case_name', caseName)
        .eq('created_by', user.id)
        .maybeSingle();

      if (error) throw error;
      return data !== null;
    } catch (err) {
      console.error('Error checking case name:', err);
      return false;
    }
  };

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  return {
    cases,
    loading,
    error,
    fetchCases,
    createPatientAndCase,
    modifyCase,
    deleteCase,
    updateCaseStatus,
    loadCaseForEditing,
    checkCaseNameExists,
  };
}
