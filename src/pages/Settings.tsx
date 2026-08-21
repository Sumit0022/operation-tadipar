import { useRef } from 'react';
import { Download, Upload, Trash2, Moon, Sun, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../store';
import { useSettingsStore } from '../store/settings';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { cn } from '../utils/cn';

export default function Settings() {
  const { subjects, topics, subtopics, schedules, holidays, importData, resetData } = useAppStore();
  const { theme, setTheme, weekStartsOn, setWeekStartsOn } = useSettingsStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = {
      version: 1,
      timestamp: new Date().toISOString(),
      subjects,
      topics,
      subtopics,
      schedules,
      holidays,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `operation-tadipar-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Data exported successfully');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Basic validation
        if (json.subjects && Array.isArray(json.subjects)) {
          importData({
            subjects: json.subjects,
            topics: json.topics || [],
            subtopics: json.subtopics || [],
            schedules: json.schedules || [],
            holidays: json.holidays || [],
          });
          toast.success('Data imported successfully');
        } else {
          toast.error('Invalid backup file structure');
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to parse backup file');
      }
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    const confirm1 = window.confirm('Are you absolutely sure you want to delete all your data?');
    if (confirm1) {
      const confirm2 = window.confirm('This action CANNOT be undone. Proceed?');
      if (confirm2) {
        resetData();
        toast.success('All data has been reset');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your application preferences and data.</p>
      </div>

      <div className="grid gap-6">
        {/* Appearance Settings */}
        <Card>
          <h2 className="text-lg font-semibold mb-4 border-b border-border/50 pb-2">Appearance</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">Theme</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'system', label: 'System', icon: Monitor },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as any)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200",
                      theme === t.id 
                        ? "border-primary bg-primary/5 text-primary" 
                        : "border-border/50 bg-card hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <t.icon className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Calendar Settings */}
        <Card>
          <h2 className="text-lg font-semibold mb-4 border-b border-border/50 pb-2">Calendar</h2>
          
          <div className="max-w-xs">
            <Select
              label="First Day of Week"
              value={weekStartsOn.toString()}
              onChange={(e) => setWeekStartsOn(Number(e.target.value) as 0 | 1)}
            >
              <option value="1">Monday</option>
              <option value="0">Sunday</option>
            </Select>
          </div>
        </Card>

        {/* Data Settings */}
        <Card>
          <h2 className="text-lg font-semibold mb-4 border-b border-border/50 pb-2">Data Management</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Your data is stored locally in your browser. Export it regularly to keep backups.
          </p>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleExport} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export Data (JSON)
              </Button>
              
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="flex-1">
                <Upload className="w-4 h-4 mr-2" />
                Import Data
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json,application/json"
                onChange={handleImport}
              />
            </div>
            
            <div className="pt-6 border-t border-border/50">
              <h3 className="text-sm font-medium text-destructive mb-2">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete all your subjects, schedules, and holidays.
              </p>
              <Button variant="danger" onClick={handleReset}>
                <Trash2 className="w-4 h-4 mr-2" />
                Reset All Data
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
