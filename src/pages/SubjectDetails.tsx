import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, CheckCircle2, Circle, Edit2, Trash2, Book, ChevronRight, ChevronDown } from 'lucide-react';
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

const toRoman = (num: number): string => {
  const lookup: { [key: string]: number } = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
  let roman = '';
  for (let i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman.toLowerCase();
};

export default function SubjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { subjects, topics, subtopics, addTopic, updateTopic, deleteTopic, addSubtopic, updateSubtopic, deleteSubtopic } = useAppStore();
  
  const subject = subjects.find(s => s.id === id);
  const subjectTopics = useMemo(() => topics.filter(t => t.subjectId === id).sort((a, b) => a.createdAt - b.createdAt), [topics, id]);
  
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [topicFormData, setTopicFormData] = useState({ title: '', targetRevisions: 3 });

  const [isSubtopicModalOpen, setIsSubtopicModalOpen] = useState(false);
  const [activeTopicIdForSub, setActiveTopicIdForSub] = useState<string | null>(null);
  const [editingSubtopicId, setEditingSubtopicId] = useState<string | null>(null);
  const [subtopicFormData, setSubtopicFormData] = useState({ title: '' });

  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

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

  const toggleExpand = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  // Topic Modal
  const openTopicModal = (topicId?: string) => {
    if (topicId) {
      const topic = topics.find(t => t.id === topicId);
      if (topic) {
        setTopicFormData({ title: topic.title, targetRevisions: topic.targetRevisions });
        setEditingTopicId(topicId);
      }
    } else {
      setTopicFormData({ title: '', targetRevisions: 3 });
      setEditingTopicId(null);
    }
    setIsTopicModalOpen(true);
  };

  const handleTopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicFormData.title.trim()) return toast.error('Topic title is required');
    if (topicFormData.targetRevisions < 0) return toast.error('Target revisions cannot be negative');

    if (editingTopicId) {
      updateTopic(editingTopicId, topicFormData);
      toast.success('Topic updated');
    } else {
      addTopic({
        id: uuidv4(),
        subjectId: subject.id,
        title: topicFormData.title,
        targetRevisions: topicFormData.targetRevisions,
        revisionsCompleted: 0,
        isCompleted: false,
      });
      toast.success('Topic added');
    }
    setIsTopicModalOpen(false);
  };

  // Subtopic Modal
  const openSubtopicModal = (topicId: string, subtopicId?: string) => {
    setActiveTopicIdForSub(topicId);
    if (subtopicId) {
      const subtopic = subtopics.find(st => st.id === subtopicId);
      if (subtopic) {
        setSubtopicFormData({ title: subtopic.title });
        setEditingSubtopicId(subtopicId);
      }
    } else {
      setSubtopicFormData({ title: '' });
      setEditingSubtopicId(null);
    }
    setIsSubtopicModalOpen(true);
    
    if (!expandedTopics.has(topicId)) {
      toggleExpand(topicId);
    }
  };

  const handleSubtopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtopicFormData.title.trim()) return toast.error('Subtopic title is required');
    if (!activeTopicIdForSub) return;

    if (editingSubtopicId) {
      updateSubtopic(editingSubtopicId, subtopicFormData);
      toast.success('Subtopic updated');
    } else {
      addSubtopic({
        id: uuidv4(),
        topicId: activeTopicIdForSub,
        title: subtopicFormData.title,
        isCompleted: false,
      });
      toast.success('Subtopic added');
    }
    setIsSubtopicModalOpen(false);
  };

  const handleDeleteTopic = (topicId: string, title: string) => {
    if (window.confirm(`Delete topic "${title}" and all its subtopics?`)) {
      deleteTopic(topicId);
      toast.success('Topic deleted');
    }
  };

  const handleDeleteSubtopic = (subtopicId: string, title: string) => {
    if (window.confirm(`Delete subtopic "${title}"?`)) {
      deleteSubtopic(subtopicId);
      toast.success('Subtopic deleted');
    }
  };

  const toggleTopicCompletion = (topicId: string, currentState: boolean) => {
    updateTopic(topicId, { isCompleted: !currentState });
  };

  const toggleSubtopicCompletion = (subtopicId: string, currentState: boolean) => {
    updateSubtopic(subtopicId, { isCompleted: !currentState });
  };

  const incrementRevision = (topicId: string, current: number, target: number) => {
    if (current < target) {
      updateTopic(topicId, { revisionsCompleted: current + 1 });
    } else {
      updateTopic(topicId, { revisionsCompleted: 0 });
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 max-w-5xl mx-auto pb-12">
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
          <Button onClick={() => openTopicModal()} size="lg">
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
            <Button onClick={() => openTopicModal()}>Add your first topic</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {subjectTopics.map((topic, index) => {
              const topicSubtopics = subtopics.filter(st => st.topicId === topic.id).sort((a,b) => a.createdAt - b.createdAt);
              const isExpanded = expandedTopics.has(topic.id);
              
              return (
                <motion.div key={topic.id} variants={itemVariants} className="flex flex-col gap-2">
                  <div className="glass rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-all hover:shadow-xl hover:border-white/20 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 opacity-80" style={{ backgroundColor: subject.color }} />
                    
                    <div className="flex items-center gap-4 flex-1 min-w-0 pl-3">
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
                      
                      <div className="flex-1 cursor-pointer flex items-center gap-2" onClick={() => toggleExpand(topic.id)}>
                        <h3 className={cn("text-lg font-bold truncate transition-colors duration-300 flex items-center gap-2", topic.isCompleted && "text-muted-foreground line-through")}>
                          <span>{index + 1}.</span> {topic.title}
                        </h3>
                        {topicSubtopics.length > 0 && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            {topicSubtopics.length} sub
                          </span>
                        )}
                        <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full text-muted-foreground">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end gap-4 ml-12 md:ml-0">
                      {/* Revisions Tracker */}
                      {topic.targetRevisions > 0 && (
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
                                  i < topic.revisionsCompleted ? "shadow-sm scale-110" : "bg-muted-foreground/30",
                                  i >= topic.targetRevisions && i < topic.revisionsCompleted && "ring-2 ring-offset-1 ring-offset-card"
                                )}
                                style={i < topic.revisionsCompleted ? { backgroundColor: subject.color } : {}}
                              />
                            ))}
                          </button>
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={() => openSubtopicModal(topic.id)} title="Add Subtopic">
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openTopicModal(topic.id)} title="Edit Topic">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteTopic(topic.id, topic.title)} title="Delete Topic">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Subtopics Nested List */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden pl-6 md:pl-12 pr-2"
                      >
                        <div className="pl-4 py-2 border-l-2 border-border/50 space-y-2 mb-2">
                          {topicSubtopics.map((sub, sIdx) => (
                            <div key={sub.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-secondary/40 transition-colors group">
                              <div className="flex items-center gap-3 min-w-0">
                                <button 
                                  onClick={() => toggleSubtopicCompletion(sub.id, sub.isCompleted)}
                                  className="focus:outline-none flex-shrink-0"
                                >
                                  {sub.isCompleted ? (
                                    <CheckCircle2 className="w-5 h-5" style={{ color: subject.color }} />
                                  ) : (
                                    <Circle className="w-5 h-5 text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
                                  )}
                                </button>
                                <span className={cn(
                                  "text-sm font-medium truncate flex items-center gap-2",
                                  sub.isCompleted && "line-through text-muted-foreground"
                                )}>
                                  <span className="text-muted-foreground w-6 inline-block font-mono text-xs">{toRoman(sIdx + 1)}.</span>
                                  {sub.title}
                                </span>
                              </div>
                              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => openSubtopicModal(topic.id, sub.id)}>
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteSubtopic(sub.id, sub.title)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          
                          <button 
                            onClick={() => openSubtopicModal(topic.id)}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors p-2 font-medium"
                          >
                            <Plus className="w-4 h-4" /> Add Subtopic
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Topic Modal */}
      <Modal isOpen={isTopicModalOpen} onClose={() => setIsTopicModalOpen(false)} title={editingTopicId ? "Edit Topic" : "Add Topic"}>
        <form onSubmit={handleTopicSubmit} className="space-y-5">
          <Input
            label="Topic / Chapter Title *"
            placeholder="e.g. Thermodynamics, Chapter 1"
            value={topicFormData.title}
            onChange={(e) => setTopicFormData({ ...topicFormData, title: e.target.value })}
            autoFocus
          />
          
          <Input
            type="number"
            min="0"
            max="10"
            label="Target Revisions"
            placeholder="How many times do you plan to revise?"
            value={topicFormData.targetRevisions}
            onChange={(e) => setTopicFormData({ ...topicFormData, targetRevisions: parseInt(e.target.value) || 0 })}
          />
          <p className="text-xs text-muted-foreground -mt-2">Set to 0 if you don't want to track revisions for this topic.</p>
          
          <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
            <Button type="button" variant="ghost" onClick={() => setIsTopicModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editingTopicId ? "Save Changes" : "Add Topic"}</Button>
          </div>
        </form>
      </Modal>

      {/* Subtopic Modal */}
      <Modal isOpen={isSubtopicModalOpen} onClose={() => setIsSubtopicModalOpen(false)} title={editingSubtopicId ? "Edit Subtopic" : "Add Subtopic"}>
        <form onSubmit={handleSubtopicSubmit} className="space-y-5">
          <Input
            label="Subtopic Title *"
            placeholder="e.g. Introduction and Basic Concepts"
            value={subtopicFormData.title}
            onChange={(e) => setSubtopicFormData({ ...subtopicFormData, title: e.target.value })}
            autoFocus
          />
          
          <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
            <Button type="button" variant="ghost" onClick={() => setIsSubtopicModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editingSubtopicId ? "Save Changes" : "Add Subtopic"}</Button>
          </div>
        </form>
      </Modal>

    </motion.div>
  );
}
