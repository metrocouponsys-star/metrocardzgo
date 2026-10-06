'use client';

interface CityFilterProps {
  cities: Array<{ id: number; name: string; slug: string }>;
  selected: string | null; // slug of selected city, null = "All"
  onChange: (slug: string | null) => void;
  className?: string;
}

/**
 * CityFilter — horizontal scrolling city filter chips.
 * White/light theme — classical modern design.
 */
export function CityFilter({ cities, selected, onChange, className = '' }: CityFilterProps) {
  return (
    <div
      className={`flex gap-2 overflow-x-auto pb-1 hide-scrollbar ${className}`}
      role="group"
      aria-label="Filter by city"
    >
      {/* All Regions chip */}
      <button
        onClick={() => onChange(null)}
        className="shrink-0 transition-all active:scale-95"
        style={chipStyle(selected === null)}
        aria-pressed={selected === null}
      >
        All Regions
      </button>

      {cities.map((city) => {
        const isActive = selected === city.slug;
        return (
          <button
            key={city.id}
            onClick={() => onChange(city.slug)}
            className="shrink-0 transition-all active:scale-95"
            style={chipStyle(isActive)}
            aria-pressed={isActive}
          >
            {isActive && (
              <span
                aria-hidden="true"
                style={{
                  width:        '5px',
                  height:       '5px',
                  borderRadius: '50%',
                  background:   '#B45309',
                  display:      'inline-block',
                  marginRight:  '4px',
                  flexShrink:   0,
                }}
              />
            )}
            {city.name}
          </button>
        );
      })}
    </div>
  );
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    display:      'inline-flex',
    alignItems:   'center',
    height:       '36px',
    padding:      '0 14px',
    borderRadius: '9999px',
    fontSize:     '13px',
    fontWeight:   active ? 600 : 400,
    fontFamily:   '"Inter", sans-serif',
    background:   active ? '#FEF3C7' : '#FFFFFF',
    border:       `1px solid ${active ? '#FDE68A' : '#E5E7EB'}`,
    color:        active ? '#92400E' : '#4B5563',
    cursor:       'pointer',
    whiteSpace:   'nowrap' as const,
    boxShadow:    active ? '0 1px 4px rgba(197,155,39,0.2)' : '0 1px 2px rgba(0,0,0,0.04)',
    minWidth:     '0',
    transition:   'all 0.15s',
  };
}
