import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight } from 'lucide-react';
import { useCreateCaseStore } from '@/stores/createCaseStore';
import { StepIndicator } from '@/components/create-case/StepIndicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { CancerType, Sex } from '@/types/vmtb';

const cancerTypes: { value: CancerType; label: string }[] = [
  { value: 'breast', label: 'Breast Cancer' },
  { value: 'lung', label: 'Lung Cancer' },
  { value: 'colorectal', label: 'Colorectal Cancer' },
  { value: 'prostate', label: 'Prostate Cancer' },
  { value: 'melanoma', label: 'Melanoma' },
  { value: 'leukemia', label: 'Leukemia' },
  { value: 'lymphoma', label: 'Lymphoma' },
  { value: 'pancreatic', label: 'Pancreatic Cancer' },
  { value: 'ovarian', label: 'Ovarian Cancer' },
  { value: 'bladder', label: 'Bladder Cancer' },
  { value: 'kidney', label: 'Kidney Cancer' },
  { value: 'thyroid', label: 'Thyroid Cancer' },
  { value: 'liver', label: 'Liver Cancer' },
  { value: 'brain', label: 'Brain Cancer' },
  { value: 'other', label: 'Other' },
];

const formSchema = z.object({
  patientName: z.string().min(1, 'Patient name is required'),
  age: z.coerce.number().min(0, 'Age must be positive').max(150, 'Invalid age'),
  sex: z.enum(['male', 'female', 'other'] as const),
  caseName: z.string().min(1, 'Case name is required'),
  cancerType: z.string().min(1, 'Cancer type is required'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function MetadataStep() {
  const navigate = useNavigate();
  const { 
    patientMetadata, 
    caseMetadata, 
    setPatientMetadata, 
    setCaseMetadata,
    setStep 
  } = useCreateCaseStore();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: patientMetadata?.name || '',
      age: patientMetadata?.age || undefined,
      sex: patientMetadata?.sex || undefined,
      caseName: caseMetadata?.caseName || '',
      cancerType: caseMetadata?.cancerType || '',
      notes: caseMetadata?.notes || '',
    },
  });

  const onSubmit = (data: FormData) => {
    setPatientMetadata({
      name: data.patientName,
      age: data.age,
      sex: data.sex as Sex,
    });
    setCaseMetadata({
      caseName: data.caseName,
      cancerType: data.cancerType as CancerType,
      notes: data.notes,
    });
    setStep('upload');
    navigate('/create-case/upload');
  };

  return (
    <div className="min-h-screen bg-background">
      <StepIndicator currentStep="metadata" completedSteps={[]} />

      <div className="max-w-2xl mx-auto px-4 pb-12">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Create New Case
          </h1>
          <p className="text-muted-foreground">
            Enter patient and case information. This data is stored locally until case creation.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Patient Information */}
            <div className="medical-card animate-fade-in" style={{ animationDelay: '100ms' }}>
              <h2 className="text-lg font-semibold text-foreground mb-6">Patient Information</h2>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="patientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter patient name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Age" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sex</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Case Information */}
            <div className="medical-card animate-fade-in" style={{ animationDelay: '200ms' }}>
              <h2 className="text-lg font-semibold text-foreground mb-6">Case Information</h2>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="caseName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Case Identifier</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., BC-2024-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cancerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cancer Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cancer type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cancerTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clinical Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter any relevant clinical notes..."
                          className="min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end animate-fade-in" style={{ animationDelay: '300ms' }}>
              <Button type="submit" size="lg" className="gap-2">
                Continue to Upload
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
