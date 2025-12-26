import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Folder,
  Calendar,
  Plus,
  Mail,
  Video,
  Clock,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMTBStore } from '@/stores/mtbStore';
import { useCasesStore } from '@/stores/casesStore';
import { toast } from 'sonner';

export function MTBDetailPage() {
  const { mtbId } = useParams<{ mtbId: string }>();
  const { getMtbById, getMeetingsForMtb, getCasesForMtb, loadMockData } = useMTBStore();
  const { getCaseById, loadMockData: loadCases } = useCasesStore();
  
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);

  useEffect(() => {
    loadMockData();
    loadCases();
  }, [loadMockData, loadCases]);

  const mtb = mtbId ? getMtbById(mtbId) : undefined;
  const meetings = mtbId ? getMeetingsForMtb(mtbId) : [];
  const mtbCases = mtbId ? getCasesForMtb(mtbId) : [];

  if (!mtb) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">MTB Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The tumor board you're looking for doesn't exist.
          </p>
          <Link to="/mtbs">
            <Button>Back to MTBs</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleInviteExpert = () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    // In real implementation, check if email exists and send invitation
    toast.success('Invitation sent', {
      description: `Invitation sent to ${inviteEmail}`,
    });
    setInviteDialogOpen(false);
    setInviteEmail('');
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <Link
            to="/mtbs"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tumor Boards
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-foreground">
                  {mtb.name}
                </h1>
              </div>
              <p className="text-muted-foreground">
                {mtb.description || 'No description available'}
              </p>
            </div>

            <div className="flex gap-2">
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Invite Expert
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Expert</DialogTitle>
                    <DialogDescription>
                      Send an invitation to an expert to join this tumor board.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="expert@hospital.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleInviteExpert} className="gap-2">
                      <Mail className="h-4 w-4" />
                      Send Invitation
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={meetingDialogOpen} onOpenChange={setMeetingDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule Meeting
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Schedule Meeting</DialogTitle>
                    <DialogDescription>
                      Schedule a virtual tumor board meeting.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="meeting-title">Title</Label>
                      <Input id="meeting-title" placeholder="Weekly Case Review" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="meeting-date">Date</Label>
                        <Input id="meeting-date" type="date" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="meeting-time">Time</Label>
                        <Input id="meeting-time" type="time" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meet-link">Google Meet Link (Optional)</Label>
                      <Input
                        id="meet-link"
                        placeholder="https://meet.google.com/..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setMeetingDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        toast.success('Meeting scheduled');
                        setMeetingDialogOpen(false);
                      }}
                    >
                      Schedule
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="cases" className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <TabsList className="mb-6">
            <TabsTrigger value="cases" className="gap-2">
              <Folder className="h-4 w-4" />
              Cases ({mtbCases.length})
            </TabsTrigger>
            <TabsTrigger value="meetings" className="gap-2">
              <Calendar className="h-4 w-4" />
              Meetings ({meetings.length})
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cases">
            {mtbCases.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {mtbCases.map((mtbCase, index) => {
                  const caseData = getCaseById(mtbCase.caseId);
                  if (!caseData) return null;
                  
                  return (
                    <Link
                      key={mtbCase.id}
                      to={`/cases/${caseData.id}`}
                      className="medical-card hover:border-primary/50 transition-all duration-300 animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                          {caseData.cancerType}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Added {new Date(mtbCase.addedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground">{caseData.caseName}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {caseData.notes || 'No notes'}
                      </p>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 medical-card">
                <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Cases Added</h3>
                <p className="text-muted-foreground mb-4">
                  Add cases to this tumor board for review.
                </p>
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Case
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="meetings">
            {meetings.length > 0 ? (
              <div className="space-y-4">
                {meetings.map((meeting, index) => (
                  <div
                    key={meeting.id}
                    className="medical-card animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-accent/10">
                          <Video className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{meeting.title}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(meeting.scheduledAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(meeting.scheduledAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span>{meeting.durationMinutes} min</span>
                          </div>
                        </div>
                      </div>
                      {meeting.googleMeetLink && (
                        <a
                          href={meeting.googleMeetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline" className="gap-2">
                            <Video className="h-4 w-4" />
                            Join
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 medical-card">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Meetings Scheduled</h3>
                <p className="text-muted-foreground mb-4">
                  Schedule a meeting to discuss cases with experts.
                </p>
                <Button onClick={() => setMeetingDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Schedule Meeting
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="members">
            <div className="text-center py-12 medical-card">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Members Yet</h3>
              <p className="text-muted-foreground mb-4">
                Invite experts to join this tumor board.
              </p>
              <Button onClick={() => setInviteDialogOpen(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite Expert
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
