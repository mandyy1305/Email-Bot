import { useState, useEffect } from 'react';

const EmailTemplateEditor = ({ onTemplateChange, onSave }) => {
  const [template, setTemplate] = useState({
    name: '',
    subject: '',
    body: '',
    attachments: [],
    isDefault: false
  });
  const [originalTemplate, setOriginalTemplate] = useState(null);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [newAttachments, setNewAttachments] = useState([]);
  const [removedAttachments, setRemovedAttachments] = useState([]);

  useEffect(() => {
    loadDefaultTemplate();
    loadSavedTemplates();
  }, []);

  useEffect(() => {
    // Notify parent component when template changes
    if (onTemplateChange) {
      onTemplateChange(template);
    }
  }, [template, onTemplateChange]);

  const loadDefaultTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/templates/default');
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setTemplate(data.data);
          setOriginalTemplate(data.data);
          setSelectedTemplateId(data.data._id);
          setNewAttachments([]);
          setRemovedAttachments([]);
        }
      }
    } catch (error) {
      console.error('Failed to load default template:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      if (response.ok) {
        const data = await response.json();
        setSavedTemplates(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load saved templates:', error);
    }
  };

  const handleTemplateSelect = async (templateId) => {
    if (!templateId) {
      const emptyTemplate = { name: '', subject: '', body: '', attachments: [], isDefault: false };
      setTemplate(emptyTemplate);
      setOriginalTemplate(null);
      setSelectedTemplateId('');
      setNewAttachments([]);
      setRemovedAttachments([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/templates/${templateId}`);
      if (response.ok) {
        const data = await response.json();
        setTemplate(data.data);
        setOriginalTemplate(data.data);
        setSelectedTemplateId(templateId);
        setNewAttachments([]);
        setRemovedAttachments([]);
      }
    } catch (error) {
      console.error('Failed to load template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      setSaving(true);
      
      const formData = new FormData();
      formData.append('name', template.name || 'Email Template');
      formData.append('subject', template.subject);
      formData.append('body', template.body);
      
      // Only send isDefault if the template was originally the default
      // This preserves the original default status without changing it
      if (originalTemplate && originalTemplate.isDefault) {
        formData.append('isDefault', 'true');
      }

      // Add new attachments
      newAttachments.forEach(file => {
        formData.append('attachments', file);
      });

      // Add removed attachment IDs
      if (removedAttachments.length > 0) {
        removedAttachments.forEach(attachmentId => {
          formData.append('removeAttachments', attachmentId);
        });
      }

      let response;
      if (selectedTemplateId) {
        // Update existing template
        response = await fetch(`/api/templates/${selectedTemplateId}`, {
          method: 'PUT',
          body: formData
        });
      } else {
        // Create new template or update default
        response = await fetch('/api/templates/default', {
          method: 'POST',
          body: formData
        });
      }

      if (response.ok) {
        const data = await response.json();
        setTemplate(data.data);
        setOriginalTemplate(data.data);
        setSelectedTemplateId(data.data._id);
        setNewAttachments([]);
        setRemovedAttachments([]);
        
        // Reload templates list
        await loadSavedTemplates();
        
        // Notify parent component
        if (onSave) {
          onSave(data.data);
        }
        
        alert('Template saved successfully!');
      } else {
        throw new Error('Failed to save template');
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewTemplate = async () => {
    try {
      setSaving(true);
      
      const formData = new FormData();
      formData.append('name', template.name || `Template ${Date.now()}`);
      formData.append('subject', template.subject);
      formData.append('body', template.body);
      formData.append('isDefault', 'false');

      // Add new attachments
      newAttachments.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await fetch('/api/templates', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        await loadSavedTemplates();
        alert('New template created successfully!');
      } else {
        throw new Error('Failed to create template');
      }
    } catch (error) {
      console.error('Failed to create template:', error);
      alert('Failed to create template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetAsDefault = async (templateId) => {
    try {
      const response = await fetch(`/api/templates/${templateId}/default`, {
        method: 'PUT'
      });

      if (response.ok) {
        await loadSavedTemplates();
        // Reload the template if it's the currently selected one
        if (selectedTemplateId === templateId) {
          await handleTemplateSelect(templateId);
        } else {
          // Update the current template state if it's the one being set as default
          const updatedTemplate = { ...template, isDefault: true };
          setTemplate(updatedTemplate);
          setOriginalTemplate(updatedTemplate);
        }
        alert('Template set as default successfully!');
      } else {
        throw new Error('Failed to set template as default');
      }
    } catch (error) {
      console.error('Failed to set template as default:', error);
      alert('Failed to set template as default. Please try again.');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadSavedTemplates();
        if (selectedTemplateId === templateId) {
          setTemplate({ name: '', subject: '', body: '', attachments: [] });
          setSelectedTemplateId('');
        }
        alert('Template deleted successfully!');
      } else {
        throw new Error('Failed to delete template');
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template. Please try again.');
    }
  };

  const handleAttachmentUpload = (event) => {
    const files = Array.from(event.target.files);
    setNewAttachments(prev => [...prev, ...files]);
  };

  const removeNewAttachment = (index) => {
    setNewAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (attachmentId) => {
    // Add to removed attachments list
    setRemovedAttachments(prev => [...prev, attachmentId]);
    
    // Remove from template's current attachments
    setTemplate(prev => ({
      ...prev,
      attachments: prev.attachments.filter(att => att._id !== attachmentId)
    }));
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
          <span className="ml-3 text-gray-300">Loading template...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Template Selector */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Email Template</h3>
          <button
            onClick={() => setShowTemplateManager(!showTemplateManager)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            {showTemplateManager ? 'Hide Templates' : 'Manage Templates'}
          </button>
        </div>

        {/* Template Manager */}
        {showTemplateManager && (
          <div className="mb-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-300">
                Load Saved Template:
              </label>
              <button
                onClick={handleCreateNewTemplate}
                disabled={saving || !template.subject || !template.body}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save as New
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {savedTemplates.map(tmpl => (
                <div key={tmpl._id} className="flex items-center justify-between p-3 bg-gray-800 rounded border border-gray-600">
                  <div className="flex-1">
                    <button
                      onClick={() => handleTemplateSelect(tmpl._id)}
                      className="text-left w-full"
                    >
                      <div className="text-white font-medium">{tmpl.name}</div>
                      <div className="text-gray-400 text-sm truncate">{tmpl.subject}</div>
                      {tmpl.isDefault && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-green-600 text-white text-xs rounded">Default</span>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!tmpl.isDefault && (
                      <button
                        onClick={() => handleSetAsDefault(tmpl._id)}
                        className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors duration-200"
                        title="Set as default template"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTemplate(tmpl._id)}
                      className="text-red-400 hover:text-red-300 transition-colors duration-200"
                      title="Delete template"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Template Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Template Name
          </label>
          <input
            type="text"
            value={template.name}
            onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter template name..."
          />
        </div>

        {/* Subject Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Subject
          </label>
          <input
            type="text"
            value={template.subject}
            onChange={(e) => setTemplate(prev => ({ ...prev, subject: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter email subject..."
          />
        </div>

        {/* Body Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email Body
          </label>
          <textarea
            value={template.body}
            onChange={(e) => setTemplate(prev => ({ ...prev, body: e.target.value }))}
            rows={10}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            placeholder="Enter email body... Use {{firstName}}, {{lastName}}, {{email}} for personalization"
          />
        </div>

        {/* Attachments */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Attachments
          </label>
          
          {/* Existing Attachments */}
          {template.attachments && template.attachments.length > 0 && (
            <div className="mb-3">
              <div className="text-sm text-gray-400 mb-2">Current attachments:</div>
              <div className="space-y-2">
                {template.attachments.map((attachment, index) => (
                  <div key={attachment._id || index} className="flex items-center justify-between p-2 bg-gray-700 rounded border border-gray-600">
                    <span className="text-white text-sm">{attachment.originalname || attachment.filename}</span>
                    <button
                      onClick={() => removeExistingAttachment(attachment._id)}
                      className="text-red-400 hover:text-red-300 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Attachments */}
          {newAttachments.length > 0 && (
            <div className="mb-3">
              <div className="text-sm text-gray-400 mb-2">New attachments:</div>
              <div className="space-y-2">
                {newAttachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-green-900/20 rounded border border-green-600/30">
                    <span className="text-green-300 text-sm">{file.name}</span>
                    <button
                      onClick={() => removeNewAttachment(index)}
                      className="text-red-400 hover:text-red-300 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
            <input
              type="file"
              multiple
              onChange={handleAttachmentUpload}
              className="hidden"
              id="attachment-upload"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif"
            />
            <label
              htmlFor="attachment-upload"
              className="cursor-pointer block"
            >
              <div className="text-gray-400 mb-2">
                <svg className="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="text-sm text-gray-300">
                Click to upload files or drag and drop
              </div>
              <div className="text-xs text-gray-500 mt-1">
                PDF, Word, Excel, Text, Images (Max 10MB each)
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleSaveTemplate}
            disabled={saving || !template.subject || !template.body}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              'Save Template'
            )}
          </button>
          
          <button
            onClick={() => {
              const emptyTemplate = { name: '', subject: '', body: '', attachments: [], isDefault: false };
              setTemplate(emptyTemplate);
              setOriginalTemplate(null);
              setSelectedTemplateId('');
              setNewAttachments([]);
              setRemovedAttachments([]);
            }}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateEditor;
