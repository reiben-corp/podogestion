/**
 * Componente Header reutilizable para todos los módulos.
 * Muestra un título con icono y barra decorativa.
 */
interface HeaderProps {
  titulo: string;
  icono?: string;
  children?: React.ReactNode;
}

function Header({ titulo, icono, children }: HeaderProps) {
  return (
    <div className="header">
      <h2>
        {icono && <span className="header-icono">{icono}</span>}
        {titulo}
      </h2>
      {children}
    </div>
  );
}

export default Header;
