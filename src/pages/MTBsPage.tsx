import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Users, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMTBStore } from '@/stores/mtbStore';
import { toast } from 'sonner';

export function MTBsPage() {
  const { mtbs, getMeetingsForMtb, getCasesForMtb, loadMockData } = useMTBStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newMtbName, setNewMtbName] = useState('');
  const [newMtbDescription, setNewMtbDescription] = useState('');

  useEffect(() => {
    loadMockData();
  }, [loadMockData]);

  const filteredMtbs = mtbs.filter((mtb) =>
    mtb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mtb.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateMtb = () => {
    if (!newMtbName.trim()) {
      toast.error('Please enter a name for the MTB');
      return;
    }
    // In real implementation, this would call Supabase
    toast.success('MTB created successfully');
    setCreateDialogOpen(false);
    setNewMtbName('');
    setNewMtbDescription('');
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tumor Boards</h1>
            <p className="text-muted-foreground mt-1">
              Collaborate with experts on cancer cases
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-glow">
                <Plus className="h-4 w-4" />
                Create MTB
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New MTB</DialogTitle>
                <DialogDescription>
                  Create a virtual molecular tumor board to collaborate with experts.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="mtb-name">Name</Label>
                  <Input
                    id="mtb-name"
                    placeholder="e.g., Breast Cancer Board"
                    value={newMtbName}
                    onChange={(e) => setNewMtbName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mtb-description">Description (Optional)</Label>
                  <Textarea
                    id="mtb-description"
                    placeholder="Describe the focus of this tumor board..."
                    value={newMtbDescription}
                    onChange={(e) => setNewMtbDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateMtb}>Create MTB</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tumor boards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* MTB Grid */}
        {filteredMtbs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMtbs.map((mtb, index) => {
              const meetings = getMeetingsForMtb(mtb.id);
              const cases = getCasesForMtb(mtb.id);
              const upcomingMeetings = meetings.filter(
                (m) => m.status === 'scheduled' && new Date(m.scheduledAt) > new Date()
              );

              return (
                <Link
                  key={mtb.id}
                  to={`/mtbs/${mtb.id}`}
                  className="medical-card hover:border-primary/50 transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${(index + 1) * 50}ms` }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {mtb.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {cases.length} case{cases.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {mtb.description || 'No description available'}
                  </p>

                  {upcomingMeetings.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-accent">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Next: {new Date(upcomingMeetings[0].scheduledAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-end mt-4 pt-4 border-t border-border/50">
                    <span className="text-sm text-primary font-medium flex items-center gap-1">
                      View Details
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No tumor boards found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Create your first tumor board to start collaborating'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create MTB
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
