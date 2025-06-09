import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Plus, Edit, Trash2, Save, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

type ChecklistItem = {
  id: string;
  question: string;
  category: string;
  required: boolean;
};

type Checklist = {
  id: string;
  title: string;
  description: string;
  active: boolean;
  items: ChecklistItem[];
};

const ChecklistManager: React.FC = () => {
  const { user } = useAuth();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newChecklist, setNewChecklist] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    items: [{ question: '', category: '', required: false }]
  });

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = async () => {
    try {
      const { data: checklistsData, error: checklistsError } = await supabase
        .from('checklists')
        .select('*')
        .order('created_at', { ascending: false });

      if (checklistsError) throw checklistsError;

      const checklistsWithItems = await Promise.all(
        checklistsData.map(async (checklist) => {
          const { data: items, error: itemsError } = await supabase
            .from('checklist_items')
            .select('*')
            .eq('checklist_id', checklist.id)
            .order('created_at', { ascending: true });

          if (itemsError) throw itemsError;

          return {
            ...checklist,
            items: items || []
          };
        })
      );

      setChecklists(checklistsWithItems);
    } catch (error) {
      console.error('Error fetching checklists:', error);
      toast.error('Failed to load checklists');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { question: '', category: '', required: false }]
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index: number, field: string, value: string | boolean) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setFormData({ ...formData, items: updatedItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (formData.items.some(item => !item.question.trim() || !item.category.trim())) {
      toast.error('Please fill in all item fields');
      return;
    }

    try {
      if (editingId) {
        // Update existing checklist
        const { error: checklistError } = await supabase
          .from('checklists')
          .update({
            title: formData.title,
            description: formData.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (checklistError) throw checklistError;

        // Delete existing items
        const { error: deleteError } = await supabase
          .from('checklist_items')
          .delete()
          .eq('checklist_id', editingId);

        if (deleteError) throw deleteError;

        // Insert new items
        const { error: itemsError } = await supabase
          .from('checklist_items')
          .insert(
            formData.items.map(item => ({
              checklist_id: editingId,
              ...item
            }))
          );

        if (itemsError) throw itemsError;

        toast.success('Checklist updated successfully');
      } else {
        // Create new checklist
        const { data: checklist, error: checklistError } = await supabase
          .from('checklists')
          .insert({
            title: formData.title,
            description: formData.description,
            created_by: user?.id,
            active: false
          })
          .select()
          .single();

        if (checklistError) throw checklistError;

        // Insert items
        const { error: itemsError } = await supabase
          .from('checklist_items')
          .insert(
            formData.items.map(item => ({
              checklist_id: checklist.id,
              ...item
            }))
          );

        if (itemsError) throw itemsError;

        toast.success('Checklist created successfully');
      }

      // Reset form and refresh list
      setFormData({
        title: '',
        description: '',
        items: [{ question: '', category: '', required: false }]
      });
      setEditingId(null);
      setNewChecklist(false);
      fetchChecklists();

    } catch (error) {
      console.error('Error saving checklist:', error);
      toast.error('Failed to save checklist');
    }
  };

  const startEdit = (checklist: Checklist) => {
    setFormData({
      title: checklist.title,
      description: checklist.description,
      items: checklist.items
    });
    setEditingId(checklist.id);
    setNewChecklist(false);
  };

  const deleteChecklist = async (id: string) => {
    if (!confirm('Are you sure you want to delete this checklist?')) return;

    try {
      const { error } = await supabase
        .from('checklists')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Checklist deleted successfully');
      fetchChecklists();
    } catch (error) {
      console.error('Error deleting checklist:', error);
      toast.error('Failed to delete checklist');
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      // If activating this checklist, deactivate all others first
      if (!currentActive) {
        await supabase
          .from('checklists')
          .update({ active: false })
          .neq('id', id);
      }

      const { error } = await supabase
        .from('checklists')
        .update({ active: !currentActive })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Checklist ${!currentActive ? 'activated' : 'deactivated'} successfully`);
      fetchChecklists();
    } catch (error) {
      console.error('Error toggling checklist status:', error);
      toast.error('Failed to update checklist status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Checklist Form */}
      {(newChecklist || editingId) && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="bg-indigo-700 px-6 py-4">
            <h3 className="text-lg font-semibold text-white">
              {editingId ? 'Edit Checklist' : 'Create New Checklist'}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter checklist title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter checklist description"
                  rows={3}
                />
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium text-gray-900">Checklist Items</h4>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </button>
              </div>

              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Question
                        </label>
                        <input
                          type="text"
                          value={item.question}
                          onChange={(e) => updateItem(index, 'question', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter question"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <input
                          type="text"
                          value={item.category}
                          onChange={(e) => updateItem(index, 'category', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter category"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 pt-7">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={item.required}
                          onChange={(e) => updateItem(index, 'required', e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-600">Required</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setNewChecklist(false);
                  setFormData({
                    title: '',
                    description: '',
                    items: [{ question: '', category: '', required: false }]
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {editingId ? 'Update Checklist' : 'Create Checklist'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Checklists List */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="bg-indigo-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Manage Checklists</h2>
          {!newChecklist && !editingId && (
            <button
              onClick={() => setNewChecklist(true)}
              className="flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-indigo-700 bg-white hover:bg-indigo-50"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Checklist
            </button>
          )}
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-4 text-gray-500">Loading checklists...</div>
          ) : checklists.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No checklists found</div>
          ) : (
            <div className="space-y-4">
              {checklists.map((checklist) => (
                <div
                  key={checklist.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{checklist.title}</h3>
                      {checklist.description && (
                        <p className="text-sm text-gray-500 mt-1">{checklist.description}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        {checklist.items.length} items
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleActive(checklist.id, checklist.active)}
                        className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          checklist.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {checklist.active ? 'Active' : 'Inactive'}
                      </button>

                      <button
                        onClick={() => startEdit(checklist)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="h-5 w-5" />
                      </button>

                      <button
                        onClick={() => deleteChecklist(checklist.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Items:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {checklist.items.map((item) => (
                        <div
                          key={item.id}
                          className="bg-gray-50 p-3 rounded-md"
                        >
                          <p className="text-sm text-gray-800">{item.question}</p>
                          <div className="flex items-center mt-2">
                            <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded">
                              {item.category}
                            </span>
                            {item.required && (
                              <span className="ml-2 text-xs font-medium text-red-500">
                                Required
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChecklistManager;