import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit2, 
  Trash2,
  Filter,
  X,
  Save,
  AlertCircle
} from 'lucide-react';

interface Knowledge {
  _id: string;
  carModel: string;
  problem: string;
  solution: string;
  category: string;
  tags: string[];
  createdAt: string;
}

const categories = [
  { value: 'all', label: 'Barchasi' },
  { value: 'motor', label: 'Motor' },
  { value: 'transmissiya', label: 'Transmissiya' },
  { value: 'tormoz', label: 'Tormoz' },
  { value: 'suspenziya', label: 'Suspenziya' },
  { value: 'elektr', label: 'Elektr' },
  { value: 'boshqa', label: 'Boshqa' }
];

const KnowledgeBase: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState<Knowledge | null>(null);
  
  const [formData, setFormData] = useState({
    carModel: '',
    problem: '',
    solution: '',
    category: 'boshqa',
    tags: ''
  });

  // Fetch knowledge
  const { data: knowledgeData, isLoading } = useQuery({
    queryKey: ['knowledge', selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await api.get(`/knowledge?${params.toString()}`);
      return response.data;
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/knowledge', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      setIsModalOpen(false);
      resetForm();
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/knowledge/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      setIsModalOpen(false);
      setEditingKnowledge(null);
      resetForm();
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/knowledge/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
    }
  });

  const resetForm = () => {
    setFormData({
      carModel: '',
      problem: '',
      solution: '',
      category: 'boshqa',
      tags: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
    };

    if (editingKnowledge) {
      updateMutation.mutate({ id: editingKnowledge._id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (knowledge: Knowledge) => {
    setEditingKnowledge(knowledge);
    setFormData({
      carModel: knowledge.carModel,
      problem: knowledge.problem,
      solution: knowledge.solution,
      category: knowledge.category,
      tags: knowledge.tags.join(', ')
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Rostdan ham o\'chirmoqchimisiz?')) {
      deleteMutation.mutate(id);
    }
  };

  const openCreateModal = () => {
    setEditingKnowledge(null);
    resetForm();
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="card-gradient p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
                Bilimlar bazasi
              </h1>
              <p className="text-gray-600 mt-2">
                O'z tajribangizni saqlang va shogirtlar bilan bo'lishing
              </p>
            </div>
            <button onClick={openCreateModal} className="btn-primary">
              <Plus className="h-5 w-5 mr-2" />
              Yangi bilim qo'shish
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>

            {/* Category filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input pl-10"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Knowledge List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Yuklanmoqda...</p>
            </div>
          ) : knowledgeData?.knowledge?.length === 0 ? (
            <div className="card p-12 text-center">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Hozircha bilimlar yo'q
              </h3>
              <p className="text-gray-600 mb-6">
                Birinchi bilimingizni qo'shing va shogirtlar bilan bo'lishing
              </p>
              <button onClick={openCreateModal} className="btn-primary">
                <Plus className="h-5 w-5 mr-2" />
                Bilim qo'shish
              </button>
            </div>
          ) : (
            knowledgeData?.knowledge?.map((knowledge: Knowledge) => (
              <div key={knowledge._id} className="card p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="badge badge-primary">{knowledge.carModel}</span>
                      <span className="badge badge-secondary">
                        {categories.find(c => c.value === knowledge.category)?.label}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {knowledge.problem}
                    </h3>
                    
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {knowledge.solution}
                    </p>
                    
                    {knowledge.tags && knowledge.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {knowledge.tags.map((tag, index) => (
                          <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(knowledge)}
                      className="btn-secondary btn-sm"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(knowledge._id)}
                      className="btn-danger btn-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingKnowledge ? 'Bilimni tahrirlash' : 'Yangi bilim qo\'shish'}
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingKnowledge(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Mashina modeli *</label>
                  <input
                    type="text"
                    required
                    value={formData.carModel}
                    onChange={(e) => setFormData({ ...formData, carModel: e.target.value })}
                    placeholder="Masalan: Chevrolet Gentra"
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Kategoriya</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input"
                  >
                    {categories.filter(c => c.value !== 'all').map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Muammo *</label>
                  <textarea
                    required
                    value={formData.problem}
                    onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                    placeholder="Muammoni batafsil yozing..."
                    rows={3}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Yechim *</label>
                  <textarea
                    required
                    value={formData.solution}
                    onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                    placeholder="Yechimni bosqichma-bosqich yozing..."
                    rows={6}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Teglar (vergul bilan ajrating)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="motor, ta'mirlash, diagnostika"
                    className="input"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">
                      Bu ma'lumot AI chat'da shogirtlarga ko'rsatiladi. Aniq va tushunarli yozing.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingKnowledge(null);
                      resetForm();
                    }}
                    className="btn-secondary flex-1"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="btn-primary flex-1"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    {editingKnowledge ? 'Yangilash' : 'Saqlash'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
