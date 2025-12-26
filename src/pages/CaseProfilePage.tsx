import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, FileText, Users, Calendar, Edit, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCasesStore } from '@/stores/casesStore';
import type { CancerType } from '@/types/vmtb';

const cancerTypeLabels: Record<CancerType, string> = {
  breast: 'Breast Cancer',
  lung: 'Lung Cancer',
  colorectal: 'Colorectal Cancer',
  prostate: 'Prostate Cancer',
  melanoma: 'Melanoma',
  leukemia: 'Leukemia',
  lymphoma: 'Lymphoma',
  pancreatic: 'Pancreatic Cancer',
  ovarian: 'Ovarian Cancer',
  bladder: 'Bladder Cancer',
  kidney: 'Kidney Cancer',
  thyroid: 'Thyroid Cancer',
  liver: 'Liver Cancer',
  brain: 'Brain Cancer',
  other: 'Other',
};

export function CaseProfilePage() {
  const { caseId } = useParams<{ caseId: string }>();
  const { getCaseById, getPatientForCase, getDocumentsForCase, loadMockData } = useCasesStore();

  useEffect(() => {
    loadMockData();
  }, [loadMockData]);

  const caseData = caseId ? getCaseById(caseId) : undefined;
  const patient = caseData ? getPatientForCase(caseData.patientId) : undefined;
  const documents = caseId ? getDocumentsForCase(caseId) : [];

  if (!caseData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Case Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The case you're looking for doesn't exist.
          </p>
          <Link to="/cases">
            <Button>Back to Cases</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <Link
            to="/cases"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cases
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">
                  {caseData.caseName}
                </h1>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-success/10 text-success">
                  {caseData.status}
                </span>
              </div>
              <p className="text-muted-foreground">
                {cancerTypeLabels[caseData.cancerType]} • Created {new Date(caseData.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button size="sm" className="gap-2">
                <Edit className="h-4 w-4" />
                Edit Case
              </Button>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="overview" className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="gap-2">
              <User className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              Documents ({documents.length})
            </TabsTrigger>
            <TabsTrigger value="experts" className="gap-2">
              <Users className="h-4 w-4" />
              Experts
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Patient Info */}
              <div className="medical-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Patient</h2>
                </div>
                {patient ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Identifier</p>
                      <p className="font-medium text-foreground">{patient.displayName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Age</p>
                        <p className="font-medium text-foreground">{patient.age} years</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Sex</p>
                        <p className="font-medium text-foreground capitalize">{patient.sex}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No patient data available</p>
                )}
              </div>

              {/* Case Details */}
              <div className="medical-card lg:col-span-2">
                <h2 className="text-lg font-semibold text-foreground mb-4">Clinical Notes</h2>
                <p className="text-foreground">
                  {caseData.notes || 'No clinical notes available for this case.'}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <div className="space-y-4">
              {documents.length > 0 ? (
                documents.map((doc, index) => (
                  <div
                    key={doc.id}
                    className="medical-card animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-foreground">{doc.fileName}</h3>
                          <span className="text-xs text-muted-foreground">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg font-mono text-sm text-foreground/80">
                          {doc.digitizedText}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No documents available</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="experts">
            <div className="text-center py-12 medical-card">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Experts Assigned</h3>
              <p className="text-muted-foreground mb-4">
                Add this case to an MTB to collaborate with experts.
              </p>
              <Button variant="outline">Add to MTB</Button>
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <div className="medical-card">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-success" />
                    <div className="w-0.5 h-full bg-border flex-1 mt-2" />
                  </div>
                  <div className="pb-6">
                    <p className="font-medium text-foreground">Case Created</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(caseData.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Last Updated</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(caseData.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
