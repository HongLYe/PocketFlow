import React, { useState } from 'react';
import { Download, Upload, Moon, Sun, Monitor, Plus, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { AppSettings, Category } from '../../../domain/models/types';
import { Icon } from '../../components/Icon';

interface SettingsViewProps {
  settings: AppSettings;
  categories: Category[];
  onUpdateSettings: (s: Partial<AppSettings>) => Promise<void>;
  onExportBackup: () => Promise<void>;
  onImportBackup: (jsonString: string) => Promise<{ success: boolean; error?: string }>;
  onExportCSV: () => Promise<void>;
  onAddCategory: (category: Category) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  categories,
  onUpdateSettings,
  onExportBackup,
  onImportBackup,
  onExportCSV,
  onAddCategory,
}) => {
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatKind, setNewCatKind] = useState<'income' | 'expense'>('expense');
  const [newCatIcon, setNewCatIcon] = useState('Tag');
  const [isAddingCat, setIsAddingCat] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('Restoring a backup will overwrite existing local data. Do you want to continue?')) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const result = await onImportBackup(text);
      if (result.success) {
        setImportStatus({ success: true, message: 'Backup restored successfully! All data has been synchronized.' });
      } else {
        setImportStatus({ success: false, message: `Restore failed: ${result.error || 'Corrupted file'}` });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCategory: Category = {
      id: `cat-custom-${Date.now()}`,
      name: newCatName.trim(),
      kind: newCatKind,
      icon: newCatIcon || 'Tag',
      sortOrder: categories.length + 1,
      isArchived: false,
    };

    await onAddCategory(newCategory);
    setNewCatName('');
    setIsAddingCat(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 760 }}>
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Settings & Data Management</h1>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
          Manage local storage, theme appearance, categories, and offline backups
        </p>
      </div>

      {importStatus && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: importStatus.success ? 'var(--income-bg)' : 'var(--expense-bg)',
            color: importStatus.success ? 'var(--income-color)' : 'var(--expense-color)',
            border: `1px solid ${importStatus.success ? 'var(--income-border)' : 'var(--expense-border)'}`,
            fontSize: '0.88rem',
          }}
        >
          {importStatus.success ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{importStatus.message}</span>
        </div>
      )}

      <div className="stat-box" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Display Theme</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              className={`btn btn-sm ${settings.theme === t ? 'btn-primary' : 'btn-secondary'}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6, textTransform: 'capitalize' }}
              onClick={() => onUpdateSettings({ theme: t })}
            >
              {t === 'light' ? <Sun size={14} /> : t === 'dark' ? <Moon size={14} /> : <Monitor size={14} />}
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="stat-box" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Local-First Backup & Restore</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
            PocketFlow does not use external servers or cloud accounts. Save versioned backup files to preserve your data across devices.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onExportBackup}>
            <Download size={15} /> Export Backup (JSON)
          </button>

          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            <Upload size={15} /> Restore Backup (JSON)
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </label>

          <button className="btn btn-secondary" onClick={onExportCSV}>
            <Download size={15} /> Export Transactions (CSV)
          </button>
        </div>
      </div>

      <div className="stat-box" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Categories</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {categories.length} categories available
            </p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setIsAddingCat(!isAddingCat)}
          >
            <Plus size={14} /> {isAddingCat ? 'Cancel' : 'Add Category'}
          </button>
        </div>

        {isAddingCat && (
          <form
            onSubmit={handleCreateCategory}
            style={{
              padding: 12,
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div className="grid-2">
              <input
                type="text"
                className="form-input"
                placeholder="Category Name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                required
              />
              <select
                className="form-select"
                value={newCatKind}
                onChange={(e) => setNewCatKind(e.target.value as 'income' | 'expense')}
              >
                <option value="expense">Expense Category</option>
                <option value="income">Income Category</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                Icon Keyword (e.g. Coffee, Car, Home, Film, Gift)
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Tag"
                value={newCatIcon}
                onChange={(e) => setNewCatIcon(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="submit" className="btn btn-primary btn-sm">
                Save Category
              </button>
            </div>
          </form>
        )}

        <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
          {categories.map((c) => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name={c.icon} size={15} />
                <span>{c.name}</span>
              </div>
              <span className="badge" style={{ textTransform: 'capitalize' }}>
                {c.kind}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
