import React, { useState } from 'react';
import {
  Download,
  Upload,
  Moon,
  Sun,
  Monitor,
  Plus,
  ShieldCheck,
  Archive,
} from 'lucide-react';
import type { AppSettings, Category } from '../../domain/models/types';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Alert } from '../components/Alert';
import { Badge } from '../components/Badge';
import { Icon } from '../components/Icon';
import { Link } from '../routing/router';
import { ROUTES } from '../routing/routes';
import { APP_VERSION } from '../../config/version';

export interface SettingsPageProps {
  settings: AppSettings;
  categories: Category[];
  onUpdateSettings: (s: Partial<AppSettings>) => Promise<void>;
  onExportBackup: () => Promise<void>;
  onImportBackup: (jsonString: string) => Promise<{ success: boolean; error?: string }>;
  onExportCSV: () => Promise<void>;
  onAddCategory: (category: Category) => Promise<void>;
  onArchiveCategory?: (id: string) => Promise<void>;
  onUnarchiveCategory?: (id: string) => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  categories,
  onUpdateSettings,
  onExportBackup,
  onImportBackup,
  onExportCSV,
  onAddCategory,
  onArchiveCategory,
  onUnarchiveCategory,
}) => {
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(
    null
  );
  const [newCatName, setNewCatName] = useState('');
  const [newCatKind, setNewCatKind] = useState<'income' | 'expense'>('expense');
  const [newCatIcon, setNewCatIcon] = useState('Tag');
  const [isAddingCat, setIsAddingCat] = useState(false);

  const activeCategories = categories.filter((c) => !c.isArchived);
  const archivedCategories = categories.filter((c) => c.isArchived);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmed = window.confirm(
      'WARNING: Restoring a backup completely replaces all current accounts, transactions, categories, budgets, and settings with the contents of this file.\n\nExisting local data will be replaced. Do you wish to continue?'
    );

    if (!confirmed) {
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
          message:
            'Backup restored successfully! All local database tables have been verified and updated.',
        });
      } else {
        setImportStatus({
          success: false,
          message: `Restore failed: ${result.error || 'Corrupted, invalid, or unsupported backup format. Existing data remains untouched.'}`,
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
      icon: newCatIcon.trim() || 'Tag',
      sortOrder: categories.length + 1,
      isArchived: false,
    };

    try {
      await onAddCategory(newCategory);
      setNewCatName('');
      setIsAddingCat(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to add category');
    }
  };

  const currencies: { value: AppSettings['preferredCurrency']; label: string }[] = [
    { value: 'ALL', label: 'All Currencies (USD & KHR)' },
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'KHR', label: 'Cambodian Riel (៛)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHeader
        eyebrow="PREFERENCES & DATA MANAGEMENT"
        title="Settings"
        description="Display preferences, backup & restore, and category management"
      />

      {importStatus && (
        <Alert
          variant={importStatus.success ? 'success' : 'error'}
          onClose={() => setImportStatus(null)}
        >
          {importStatus.message}
        </Alert>
      )}

      {/* Preferred Display Currency */}
      <div className="surface-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: '0.94rem', fontWeight: 600 }}>Preferred Display Currency</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
            A display preference for which records to show first. Does not convert or modify monetary amounts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {currencies.map((c) => (
            <Button
              key={c.value}
              variant={settings.preferredCurrency === c.value ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => onUpdateSettings({ preferredCurrency: c.value })}
            >
              {c.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Theme Appearance */}
      <div className="surface-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 style={{ fontSize: '0.94rem', fontWeight: 600 }}>Display Theme</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['light', 'dark', 'system'] as const).map((t) => (
            <Button
              key={t}
              variant={settings.theme === t ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => onUpdateSettings({ theme: t })}
              leftIcon={
                t === 'light' ? (
                  <Sun size={14} />
                ) : t === 'dark' ? (
                  <Moon size={14} />
                ) : (
                  <Monitor size={14} />
                )
              }
              style={{ textTransform: 'capitalize' }}
            >
              {t}
            </Button>
          ))}
        </div>
      </div>

      {/* Backup and Restore Box */}
      <div className="surface-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={16} color="var(--income-color)" />
            <h2 style={{ fontSize: '0.94rem', fontWeight: 600 }}>Local-First Backup & Restore</h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 3 }}>
            PocketFlow operates 100% locally in your browser. Backups are exported as standardized JSON files containing your accounts, transactions, and categories.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="primary" size="sm" onClick={onExportBackup} leftIcon={<Download size={14} />}>
            Export Backup (JSON)
          </Button>

          <label
            className="btn btn-secondary btn-sm"
            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Upload size={14} /> Restore Backup (JSON)
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </label>

          <Button variant="secondary" size="sm" onClick={onExportCSV} leftIcon={<Download size={14} />}>
            Export Transactions (CSV)
          </Button>
        </div>
      </div>

      {/* Categories Box */}
      <div className="surface-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '0.94rem', fontWeight: 600 }}>Category Management</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {activeCategories.length} active categories ({archivedCategories.length} archived)
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAddingCat(!isAddingCat)}
            leftIcon={<Plus size={13} />}
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
          {activeCategories.map((c) => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 12px',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: '0.84rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name={c.icon} size={14} />
                <span>{c.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge variant={c.kind === 'income' ? 'success' : 'neutral'}>{c.kind}</Badge>
                {onArchiveCategory && (
                  <Button
                    variant="ghost"
                    size="sm"
                    style={{ padding: '2px 5px', fontSize: '0.74rem', color: 'var(--text-muted)' }}
                    onClick={async () => {
                      if (window.confirm(`Archive category "${c.name}"?`)) {
                        await onArchiveCategory(c.id);
                      }
                    }}
                    title="Archive category"
                  >
                    <Archive size={12} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {archivedCategories.length > 0 && (
          <div>
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: 6,
              }}
            >
              Archived Categories ({archivedCategories.length})
            </div>
            <div
              style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-subtle)',
              }}
            >
              {archivedCategories.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 12px',
                    borderBottom: '1px solid var(--border-subtle)',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name={c.icon} size={13} />
                    <span>{c.name}</span>
                  </div>
                  {onUnarchiveCategory && (
                    <Button
                      variant="secondary"
                      size="sm"
                      style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                      onClick={() => onUnarchiveCategory(c.id)}
                    >
                      Unarchive
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Application Information Box */}
      <div className="surface-card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src="/App icon only.png"
              alt="PocketFlow Logo"
              style={{
                width: 36,
                height: 36,
                borderRadius: '28%',
                objectFit: 'contain',
              }}
            />
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>PocketFlow</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Local money tracker (USD & KHR)</div>
            </div>
          </div>
          <span
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-secondary)',
              fontFamily: 'monospace',
              padding: '3px 10px',
              backgroundColor: 'var(--color-canvas-soft)',
              borderRadius: '9999px',
              border: '1px solid var(--color-hairline)',
              fontWeight: 600,
            }}
          >
            {APP_VERSION}
          </span>
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div>
            <strong>Architecture:</strong> Local-First Single Page Application (IndexedDB via Dexie)
          </div>
          <div>
            <strong>Currency Engine:</strong> Dual-currency isolation (USD cents & KHR whole riel, exact integer arithmetic)
          </div>
          <div>
            <strong>Privacy:</strong> All financial data remains in browser local storage.
          </div>
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
            <Link
              to={ROUTES.LANDING}
              style={{
                fontSize: '0.8rem',
                color: 'var(--accent-brand)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              ← View Public Landing Page & Features
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
