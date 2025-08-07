const EmailTemplate = require('../models/EmailTemplate');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

class EmailTemplateService {
  /**
   * Create a new email template
   */
  async createTemplate(templateData) {
    try {
      const template = new EmailTemplate(templateData);
      await template.save();
      logger.info(`Email template created: ${template.name} (ID: ${template._id})`);
      return template;
    } catch (error) {
      logger.error('Failed to create email template:', error);
      throw error;
    }
  }

  /**
   * Get all active templates
   */
  async getActiveTemplates() {
    try {
      return await EmailTemplate.getActiveTemplates();
    } catch (error) {
      logger.error('Failed to get active templates:', error);
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(templateId) {
    try {
      const template = await EmailTemplate.findById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }
      return template;
    } catch (error) {
      logger.error(`Failed to get template ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Get default template
   */
  async getDefaultTemplate() {
    try {
      return await EmailTemplate.getDefault();
    } catch (error) {
      logger.error('Failed to get default template:', error);
      throw error;
    }
  }

  /**
   * Update template
   */
  async updateTemplate(templateId, updateData) {
    try {
      const template = await EmailTemplate.findByIdAndUpdate(
        templateId,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!template) {
        throw new Error('Template not found');
      }

      logger.info(`Email template updated: ${template.name} (ID: ${template._id})`);
      return template;
    } catch (error) {
      logger.error(`Failed to update template ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId) {
    try {
      const template = await EmailTemplate.findById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Clean up attachment files if they exist
      if (template.attachments && template.attachments.length > 0) {
        await this.cleanupAttachments(template.attachments);
      }

      await EmailTemplate.findByIdAndDelete(templateId);
      logger.info(`Email template deleted: ${template.name} (ID: ${templateId})`);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to delete template ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Set template as default
   */
  async setDefaultTemplate(templateId) {
    try {
      const template = await EmailTemplate.findById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      await template.setAsDefault();
      logger.info(`Template set as default: ${template.name} (ID: ${templateId})`);
      return template;
    } catch (error) {
      logger.error(`Failed to set default template ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Mark template as used
   */
  async markTemplateAsUsed(templateId) {
    try {
      const template = await EmailTemplate.findById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      await template.markAsUsed();
      return template;
    } catch (error) {
      logger.error(`Failed to mark template as used ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Create or update default template
   */
  async createOrUpdateDefaultTemplate(templateData) {
    try {
      let defaultTemplate = await this.getDefaultTemplate();
      
      if (defaultTemplate) {
        // Update existing default template
        Object.assign(defaultTemplate, templateData);
        await defaultTemplate.save();
        logger.info(`Default template updated: ${defaultTemplate.name}`);
        return defaultTemplate;
      } else {
        // Create new default template
        const newTemplate = await this.createTemplate({
          ...templateData,
          name: templateData.name || 'Default Template',
          isDefault: true
        });
        logger.info(`Default template created: ${newTemplate.name}`);
        return newTemplate;
      }
    } catch (error) {
      logger.error('Failed to create or update default template:', error);
      throw error;
    }
  }

  /**
   * Get template statistics
   */
  async getTemplateStats() {
    try {
      const [totalTemplates, activeTemplates, defaultTemplate, mostUsedTemplate] = await Promise.all([
        EmailTemplate.countDocuments(),
        EmailTemplate.countDocuments({ isActive: true }),
        EmailTemplate.findOne({ isDefault: true }),
        EmailTemplate.findOne({ isActive: true }).sort({ usageCount: -1 })
      ]);

      return {
        totalTemplates,
        activeTemplates,
        defaultTemplate: defaultTemplate ? {
          id: defaultTemplate._id,
          name: defaultTemplate.name,
          usageCount: defaultTemplate.usageCount
        } : null,
        mostUsedTemplate: mostUsedTemplate ? {
          id: mostUsedTemplate._id,
          name: mostUsedTemplate.name,
          usageCount: mostUsedTemplate.usageCount
        } : null
      };
    } catch (error) {
      logger.error('Failed to get template stats:', error);
      throw error;
    }
  }

  /**
   * Clean up attachment files
   */
  async cleanupAttachments(attachments) {
    try {
      for (const attachment of attachments) {
        if (attachment.path) {
          try {
            await fs.unlink(attachment.path);
            logger.info(`Deleted attachment file: ${attachment.path}`);
          } catch (err) {
            if (err.code !== 'ENOENT') {
              logger.warn(`Failed to delete attachment file ${attachment.path}:`, err);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup attachments:', error);
    }
  }

  /**
   * Extract variables from template body
   */
  extractVariables(templateBody) {
    try {
      const variableRegex = /\{\{(\w+)\}\}/g;
      const variables = [];
      let match;

      while ((match = variableRegex.exec(templateBody)) !== null) {
        if (!variables.includes(match[1])) {
          variables.push(match[1]);
        }
      }

      return variables;
    } catch (error) {
      logger.error('Failed to extract variables from template:', error);
      return [];
    }
  }

  /**
   * Validate template content
   */
  validateTemplate(templateData) {
    const errors = [];

    if (!templateData.name || templateData.name.trim().length === 0) {
      errors.push('Template name is required');
    }

    if (!templateData.subject || templateData.subject.trim().length === 0) {
      errors.push('Subject is required');
    }

    if (!templateData.body || templateData.body.trim().length === 0) {
      errors.push('Body is required');
    }

    if (templateData.name && templateData.name.length > 100) {
      errors.push('Template name must be less than 100 characters');
    }

    if (templateData.subject && templateData.subject.length > 200) {
      errors.push('Subject must be less than 200 characters');
    }

    if (templateData.body && templateData.body.length > 10000) {
      errors.push('Body must be less than 10,000 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = new EmailTemplateService();
