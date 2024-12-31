import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Goal, GoalType, GoalTimeframe } from '@/types/goals';
import { createGoal } from '@/services/goalService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { format, endOfWeek } from 'date-fns';

interface CreateGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoalCreated: (goalId: string) => void;
  selectedWeek: Date;
}

export function CreateGoalDialog({
  open,
  onOpenChange,
  onGoalCreated,
  selectedWeek,
}: CreateGoalDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: format(endOfWeek(selectedWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    type: 'team' as GoalType,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.uid || !user?.organizationId) return;

    try {
      setIsSubmitting(true);
      const goalId = await createGoal({
        ...formData,
        timeframe: 'weekly' as GoalTimeframe,
        priority: 'medium',
        status: 'not_started',
        progress: 0,
        startDate: selectedWeek,
        endDate: endOfWeek(selectedWeek, { weekStartsOn: 1 }),
        metrics: [],
        keyResults: [],
        milestones: [],
        assignees: [],
        organizationId: user.organizationId,
        ownerId: user.uid,
        createdBy: user.uid,
        tags: []
      });

      toast({
        title: 'Goal Created',
        description: 'Your new goal has been created successfully.',
      });

      onGoalCreated(goalId);
      onOpenChange(false);
      setFormData({
        title: '',
        description: '',
        deadline: format(endOfWeek(selectedWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        type: 'team',
      });
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to create goal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter goal title"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Enter goal description"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Deadline</label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, deadline: e.target.value }))
                }
                min={format(selectedWeek, 'yyyy-MM-dd')}
                max={format(endOfWeek(selectedWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd')}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={formData.type}
                onValueChange={(value: GoalType) =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select goal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Weekly">Weekly Goal</SelectItem>
                  <SelectItem value="Team">Team Goal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 