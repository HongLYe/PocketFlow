import React, { useState } from 'react';
import { Download, Upload, Moon, Sun, Monitor, Plus } from 'lucide-react';
import type { AppSettings, Category } from '../../domain/models/types';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Alert } from '../components/Alert';
import { Badge } from '../components/Badge';
import { Icon } from '../components/Icon';

export interface SettingsPageProps {
  settings: AppSettings;
  categories: Category[];
  onUpdateSettings: (s: Partial<AppSettings>) => Promise<void>;
  onExportBackup: () => Promise<void>;
  onImportBackup: (jsonString: string) => Promise<{ success: boolean; error?: string }>;
  onExportCSV: () => Promise<void>;
  onAddCategory: (category: Category) => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
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
        setImportStatus({
          success: true,
          message: 'Backup restored successfully! All local data is verified and synchronized.',
        });
      } else {
        setImportStatus({
          success: false,
          message: `Restore failed: ${result.error || 'Corrupted or incompatible file format'}`,
        });
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 760 }}>
      <PageHeader
        title="Settings & Data Management"
        description="Local storage, theme appearance, categories, and offline backup export"
      />

      {importStatus && (
        <Alert
          variant={importStatus.success ? 'success' : 'error'}
          title={importStatus.success ? 'Backup Restored' : 'Restore Error'}
          onClose={() => setImportStatus(null)}
        >
          {importStatus.message}
        </Alert>
      )}

      {/* Theme Appearance Box */}
      <div className="stat-box" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Display Theme</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['light', 'dark', 'system'] as const).map((t) => (
            <Button
              key={t}
              variant={settings.theme === t ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => onUpdateSettings({ theme: t })}
              leftIcon={
                t === 'light' ? <Sun size={14} /> : t === 'dark' ? <Moon size={14} /> : <Monitor size={14} />
              }
              style={{ textTransform: 'capitalize' }}
            >
              {t}
            </Button>
          ))}
        </div>
      </div>

      {/* Backup and Restore Box */}
      <div className="stat-box" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Local-First Backup & Restore</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
            PocketFlow does not use external servers or cloud accounts. Save versioned JSON files to preserve your financial records across devices.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            onClick={onExportBackup}
            leftIcon={<Download size={15} />}
          >
            Export Backup (JSON)
          </Button>

          <label
            className="btn btn-secondary"
            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Upload size={15} /> Restore Backup (JSON)
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </label>

          <Button
            variant="secondary"
            onClick={onExportCSV}
            leftIcon={<Download size={15} />}
          >
            Export Transactions (CSV)
          </Button>
        </div>
      </div>

      {/* Categories Box */}
      <div className="stat-box" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Categories</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {categories.length} income and expense categories
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAddingCat(!isAddingCat)}
            leftIcon={<Plus size={14} />}
          >
            {isAddingCat ? 'Cancel' : 'Add Category'}
          </Button>
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
              <Input
                label="Category Name"
                placeholder="e.g. Subscriptions, Coffee, Books"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                required
              />
              <Select
                label="Kind"
                value={newCatKind}
                onChange={(e) => setNewCatKind(e.target.value as 'income' | 'expense')}
                options={[
                  { value: 'expense', label: 'Expense Category' },
                  { value: 'income', label: 'Income Category' },
                ]}
              />
            </div>
            <Input
              label="Icon Name (Lucide)"
              placeholder="Tag, Coffee, Car, Home, Film, Gift"
              value={newCatIcon}
              onChange={(e) => setNewCatIcon(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button type="submit" variant="primary" size="sm">
                Save Category
              </Button>
            </div>
          </form>
        )}

        <div
          style={{
            maxHeight: 280,
            overflowY: 'auto',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
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
              <Badge variant={c.kind === 'income' ? 'success' : 'neutral'}>
                {c.kind}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
