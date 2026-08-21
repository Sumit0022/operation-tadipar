import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, CheckCircle2, Circle, Edit2, Trash2, Book } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { useAppStore } from '../store';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { SUBJECT_ICONS, type IconName } from '../utils/constants';
import { cn } from '../utils/cn';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 30 } }
};

export default function SubjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { subjects, topics, addTopic, updateTopic, deleteTopic } = useAppStore();
  
  const subject = subjects.find(s => s.id === id);
  const subjectTopics = useMemo(() => topics.filter(t => t.subjectId === id).sort((a, b) => a.createdAt - b.createdAt), [topics, id]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    targetRevisions: 3
  });

  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold">Subject not found</h2>
        <Button onClick={() => navigate('/subjects')}>Go Back</Button>
      </div>
    );
  }

  const IconComponent = SUBJECT_ICONS[subject.icon as IconName] || Book;
  
  const completedTopics = subjectTopics.filter(t => t.isCompleted).length;
  const progressPercent = subjectTopics.length === 0 ? 0 : Math.round((completedTopics / subjectTopics.length) * 100);

  const openModal = (topicId?: string) => {
    if (topicId) {
      const topic = topics.find(t => t.id === topicId);
      if (topic) {
        setFormData({ title: topic.title, targetRevisions: topic.targetRevisions });
        setEditingId(topicId);
      }
    } else {
      setFormData({ title: '', targetRevisions: 3 });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error('Topic title is required');
    if (formData.targetRevisions < 0) return toast.error('Target revisions cannot be negative');

    if (editingId) {
      updateTopic(editingId, formData);
      toast.success('Topic updated');
    } else {
      addTopic({
        id: uuidv4(),
        subjectId: subject.id,
        title: formData.title,
        targetRevisions: formData.targetRevisions,
        revisionsCompleted: 0,
        isCompleted: false,
      });
      toast.success('Topic added');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (topicId: string, title: string) => {
    if (window.confirm(`Delete topic "${title}"?`)) {
      deleteTopic(topicId);
      toast.success('Topic deleted');
    }
  };

  const toggleTopicCompletion = (topicId: string, currentState: boolean) => {
    updateTopic(topicId, { isCompleted: !currentState });
  };

  const incrementRevision = (topicId: string, current: number, target: number) => {
    if (current < target) {
      updateTopic(topicId, { revisionsCompleted: current + 1 });
    } else {
      // Optional: allow resetting or just capping
      updateTopic(topicId, { revisionsCompleted: 0 });
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/subjects')} className="rounded-full bg-muted/50 hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: subject.color }}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">{subject.name}</h1>
              {subject.shortName && <span className="text-muted-foreground font-semibold">{subject.shortName}</span>}
            </div>
          </div>
          <Button onClick={() => openModal()} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Add Topic
          </Button>
        </div>
      </motion.div>

      {/* Progress Card */}
      <motion.div variants={itemVariants}>
        <Card className="bg-card/40 backdrop-blur-3xl border border-white/5 p-6 flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-xl font-bold">Subject Progress</h2>
              <p className="text-muted-foreground">{completedTopics} of {subjectTopics.length} topics completed</p>
            </div>
            <div className="text-4xl font-extrabold" style={{ color: subject.color }}>
              {progressPercent}%
            </div>
          </div>
          <div className="h-4 w-full bg-background/50 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, type: "spring" }}
              className="h-full relative overflow-hidden"
              style={{ backgroundColor: subject.color }}
            >
              <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
            </motion.div>
          </div>
        </Card>
      </motion.div>

      {/* Topics List */}
      <motion.div variants={itemVariants}>
        {subjectTopics.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-16 text-center border-dashed bg-card/20">
            <h3 className="text-xl font-bold mb-2">No topics added</h3>
            <p className="text-muted-foreground max-w-sm mb-6">Break down your subject into chapters or topics to track your progress.</p>
            <Button onClick={() => openModal()}>Add your first topic</Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {subjectTopics.map((topic, index) => (
              <motion.div 
                key={topic.id}
                variants={itemVariants}
                className="glass rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-all hover:shadow-xl hover:border-white/20"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <button 
                    onClick={() => toggleTopicCompletion(topic.id, topic.isCompleted)}
                    className="flex-shrink-0 focus:outline-none transition-transform active:scale-90"
                  >
                    {topic.isCompleted ? (
                      <CheckCircle2 className="w-8 h-8 drop-shadow-md" style={{ color: subject.color }} />
                    ) : (
                      <Circle className="w-8 h-8 text-muted-foreground/50 hover:text-muted-foreground" />
                    )}
                  </button>
                  <h3 className={cn("text-lg font-bold truncate transition-colors duration-300", topic.isCompleted && "text-muted-foreground line-through")}>
                    {index + 1}. {topic.title}
                  </h3>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-6 ml-12 md:ml-0">
                  {/* Revisions Tracker */}
                  <div className="flex flex-col items-start md:items-end">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Revisions</span>
                    <button 
                      onClick={() => incrementRevision(topic.id, topic.revisionsCompleted, topic.targetRevisions)}
                      className="flex gap-1.5 p-1 -m-1 rounded-lg hover:bg-secondary/50 transition-colors"
                      title="Click to mark revision complete"
                    >
                      {Array.from({ length: Math.max(topic.targetRevisions, topic.revisionsCompleted) }).map((_, i) => (
                        <div 
                          key={i}
                          className={cn(
                            "w-3 h-3 rounded-full transition-all duration-300",
                            i < topic.revisionsCompleted 
                              ? "shadow-sm scale-110" 
                              : "bg-muted-foreground/30",
                            i >= topic.targetRevisions && i < topic.revisionsCompleted && "ring-2 ring-offset-1 ring-offset-card" // extra revisions
                          )}
                          style={i < topic.revisionsCompleted ? { backgroundColor: subject.color } : {}}
                        />
                      ))}
                    </button>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openModal(topic.id)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(topic.id, topic.title)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Topic" : "Add Topic"}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Topic / Chapter Title *"
            placeholder="e.g. Thermodynamics, Chapter 1"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            autoFocus
          />
          
          <Input
            type="number"
            min="0"
            max="10"
            label="Target Revisions"
            placeholder="How many times do you plan to revise?"
            value={formData.targetRevisions}
            onChange={(e) => setFormData({ ...formData, targetRevisions: parseInt(e.target.value) || 0 })}
          />
          <p className="text-xs text-muted-foreground -mt-2">Set to 0 if you don't want to track revisions for this topic.</p>
          
          <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editingId ? "Save Changes" : "Add Topic"}</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
