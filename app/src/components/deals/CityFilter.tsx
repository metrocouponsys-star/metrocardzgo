'use client';

interface CityFilterProps {
  cities: Array<{ id: number; name: string; slug: string }>;
  selected: string | null; // slug of selected city, null = "All"
  onChange: (slug: string | null) => void;
  className?: string;
}

/**
 * CityFilter — horizontal scrolling city filter chips.
 * "All Regions" chip appears first, then city chips.
 * Selected chip: gold border + specular text.
 * Unselected: obsidian surface + muted text.
 * Matches the filtered_deals_grid Stitch screen design.
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
                  width:           '5px',
                  height:          '5px',
                  borderRadius:    '50%',
                  background:      '#D4AF37',
                  display:         'inline-block',
                  marginRight:     '4px',
                  boxShadow:       '0 0 4px rgba(212,175,55,0.8)',
                  flexShrink:      0,
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
    display:        'inline-flex',
    alignItems:     'center',
    height:         '36px',
    padding:        '0 14px',
    borderRadius:   '9999px',
    fontSize:       '13px',
    fontWeight:     active ? 600 : 400,
    fontFamily:     '"Plus Jakarta Sans", sans-serif',
    background:     active ? '#1C212B' : '#14171F',
    border:         `1px solid ${active ? '#D4AF37' : '#2A303C'}`,
    color:          active ? '#FFF3D6' : '#9CA3AF',
    cursor:         'pointer',
    whiteSpace:     'nowrap' as const,
    boxShadow:      active ? '0 0 8px rgba(212,175,55,0.15)' : 'none',
    minWidth:       '0',
  };
}
