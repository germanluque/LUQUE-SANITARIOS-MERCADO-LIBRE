import { type Product } from './supabase';
import { formatPrice } from './store';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: 'white', borderRadius: 16, maxWidth: 680, width: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', height: '100%' }}>
          <div style={{ width: 300, flexShrink: 0, background: 'var(--gray-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, minHeight: 300 }}>
            <img src={product.image} alt={product.name} onError={e=>{(e.target as HTMLImageElement).src='/faucet.png'}}
              style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }} />
          </div>
          <div style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column', minWidth: 300 }}>
            <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'white', border: '1px solid var(--border)', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>✕</button>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>{product.category}</span>
            <h2 style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2, margin: '0 0 16px', color: 'var(--black)' }}>{product.name}</h2>
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--orange)', margin: 0 }}>{formatPrice(product.price)}</p>
              <p style={{ fontSize: 13, color: '#16A34A', fontWeight: 600, marginTop: 4 }}>✓ Stock disponible para entrega inmediata</p>
            </div>
            
            {product.brand && product.brand !== 'Personalizado' && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: 'var(--gray)', fontWeight: 600 }}>Marca:</span>
                <span style={{ fontSize: 14, color: 'var(--black)', fontWeight: 700, marginLeft: 8 }}>{product.brand}</span>
              </div>
            )}
            
            <div style={{ flex: 1, overflow: 'auto', marginBottom: 24 }}>
              <p style={{ fontSize: 14, color: 'var(--gray-dark)', lineHeight: 1.6 }}>{product.description || 'Sin descripción disponible para este producto.'}</p>
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              {product.externalurl && (
                <a href={product.externalurl} target="_blank" rel="noreferrer"
                  style={{ flex: 1, background: 'var(--orange)', color: 'white', border: 'none', padding: '14px 20px', borderRadius: 8, fontWeight: 700, fontSize: 15, textAlign: 'center', textDecoration: 'none', transition: 'all 0.2s' }}>
                  Ir a comprar ahora 🔗
                </a>
              )}
              <a href="https://api.whatsapp.com/send?phone=541148700684&text=Hola!%20Quiero%20consultar" 
                target="_blank" rel="noreferrer"
                style={{ flex: 1, background: 'white', color: '#25D366', border: '2px solid #25D366', padding: '14px 20px', borderRadius: 8, fontWeight: 700, fontSize: 15, textAlign: 'center', textDecoration: 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <img src="/whatsapp.png" alt="WhatsApp" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                Consultar por WhatsApp
              </a>
            </div>
            <p style={{ fontSize: 12, color: 'var(--gray)', marginTop: 16, textAlign: 'center' }}>Aceptamos todos los medios de pago</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CartPanel() { return null; }
export function OrderSuccess() { return null; }
