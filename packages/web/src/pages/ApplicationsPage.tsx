import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { t } from '../i18n/es';
import apiClient from '../services/api-client';
import { PageHeader } from '../components/ui/PageHeader';
import { TabBar } from '../components/ui/TabBar';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { IconClipboard, IconBuilding, IconCheck, IconX, IconChevronRight } from '../components/ui/Icons';

interface SentApplication {
  id: string;
  message: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  createdAt: string;
  property: {
    id: string;
    title: string;
    city: string;
    price: number | string;
  };
}

interface ReceivedApplication {
  id: string;
  message: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  createdAt: string;
  property: {
    id: string;
    title: string;
    city: string;
    price: number | string;
  };
  applicant: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

type Tab = 'sent' | 'received';

const statusVariant: Record<string, 'warning' | 'success' | 'danger' | 'neutral'> = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'danger',
  WITHDRAWN: 'neutral',
};

const statusLabels: Record<string, string> = {
  PENDING: t.application.pending,
  ACCEPTED: t.application.accepted,
  REJECTED: t.application.rejected,
  WITHDRAWN: t.application.withdrawn,
};

function formatPrice(price: number | string): string {
  return Number(price).toLocaleString('es-CO');
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function ApplicationsPage() {
  const [tab, setTab] = useState<Tab>('sent');
  const [sent, setSent] = useState<SentApplication[]>([]);
  const [received, setReceived] = useState<ReceivedApplication[]>([]);
  const [loadingSent, setLoadingSent] = useState(true);
  const [loadingReceived, setLoadingReceived] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchSent = useCallback(async () => {
    setLoadingSent(true);
    try {
      const res = await apiClient.get<SentApplication[]>('/applications/sent');
      setSent(res.data);
    } catch {
      setError(t.common.error);
    } finally {
      setLoadingSent(false);
    }
  }, []);

  const fetchReceived = useCallback(async () => {
    setLoadingReceived(true);
    try {
      const res = await apiClient.get<ReceivedApplication[]>('/applications/received');
      setReceived(res.data);
    } catch {
      setError(t.common.error);
    } finally {
      setLoadingReceived(false);
    }
  }, []);

  useEffect(() => {
    fetchSent();
    fetchReceived();
  }, [fetchSent, fetchReceived]);

  const handleStatusUpdate = async (applicationId: string, status: 'ACCEPTED' | 'REJECTED') => {
    setUpdatingId(applicationId);
    setError('');
    try {
      await apiClient.put(`/applications/${applicationId}/status`, { status });
      setReceived((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, status } : app)),
      );
    } catch {
      setError(t.common.error);
    } finally {
      setUpdatingId(null);
    }
  };

  const isLoading = tab === 'sent' ? loadingSent : loadingReceived;

  const tabs = [
    { key: 'sent', label: t.application.sent, count: sent.length > 0 ? sent.length : undefined },
    { key: 'received', label: t.application.received, count: received.length > 0 ? received.length : undefined },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title={t.nav.applications} />

      <TabBar
        tabs={tabs}
        activeTab={tab}
        onChange={(key) => setTab(key as Tab)}
        className="mb-6"
      />

      <ErrorAlert message={error} className="mb-6" />

      {isLoading && <LoadingState text={t.common.loading} />}

      {/* ===== SENT TAB ===== */}
      {tab === 'sent' && !loadingSent && (
        <>
          {sent.length === 0 ? (
            <EmptyState
              icon={<IconClipboard className="w-10 h-10" />}
              title={t.application.noSent}
              description={t.application.noSentSubtitle}
              action={{ label: t.nav.properties, to: '/properties' }}
            />
          ) : (
            <div className="space-y-4 stagger-children">
              {sent.map((app) => (
                <Card key={app.id} variant="elevated" padding="none" className="overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/properties/${app.property.id}`}
                          className="text-base font-semibold text-rumi-text hover:text-rumi-primary transition-colors"
                        >
                          {app.property.title}
                        </Link>
                        <p className="text-sm text-rumi-text/50 mt-0.5">
                          {app.property.city} &bull; ${formatPrice(app.property.price)} COP
                        </p>
                      </div>
                      <Badge variant={statusVariant[app.status] || 'neutral'}>
                        {statusLabels[app.status] || app.status}
                      </Badge>
                    </div>

                    {app.message && (
                      <div className="mt-3 p-3 bg-rumi-bg/50 rounded-xl">
                        <p className="text-sm text-rumi-text/70 italic">&ldquo;{app.message}&rdquo;</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-rumi-text/30">
                        {t.application.appliedOn} {formatDate(app.createdAt)}
                      </p>
                      {app.status === 'ACCEPTED' && (
                        <Link to={`/applications/${app.id}/workflow`}>
                          <Button variant="primary" size="sm" iconRight={<IconChevronRight className="w-3.5 h-3.5" />}>
                            {t.application.continueProcess}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== RECEIVED TAB ===== */}
      {tab === 'received' && !loadingReceived && (
        <>
          {received.length === 0 ? (
            <EmptyState
              icon={<IconBuilding className="w-10 h-10" />}
              title={t.application.noReceived}
              description={t.application.noReceivedSubtitle}
              action={{ label: t.nav.publishProperty, to: '/properties/new' }}
            />
          ) : (
            <div className="space-y-4 stagger-children">
              {received.map((app) => (
                <Card key={app.id} variant="elevated" padding="none" className="overflow-hidden">
                  <div className="p-5 flex items-start gap-4">
                    <Avatar
                      src={app.applicant.avatarUrl}
                      name={`${app.applicant.firstName} ${app.applicant.lastName}`}
                      size="lg"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link
                            to={`/users/${app.applicant.id}`}
                            className="text-base font-semibold text-rumi-text hover:text-rumi-primary transition-colors"
                          >
                            {app.applicant.firstName} {app.applicant.lastName}
                          </Link>
                          <p className="text-sm text-rumi-text/50 mt-0.5">
                            para{' '}
                            <Link
                              to={`/properties/${app.property.id}`}
                              className="text-rumi-primary hover:underline"
                            >
                              {app.property.title}
                            </Link>
                          </p>
                        </div>
                        <Badge variant={statusVariant[app.status] || 'neutral'}>
                          {statusLabels[app.status] || app.status}
                        </Badge>
                      </div>

                      {app.message && (
                        <div className="mt-3 p-3 bg-rumi-bg/50 rounded-xl">
                          <p className="text-sm text-rumi-text/70 italic">&ldquo;{app.message}&rdquo;</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <p className="text-xs text-rumi-text/30">
                          {t.application.receivedOn} {formatDate(app.createdAt)}
                        </p>
                        {app.status === 'ACCEPTED' && (
                          <Link to={`/applications/${app.id}/workflow`}>
                            <Button variant="primary" size="sm" iconRight={<IconChevronRight className="w-3.5 h-3.5" />}>
                              {t.application.continueProcess}
                            </Button>
                          </Link>
                        )}
                      </div>

                      {/* Accept / Reject buttons */}
                      {app.status === 'PENDING' && (
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="primary"
                            size="sm"
                            icon={<IconCheck className="w-4 h-4" />}
                            loading={updatingId === app.id}
                            onClick={() => handleStatusUpdate(app.id, 'ACCEPTED')}
                            className="!bg-green-600 hover:!bg-green-700"
                          >
                            {t.application.accept}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<IconX className="w-4 h-4" />}
                            loading={updatingId === app.id}
                            onClick={() => handleStatusUpdate(app.id, 'REJECTED')}
                            className="!border-red-300 !text-red-600 hover:!bg-red-50"
                          >
                            {t.application.reject}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
