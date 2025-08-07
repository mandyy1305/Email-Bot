const XLSX = require('xlsx');
const fs = require('fs').promises;
const path = require('path');
const { ApiError } = require('../utils/ApiError');
const logger = require('../utils/logger');

class ExcelService {
  /**
   * Process Excel file and extract data
   */
  async processExcelFile(filePath, fieldMapping) {
    try {
      // Read the Excel file
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0]; // Use first sheet
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (rawData.length === 0) {
        throw new ApiError(400, 'Excel file is empty');
      }

      // Extract headers and data
      const headers = rawData[0];
      const rows = rawData.slice(1);

      // Validate field mapping
      this.validateFieldMapping(fieldMapping, headers);

      // Process and structure the data
      const processedData = this.mapDataToFields(rows, headers, fieldMapping);

      // Clean up uploaded file
      await this.cleanupFile(filePath);

      logger.info(`Processed Excel file with ${processedData.length} records`);

      return {
        headers,
        totalRecords: processedData.length,
        validRecords: processedData.filter(record => this.isValidRecord(record)).length,
        data: processedData,
        fieldMapping,
      };

    } catch (error) {
      // Clean up file on error
      await this.cleanupFile(filePath);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      logger.error('Excel processing error:', error);
      throw new ApiError(500, 'Failed to process Excel file');
    }
  }

  /**
   * Validate field mapping against Excel headers
   */
  validateFieldMapping(fieldMapping, headers) {
    const { firstName, lastName, emails } = fieldMapping;

    // Check if mapped fields exist in headers
    if (firstName && !headers.includes(firstName)) {
      throw new ApiError(400, `First name field '${firstName}' not found in Excel headers`);
    }

    if (lastName && !headers.includes(lastName)) {
      throw new ApiError(400, `Last name field '${lastName}' not found in Excel headers`);
    }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      throw new ApiError(400, 'At least one email field must be selected');
    }

    // Check if email fields exist in headers
    for (const emailField of emails) {
      if (!headers.includes(emailField)) {
        throw new ApiError(400, `Email field '${emailField}' not found in Excel headers`);
      }
    }
  }

  /**
   * Map raw Excel data to structured format
   */
  mapDataToFields(rows, headers, fieldMapping) {
    const { firstName, lastName, emails, customFields = {} } = fieldMapping;

    return rows.map((row, index) => {
      const record = {
        rowIndex: index + 2, // +2 because Excel is 1-indexed and we skipped header
      };

      // Map first name
      if (firstName) {
        const firstNameIndex = headers.indexOf(firstName);
        record.firstName = row[firstNameIndex] || '';
      }

      // Map last name
      if (lastName) {
        const lastNameIndex = headers.indexOf(lastName);
        record.lastName = row[lastNameIndex] || '';
      }

      // Map email addresses
      record.emails = [];
      emails.forEach(emailField => {
        const emailIndex = headers.indexOf(emailField);
        const emailValue = row[emailIndex];
        
        if (emailValue && this.validateEmail(emailValue)) {
          record.emails.push({
            field: emailField,
            email: emailValue.trim().toLowerCase(),
          });
        }
      });

      // Map custom fields
      Object.keys(customFields).forEach(customFieldName => {
        const sourceField = customFields[customFieldName];
        const sourceIndex = headers.indexOf(sourceField);
        if (sourceIndex !== -1) {
          record[customFieldName] = row[sourceIndex] || '';
        }
      });

      // Add validation status
      record.isValid = this.isValidRecord(record);
      record.validationErrors = this.getValidationErrors(record);

      return record;
    });
  }

  /**
   * Validate email address format
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if a record is valid
   */
  isValidRecord(record) {
    return record.emails && record.emails.length > 0;
  }

  /**
   * Get validation errors for a record
   */
  getValidationErrors(record) {
    const errors = [];

    if (!record.emails || record.emails.length === 0) {
      errors.push('No valid email addresses found');
    }

    return errors;
  }

  /**
   * Get statistics from processed data
   */
  getDataStatistics(processedData) {
    const stats = {
      totalRecords: processedData.length,
      validRecords: 0,
      invalidRecords: 0,
      uniqueEmails: new Set(),
      emailFieldStats: {},
    };

    processedData.forEach(record => {
      if (record.isValid) {
        stats.validRecords++;
        
        // Count unique emails
        record.emails.forEach(emailObj => {
          stats.uniqueEmails.add(emailObj.email);
          
          // Count emails per field
          if (!stats.emailFieldStats[emailObj.field]) {
            stats.emailFieldStats[emailObj.field] = 0;
          }
          stats.emailFieldStats[emailObj.field]++;
        });
      } else {
        stats.invalidRecords++;
      }
    });

    stats.uniqueEmailCount = stats.uniqueEmails.size;
    delete stats.uniqueEmails; // Remove Set object for JSON serialization

    return stats;
  }

  /**
   * Convert processed data to email recipients format
   */
  convertToEmailRecipients(processedData) {
    const recipients = [];

    processedData.forEach(record => {
      if (!record.isValid) return;

      record.emails.forEach(emailObj => {
        recipients.push({
          email: emailObj.email,
          firstName: record.firstName || '',
          lastName: record.lastName || '',
          fullName: `${record.firstName || ''} ${record.lastName || ''}`.trim(),
          ...Object.keys(record)
            .filter(key => !['rowIndex', 'emails', 'isValid', 'validationErrors', 'firstName', 'lastName'].includes(key))
            .reduce((obj, key) => {
              obj[key] = record[key];
              return obj;
            }, {}),
        });
      });
    });

    return recipients;
  }

  /**
   * Clean up uploaded file
   */
  async cleanupFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.info(`Cleaned up file: ${filePath}`);
    } catch (error) {
      logger.warn(`Failed to cleanup file ${filePath}:`, error.message);
    }
  }

  /**
   * Get supported file formats
   */
  getSupportedFormats() {
    return ['.xlsx', '.xls', '.csv'];
  }

  /**
   * Validate file format
   */
  validateFileFormat(filename) {
    const ext = path.extname(filename).toLowerCase();
    return this.getSupportedFormats().includes(ext);
  }
}

// Export singleton instance
module.exports = new ExcelService();