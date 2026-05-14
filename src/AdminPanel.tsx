import { useState, useEffect } from 'react';
import { supabase, type Product } from './supabase';

interface AdminPanelProps {
  onClose: () => void;
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const [edits, setEdits] = useState<Record<string, Partial<Product>>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ name: '', price: 0, image: '', externalurl: '', category: 'Grifería', brand: 'Genérico', status: 'active', stock: 10 });

  useEffect(() => {
    if (authenticated) {
      fetchAllProducts();
    }
  }, [authenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '9917') {
      setAuthenticated(true);
    } else {
      alert('Contraseña incorrecta');
    }
  };

  const fetchAllProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true }).limit(2000);
    if (!error && data) setProducts(data);
    setLoading(false);
  };

  const handleEdit = (id: string, field: keyof Product, value: any) => {
    setEdits(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value
      }
    }));
  };

  const saveChanges = async () => {
    setSaving(true);
    const updates = Object.keys(edits).map(id => {
      const original = products.find(p => p.id === id);
      return { ...original, ...edits[id] };
    });

    const { error } = await supabase.from('products').upsert(updates);

    setSaving(false);
    if (error) alert('Error al guardar: ' + error.message);
    else {
      alert('Cambios guardados correctamente');
      setEdits({});
      fetchAllProducts();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name) return alert('El nombre es obligatorio');
    setSaving(true);
    const { error } = await supabase.from('products').insert([newProduct]);
    setSaving(false);
    if (error) alert('Error al crear: ' + error.message);
    else {
      alert('Producto creado correctamente');
      setIsCreating(false);
      setNewProduct({ name: '', price: 0, image: '', externalurl: '', category: 'Grifería', brand: 'Genérico', status: 'active', stock: 10 });
      fetchAllProducts();
    }
  };

  const handleDeleteAll = async () => {
    const confirm1 = window.confirm('⚠️ ADVERTENCIA: Estás a punto de ELIMINAR TODOS LOS PRODUCTOS. Esta acción NO se puede deshacer.\n\n¿Estás absolutamente seguro?');
    if (!confirm1) return;
    
    const confirm2 = window.prompt('Para confirmar la eliminación de TODOS los productos de la base de datos, escribe la palabra "BORRAR" en mayúsculas:');
    if (confirm2 !== 'BORRAR') {
      alert('Operación cancelada.');
      return;
    }
    
    setSaving(true);
    const { error } = await supabase.from('products').delete().not('id', 'is', null);
    setSaving(false);
    
    if (error) {
      alert('Error al borrar: ' + error.message);
    } else {
      alert('Se han eliminado todos los productos correctamente.');
      setEdits({});
      fetchAllProducts();
    }
  };

  const exportJSON = () => {
    const jsonStr = JSON.stringify(products, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'productos_luque.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (!Array.isArray(importedData)) throw new Error('El archivo JSON debe contener un arreglo de productos.');
        
        const newEdits = { ...edits };
        let changesCount = 0;

        importedData.forEach((row: any) => {
          const original = products.find(p => p.id === row.id);
          const importedUrl = row.externalurl || row.externalUrl || row.external_url || row.url || row.link || row.enlace;
          
          if (original) {
            let itemChanged = false;
            const newEdit: Partial<Product> = {};

            const rowPrice = Number(row.price);
            if (!isNaN(rowPrice) && rowPrice !== original.price) {
              newEdit.price = rowPrice;
              itemChanged = true;
            }
            if (row.image !== undefined && row.image !== original.image) {
              newEdit.image = row.image;
              itemChanged = true;
            }
            if (importedUrl !== undefined && importedUrl !== original.externalurl) {
              newEdit.externalurl = importedUrl;
              itemChanged = true;
            }
            if (row.category !== undefined && row.category !== original.category) {
              newEdit.category = row.category;
              itemChanged = true;
            }
            if (row.brand !== undefined && row.brand !== original.brand) {
              newEdit.brand = row.brand;
              itemChanged = true;
            }
            if (row.stock !== undefined && Number(row.stock) !== original.stock) {
              newEdit.stock = Number(row.stock);
              itemChanged = true;
            }

            if (itemChanged) {
              newEdits[row.id] = { ...(newEdits[row.id] || {}), ...newEdit };
              changesCount++;
            }
          } else {
            // It's a completely new product or a restored one
            const isRestore = row.id && typeof row.id === 'string' && row.id.includes('-');
            const tempId = isRestore ? row.id : crypto.randomUUID();
            
            newEdits[tempId] = {
              id: tempId,
              name: row.name || 'Sin Nombre',
              price: Number(row.price) || 0,
              image: row.image || '',
              externalurl: importedUrl || '',
              category: row.category || 'Varios',
              brand: row.brand || 'Genérico',
              status: row.status || 'active',
              stock: Number(row.stock) || 10
            };
            changesCount++;
          }
        });

        if (changesCount > 0) {
          setEdits(newEdits);
          alert(`Se detectaron cambios en ${Object.keys(newEdits).length} productos. Haz clic en "Guardar Cambios" para aplicar.`);
        } else {
          alert('No se detectaron diferencias con los datos actuales.');
        }
      } catch (err: any) {
        alert('Error al leer el archivo JSON: ' + err.message);
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  if (!authenticated) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={handleLogin} style={{ background: 'white', padding: '32px', borderRadius: '12px', width: '320px', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '20px', color: 'var(--black)' }}>Acceso Admin</h2>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '12px', marginBottom: '20px', border: '1px solid #ccc', borderRadius: '6px', fontSize: 16 }}
            autoFocus
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', background: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
            <button type="submit" style={{ flex: 1, padding: '12px', background: 'var(--orange)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Entrar</button>
          </div>
        </form>
      </div>
    );
  }

  const allVisibleProducts = [
    ...products,
    ...Object.keys(edits)
      .filter(id => !products.find(p => p.id === id))
      .map(id => edits[id] as Product)
  ];

  const filteredProducts = allVisibleProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const hasEdits = Object.keys(edits).length > 0;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--gray-light)', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'var(--black)', color: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>⚙️ Panel de Administración</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleDeleteAll} style={{ background: '#ef4444', color: 'white', border: '1px solid #dc2626', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Borrar Todo</button>
          <button onClick={() => setIsCreating(true)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>+ Nuevo Producto</button>
          <button onClick={exportJSON} style={{ background: '#333', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Exportar JSON</button>
          <label style={{ background: '#333', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
            Importar JSON
            <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
          </label>
          <button onClick={saveChanges} disabled={!hasEdits || saving} style={{ background: hasEdits ? 'var(--orange)' : '#555', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: hasEdits ? 'pointer' : 'not-allowed', fontWeight: 600, transition: 'all 0.2s' }}>
            {saving ? 'Guardando...' : `Guardar Cambios (${Object.keys(edits).length})`}
          </button>
          <button onClick={onClose} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Cerrar</button>
        </div>
      </div>

      {isCreating && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleCreate} style={{ background: 'white', padding: '32px', borderRadius: '12px', width: '400px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--black)' }}>Crear Nuevo Producto</h2>
            
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>Nombre *
              <input type="text" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </label>
            
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>Categoría
              <select required value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' }}>
                <option value="">-- Seleccionar --</option>
                {Array.from(new Set(allVisibleProducts.map(p => p.category))).filter(Boolean).sort().map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <label style={{ flex: 1, fontSize: '14px', fontWeight: 600 }}>Precio (ARS)
                <input type="number" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' }} />
              </label>
              <label style={{ flex: 1, fontSize: '14px', fontWeight: 600 }}>Marca
                <input type="text" value={newProduct.brand} onChange={e => setNewProduct({...newProduct, brand: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' }} />
              </label>
            </div>
            
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>Imagen (URL)
              <input type="text" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </label>
            
            <label style={{ display: 'block', marginBottom: '24px', fontSize: '14px', fontWeight: 600 }}>Enlace Externo (Opcional)
              <input type="text" value={newProduct.externalurl} onChange={e => setNewProduct({...newProduct, externalurl: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </label>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => setIsCreating(false)} style={{ flex: 1, padding: '12px', background: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: '12px', background: 'var(--orange)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{saving ? 'Guardando...' : 'Crear Producto'}</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ padding: '20px', display: 'flex', gap: '16px', background: 'white', borderBottom: '1px solid var(--border)' }}>
        <input
          type="text"
          placeholder="Buscar producto por nombre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '400px', padding: '10px 16px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: 14 }}
        />
        <span style={{ alignSelf: 'center', color: 'var(--gray)', fontWeight: 600 }}>{filteredProducts.length} productos</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray)', fontSize: 16, fontWeight: 600 }}>Cargando productos...</div>
        ) : (
          <table style={{ width: '100%', background: 'white', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', width: '60px', color: 'var(--gray-dark)' }}>Foto</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', color: 'var(--gray-dark)' }}>Producto</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', width: '150px', color: 'var(--gray-dark)' }}>Categoría</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', width: '120px', color: 'var(--gray-dark)' }}>Precio (ARS)</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', width: '200px', color: 'var(--gray-dark)' }}>Imagen (URL/Ruta)</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', width: '250px', color: 'var(--gray-dark)' }}>Enlace Externo</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => {
                const isEdited = edits[p.id] !== undefined;
                const currentPrice = edits[p.id]?.price !== undefined ? edits[p.id].price : p.price;
                const currentCategory = edits[p.id]?.category !== undefined ? edits[p.id].category : (p.category || '');
                const currentImage = edits[p.id]?.image !== undefined ? edits[p.id].image : (p.image || '');
                const currentUrl = edits[p.id]?.externalurl !== undefined ? edits[p.id].externalurl : (p.externalurl || '');

                return (
                  <tr key={p.id} style={{ background: isEdited ? '#FFF7ED' : 'white', borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', margin: '0 auto' }}>
                        <img src={currentImage} alt="preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).src = '/faucet.png' }} />
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13.5px', fontWeight: 600, color: 'var(--black)' }}>{p.name}</td>
                    <td style={{ padding: '8px 16px' }}>
                      <select 
                        value={currentCategory}
                        onChange={e => handleEdit(p.id, 'category', e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: 13 }}
                      >
                        <option value="">-- Seleccionar --</option>
                        {Array.from(new Set(allVisibleProducts.map(pr => pr.category))).filter(Boolean).sort().map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '8px 16px' }}>
                      <input
                        type="number"
                        value={currentPrice}
                        onChange={e => handleEdit(p.id, 'price', Number(e.target.value))}
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: 13 }}
                      />
                    </td>
                    <td style={{ padding: '8px 16px' }}>
                      <input
                        type="text"
                        value={currentImage}
                        onChange={e => handleEdit(p.id, 'image', e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: 13 }}
                      />
                    </td>
                    <td style={{ padding: '8px 16px' }}>
                      <input
                        type="text"
                        value={currentUrl}
                        onChange={e => handleEdit(p.id, 'externalurl', e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: 13 }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
