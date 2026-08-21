import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Power, Book } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { useAppStore } from '../store';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { SUBJECT_COLORS, SUBJECT_ICONS } from '../utils/constants';
import type { IconName } from '../utils/constants';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 30 } }
};

export default function Subjects() {
  const navigate = useNavigate();
  const { subjects, topics, schedules, addSubject, updateSubject, deleteSubject } = useAppStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    description: '',
    color: SUBJECT_COLORS[0].value,
    icon: 'Book' as IconName,
  });

  const openModal = (e?: React.MouseEvent, subjectId?: string) => {
    e?.stopPropagation();
    if (subjectId) {
      const subject = subjects.find((s) => s.id === subjectId);
      if (subject) {
        setFormData({
          name: subject.name,
          shortName: subject.shortName || '',
          description: subject.description || '',
          color: subject.color,
          icon: subject.icon as IconName,
        });
        setEditingId(subjectId);
      }
    } else {
      setFormData({
        name: '',
        shortName: '',
        description: '',
        color: SUBJECT_COLORS[0].value,
        icon: 'Book',
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Subject name is required');
    
    if (editingId) {
      updateSubject(editingId, formData);
      toast.success('Subject updated');
    } else {
      addSubject({
        id: uuidv4(),
        ...formData,
        isActive: true,
      });
      toast.success('Subject created');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    const isUsed = schedules.some((s) => s.subjectId === id);
    if (isUsed) {
      toast.error(`Cannot delete ${name}. It is used in your schedules. Deactivate it instead.`);
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${name}? All its topics will be lost.`)) {
      deleteSubject(id);
      toast.success('Subject deleted');
    }
  };

  const handleToggleActive = (e: React.MouseEvent, id: string, currentState: boolean) => {
    e.stopPropagation();
    updateSubject(id, { isActive: !currentState });
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground mt-2 text-lg">Manage subjects and track chapter progress.</p>
        </div>
        <Button onClick={() => openModal()} size="lg">
          <Plus className="w-5 h-5 mr-2" />
          Add Subject
        </Button>
      </motion.div>

      {subjects.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="flex flex-col items-center justify-center p-16 text-center border-dashed bg-card/40">
            <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary mb-6">
              <Book className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold mb-3">No subjects yet</h3>
            <p className="text-muted-foreground max-w-sm mb-8 text-base">
              Add your first subject to start building your topics and schedule.
            </p>
            <Button onClick={() => openModal()} size="lg">Add Subject</Button>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {subjects.map((subject) => {
            const IconComponent = SUBJECT_ICONS[subject.icon as IconName] || Book;
            const subjectTopics = topics.filter(t => t.subjectId === subject.id);
            const completedTopics = subjectTopics.filter(t => t.isCompleted).length;
            const progress = subjectTopics.length === 0 ? 0 : Math.round((completedTopics / subjectTopics.length) * 100);
            
            return (
              <motion.div variants={itemVariants} key={subject.id}>
                <Card 
                  interactive
                  onClick={() => navigate(`/subjects/${subject.id}`)}
                  className={`h-full relative overflow-hidden transition-all duration-300 flex flex-col group ${!subject.isActive ? 'opacity-60 grayscale-[30%]' : ''}`}
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full opacity-80" style={{ backgroundColor: subject.color }} />
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: subject.color }}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={(e) => handleToggleActive(e, subject.id, subject.isActive)} title={subject.isActive ? 'Deactivate' : 'Activate'}>
                        <Power className={`w-3.5 h-3.5 ${!subject.isActive ? 'text-destructive' : ''}`} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={(e) => openModal(e, subject.id)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={(e) => handleDelete(e, subject.id, subject.name)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">{subject.name}</h3>
                    {subject.shortName && (
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] uppercase font-bold bg-secondary/80 text-secondary-foreground mt-1 mb-2 shadow-sm border border-border/50">
                        {subject.shortName}
                      </span>
                    )}
                    {subject.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                        {subject.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/50 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-muted-foreground">{subjectTopics.length} Topics</span>
                      <span style={{ color: subject.color }}>{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-background/50 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%`, backgroundColor: subject.color }} />
                    </div>
                  </div>
                  
                  {!subject.isActive && (
                    <div className="absolute inset-0 bg-background/20 backdrop-blur-[2px] pointer-events-none flex items-center justify-center">
                      <span className="px-4 py-1.5 bg-background/90 rounded-full text-sm font-bold shadow-xl border border-border/50">
                        Inactive
                      </span>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Subject' : 'Add Subject'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Subject Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Corporate Law" autoFocus />
          <Input label="Short Name / Code" value={formData.shortName} onChange={(e) => setFormData({ ...formData, shortName: e.target.value })} placeholder="e.g. CLAW" />
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Description</label>
            <textarea className="flex w-full rounded-2xl glass-input px-4 py-3 text-sm placeholder:text-muted-foreground resize-none h-24" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional description" />
          </div>
          
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Color</label>
              <div className="flex flex-wrap gap-2.5">
                {SUBJECT_COLORS.map((c) => (
                  <button key={c.value} type="button" className={`w-8 h-8 rounded-full transition-transform shadow-inner ${formData.color === c.value ? 'scale-125 ring-2 ring-offset-2 ring-offset-background shadow-lg' : 'hover:scale-110'}`} style={{ backgroundColor: c.value }} onClick={() => setFormData({ ...formData, color: c.value })} title={c.name} />
                ))}
              </div>
            </div>
            
            <Select label="Icon" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value as IconName })}>
              {Object.keys(SUBJECT_ICONS).map((iconName) => (
                <option key={iconName} value={iconName}>{iconName}</option>
              ))}
            </Select>
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editingId ? 'Save Changes' : 'Add Subject'}</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
