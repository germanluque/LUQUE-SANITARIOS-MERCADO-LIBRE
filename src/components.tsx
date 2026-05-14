import { type Product } from './supabase';
import { formatPrice } from './store';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  return (
    <div onClick={onClose} style={{ 
      position: 'fixed', 
      inset: 0, 
      background: 'rgba(0,0,0,0.7)', 
      backdropFilter: 'blur(3px)',
      zIndex: 1000, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: 20 
    }}>
      <div onClick={e => e.stopPropagation()}
        style={{ 
          background: 'white', 
          borderRadius: 20, 
          maxWidth: 680, 
          width: '100%', 
          maxHeight: '90vh', 
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          position: 'relative'
        }}>
        
        <button onClick={onClose} style={{ 
          position: 'absolute', 
          top: 16, 
          right: 16, 
          background: 'white', 
          border: 'none', 
          width: 32, 
          height: 32, 
          borderRadius: '50%', 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 10,
          fontSize: '16px',
          color: 'var(--gray-dark)'
        }}>✕</button>

        <div style={{ display: 'flex', flexWrap: 'wrap', height: '100%' }}>
          {/* Image Section */}
          <div style={{ 
            width: '42%', 
            minWidth: 280,
            background: '#fcfcfc', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: 24,
            borderRight: '1px solid #f0f0f0'
          }}>
            <img src={product.image} alt={product.name} onError={e=>{(e.target as HTMLImageElement).src='/faucet.png'}}
              style={{ maxWidth: '100%', maxHeight: 360, objectFit: 'contain' }} />
          </div>

          {/* Info Section */}
          <div style={{ 
            flex: 1, 
            padding: '36px 32px', 
            display: 'flex', 
            flexDirection: 'column', 
            minWidth: 280,
            justifyContent: 'center'
          }}>
            <span style={{ 
              fontSize: 10, 
              fontWeight: 700, 
              color: 'var(--orange)', 
              textTransform: 'uppercase', 
              letterSpacing: 1.5, 
              marginBottom: 8,
              display: 'block'
            }}>{product.category}</span>
            
            <h2 style={{ 
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 22, 
              fontWeight: 700, 
              lineHeight: 1.25, 
              margin: '0 0 12px', 
              color: 'var(--black)'
            }}>{product.name}</h2>

            <div style={{ marginBottom: 28 }}>
              <p style={{ 
                fontSize: 32, 
                fontWeight: 800, 
                color: 'var(--orange)', 
                margin: 0,
                fontFamily: 'Montserrat, sans-serif'
              }}>{formatPrice(product.price)}</p>
              {product.brand && product.brand !== 'Personalizado' && (
                <div style={{ marginTop: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--gray)', fontWeight: 500 }}>Marca:</span>
                  <span style={{ fontSize: 13, color: 'var(--black)', fontWeight: 600, marginLeft: 6 }}>{product.brand}</span>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {product.externalurl && (
                <a href={product.externalurl} target="_blank" rel="noreferrer"
                  style={{ 
                    background: 'var(--orange)', 
                    color: 'white', 
                    border: 'none', 
                    padding: '14px 20px', 
                    borderRadius: 10, 
                    fontWeight: 700, 
                    fontSize: 14, 
                    textAlign: 'center', 
                    textDecoration: 'none', 
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  COMPRAR
                </a>
              )}
              <a href={`https://api.whatsapp.com/send?phone=541148700684&text=Hola! Quiero consultar por: ${product.name} (visto en la web)`} 
                target="_blank" rel="noreferrer"
                style={{ 
                  background: '#25D366', 
                  color: 'white', 
                  border: 'none', 
                  padding: '14px 20px', 
                  borderRadius: 10, 
                  fontWeight: 700, 
                  fontSize: 14, 
                  textAlign: 'center', 
                  textDecoration: 'none', 
                  transition: 'all 0.2s', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '10px'
                }}>
                <img src="/whatsapp.png" alt="WhatsApp" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                CONSULTAR
              </a>
            </div>
            <p style={{ fontSize: 11, color: 'var(--gray)', marginTop: 20, textAlign: 'center', fontWeight: 500 }}>Aceptamos todos los medios de pago</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CartPanel() { return null; }
export function OrderSuccess() { return null; }
