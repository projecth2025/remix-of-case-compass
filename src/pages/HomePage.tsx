import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, Folder, Users, Calendar, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCasesStore } from '@/stores/casesStore';
import { useMTBStore } from '@/stores/mtbStore';

export function HomePage() {
  const { cases, loadMockData: loadCases } = useCasesStore();
  const { mtbs, loadMockData: loadMtbs } = useMTBStore();

  useEffect(() => {
    loadCases();
    loadMtbs();
  }, [loadCases, loadMtbs]);

  const activeCases = cases.filter((c) => c.status === 'active').length;
  const activeMtbs = mtbs.filter((m) => m.status === 'active').length;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Virtual Molecular
              <span className="text-gradient block">Tumor Board</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
              A medical-grade platform for collaborative cancer case review. 
              Streamline your tumor board workflow with secure document management, 
              AI-powered digitization, and expert collaboration.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/create-case">
                <Button size="lg" className="gap-2 shadow-glow">
                  <Plus className="h-5 w-5" />
                  Create New Case
                </Button>
              </Link>
              <Link to="/cases">
                <Button variant="outline" size="lg" className="gap-2">
                  View All Cases
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border/50 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Folder className="h-5 w-5 text-primary" />
                </div>
                <span className="text-3xl font-bold text-foreground">{activeCases}</span>
              </div>
              <p className="text-sm text-muted-foreground">Active Cases</p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <span className="text-3xl font-bold text-foreground">{activeMtbs}</span>
              </div>
              <p className="text-sm text-muted-foreground">Active MTBs</p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-success/10">
                  <Calendar className="h-5 w-5 text-success" />
                </div>
                <span className="text-3xl font-bold text-foreground">2</span>
              </div>
              <p className="text-sm text-muted-foreground">Scheduled Meetings</p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '250ms' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Activity className="h-5 w-5 text-warning" />
                </div>
                <span className="text-3xl font-bold text-foreground">12</span>
              </div>
              <p className="text-sm text-muted-foreground">Documents Processed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-8 animate-fade-in">
            Quick Actions
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link 
              to="/create-case" 
              className="medical-card group hover:border-primary/50 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: '100ms' }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Create Case</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                Start a new cancer case with patient information, document uploads, 
                and AI-powered digitization.
              </p>
            </Link>

            <Link 
              to="/cases" 
              className="medical-card group hover:border-primary/50 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: '150ms' }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <Folder className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Manage Cases</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                View, edit, and manage existing cases. Access patient profiles, 
                documents, and treatment plans.
              </p>
            </Link>

            <Link 
              to="/mtbs" 
              className="medical-card group hover:border-primary/50 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: '200ms' }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-success/10 group-hover:bg-success/20 transition-colors">
                  <Users className="h-6 w-6 text-success" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Tumor Boards</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                Collaborate with experts, schedule meetings, and conduct 
                virtual tumor board reviews.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Cases */}
      {cases.length > 0 && (
        <section className="py-16 bg-muted/20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-foreground animate-fade-in">
                Recent Cases
              </h2>
              <Link to="/cases">
                <Button variant="ghost" className="gap-2">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cases.slice(0, 3).map((caseItem, index) => (
                <Link
                  key={caseItem.id}
                  to={`/cases/${caseItem.id}`}
                  className="medical-card hover:border-primary/50 transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${(index + 1) * 50}ms` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary uppercase">
                      {caseItem.cancerType}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(caseItem.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{caseItem.caseName}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {caseItem.notes || 'No notes available'}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
