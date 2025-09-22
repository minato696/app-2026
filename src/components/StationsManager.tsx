// src/components/StationsManager.tsx
'use client';

import React, { useState } from 'react';
import { Radio, Edit2, Trash2, Plus, Save, X, Upload, MapPin, Link } from 'lucide-react';

interface Station {
  id: string;
  name: string;
  url: string;
  image?: string;
  frequency?: string;
  city?: string;
  description?: string;
}

interface StationsManagerProps {
  stations: Station[];
  onUpdate: (stations: Station[]) => void;
}

export default function StationsManager({ stations, onUpdate }: StationsManagerProps) {
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<Station>>({
    name: '',
    url: '',
    frequency: '',
    city: '',
    description: ''
  });

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Subir imagen
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, stationId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('type', 'station');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin',
        body: formDataUpload
      });

      const result = await response.json();
      if (result.success) {
        if (stationId) {
          // Actualizar estación existente
          await updateStation(stationId, { image: result.data.url });
        } else {
          // Para nueva estación
          setFormData({ ...formData, image: result.data.url });
        }
      }
    } catch (error) {
      console.error('Error al subir imagen:', error);
    }
  };

  // Crear nueva estación
  const handleCreate = async () => {
    if (!formData.name || !formData.url) {
      alert('Por favor completa al menos el nombre y la URL de streaming');
      return;
    }

    try {
      const response = await fetch('/api/stations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          name: formData.name,
          url: formData.url,
          image: formData.image,
          frequency: formData.frequency,
          city: formData.city,
          description: formData.description
        })
      });

      const result = await response.json();
      console.log('Respuesta del servidor:', result);

      if (response.ok && result.success) {
        onUpdate([...stations, result.data]);
        resetForm();
        alert('Estación creada exitosamente');
      } else {
        alert(`Error: ${result.error || 'No se pudo crear la estación'}`);
      }
    } catch (error) {
      console.error('Error al crear estación:', error);
      alert('Error al crear la estación');
    }
  };

  // Actualizar estación
  const updateStation = async (id: string, updates: Partial<Station>) => {
    try {
      const response = await fetch('/api/stations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({ id, ...updates })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const updatedStations = stations.map(s => 
            s.id === id ? { ...s, ...updates } : s
          );
          onUpdate(updatedStations);
        }
      }
    } catch (error) {
      console.error('Error al actualizar estación:', error);
    }
  };

  // Guardar cambios de edición
  const handleSaveEdit = async () => {
    if (!editingStation) return;

    await updateStation(editingStation.id, formData);
    resetForm();
  };

  // Eliminar estación
  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta estación? Se eliminarán también todos sus programas.')) {
      return;
    }

    try {
      const response = await fetch(`/api/stations?id=${id}`, {
        method: 'DELETE',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        credentials: 'same-origin'
      });

      if (response.ok) {
        onUpdate(stations.filter(s => s.id !== id));
      }
    } catch (error) {
      console.error('Error al eliminar estación:', error);
    }
  };

  // Editar estación
  const handleEdit = (station: Station) => {
    setEditingStation(station);
    setFormData({
      name: station.name,
      url: station.url,
      frequency: station.frequency || '',
      city: station.city || '',
      description: station.description || '',
      image: station.image
    });
    setIsCreating(false);
  };

  // Limpiar formulario
  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      frequency: '',
      city: '',
      description: '',
      image: ''
    });
    setEditingStation(null);
    setIsCreating(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Radio className="w-5 h-5" />
          Gestión de Estaciones
        </h2>
        {!isCreating && !editingStation && (
          <button
            onClick={() => setIsCreating(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition"
          >
            <Plus className="w-4 h-4" />
            Nueva Estación
          </button>
        )}
      </div>

      {/* Formulario de creación/edición */}
      {(isCreating || editingStation) && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-bold mb-4">
            {editingStation ? 'Editar Estación' : 'Nueva Estación'}
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Estación *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Ej: Lima"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ciudad/Filial
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Ej: Lima, Perú"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de Streaming *
              </label>
              <input
                type="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="https://stream.ejemplo.com/radio"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frecuencia
              </label>
              <input
                type="text"
                name="frequency"
                value={formData.frequency}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Ej: 95.5 FM"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="Descripción breve de la estación..."
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen/Logo
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e)}
                className="hidden"
                id="station-image-upload"
              />
              <label
                htmlFor="station-image-upload"
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 transition"
              >
                <Upload className="w-4 h-4" />
                Subir Imagen
              </label>
              
              {formData.image && (
                <div className="relative">
                  <img 
                    src={formData.image} 
                    alt="Preview" 
                    className="w-20 h-20 object-cover rounded-full"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: '' })}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={editingStation ? handleSaveEdit : handleCreate}
              className="bg-red-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition"
            >
              <Save className="w-4 h-4" />
              {editingStation ? 'Guardar Cambios' : 'Crear Estación'}
            </button>
            
            <button
              onClick={resetForm}
              className="bg-gray-200 hover:bg-gray-300 px-6 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de estaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stations.map(station => (
          <div key={station.id} className="border rounded-lg p-6 hover:shadow-lg transition">
            <div className="flex items-start gap-4">
              {station.image ? (
                <img 
                  src={station.image} 
                  alt={station.name}
                  className="w-24 h-24 object-cover rounded-full border-4 border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                  <Radio className="w-12 h-12 text-gray-400" />
                </div>
              )}
              
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">{station.name}</h3>
                {station.city && (
                  <p className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                    <MapPin className="w-3 h-3" />
                    {station.city}
                  </p>
                )}
                {station.frequency && (
                  <p className="text-sm text-gray-600 mb-1">
                    📻 {station.frequency}
                  </p>
                )}
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                  <Link className="w-3 h-3" />
                  {station.url}
                </p>
                {station.description && (
                  <p className="text-sm text-gray-600 mt-2">
                    {station.description}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleEdit(station)}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
              
              <button
                onClick={() => handleDelete(station.id)}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-red-700 transition"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}