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

  const [colorStocks, setColorStocks] = useState<{ [color: string]: number }>({ Gold: 10 });
  const [colorSizeStocks, setColorSizeStocks] = useState<{ [key: string]: number }>({
    'Gold_2.2': 10, 'Gold_2.4': 5, 'Gold_2.6': 0, 'Gold_2.8': 3, 'Gold_2.10': 7,
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
      const hasRegularStock = (colorStocks[colorName] || 0) > 0;
      const hasMatrixStock = Object.keys(colorSizeStocks).some(
        (key) => key.startsWith(`${colorName}_`) && (colorSizeStocks[key] || 0) > 0
      );
      if (hasRegularStock || hasMatrixStock) {
        const confirmed = window.confirm(
          `Removing colour "${colorName}" will discard its recorded stock quantity. Are you sure you want to remove it?`
        );
        if (!confirmed) return;
      }
      setColors(colors.filter((c) => c !== colorName));
    } else {
      setColors([...colors, colorName]);
      setColorStocks((prev) => ({ ...prev, [colorName]: prev[colorName] ?? 0 }));
    }
  };

  const toggleSize = (sz: string) => {
    if (selectedSizes.includes(sz)) {
      const hasSizeStock = (sizeStocks[sz] || 0) > 0;
      const hasMatrixStock = Object.keys(colorSizeStocks).some(
        (key) => key.endsWith(`_${sz}`) && (colorSizeStocks[key] || 0) > 0
      );
      if (hasSizeStock || hasMatrixStock) {
        const confirmed = window.confirm(
          `Removing Size ${sz} will discard its recorded stock quantity. Are you sure you want to remove it?`
        );
        if (!confirmed) return;
      }
      setSelectedSizes(selectedSizes.filter((s) => s !== sz));
    } else {
      setSelectedSizes([...selectedSizes, sz]);
    }
  };

  const addCustomColor = () => {
    const trimmed = customColorInput.trim();
    if (trimmed && !colors.includes(trimmed)) {
      setColors([...colors, trimmed]);
      setColorStocks((prev) => ({ ...prev, [trimmed]: 0 }));
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
    ? colors.length > 1
      ? selectedSizes.reduce((acc, sz) => {
          const sizeSum = colors.reduce((cAcc, col) => {
            const key = `${col}_${sz}`;
            return cAcc + Math.max(0, Number(colorSizeStocks[key] || 0));
          }, 0);
          return acc + sizeSum;
        }, 0)
      : selectedSizes.reduce((acc, sz) => acc + Math.max(0, Number(sizeStocks[sz] || 0)), 0)
    : colors.length > 0
    ? colors.reduce((acc, col) => acc + Math.max(0, Number(colorStocks[col] || 0)), 0)
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
      ? selectedSizes.map((sz) => {
          const sumForSize = colors.length > 1
            ? colors.reduce((acc, col) => acc + Math.max(0, Number(colorSizeStocks[`${col}_${sz}`] || 0)), 0)
            : Math.max(0, Number(sizeStocks[sz] || 0));
          return {
            size: sz,
            stock: sumForSize,
          };
        })
      : [];

    const variants: Array<{ color: string | null; size: string | null; stock: number }> = [];
    if (productType === 'regular') {
      if (colors.length > 0) {
        colors.forEach((col) => {
          variants.push({
            color: col,
            size: null,
            stock: Math.max(0, Number(colorStocks[col] || 0)),
          });
        });
      }
    } else {
      if (colors.length > 1) {
        colors.forEach((col) => {
          selectedSizes.forEach((sz) => {
            variants.push({
              color: col,
              size: sz,
              stock: Math.max(0, Number(colorSizeStocks[`${col}_${sz}`] || 0)),
            });
          });
        });
      } else {
        const singleColor = colors[0] || null;
        selectedSizes.forEach((sz) => {
          variants.push({
            color: singleColor,
            size: sz,
            stock: Math.max(0, Number(sizeStocks[sz] || 0)),
          });
        });
      }
    }

    const payload = {
      name,
      productCode: productCode.trim().toUpperCase(),
      slug,
      price: Number(price),
      description,
      stock: totalCalculatedStock,
      productType,
      variants,
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

                {/* Size checkboxes */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                  {activeAvailableSizes.map((sz) => {
                    const isChecked = selectedSizes.includes(sz);
                    return (
                      <label
                        key={sz}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: isChecked ? '1px solid #c9b097' : '1px solid #e5e5e5',
                          background: isChecked ? '#fff' : '#f5f5f5',
                          cursor: 'pointer',
                          fontWeight: isChecked ? 600 : 400,
                          fontSize: '0.88rem',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSize(sz)}
                          style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                        />
                        Size {sz}
                      </label>
                    );
                  })}
                </div>

                {/* If multiple colours are selected: show Colour × Size Matrix */}
                {colors.length > 1 ? (
                  <div style={{ marginTop: '10px', overflowX: 'auto' }}>
                    <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#443b38' }}>
                        Colour × Size Stock Grid
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#777' }}>
                        Enter available stock for each colour and size combination.
                      </span>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', background: '#fff', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e8e2d8' }}>
                      <thead>
                        <tr style={{ background: '#f5efe6', borderBottom: '1px solid #e2d9cd' }}>
                          <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#333' }}>Size</th>
                          {colors.map((col) => (
                            <th key={col} style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: '#333' }}>
                              {col}
                            </th>
                          ))}
                          <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#333' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSizes.map((sz) => {
                          const rowTotal = colors.reduce((acc, col) => acc + Math.max(0, Number(colorSizeStocks[`${col}_${sz}`] || 0)), 0);
                          return (
                            <tr key={sz} style={{ borderBottom: '1px solid #f0eae1' }}>
                              <td style={{ padding: '8px 10px', fontWeight: 600, color: '#2c2523' }}>Size {sz}</td>
                              {colors.map((col) => {
                                const key = `${col}_${sz}`;
                                return (
                                  <td key={col} style={{ padding: '6px 10px', textAlign: 'center' }}>
                                    <input
                                      type="number"
                                      min="0"
                                      value={colorSizeStocks[key] ?? 0}
                                      onChange={(e) => {
                                        const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                        setColorSizeStocks((prev) => ({ ...prev, [key]: val }));
                                      }}
                                      style={{ width: '70px', padding: '5px 8px', textAlign: 'center', fontSize: '0.85rem', border: '1px solid #ccc', borderRadius: '4px' }}
                                    />
                                  </td>
                                );
                              })}
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#334c3d' }}>
                                {rowTotal}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Single or no colour selected: show classic size stock list */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedSizes.map((sz) => (
                      <div
                        key={sz}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: '#fff',
                          borderRadius: '6px',
                          border: '1px solid #e5e5e5',
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>Size {sz}</span>
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
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #e0d8cd', fontSize: '0.92rem', fontWeight: 600, color: '#334c3d', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Stock (Calculated)</span>
                  <span>{totalCalculatedStock} units</span>
                </div>
              </div>
            ) : colors.length > 0 ? (
              /* Regular Product with colours selected: Colour-wise stock inputs */
              <div className="color-stock-box" style={{ background: '#faf9f6', padding: '16px', borderRadius: '8px', border: '1px solid #ede5db' }}>
                <div style={{ borderBottom: '1px solid #e5dcd0', paddingBottom: '8px', marginBottom: '12px' }}>
                  <span className="serif font-semibold" style={{ display: 'block', fontSize: '1rem', color: '#2c2523' }}>
                    Colour-Wise Stock Configuration
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>
                    Set stock quantity separately for each active colour option.
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {colors.map((col) => {
                    const matchedPreset = presetColors.find((p) => p.name.toLowerCase() === col.toLowerCase());
                    const hex = matchedPreset ? matchedPreset.hex : '#888';
                    return (
                      <div
                        key={col}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: '#fff',
                          borderRadius: '6px',
                          border: '1px solid #e5e5e5',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              background: hex,
                              border: '1px solid #aaa',
                              display: 'inline-block',
                            }}
                          />
                          <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>{col}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.85rem', color: '#555' }}>Stock:</span>
                          <input
                            type="number"
                            min="0"
                            value={colorStocks[col] ?? 0}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                              setColorStocks((prev) => ({ ...prev, [col]: val }));
                            }}
                            style={{ width: '90px', padding: '6px 10px', fontSize: '0.88rem', border: '1px solid #ccc', borderRadius: '4px' }}
                          />
                        </div>
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
              /* Fallback single stock input if no colours selected */
              <label>
                Stock Quantity *
                <input
                  required
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
                <span style={{ fontSize: '0.78rem', color: '#888', display: 'block', marginTop: '4px' }}>
                  Tip: Select product colours to configure colour-specific inventory.
                </span>
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
