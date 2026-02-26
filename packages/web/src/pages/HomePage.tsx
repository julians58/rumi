import { Link } from 'react-router-dom';
import { t } from '../i18n/es';
import { RumiLogo } from '../components/ui/RumiLogo';
import { IconBuilding, IconUsers, IconPlus, IconChevronRight, IconHeart, IconHome } from '../components/ui/Icons';

const features = [
  {
    to: '/properties',
    icon: <IconBuilding className="w-6 h-6" />,
    title: t.nav.properties,
    description: 'Explora apartamentos, casas y habitaciones disponibles en toda Colombia',
    gradient: 'from-rumi-primary/20 to-rumi-accent/10',
    iconBg: 'bg-rumi-primary/10 text-rumi-primary',
  },
  {
    to: '/roommates',
    icon: <IconUsers className="w-6 h-6" />,
    title: t.nav.roommates,
    description: 'Encuentra tu compañero de cuarto ideal con nuestro sistema de matching',
    gradient: 'from-rumi-accent/15 to-rumi-primary/10',
    iconBg: 'bg-rumi-accent/10 text-rumi-accent',
  },
  {
    to: '/properties/new',
    icon: <IconPlus className="w-6 h-6" />,
    title: t.nav.publishProperty,
    description: 'Publica tu inmueble y conecta con inquilinos verificados',
    gradient: 'from-rumi-primary-light/20 to-rumi-accent-light/10',
    iconBg: 'bg-rumi-primary-light/15 text-rumi-primary-dark',
  },
];

const stats = [
  { label: 'Ciudades', value: '15+' },
  { label: 'Inmuebles', value: '500+' },
  { label: 'Usuarios', value: '2K+' },
  { label: 'Matches', value: '800+' },
];

export function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Decorative background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-rumi-primary/[0.07] to-transparent blur-3xl animate-pulse-glow" />
        <div className="absolute top-1/2 -left-48 w-80 h-80 rounded-full bg-gradient-to-tr from-rumi-accent/[0.05] to-transparent blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute -bottom-24 right-1/4 w-64 h-64 rounded-full bg-gradient-to-tl from-rumi-primary-light/[0.06] to-transparent blur-3xl animate-pulse-glow" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-8 pb-12 md:pt-16 md:pb-20 text-center">
          <div className="animate-fade-in-up max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-accent border border-rumi-primary/10 mb-8">
              <span className="w-2 h-2 rounded-full bg-rumi-success animate-pulse" />
              <span className="text-xs font-semibold text-rumi-accent tracking-wide uppercase">
                Plataforma activa en Colombia
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
              <span className="bg-gradient-to-r from-rumi-text via-rumi-accent to-rumi-text bg-clip-text text-transparent animate-gradient-shift">
                Encuentra tu hogar
              </span>
              <br />
              <span className="bg-gradient-to-r from-rumi-primary via-rumi-primary-dark to-rumi-accent bg-clip-text text-transparent animate-gradient-shift" style={{ animationDelay: '0.5s' }}>
                ideal con
              </span>{' '}
              <span className="inline-flex items-center align-middle">
                <RumiLogo size="lg" className="translate-y-0.5" />
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-rumi-text/50 max-w-xl mx-auto mb-10 leading-relaxed">
              Conecta con arrendadores, inquilinos y compañeros de cuarto.
              Tu siguiente hogar esta a un swipe de distancia.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <Link
                to="/properties"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-rumi-primary to-rumi-primary-dark text-white font-semibold shadow-lg shadow-rumi-primary/25 hover:shadow-xl hover:shadow-rumi-primary/30 hover:-translate-y-0.5 transition-all duration-300"
              >
                <IconHome className="w-5 h-5" />
                Buscar inmuebles
              </Link>
              <Link
                to="/roommates"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl glass border border-rumi-primary/15 text-rumi-text font-semibold hover:border-rumi-primary/30 hover:-translate-y-0.5 transition-all duration-300"
              >
                <IconHeart className="w-5 h-5 text-rumi-primary" />
                Buscar compañero
              </Link>
            </div>
          </div>
        </section>

        {/* Gradient divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-rumi-primary-light/25 to-transparent max-w-2xl mx-auto" />

        {/* Stats Row */}
        <section className="py-10 md:py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto stagger-children">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="glass rounded-2xl border border-rumi-primary-light/10 p-5 text-center hover:border-rumi-primary/20 transition-colors duration-300"
              >
                <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-br from-rumi-primary to-rumi-accent bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs font-medium text-rumi-text/40 mt-1 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Gradient divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-rumi-primary-light/25 to-transparent max-w-2xl mx-auto" />

        {/* Feature Cards */}
        <section className="py-10 md:py-14">
          <div className="text-center mb-8 animate-fade-in">
            <h2 className="text-xl sm:text-2xl font-bold text-rumi-text mb-2">
              Todo lo que necesitas
            </h2>
            <p className="text-sm text-rumi-text/40">
              Herramientas diseñadas para simplificar tu busqueda
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto stagger-children">
            {features.map((feature) => (
              <Link key={feature.to} to={feature.to} className="block group">
                <div className="relative glass rounded-2xl border border-rumi-primary-light/10 p-6 h-full overflow-hidden hover:border-rumi-primary/20 hover:shadow-lg hover:shadow-rumi-primary/[0.06] hover:-translate-y-1 transition-all duration-300">
                  {/* Subtle gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`} />

                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      {feature.icon}
                    </div>

                    {/* Title + arrow */}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-bold text-rumi-text">{feature.title}</h3>
                      <IconChevronRight className="w-4 h-4 text-rumi-primary/30 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-rumi-text/45 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="pb-10 md:pb-16">
          <div className="glass-accent rounded-3xl border border-rumi-primary/10 p-8 md:p-12 max-w-3xl mx-auto text-center animate-fade-in">
            <h2 className="text-xl sm:text-2xl font-bold text-rumi-text mb-3">
              ¿Listo para encontrar tu lugar?
            </h2>
            <p className="text-sm text-rumi-text/45 mb-6 max-w-md mx-auto">
              Unete a nuestra comunidad y empieza a conectar con personas que buscan lo mismo que tu.
            </p>
            <Link
              to="/properties"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-rumi-accent to-rumi-primary-dark text-white font-semibold shadow-lg shadow-rumi-accent/20 hover:shadow-xl hover:shadow-rumi-accent/30 hover:-translate-y-0.5 transition-all duration-300"
            >
              Comenzar ahora
              <IconChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
