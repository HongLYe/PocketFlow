import React from 'react';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from '../routing/useRouter';
import { ROUTES } from '../routing/routes';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';

export const NotFoundPage: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 30 }}>
      <EmptyState
        icon={<HelpCircle size={44} color="var(--text-muted)" />}
        title="Page Not Found (404)"
        description="The view or ledger section you requested does not exist or the URL was mistyped."
        action={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 8 }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(ROUTES.LANDING)}
            >
              Landing Page
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(ROUTES.DASHBOARD)}
              leftIcon={<ArrowLeft size={14} />}
            >
              Return to Dashboard
            </Button>
          </div>
        }
      />
    </div>
  );
};
