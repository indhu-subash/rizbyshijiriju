'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ArrowLeft, Upload, Loader2, Plus, X } from 'lucide-react';

const presetColors = [
  { name: 'Gold', hex: '#d4af37' },
  { name: 'Silver', hex: '#d0d5dd' },
  { name: 'Rose Gold', hex: '#e8b4b8' },
  { name: 'Ruby Red', hex: '#9b111e' },
  { name: 'Emerald Green', hex: '#2e7d32' },
  { name: 'Sapphire Blue', hex: '#1565c0' },
  { name: 'Pearl White', hex: '#fdfbf7' },
  { name: 'Black', hex: '#212529' },
];

export default function NewProductPage() {
  const router = useRouter();

  // Form Fields
  const [name, setName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('10');
  const [category, setCategory] = useState('Bangles');
  const [categoryId, setCategoryId] = useState('');

  const getProductTypeFromCategory = (catName: string): 'bangle' | 'ring' | 'regular' => {
    const norm = (catName || '').toLowerCase().trim();
    if (norm === 'bangles' || norm === 'bangle') return 'bangle';
    if (norm === 'rings' || norm === 'ring') return 'ring';
    return 'regular';
  };

  const productType = getProductTypeFromCategory(category);

  const [selectedSizes, setSelectedSizes] = useState<string[]>(['2.2', '2.4', '2.6', '2.8', '2.10']);
  const [sizeStocks, setSizeStocks] = useState<{ [size: string]: number }>({
    '2.2': 10, '2.4': 5, '2.6': 0, '2.8': 3, '2.10': 7,
    '6': 4, '7': 0, '8': 5, '9': 2, '16': 1, '17': 3, '18': 6,
  });

  const [collection, setCollection] = useState('Anti-Tarnish');
  const [colors, setColors] = useState<string[]>(['Gold']);
  const [customColorInput, setCustomColorInput] = useState('');
  const [gender, setGender] = useState('Women');
  const [ageGroup, setAgeGroup] = useState('Adults');
  const [metal, setMetal] = useState('Brass');
  const [finish, setFinish] = useState('Gold Plated');
  const [careInstructions, setCareInstructions] = useState('');

  // Categories & Collections list from API
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbCollections, setDbCollections] = useState<any[]>([]);

  // Image Upload State
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.categories.list()
      .then((res) => {
        if (res && res.categories) {
          setDbCategories(res.categories);
        }
      })
      .catch(() => {});

    api.admin.getCollections()
      .then((res) => {
        if (res && res.collections) {
          setDbCollections(res.collections);
        }
      })
      .catch(() => {});
  }, []);

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const matched = dbCategories.find((c) => c.name === newCat);
    if (matched) setCategoryId(matched.id);

    const newType = getProductTypeFromCategory(newCat);
    if (newType === 'bangle') {
      setSelectedSizes(['2.2', '2.4', '2.6', '2.8', '2.10']);
    } else if (newType === 'ring') {
      setSelectedSizes(['6', '7', '8', '9', '16', '17', '18']);
    } else {
      setSelectedSizes([]);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generatedSlug);
  };

  const toggleColor = (colorName: string) => {
    if (colors.includes(colorName)) {
      setColors(colors.filter((c) => c !== colorName));
    } else {
      setColors([...colors, colorName]);
    }
  };

  const addCustomColor = () => {
    const trimmed = customColorInput.trim();
    if (trimmed && !colors.includes(trimmed)) {
      setColors([...colors, trimmed]);
      setCustomColorInput('');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await api.admin.uploadImage(file);
      const uploadedUrl = res?.url || res?.imageUrl;
      if (!uploadedUrl) {
        throw new Error('Server returned an empty image URL.');
      }
      setImages((prev) => [...prev, uploadedUrl]);
      setSuccess('Image uploaded successfully to Cloudflare R2.');
    } catch (err: any) {
      setError(err.message || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const activeAvailableSizes = productType === 'bangle'
    ? ['2.2', '2.4', '2.6', '2.8', '2.10']
    : productType === 'ring'
    ? ['6', '7', '8', '9', '16', '17', '18']
    : [];

  const totalCalculatedStock = productType !== 'regular'
    ? selectedSizes.reduce((acc, sz) => acc + Math.max(0, Number(sizeStocks[sz] || 0)), 0)
    : Number(stock || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!productCode || !productCode.trim()) {
      setError('Product Code is required.');
      setSaving(false);
      return;
    }

    if (images.length === 0) {
      setError('Please upload at least one image.');
      setSaving(false);
      return;
    }

    if (productType !== 'regular' && selectedSizes.length === 0) {
      setError(`Please select at least one size variant for ${category}.`);
      setSaving(false);
      return;
    }

    const sizes = productType !== 'regular'
      ? selectedSizes.map((sz) => ({
          size: sz,
          stock: Math.max(0, Number(sizeStocks[sz] || 0)),
        }))
      : [];

    const payload = {
      name,
      productCode: productCode.trim().toUpperCase(),
      slug,
      price: Number(price),
      description,
      stock: totalCalculatedStock,
      productType,
      sizes,
      category,
      categoryId: categoryId || undefined,
      collection,
      colors,
      gender,
      ageGroup,
      metal,
      finish,
      careInstructions,
      images,
    };

    try {
      await api.admin.createProduct(payload);
      router.push('/admin/products');
    } catch (err: any) {
      setError(err.message || 'Failed to create product.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Link href="/admin/products" className="flex items-center gap-2 text-sm muted mb-6" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ArrowLeft size={16} /> Back to Products
      </Link>

      <div className="mb-8">
        <span className="eyebrow">Inventory Catalog</span>
        <h1 className="serif text-3xl font-semibold">Add New Product</h1>
      </div>

      {error && <div className="error-banner mb-6">{error}</div>}
      {success && <div className="success-banner mb-6">{success}</div>}

      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '32px', borderRadius: '8px', border: '1px solid #eee' }}>
        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {/* Details Section */}
          <div style={{ display: 'grid', gap: '15px' }}>
            <h3 className="serif border-b pb-2">Product Info</h3>

            <label>
              Category Name *
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="Earrings">Earrings</option>
                <option value="Rings">Rings</option>
                <option value="Necklaces">Necklaces</option>
                <option value="Bangles">Bangles</option>
                <option value="Bracelets">Bracelets</option>
                <option value="Pendants">Pendants</option>
                <option value="Chains">Chains</option>
                <option value="Nose Pins">Nose Pins</option>
                <option value="Second Studs">Second Studs</option>
                <option value="Anklets">Anklets</option>
                <option value="Jewellery Sets">Jewellery Sets</option>
                <option value="Kids Jewellery">Kids Jewellery</option>
                <option value="Hair Accessories">Hair Accessories</option>
                {dbCategories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.group})
                  </option>
                ))}
              </select>
            </label>
            
            <label>
              Product Name *
              <input
                required
                type="text"
                placeholder="e.g. Traditional Bangle Set"
                value={name}
                onChange={handleNameChange}
              />
            </label>

            <label>
              Product Code / SKU *
              <input
                required
                type="text"
                placeholder="RIZ-BN-001"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value.toUpperCase())}
                style={{ fontFamily: 'monospace', letterSpacing: '0.5px' }}
              />
            </label>

            <label>
              URL Slug *
              <input
                required
                type="text"
                placeholder="traditional-bangle-set"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </label>

            <label>
              Price (INR) *
              <input
                required
                type="number"
                min="0"
                placeholder="1499"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </label>

            {/* Inventory & Size Section */}
            {productType !== 'regular' ? (
              <div className="size-stock-box" style={{ background: '#faf9f6', padding: '16px', borderRadius: '8px', border: '1px solid #ede5db' }}>
                <div style={{ borderBottom: '1px solid #e5dcd0', paddingBottom: '8px', marginBottom: '12px' }}>
                  <span className="serif font-semibold" style={{ display: 'block', fontSize: '1rem', color: '#2c2523' }}>
                    Size & Stock Configuration ({category})
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>
                    Check active sizes and set stock quantity for each size variant.
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeAvailableSizes.map((sz) => {
                    const isChecked = selectedSizes.includes(sz);
                    return (
                      <div
                        key={sz}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: '#fff',
                          borderRadius: '6px',
                          border: isChecked ? '1px solid #c9b097' : '1px solid #e5e5e5',
                        }}
                      >
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.92rem' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSizes((prev) => [...prev, sz]);
                              } else {
                                setSelectedSizes((prev) => prev.filter((s) => s !== sz));
                              }
                            }}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          Size {sz}
                        </label>

                        {isChecked ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.85rem', color: '#555' }}>Stock:</span>
                            <input
                              type="number"
                              min="0"
                              value={sizeStocks[sz] ?? 0}
                              onChange={(e) => {
                                const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                setSizeStocks((prev) => ({ ...prev, [sz]: val }));
                              }}
                              style={{ width: '90px', padding: '6px 10px', fontSize: '0.88rem', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#999' }}>Not offered</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #e0d8cd', fontSize: '0.92rem', fontWeight: 600, color: '#334c3d', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Stock (Calculated)</span>
                  <span>{totalCalculatedStock} units</span>
                </div>
              </div>
            ) : (
              <label>
                Stock Quantity *
                <input
                  required
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </label>
            )}

            <label>
              Description *
              <textarea
                required
                rows={4}
                placeholder="Write a warm, compelling description of this piece..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            {/* Colors Selection Chip Component */}
            <div className="color-selection-section" style={{ display: 'grid', gap: '8px', marginTop: '10px' }}>
              <label style={{ fontWeight: '500', fontSize: '14px' }}>Product Colors / Finish Tones</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {presetColors.map((c) => {
                  const isSelected = colors.includes(c.name);
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => toggleColor(c.name)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: isSelected ? '2px solid var(--brown)' : '1px solid #ccc',
                        background: isSelected ? '#f7f5ed' : '#fff',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: isSelected ? '600' : '400',
                      }}
                    >
                      <span
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: c.hex,
                          border: '1px solid #aaa',
                        }}
                      />
                      {c.name}
                    </button>
                  );
                })}
              </div>

              {/* Custom Color Adder */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <input
                  type="text"
                  placeholder="Add custom color (e.g. Champagne Gold)"
                  value={customColorInput}
                  onChange={(e) => setCustomColorInput(e.target.value)}
                  style={{ fontSize: '13px', padding: '6px 10px', flex: 1 }}
                />
                <button
                  type="button"
                  onClick={addCustomColor}
                  className="button secondary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  <Plus size={14} /> Add
                </button>
              </div>

              {/* Selected Colors Badges */}
              {colors.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#666' }}>Active colors:</span>
                  {colors.map((c) => (
                    <span
                      key={c}
                      style={{
                        background: 'var(--ivory)',
                        border: '1px solid #ddd',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {c}
                      <X size={10} style={{ cursor: 'pointer' }} onClick={() => toggleColor(c)} />
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Categorization & Attributes */}
          <div style={{ display: 'grid', gap: '15px' }}>
            <h3 className="serif border-b pb-2">Categorization & Craft</h3>

            <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: '1fr 1fr' }}>
              <label>
                Collection
                <select value={collection} onChange={(e) => setCollection(e.target.value)}>
                  {dbCollections.length > 0 ? (
                    dbCollections.map((c: any) => (
                      <option key={c.id || c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Anti-Tarnish">Anti-Tarnish</option>
                      <option value="Traditional">Traditional</option>
                      <option value="Bridal">Bridal</option>
                      <option value="Silver Replica">Silver Replica</option>
                      <option value="Diamond Replica">Diamond Replica</option>
                      <option value="AD Collections">AD Collections</option>
                      <option value="Men's">Men's</option>
                      <option value="Kids">Kids</option>
                      <option value="RIZ House of Fashion">RIZ House of Fashion</option>
                      <option value="Watches">Watches</option>
                    </>
                  )}
                </select>
              </label>

              <label>
                Target Audience / Gender
                <select value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="Women">Women</option>
                  <option value="Men">Men</option>
                  <option value="Unisex">Unisex</option>
                  <option value="Kids">Kids</option>
                </select>
              </label>
            </div>

            <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: '1fr 1fr' }}>
              <label>
                Age Group
                <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
                  <option value="Adults">Adults</option>
                  <option value="Teens">Teens</option>
                  <option value="Kids">Kids</option>
                  <option value="All Ages">All Ages</option>
                </select>
              </label>

              <label>
                Base Metal / Material
                <input
                  type="text"
                  placeholder="e.g. Brass, Silver, Alloy"
                  value={metal}
                  onChange={(e) => setMetal(e.target.value)}
                />
              </label>
            </div>

            <label>
              Plating / Finish Details
              <input
                type="text"
                placeholder="e.g. 18K Micro Gold Plated, Rhodium"
                value={finish}
                onChange={(e) => setFinish(e.target.value)}
              />
            </label>

            <label>
              Care Instructions
              <textarea
                rows={2}
                placeholder="e.g. Keep away from perfumes, store in airtight pouch."
                value={careInstructions}
                onChange={(e) => setCareInstructions(e.target.value)}
              />
            </label>

            {/* Image Upload Area */}
            <div style={{ marginTop: '10px' }}>
              <h4 className="serif mb-2" style={{ fontWeight: 600 }}>Product Imagery (Cloudflare R2)</h4>
              <div style={{ border: '2px dashed #ccc', padding: '20px', textAlign: 'center', borderRadius: '8px', background: '#faf9f6' }}>
                <Upload size={24} style={{ margin: '0 auto 8px', color: '#888' }} />
                <p style={{ fontSize: '0.85rem', marginBottom: '8px', color: '#555' }}>
                  Upload product photos. They will be stored securely on Cloudflare R2 storage.
                </p>
                <label className="button secondary" style={{ cursor: 'pointer', display: 'inline-block' }}>
                  {uploading ? <Loader2 className="animate-spin" size={16} /> : 'Choose Image File'}
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
                </label>
              </div>

              {/* Uploaded Images Gallery */}
              {images.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '15px' }}>
                  {images.map((url, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #ddd' }}>
                      <img src={url} alt={`Upload ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => setImages(images.filter((_, i) => i !== idx))}
                        style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Link href="/admin/products" className="button secondary">
            Cancel
          </Link>
          <button type="submit" className="button" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" size={16} /> : 'Save & Publish Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
