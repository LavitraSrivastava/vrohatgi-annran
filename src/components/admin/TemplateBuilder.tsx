import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { PlusCircle, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

type TemplateQuestion = {
  id: string;
  question: string;
  category: string;
};

const TemplateBuilder: React.FC = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [questions, setQuestions] = useState<TemplateQuestion[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [currentCategory, setCurrentCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const addCategory = () => {
    if (!newCategory.trim()) return;
    if (categories.includes(newCategory)) {
      toast.error('Category already exists');
      return;
    }
    
    setCategories([...categories, newCategory]);
    setCurrentCategory(newCategory);
    setNewCategory('');
  };

  const addQuestion = () => {
    if (!newQuestion.trim() || !currentCategory) return;
    
    setQuestions([
      ...questions,
      {
        id: Math.random().toString(36).substring(2, 9),
        question: newQuestion,
        category: currentCategory,
      },
    ]);
    
    setNewQuestion('');
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const removeCategory = (category: string) => {
    setCategories(categories.filter(c => c !== category));
    setQuestions(questions.filter(q => q.category !== category));
    
    if (currentCategory === category) {
      setCurrentCategory(categories.find(c => c !== category) || '');
    }
  };

  const saveTemplate = async () => {
    if (!title.trim() || !description.trim() || categories.length === 0 || questions.length === 0) {
      toast.error('Please fill in all required fields and add at least one category and question');
      return;
    }

    setLoading(true);

    try {
      // Insert template
      const { data: templateData, error: templateError } = await supabase
        .from('audit_templates')
        .insert({
          title,
          description,
          created_by: user?.id,
          categories,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Insert template questions
      const templateItems = questions.map(q => ({
        template_id: templateData.id,
        question: q.question,
        category: q.category,
      }));

      const { error: questionsError } = await supabase
        .from('template_items')
        .insert(templateItems);

      if (questionsError) throw questionsError;

      toast.success('Template created successfully');
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategories([]);
      setQuestions([]);
      setCurrentCategory('');
      
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="bg-indigo-700 px-6 py-4">
        <h2 className="text-lg font-semibold text-white">Create Audit Template</h2>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Template Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Safety Audit Template"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Brief description of this template"
              required
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categories
          </label>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map(cat => (
              <div 
                key={cat} 
                className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${
                  currentCategory === cat
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                    : 'bg-gray-100 text-gray-800 border border-gray-300'
                }`}
              >
                <span 
                  className="cursor-pointer"
                  onClick={() => setCurrentCategory(cat)}
                >
                  {cat}
                </span>
                <button
                  type="button"
                  onClick={() => removeCategory(cat)}
                  className="ml-2 text-gray-500 hover:text-red-500"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Add a new category"
            />
            <button
              type="button"
              onClick={addCategory}
              className="px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add
            </button>
          </div>
        </div>

        {currentCategory && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md font-medium text-gray-800">
                Questions for: <span className="text-indigo-600">{currentCategory}</span>
              </h3>
            </div>
            
            <div className="flex mb-4">
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Add a new question"
              />
              <button
                type="button"
                onClick={addQuestion}
                className="px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Add
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-md p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Questions:</h4>
              
              {questions.filter(q => q.category === currentCategory).length === 0 ? (
                <p className="text-sm text-gray-500">No questions added yet</p>
              ) : (
                <ul className="space-y-2">
                  {questions
                    .filter(q => q.category === currentCategory)
                    .map(q => (
                      <li key={q.id} className="flex justify-between items-center bg-white p-3 rounded-md shadow-sm">
                        <span className="text-sm text-gray-800">{q.question}</span>
                        <button
                          type="button"
                          onClick={() => removeQuestion(q.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={saveTemplate}
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateBuilder;