'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ArrowLeft, Upload, Loader2, Check } from 'lucide-react';

export default function NewProductPage() {
  const router = useRouter();

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('10');
  const [category, setCategory] = useState('Earrings');
  const [collection, setCollection] = useState('Anti-Tarnish');
  const [gender, setGender] = useState('Women');
  const [ageGroup, setAgeGroup] = useState('Adults');
  const [metal, setMetal] = useState('Brass');
  const [finish, setFinish] = useState('Gold Plated');
  const [careInstructions, setCareInstructions] = useState('');

  // Image Upload State
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // remove non-word characters
      .replace(/[\s_-]+/g, '-') // replace spaces/underscores with hyphen
      .replace(/^-+|-+$/g, ''); // remove leading/trailing hyphens
    setSlug(generatedSlug);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    
    try {
      const res = await api.admin.uploadImage(file);
      setImages((prev) => [...prev, res.url]);
      setSuccess('Image uploaded successfully.');
    } catch (err: any) {
      setError(err.message || 'Image upload failed. Check S3/R2 settings.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (images.length === 0) {
      setError('Please upload at least one image.');
      setSaving(false);
      return;
    }

    const payload = {
      name,
      slug,
      price: Number(price),
      description,
      stock: Number(stock),
      category,
      collection,
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
      {/* Back link */}
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
              Product Name *
              <input
                required
                type="text"
                placeholder="e.g. Traditional Mango Necklace"
                value={name}
                onChange={handleNameChange}
              />
            </label>

            <label>
              URL Slug *
              <input
                required
                type="text"
                placeholder="traditional-mango-necklace"
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
          </div>

          {/* Categorization & Attributes */}
          <div style={{ display: 'grid', gap: '15px' }}>
            <h3 className="serif border-b pb-2">Categorization & Craft</h3>

            <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: '1fr 1fr' }}>
              <label>
                Category
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Earrings">Earrings</option>
                  <option value="Rings">Rings</option>
                  <option value="Necklaces">Necklaces</option>
                  <option value="Bracelets">Bracelets</option>
                  <option value="Chains">Chains</option>
                  <option value="Nose Pins">Nose Pins</option>
                  <option value="Second Studs">Second Studs</option>
                  <option value="Anklets">Anklets</option>
                  <option value="Jewellery Sets">Jewellery Sets</option>
                  <option value="Kids Jewellery">Kids Jewellery</option>
                  <option value="Hair Accessories">Hair Accessories</option>
                </select>
              </label>

              <label>
                Collection
                <select value={collection} onChange={(e) => setCollection(e.target.value)}>
                  <option value="Anti-Tarnish">Anti-Tarnish</option>
                  <option value="Traditional">Traditional</option>
                  <option value="Bridal">Bridal</option>
                  <option value="Men's">Men's</option>
                  <option value="Kids">Kids</option>
                  <option value="Hair Accessories">Hair Accessories</option>
                  <option value="Silver Replica">Silver Replica</option>
                  <option value="Diamond Replica">Diamond Replica</option>
                  <option value="AD Collections">AD Collections</option>
                  <option value="Fancy">Fancy</option>
                  <option value="Gold Covering & Micro Plated">Gold Covering & Micro Plated</option>
                  <option value="RIZ House of Fashion">RIZ House of Fashion</option>
                </select>
              </label>

              <label>
                Gender
                <select value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="Women">Women</option>
                  <option value="Men">Men</option>
                  <option value="Unisex">Unisex</option>
                </select>
              </label>

              <label>
                Age Group
                <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
                  <option value="Adults">Adults</option>
                  <option value="Kids">Kids</option>
                </select>
              </label>

              <label>
                Metal / Base Material
                <input
                  type="text"
                  placeholder="Brass, Copper, Silver"
                  value={metal}
                  onChange={(e) => setMetal(e.target.value)}
                />
              </label>

              <label>
                Finish type
                <input
                  type="text"
                  placeholder="Gold Plated, Matte Gold"
                  value={finish}
                  onChange={(e) => setFinish(e.target.value)}
                />
              </label>
            </div>

            <label>
              Care Instructions
              <textarea
                rows={2}
                placeholder="Remove before bathing..."
                value={careInstructions}
                onChange={(e) => setCareInstructions(e.target.value)}
              />
            </label>

            {/* Media Upload */}
            <div className="media-section mt-4">
              <span className="font-semibold text-sm mb-2 block">Product Media *</span>
              
              <div className="flex gap-4 items-center mb-4 flex-wrap" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                {images.map((url, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img
                      src={url}
                      alt="uploaded"
                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                      style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        background: '#d9534f',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        fontSize: '10px',
                        cursor: 'pointer',
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}

                <label
                  style={{
                    width: '80px',
                    height: '80px',
                    border: '2px dashed #ccc',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '11px',
                    color: '#888',
                  }}
                >
                  {uploading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>Upload</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 border-t pt-6 mt-8" style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
          <button className="button" type="submit" disabled={saving || uploading}>
            {saving ? 'Creating Product...' : 'Create Product'}
          </button>
          <Link href="/admin/products" className="button secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
