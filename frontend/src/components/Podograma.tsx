import { useState, useRef } from 'react';

interface ZonaPie {
  id: string;
  nombre: string;
  path: string;
}

interface DatosZona {
  presion?: number;
  [key: string]: unknown;
}

interface PodogramaProps {
  pie: 'izquierdo' | 'derecho';
  datos?: Record<string, DatosZona>;
  onZonaClick?: (zona: ZonaPie) => void;
  modo?: 'ver' | 'editar';
}

const ZONAS_PIE: Record<'izquierdo' | 'derecho', ZonaPie[]> = {
  izquierdo: [
    { id: 'hallux', nombre: 'Hallux', path: 'M150,50 Q170,30 190,50 Q200,70 190,90 Q170,100 150,90 Q140,70 150,50' },
    { id: 'dedo2', nombre: '2º Dedo', path: 'M200,60 Q215,45 230,60 Q235,80 230,100 Q215,110 200,100 Q190,80 200,60' },
    { id: 'dedo3', nombre: '3º Dedo', path: 'M240,70 Q255,55 270,70 Q275,90 270,110 Q255,120 240,110 Q230,90 240,70' },
    { id: 'dedo4', nombre: '4º Dedo', path: 'M280,80 Q295,65 310,80 Q315,100 310,120 Q295,130 280,120 Q270,100 280,80' },
    { id: 'dedo5', nombre: '5º Dedo', path: 'M320,95 Q335,80 350,95 Q355,115 350,135 Q335,145 320,135 Q310,115 320,95' },
    { id: 'metatarso', nombre: 'Metatarso', path: 'M130,100 L370,100 L380,180 L120,180 Z' },
    { id: 'empeine', nombre: 'Empeine', path: 'M120,180 L380,180 L370,260 L130,260 Z' },
    { id: 'talon', nombre: 'Talón', path: 'M130,260 L370,260 L360,340 L140,340 Z' },
  ],
  derecho: [
    { id: 'hallux', nombre: 'Hallux', path: 'M350,50 Q370,30 390,50 Q400,70 390,90 Q370,100 350,90 Q340,70 350,50' },
    { id: 'dedo2', nombre: '2º Dedo', path: 'M300,60 Q315,45 330,60 Q335,80 330,100 Q315,110 300,100 Q290,80 300,60' },
    { id: 'dedo3', nombre: '3º Dedo', path: 'M240,70 Q255,55 270,70 Q275,90 270,110 Q255,120 240,110 Q230,90 240,70' },
    { id: 'dedo4', nombre: '4º Dedo', path: 'M180,80 Q195,65 210,80 Q215,100 210,120 Q195,130 180,120 Q170,100 180,80' },
    { id: 'dedo5', nombre: '5º Dedo', path: 'M120,95 Q135,80 150,95 Q155,115 150,135 Q135,145 120,135 Q110,115 120,95' },
    { id: 'metatarso', nombre: 'Metatarso', path: 'M130,100 L370,100 L380,180 L120,180 Z' },
    { id: 'empeine', nombre: 'Empeine', path: 'M120,180 L380,180 L370,260 L130,260 Z' },
    { id: 'talon', nombre: 'Talón', path: 'M130,260 L370,260 L360,340 L140,340 Z' },
  ]
};

function Podograma({ pie, datos = {}, onZonaClick, modo = 'ver' }: PodogramaProps) {
  const [zonaActiva, setZonaActiva] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const zonas = ZONAS_PIE[pie] || ZONAS_PIE.izquierdo;

  const getColorZona = (zonaId: string): string => {
    const dato = datos[zonaId];
    if (!dato || dato.presion === undefined) return '#e8f4f8';
    if (dato.presion > 70) return '#ff6b6b';
    if (dato.presion > 40) return '#ffd93d';
    return '#6bcb77';
  };

  const handleClick = (zona: ZonaPie) => {
    if (modo === 'editar' && onZonaClick) {
      setZonaActiva(zona.id);
      onZonaClick(zona);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h4 style={{ color: '#1e3a5f', marginBottom: '1rem' }}>
        Pie {pie === 'izquierdo' ? 'Izquierdo' : 'Derecho'}
      </h4>
      <svg 
        ref={svgRef}
        viewBox="0 0 500 400" 
        style={{ 
          width: '100%', 
          maxWidth: '400px', 
          border: '2px solid #1e3a5f',
          borderRadius: '12px',
          backgroundColor: '#f8f9fa',
          cursor: modo === 'editar' ? 'pointer' : 'default'
        }}
      >
        {/* Contorno del pie */}
        <ellipse cx="250" cy="200" rx="180" ry="160" fill="#fff" stroke="#1e3a5f" strokeWidth="3" />
        
        {/* Zonas */}
        {zonas.map((zona) => (
          <g key={zona.id}>
            <path
              d={zona.path}
              fill={getColorZona(zona.id)}
              stroke={zonaActiva === zona.id ? '#ff6b6b' : '#1e3a5f'}
              strokeWidth={zonaActiva === zona.id ? 3 : 1.5}
              opacity={0.9}
              onClick={() => handleClick(zona)}
              style={{ 
                transition: 'all 0.2s',
                cursor: modo === 'editar' ? 'pointer' : 'default'
              }}
            />
            <title>{zona.nombre}</title>
          </g>
        ))}
        
        {/* Leyenda de presión */}
        {modo === 'ver' && Object.keys(datos).length > 0 && (
          <g transform="translate(10, 350)">
            <rect x="0" y="0" width="15" height="15" fill="#6bcb77" />
            <text x="20" y="12" fontSize="12" fill="#333">Baja</text>
            <rect x="60" y="0" width="15" height="15" fill="#ffd93d" />
            <text x="80" y="12" fontSize="12" fill="#333">Media</text>
            <rect x="120" y="0" width="15" height="15" fill="#ff6b6b" />
            <text x="140" y="12" fontSize="12" fill="#333">Alta</text>
          </g>
        )}
      </svg>
      
      {modo === 'editar' && zonaActiva && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <p style={{ fontWeight: 600, color: '#1e3a5f' }}>
            Zona seleccionada: {zonas.find(z => z.id === zonaActiva)?.nombre}
          </p>
        </div>
      )}
    </div>
  );
}

export default Podograma;
