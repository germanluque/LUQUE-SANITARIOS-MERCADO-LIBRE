import { useState, useEffect, useCallback } from 'react';
import { supabase, type Product } from './supabase';
import { formatPrice } from './store';
import { ProductModal } from './components';
import { AdminPanel } from './AdminPanel';

const CATEGORIES = ['Todos','Grifería','Loza Sanitaria','Accesorios de Baño','Cañería y Accesorios','Repuestos','Bachas','VANITORYS','Tanques','Bombas','Calefacción','Jardín'];
const PAGE_SIZE = 20;

const CAROUSEL_IMAGES = ['/local1.jpg', '/local2.jpg', '/local3.png'];

function HeroCarousel({ onVerProductos }: { onVerProductos: () => void }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(c => (c + 1) % CAROUSEL_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hero-carousel">
      {CAROUSEL_IMAGES.map((src, i) => (
        <div key={src} className={`carousel-slide ${i === current ? 'active' : ''}`} style={{backgroundImage: `url(${src})`}} />
      ))}
      <div className="carousel-overlay" />
      
      <div className="carousel-content">
        <div className="carousel-content-inner">
          <h1 className="carousel-title">70 años de experiencia <span>es nuestro respaldo.</span></h1>
          <p className="carousel-subtitle">Hoy, toda la evolución es para vos:<br/><strong>Descubrí nuestro nuevo diseño</strong></p>
          <button className="carousel-btn" onClick={onVerProductos}>VER PRODUCTOS</button>
        </div>
      </div>

      <button className="carousel-arrow left" onClick={() => setCurrent(c => (c - 1 + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length)}>←</button>
      <button className="carousel-arrow right" onClick={() => setCurrent(c => (c + 1) % CAROUSEL_IMAGES.length)}>→</button>

      <div className="carousel-dots">
        {CAROUSEL_IMAGES.map((_, i) => (
          <button key={i} className={`carousel-dot ${i === current ? 'active' : ''}`} onClick={() => setCurrent(i)} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchInput, setSearchInput] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('nombre');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [brands, setBrands] = useState<{name:string;count:number}[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [view, setView] = useState<'catalog' | 'nosotros'>('catalog');

  // Load brands once
  useEffect(() => {
    supabase.from('products').select('brand').eq('status','active').then(({data}) => {
      if (!data) return;
      const map: Record<string,number> = {};
      data.forEach(p => { if (p.brand) map[p.brand] = (map[p.brand]||0)+1; });
      setBrands(Object.entries(map).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count).slice(0,12));
    });
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      let q = supabase.from('products').select('*',{count:'exact'}).eq('status','active')
        .range(page*PAGE_SIZE,(page+1)*PAGE_SIZE-1);
      if (activeCategory !== 'Todos') q = q.eq('category', activeCategory);
      if (searchQuery.trim()) q = q.ilike('name', `%${searchQuery.trim()}%`);
      if (selectedBrands.length > 0) q = q.in('brand', selectedBrands);
      if (minPrice) q = q.gte('price', Number(minPrice));
      if (maxPrice) q = q.lte('price', Number(maxPrice));
      if (sortBy === 'nombre') q = q.order('name',{ascending:true});
      else if (sortBy === 'menor') q = q.order('price',{ascending:true});
      else if (sortBy === 'mayor') q = q.order('price',{ascending:false});
      else if (sortBy === 'nuevo') q = q.order('created_at',{ascending:false});
      const {data,error:err,count} = await q;
      if (err) throw err;
      setProducts(data||[]); setTotalCount(count||0);
    } catch(e:unknown){ setError(e instanceof Error ? e.message : 'Error'); }
    finally { setLoading(false); }
  }, [activeCategory,searchQuery,sortBy,page,selectedBrands,minPrice,maxPrice]);

  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Real-time search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Suggestions fetch
  useEffect(() => {
    if (searchInput.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const fetchSuggestions = async () => {
      const { data } = await supabase.from('products')
        .select('*')
        .eq('status', 'active')
        .ilike('name', `%${searchInput.trim()}%`)
        .limit(6);
      setSuggestions(data || []);
      setShowSuggestions(true);
    };
    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => { setPage(0); }, [activeCategory, searchQuery, sortBy, selectedBrands, minPrice, maxPrice]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSearch = (e: React.FormEvent) => { 
    e.preventDefault(); 
    setSearchQuery(searchInput);
    setShowSuggestions(false);
  };
  const toggleBrand = (b:string) => setSelectedBrands(p=>p.includes(b)?p.filter(x=>x!==b):[...p,b]);
  const totalPages = Math.ceil(totalCount/PAGE_SIZE);

  const selectCat = (cat:string) => {
    setView('catalog');
    setActiveCategory(cat);
    setPage(0);
    setTimeout(() => {
      const catalogEl = document.getElementById('catalog');
      if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <>
      {/* TOP BAR */}
      <div className="topbar">🔥 ¡Más de 1000 productos disponibles! Envíos a todo el país · Lun–Vie 8:30–17 hs · Sáb 8:30–13 hs · 📍 Casa central: San José de Flores 4808, Villa Ballester</div>

      {/* HEADER */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <img src="/images/1.png" alt="Sanitarios Luque" style={{ height: '50px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <form className="search-bar" onSubmit={handleSearch}>
              <input 
                type="text" 
                placeholder="¿Qué estás buscando? (grifería, inodoros...)" 
                value={searchInput} 
                onChange={e=>setSearchInput(e.target.value)} 
                onFocus={() => searchInput.length > 1 && setShowSuggestions(true)}
              />
              {searchInput && <button type="button" className="clear-search" onClick={()=>{setSearchInput(''); setShowSuggestions(false);}}>✕</button>}
              <button type="submit">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </button>
            </form>

            {showSuggestions && suggestions.length > 0 && (
              <div className="search-suggestions">
                {suggestions.map(s => (
                  <div key={s.id} className="suggestion-item" onClick={() => { setSelectedProduct(s); setShowSuggestions(false); }}>
                    <img src={s.image} alt={s.name} />
                    <div className="suggestion-info">
                      <div className="suggestion-name">{s.name}</div>
                      <div className="suggestion-price">{formatPrice(s.price)}</div>
                    </div>
                  </div>
                ))}
                <div className="suggestion-footer" onClick={handleSearch}>
                  Ver todos los resultados para "{searchInput}"
                </div>
              </div>
            )}
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-overlay" onClick={() => setShowSuggestions(false)} />
            )}
          </div>
          <div className="header-actions">
            <a href="https://api.whatsapp.com/send?phone=541148700684&text=Hola!%20Quiero%20hacer%20una%20consulta%20(visto%20en%20la%20web)" target="_blank" rel="noreferrer" className="contact-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/whatsapp.png" alt="WhatsApp" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
              Consultar
            </a>
          </div>
        </div>
      </header>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-inner">
          {CATEGORIES.slice(0,8).map((cat,i)=>(
            <a key={cat} href="#catalog" className={`nav-link${i===0?' hot':(activeCategory===cat && view==='catalog')?' active':''}`}
              onClick={e=>{e.preventDefault();selectCat(cat);}}>
              {i===0?'🔥 Ofertas':cat}
            </a>
          ))}
          <a className={`nav-link${view==='nosotros'?' active':''}`} href="#" onClick={(e)=>{e.preventDefault();setView('nosotros');window.scrollTo(0,0);}}>Nosotros</a>
          <a className="nav-link" href="#" onClick={(e)=>{e.preventDefault();const f=document.querySelector('footer');if(f)f.scrollIntoView({behavior:'smooth'});}}>Contacto</a>
        </div>
      </nav>

      {/* HERO CAROUSEL */}
      {view === 'catalog' && (
        <HeroCarousel onVerProductos={() => selectCat('Todos')} />
      )}

      {/* ADMIN PANEL */}
      {showAdmin && <AdminPanel onClose={() => { setShowAdmin(false); fetchProducts(); }} />}

      {/* MODALS */}
      {selectedProduct && <ProductModal product={selectedProduct} onClose={()=>setSelectedProduct(null)} />}

      {/* PAGE */}
      {view === 'catalog' ? (
        <div className="page-wrap" id="catalog">
          {/* SIDEBAR */}
          <aside className="sidebar">
            {/* Categories */}
            <div className="sidebar-card">
              <div className="sidebar-title">Categorías</div>
              <div className="sidebar-body" style={{padding:'6px 0'}}>
                {CATEGORIES.map(cat=>(
                  <button key={cat} onClick={()=>selectCat(cat)} style={{
                    display:'block',width:'100%',textAlign:'left',padding:'9px 16px',border:'none',cursor:'pointer',
                    background:activeCategory===cat?'var(--orange-light)':'transparent',
                    color:activeCategory===cat?'var(--orange)':'var(--gray-dark)',
                    fontWeight:activeCategory===cat?700:400,fontSize:13.5,
                    borderLeft:activeCategory===cat?'3px solid var(--orange)':'3px solid transparent',transition:'all .15s'
                  }}>{cat}</button>
                ))}
              </div>
            </div>

            {/* Price filter */}
            <div className="sidebar-card">
              <div className="sidebar-title">Precio (ARS)</div>
              <div className="sidebar-body">
                <div style={{display:'flex',gap:8,marginBottom:10}}>
                  <input type="number" placeholder="Desde" value={minPrice} onChange={e=>setMinPrice(e.target.value)}
                    style={{width:'50%',padding:'7px 10px',border:'1.5px solid var(--border)',borderRadius:6,fontSize:13,outline:'none'}} />
                  <input type="number" placeholder="Hasta" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)}
                    style={{width:'50%',padding:'7px 10px',border:'1.5px solid var(--border)',borderRadius:6,fontSize:13,outline:'none'}} />
                </div>
                <button onClick={()=>{setMinPrice('');setMaxPrice('');}}
                  style={{fontSize:12,color:'var(--orange)',background:'none',border:'none',cursor:'pointer',padding:0,fontWeight:600}}>
                  Limpiar filtro
                </button>
              </div>
            </div>

            {/* Brands */}
            {brands.length>0 && (
              <div className="sidebar-card">
                <div className="sidebar-title">Marca</div>
                <div className="sidebar-body">
                  {brands.map(b=>(
                    <label key={b.name} className="filter-item">
                      <input type="checkbox" checked={selectedBrands.includes(b.name)} onChange={()=>toggleBrand(b.name)} />
                      {b.name}<span className="count">({b.count})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="sidebar-card" style={{background:'var(--orange)',color:'white',textAlign:'center'}}>
              <div className="sidebar-body">
                <div style={{fontSize:32,marginBottom:8}}>🏠</div>
                <div style={{fontWeight:700,fontSize:15,marginBottom:6}}>¿Tenés una obra?</div>
                <p style={{fontSize:12,opacity:0.9,marginBottom:12}}>Precios especiales por volumen para constructores.</p>
                <a href="https://api.whatsapp.com/send?phone=541148700684&text=Hola!%20Quiero%20consultar" target="_blank" rel="noreferrer"
                  style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',background:'white',color:'var(--orange)',border:'2px solid var(--orange)',padding:'9px',borderRadius:6,fontWeight:700,fontSize:14,textDecoration:'none'}}>
                  <img src="/whatsapp.png" alt="WhatsApp" style={{ width: '20px', height: '20px', objectFit: 'contain' }} /> Consultar
                </a>
              </div>
            </div>
          </aside>

          {/* MAIN */}
          <main className="main-content">


            {/* Active filters */}
            {(searchQuery || selectedBrands.length>0 || minPrice || maxPrice) && (
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
                {searchQuery && <span style={{background:'var(--orange)',color:'white',padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:600}}>
                  Búsqueda: "{searchQuery}" <button onClick={()=>{setSearchQuery('');setSearchInput('');}} style={{background:'none',border:'none',color:'white',cursor:'pointer',marginLeft:4,fontSize:14}}>✕</button>
                </span>}
                {selectedBrands.map(b=><span key={b} style={{background:'var(--orange)',color:'white',padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:600}}>
                  {b} <button onClick={()=>toggleBrand(b)} style={{background:'none',border:'none',color:'white',cursor:'pointer',marginLeft:4,fontSize:14}}>✕</button>
                </span>)}
                {(minPrice||maxPrice)&&<span style={{background:'var(--orange)',color:'white',padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:600}}>
                  Precio: {minPrice||'0'} – {maxPrice||'∞'} <button onClick={()=>{setMinPrice('');setMaxPrice('');}} style={{background:'none',border:'none',color:'white',cursor:'pointer',marginLeft:4,fontSize:14}}>✕</button>
                </span>}
              </div>
            )}

            {/* Header */}
            <div className="content-header">
              <div>
                <h2>{activeCategory==='Todos'?'Todos los Productos':activeCategory}</h2>
                <span className="results-count">{loading?'Cargando...':`${totalCount} productos`}</span>
              </div>
              <div className="sort-bar">
                <span className="sort-label">Ordenar:</span>
                <select className="sort-select" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                  <option value="nombre">Nombre A–Z</option>
                  <option value="menor">Menor precio</option>
                  <option value="mayor">Mayor precio</option>
                  <option value="nuevo">Más nuevos</option>
                </select>
              </div>
            </div>

            {/* Cat tabs */}
            <div className="cat-tabs">
              {CATEGORIES.slice(0,8).map(cat=>(
                <button key={cat} className={`cat-tab${activeCategory===cat?' active':''}`} onClick={()=>selectCat(cat)}>{cat}</button>
              ))}
            </div>

            {error && <div style={{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:8,padding:'14px 18px',color:'#B91C1C',marginBottom:20}}>⚠️ {error}</div>}

            {loading ? (
              <div className="product-grid">
                {Array.from({length:8}).map((_,i)=>(
                  <div key={i} style={{background:'var(--gray-light)',borderRadius:8,height:340,animation:'pulse 1.5s ease-in-out infinite'}} />
                ))}
              </div>
            ) : products.length===0 ? (
              <div style={{textAlign:'center',padding:'80px 0',color:'var(--gray)'}}>
                <div style={{fontSize:52}}>🔍</div>
                <p style={{fontSize:16,fontWeight:600,marginTop:12}}>No encontramos resultados.</p>
                <button onClick={()=>{setActiveCategory('Todos');setSearchQuery('');setSearchInput('');setSelectedBrands([]);setMinPrice('');setMaxPrice('');}}
                  style={{marginTop:16,background:'var(--orange)',color:'white',border:'none',padding:'10px 24px',borderRadius:6,fontWeight:600,cursor:'pointer'}}>
                  Ver todos los productos
                </button>
              </div>
            ) : (
              <>
                <div className="product-grid">
                  {products.map(product=>(
                    <div key={product.id} className="product-card">
                      {product.stock < 5 && product.stock > 0 && <span className="product-badge">Últimas unidades</span>}
                      <div style={{cursor:'pointer'}} onClick={() => { if(product.externalurl) window.open(product.externalurl, '_blank'); else setSelectedProduct(product); }}>
                        <img src={product.image} alt={product.name} className="product-img"
                          onError={e=>{(e.target as HTMLImageElement).src='/faucet.png';}} />
                      </div>
                      <div className="product-info">
                        <div className="product-category">{product.category}</div>
                        <div className="product-name" title={product.name} onClick={() => { if(product.externalurl) window.open(product.externalurl, '_blank'); else setSelectedProduct(product); }} style={{cursor:'pointer'}}>{product.name}</div>
                        <div className="product-price-block">
                          <span className="price-main">{formatPrice(product.price)}</span>
                        </div>
                        <div className="product-actions">
                          <a href={product.externalurl || '#'} target={product.externalurl ? "_blank" : "_self"} rel="noreferrer"
                            className="view-product-btn"
                            onClick={(e) => { if(!product.externalurl) { e.preventDefault(); setSelectedProduct(product); } }}>
                            Ver producto
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages>1 && (
                  <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8,marginTop:40,flexWrap:'wrap'}}>
                    <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}
                      style={{padding:'8px 18px',border:'1px solid var(--border)',borderRadius:6,background:'white',cursor:page===0?'not-allowed':'pointer',opacity:page===0?.4:1,fontWeight:600}}>
                      ← Anterior
                    </button>
                    {Array.from({length:Math.min(totalPages,7)}).map((_,i)=>{
                      const p = totalPages<=7 ? i : page<4 ? i : page>totalPages-4 ? totalPages-7+i : page-3+i;
                      return (
                        <button key={p} onClick={()=>setPage(p)}
                          style={{width:38,height:38,borderRadius:6,cursor:'pointer',fontWeight:700,
                            background:page===p?'var(--orange)':'white',color:page===p?'white':'var(--black)',
                            border:page===p?'2px solid var(--orange)':'1px solid var(--border)'}}>
                          {p+1}
                        </button>
                      );
                    })}
                    <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1}
                      style={{padding:'8px 18px',border:'1px solid var(--border)',borderRadius:6,background:'white',cursor:page>=totalPages-1?'not-allowed':'pointer',opacity:page>=totalPages-1?.4:1,fontWeight:600}}>
                      Siguiente →
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      ) : (
        <div className="nosotros-page">
          <div className="nosotros-container">
            <h1 className="nosotros-title">SOBRE NOSOTROS</h1>
            
            <section className="nosotros-section">
              <div className="nosotros-content">
                <div className="nosotros-text">
                  <h3>¿Quiénes Somos?</h3>
                  <p>Desde 1955 nuestra empresa comercializa y distribuye para todo el país el más completo surtido en productos para la construcción.</p>
                  <p>Con 70 años de trayectoria en el rubro, somos una empresa especializada en el asesoramiento y provisión de la más alta variedad de artículos, adaptando nuestra recomendación a los requerimientos e exigencias de los diferentes tipos de obras de nuestros clientes.</p>
                  <p><strong>Nos especializamos en el asesoramiento y provisión de los siguientes rubros:</strong></p>
                  <ul>
                    <li>Sanitarios y grifería.</li>
                    <li>Redes de cañerías y conexiones.</li>
                    <li>Tendidos de Gas - repuestos, conexiones y artefactos -.</li>
                    <li>Calefacción integral - repuestos, conexiones y artefactos -.</li>
                    <li>Sistemas incendio.</li>
                    <li>Pisos y revestimientos.</li>
                    <li>Sistemas Riego.</li>
                  </ul>
                  
                  <p><strong>Nuestros diferenciales:</strong></p>
                  <ul>
                    <li>Asesoramiento a la medida de nuestros clientes.</li>
                    <li>Atención personalizada.</li>
                    <li>Departamento exclusivo de atención a empresas y comercios.</li>
                    <li>Entrega sin cargo en obra.</li>
                    <li>El más variado surtido y calidad.</li>
                    <li>Más de 100.000 artículos en stock permanente.</li>
                    <li>Acopios a la medida de la necesidad de su obra.</li>
                    <li>Exclusivo departamento de Cuentas Corrientes para instaladores, arquitectos y empresas constructoras.</li>
                    <li>Showroom especializado.</li>
                  </ul>
                </div>
                <div className="nosotros-images">
                  <div className="nosotros-img-card">
                    <img src="/local1.jpg" alt="Local Sanitarios Luque" />
                  </div>
                  <div className="nosotros-img-card">
                    <img src="/local2.jpg" alt="Showroom Sanitarios Luque" />
                  </div>
                </div>
              </div>
            </section>

            <section className="nosotros-section reverse">
              <div className="nosotros-content">
                <div className="nosotros-text">
                  <h3>NUESTRA VISIÓN, MISIÓN Y VALORES</h3>
                  
                  <div className="vision-item">
                    <h4>Visión:</h4>
                    <p>Ser el máximo referente en el asesoramiento y provisión de productos para la construcción para instaladores, arquitectos, empresas y particulares.</p>
                  </div>
                  
                  <div className="vision-item">
                    <h4>Misión:</h4>
                    <p>Maximizar la oferta de productos y servicios a nuestros clientes, para que puedan optimizar sus recursos e inversiones, garantizando así el nivel de calidad y rendimiento esperado para sus emprendimientos.</p>
                  </div>
                  
                  <div className="vision-item">
                    <h4>Valores:</h4>
                    <ul>
                      <li>Honestidad e integridad.</li>
                      <li>Confiabilidad y solvencia.</li>
                      <li>Confidencialidad y ética comercial.</li>
                      <li>Desarrollo, capacitación e integración del personal.</li>
                      <li>Orientación a la mejora continua.</li>
                    </ul>
                  </div>
                </div>
                <div className="nosotros-images">
                  <div className="nosotros-img-card">
                    <img src="/local3.png" alt="Interior local" />
                  </div>
                  <div className="nosotros-img-card">
                    <img src="/local1.jpg" alt="Atención al cliente" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer>
        <div className="footer-top">
          <div className="footer-brand">
            <div className="logo" style={{ marginBottom: '16px' }}>
              <img src="/images/2.png" alt="Sanitarios Luque" style={{ height: '50px', width: 'auto', objectFit: 'contain' }} />
            </div>
            <p>Nos especializamos en: Sanitarios y grifería, redes de cañerías y conexiones. Tendidos de gas, repuestos, conexiones y artefactos. Calefacción integral, repuestos, conexiones y artefactos.</p>
            <div style={{ display: 'flex', gap: '16px', marginTop: '20px', alignItems: 'center' }}>
              <a href="https://www.facebook.com/profile.php?id=100064261710857" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/facebook.png" alt="Facebook" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
              </a>
              <a href="https://www.instagram.com/luquesanitarios/" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/instagram.png" alt="Instagram" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
              </a>
              <a href="https://www.tiktok.com/@luquesanitarios" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/tiktok.png" alt="TikTok" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
              </a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Categorias</h4>
            <ul>
              <li><a href="#" onClick={e=>{e.preventDefault();selectCat('Bombas');}}>Bombas</a></li>
              <li><a href="#" onClick={e=>{e.preventDefault();selectCat('Grifería');}}>Griferias</a></li>
              <li><a href="#" onClick={e=>{e.preventDefault();selectCat('Calefacción');}}>Termotanques</a></li>
              <li><a href="#" onClick={e=>{e.preventDefault();selectCat('Vanitorys');}}>Vanitory</a></li>
              <li><a href="#" onClick={e=>{e.preventDefault();selectCat('Todos');}}>Cocina</a></li>
              <li><a href="#" onClick={e=>{e.preventDefault();selectCat('Accesorios de Baño');}}>Baños</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contáctanos</h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>📞 <span>11-4870-0684</span></li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>✉️ <span>ventas.web@sanitariosluque.com</span></li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>💬 <span>11-4870-0486</span></li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>📍 <span>San José de Flores 4808,<br/>Villa Ballester</span></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 Luque Sanitarios. Todos los derechos reservados.</span>
          <div style={{display:'flex',gap:20}}>
            <a href="#">Términos y Condiciones</a>
            <span style={{color:'rgba(255,255,255,0.2)'}}>|</span>
            <a href="#">Política de Privacidad</a>
            <span style={{color:'rgba(255,255,255,0.2)'}}>|</span>
            <a href="#" onClick={(e) => { e.preventDefault(); setShowAdmin(true); }}>⚙️ Admin</a>
          </div>
        </div>
      </footer>

      <a href="https://api.whatsapp.com/send?phone=541148700684&text=Hola!%20Quiero%20consultar" target="_blank" rel="noreferrer" className="whatsapp-float" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
        <img src="/whatsapp.png" alt="WhatsApp" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
      </a>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </>
  );
}
