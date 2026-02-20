import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  GraduationCap,
  Users,
  DoorOpen,
  ClipboardList,
  TrendingUp,
  Euro,
  CheckCircle2,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Kurse, Anmeldungen } from '@/types/app';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Stats {
  kurse: number;
  dozenten: number;
  teilnehmer: number;
  raeume: number;
  anmeldungen: number;
  bezahlt: number;
  unbezahlt: number;
  umsatz: number;
  naechsteKurse: Kurse[];
  anmeldungenListe: Anmeldungen[];
  kurseList: Kurse[];
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [kurseList, dozentenList, teilnehmerList, raeumeList, anmeldungenList] =
          await Promise.all([
            LivingAppsService.getKurse(),
            LivingAppsService.getDozenten(),
            LivingAppsService.getTeilnehmer(),
            LivingAppsService.getRaeume(),
            LivingAppsService.getAnmeldungen(),
          ]);

        const bezahlt = anmeldungenList.filter(a => a.fields.bezahlt === true).length;
        const unbezahlt = anmeldungenList.filter(a => !a.fields.bezahlt).length;

        const avgPreis =
          kurseList.length > 0
            ? kurseList.reduce((s, k) => s + (k.fields.preis ?? 0), 0) / kurseList.length
            : 0;
        const umsatz = bezahlt * avgPreis;

        const today = new Date().toISOString().split('T')[0];
        const naechsteKurse = kurseList
          .filter(k => (k.fields.startdatum ?? '') >= today)
          .sort((a, b) => (a.fields.startdatum ?? '').localeCompare(b.fields.startdatum ?? ''))
          .slice(0, 5);

        setStats({
          kurse: kurseList.length,
          dozenten: dozentenList.length,
          teilnehmer: teilnehmerList.length,
          raeume: raeumeList.length,
          anmeldungen: anmeldungenList.length,
          bezahlt,
          unbezahlt,
          umsatz,
          naechsteKurse,
          anmeldungenListe: anmeldungenList.slice(0, 6),
          kurseList,
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl gradient-hero mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground text-sm">Lade Daten...</p>
        </div>
      </div>
    );
  }

  const kpiCards = [
    { label: 'Kurse', value: stats?.kurse ?? 0, icon: BookOpen, gradient: 'gradient-hero', href: '/kurse' },
    { label: 'Dozenten', value: stats?.dozenten ?? 0, icon: GraduationCap, gradient: 'gradient-amber', href: '/dozenten' },
    { label: 'Teilnehmer', value: stats?.teilnehmer ?? 0, icon: Users, gradient: 'gradient-teal', href: '/teilnehmer' },
    { label: 'Anmeldungen', value: stats?.anmeldungen ?? 0, icon: ClipboardList, gradient: 'gradient-violet', href: '/anmeldungen' },
    { label: 'Räume', value: stats?.raeume ?? 0, icon: DoorOpen, gradient: 'gradient-rose', href: '/raeume' },
  ];

  const pieData = [
    { name: 'Bezahlt', value: stats?.bezahlt ?? 0 },
    { name: 'Ausstehend', value: stats?.unbezahlt ?? 0 },
  ];

  const monthCounts: Record<string, number> = {};
  (stats?.kurseList ?? []).forEach(k => {
    if (k.fields.startdatum) {
      const m = k.fields.startdatum.slice(0, 7);
      monthCounts[m] = (monthCounts[m] ?? 0) + 1;
    }
  });
  const barData = Object.entries(monthCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, count]) => ({
      month: format(new Date(month + '-01'), 'MMM', { locale: de }),
      kurse: count,
    }));

  return (
    <div className="space-y-8">
      {/* Hero banner */}
      <div className="gradient-hero rounded-2xl p-8 text-white relative overflow-hidden">
        <div
          className="absolute right-0 top-0 w-80 h-80 rounded-full opacity-[0.07] pointer-events-none"
          style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
        />
        <div className="relative z-10">
          <p className="text-white/60 text-xs font-semibold tracking-widest uppercase mb-1">Willkommen</p>
          <h1 className="text-3xl font-bold mb-1">KursManager</h1>
          <p className="text-white/60 text-sm">
            {format(new Date(), "EEEE, d. MMMM yyyy", { locale: de })}
          </p>
          <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-white/10">
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wider">Bezahlte Anmeldungen</p>
              <p className="text-2xl font-bold">{stats?.bezahlt ?? 0}</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wider">Ausstehend</p>
              <p className="text-2xl font-bold">{stats?.unbezahlt ?? 0}</p>
            </div>
            {(stats?.umsatz ?? 0) > 0 && (
              <>
                <div className="w-px h-10 bg-white/20" />
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wider">Gesch. Umsatz</p>
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(stats?.umsatz ?? 0)}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map(card => (
          <Link key={card.href} to={card.href} className="kpi-card p-5 group block">
            <div className={`w-10 h-10 rounded-xl ${card.gradient} flex items-center justify-center mb-4 shadow-sm`}>
              <card.icon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 kpi-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold">Kurse pro Monat</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Letzte 6 Monate</p>
            </div>
            <TrendingUp size={16} className="text-muted-foreground" />
          </div>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'oklch(0.52 0.02 260)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'oklch(0.52 0.02 260)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '0.75rem', fontSize: 12 }}
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                />
                <Bar dataKey="kurse" fill="oklch(0.38 0.14 265)" radius={[6, 6, 0, 0]} name="Kurse" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              Noch keine Kurse angelegt
            </div>
          )}
        </div>

        <div className="kpi-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold">Zahlungsstatus</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Anmeldungen</p>
            </div>
            <Euro size={16} className="text-muted-foreground" />
          </div>
          {(stats?.anmeldungen ?? 0) > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    <Cell fill="oklch(0.38 0.14 265)" />
                    <Cell fill="oklch(0.88 0.07 25)" />
                  </Pie>
                  <Tooltip contentStyle={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '0.75rem', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'oklch(0.38 0.14 265)' }} />
                    <span className="text-xs text-muted-foreground">Bezahlt</span>
                  </div>
                  <span className="font-semibold text-sm">{stats?.bezahlt ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'oklch(0.88 0.07 25)' }} />
                    <span className="text-xs text-muted-foreground">Ausstehend</span>
                  </div>
                  <span className="font-semibold text-sm">{stats?.unbezahlt ?? 0}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              Noch keine Anmeldungen
            </div>
          )}
        </div>
      </div>

      {/* Bottom: upcoming courses + recent registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="kpi-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold">Nächste Kurse</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Bevorstehende Termine</p>
            </div>
            <Calendar size={16} className="text-muted-foreground" />
          </div>
          {(stats?.naechsteKurse.length ?? 0) > 0 ? (
            <div className="space-y-0.5">
              {stats!.naechsteKurse.map(kurs => (
                <div key={kurs.record_id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                  <div className="w-9 h-9 rounded-xl gradient-hero flex-shrink-0 flex items-center justify-center">
                    <BookOpen size={13} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{kurs.fields.titel ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">
                      {kurs.fields.startdatum
                        ? format(new Date(kurs.fields.startdatum), 'dd. MMM yyyy', { locale: de })
                        : '—'}
                    </p>
                  </div>
                  {kurs.fields.preis != null && (
                    <span className="mono text-xs font-medium text-muted-foreground whitespace-nowrap">
                      {kurs.fields.preis.toFixed(0)} €
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm">Keine bevorstehenden Kurse</div>
          )}
          <Link to="/kurse" className="flex items-center gap-1.5 text-xs text-primary font-semibold mt-4 hover:underline">
            Alle Kurse <ArrowRight size={12} />
          </Link>
        </div>

        <div className="kpi-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold">Letzte Anmeldungen</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Neueste Einträge</p>
            </div>
            <CheckCircle2 size={16} className="text-muted-foreground" />
          </div>
          {(stats?.anmeldungenListe.length ?? 0) > 0 ? (
            <div className="space-y-0.5">
              {stats!.anmeldungenListe.map(a => (
                <div key={a.record_id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                  <div className="w-9 h-9 rounded-full gradient-teal flex-shrink-0 flex items-center justify-center">
                    <Users size={13} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {a.fields.anmeldedatum
                        ? format(new Date(a.fields.anmeldedatum), 'dd.MM.yyyy', { locale: de })
                        : '—'}
                    </p>
                  </div>
                  {a.fields.bezahlt ? (
                    <span className="badge-paid">Bezahlt</span>
                  ) : (
                    <span className="badge-unpaid">Offen</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm">Noch keine Anmeldungen</div>
          )}
          <Link to="/anmeldungen" className="flex items-center gap-1.5 text-xs text-primary font-semibold mt-4 hover:underline">
            Alle Anmeldungen <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
