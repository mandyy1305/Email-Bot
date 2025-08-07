import { useRef } from 'react'
import * as XLSX from 'xlsx'

const ExcelUpload = ({ 
  excelData, 
  setExcelData, 
  columns, 
  setColumns, 
  selectedFields, 
  setSelectedFields,
  processedData,
  setProcessedData
}) => {
  const fileInputRef = useRef(null)

  const handleExcelUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        if (jsonData.length > 0) {
          const headers = jsonData[0]
          const rows = jsonData.slice(1)
          setColumns(headers)
          setExcelData({ headers, rows })
          setSelectedFields({
            firstName: '',
            lastName: '',
            emails: [],
            emailStatuses: [],
            customFields: {}
          })
          setProcessedData(null)
        }
      }
      reader.readAsArrayBuffer(file)
    }
  }

  const handleFieldSelection = (fieldType, value) => {
    if (fieldType === 'emails' || fieldType === 'emailStatuses') {
      setSelectedFields(prev => ({
        ...prev,
        [fieldType]: prev[fieldType].includes(value) 
          ? prev[fieldType].filter(item => item !== value)
          : [...prev[fieldType], value]
      }))
    } else {
      setSelectedFields(prev => ({
        ...prev,
        [fieldType]: value
      }))
    }
    // Clear processed data when field selection changes
    setProcessedData(null)
  }

  const processData = () => {
    if (!excelData || selectedFields.emails.length === 0) return

    const processed = []
    
    excelData.rows.forEach((row, rowIndex) => {
      const person = {
        rowIndex: rowIndex + 2, // Excel row number (1-indexed + header)
        firstName: selectedFields.firstName ? row[columns.indexOf(selectedFields.firstName)] || '' : '',
        lastName: selectedFields.lastName ? row[columns.indexOf(selectedFields.lastName)] || '' : '',
        emails: []
      }

      // Process each email column
      selectedFields.emails.forEach((emailColumn) => {
        const emailIndex = columns.indexOf(emailColumn)
        const email = row[emailIndex]
        
        if (email) {
          const emailEntry = {
            column: emailColumn,
            email: email.toString().trim(),
            status: 'unknown',
            isValid: isValidEmail(email.toString().trim())
          }

          // Find corresponding status column if exists
          const statusColumn = selectedFields.emailStatuses.find(statusCol => 
            statusCol.toLowerCase().includes(emailColumn.toLowerCase()) ||
            emailColumn.toLowerCase().includes(statusCol.toLowerCase().replace(/status|_status/gi, ''))
          )
          
          if (statusColumn) {
            const statusIndex = columns.indexOf(statusColumn)
            emailEntry.status = row[statusIndex] || 'unknown'
          }

          person.emails.push(emailEntry)
        }
      })

      // Only add person if they have at least one email
      if (person.emails.length > 0) {
        processed.push(person)
      }
    })

    setProcessedData(processed)
  }

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8">
      <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
        <svg className="w-8 h-8 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Excel Data Upload
      </h2>
      
      {/* File Upload */}
      <div className="mb-10">
        <div className="border-2 border-dashed border-slate-600 rounded-2xl p-12 text-center hover:border-blue-400 transition-all duration-300 bg-slate-700/30">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
          </div>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelUpload}
            ref={fileInputRef}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Upload Excel File
          </button>
          <p className="text-slate-400 mt-4 text-sm">Supports .xlsx and .xls files</p>
        </div>
      </div>

      {/* Column Selection */}
      {excelData && (
        <div className="space-y-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <svg className="w-6 h-6 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Map Your Data Fields
          </h3>
          
          {/* First Name and Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600/50">
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                First Name Column
              </label>
              <select
                value={selectedFields.firstName}
                onChange={(e) => handleFieldSelection('firstName', e.target.value)}
                className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              >
                <option value="">Select column</option>
                {columns.map((column, index) => (
                  <option key={index} value={column}>
                    {column}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600/50">
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Last Name Column
              </label>
              <select
                value={selectedFields.lastName}
                onChange={(e) => handleFieldSelection('lastName', e.target.value)}
                className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              >
                <option value="">Select column</option>
                {columns.map((column, index) => (
                  <option key={index} value={column}>
                    {column}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Email Columns */}
          <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600/50">
            <label className="block text-sm font-semibold text-slate-300 mb-4">
              Email Columns (Multiple selection allowed)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {columns.map((column, index) => (
                <label key={index} className="flex items-center space-x-3 p-3 bg-slate-600/50 rounded-lg hover:bg-slate-600 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFields.emails.includes(column)}
                    onChange={() => handleFieldSelection('emails', column)}
                    className="rounded border-slate-500 text-blue-500 focus:ring-blue-500 bg-slate-600"
                  />
                  <span className="text-sm text-slate-200">{column}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Email Status Columns */}
          <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600/50">
            <label className="block text-sm font-semibold text-slate-300 mb-4">
              Email Status Columns (Optional - for filtering valid emails)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {columns.map((column, index) => (
                <label key={index} className="flex items-center space-x-3 p-3 bg-slate-600/50 rounded-lg hover:bg-slate-600 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFields.emailStatuses.includes(column)}
                    onChange={() => handleFieldSelection('emailStatuses', column)}
                    className="rounded border-slate-500 text-green-500 focus:ring-green-500 bg-slate-600"
                  />
                  <span className="text-sm text-slate-200">{column}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Process Data Button */}
          <div className="text-center">
            <button
              onClick={processData}
              disabled={selectedFields.emails.length === 0}
              className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-green-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Process Data & Create Preview
            </button>
          </div>

          {/* Data Preview */}
          <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600/50">
            <h4 className="text-xl font-bold text-white mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Data Preview
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-slate-600 rounded-lg">
                <thead className="bg-slate-600">
                  <tr>
                    {columns.map((column, index) => (
                      <th key={index} className="px-4 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider border-b border-slate-500">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-slate-700 divide-y divide-slate-600">
                  {excelData.rows.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-slate-600/50">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-3 text-sm text-slate-200">
                          {cell || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Showing first 5 rows of {excelData.rows.length} total rows
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExcelUpload