import { useState } from 'react'

const EmailPreview = ({ processedData, onFilterChange }) => {
  const [showOnlyValid, setShowOnlyValid] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  if (!processedData || processedData.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8">
        <h3 className="text-2xl font-bold text-white mb-4">Email Preview</h3>
        <p className="text-slate-400">Process your Excel data first to see the email preview.</p>
      </div>
    )
  }

  // Get all unique statuses
  const allStatuses = [...new Set(
    processedData.flatMap(person => 
      person.emails.map(email => email.status)
    )
  )].filter(status => status && status !== 'unknown')

  // Apply filters
  const filteredData = processedData.map(person => ({
    ...person,
    emails: person.emails.filter(email => {
      const validFilter = showOnlyValid ? email.isValid : true
      const statusFilterMatch = statusFilter === 'all' || email.status === statusFilter
      return validFilter && statusFilterMatch
    })
  })).filter(person => person.emails.length > 0)

  // Calculate statistics
  const totalEmails = processedData.reduce((sum, person) => sum + person.emails.length, 0)
  const validEmails = processedData.reduce((sum, person) => 
    sum + person.emails.filter(email => email.isValid).length, 0
  )
  const filteredEmails = filteredData.reduce((sum, person) => sum + person.emails.length, 0)

  // Notify parent of filter changes
  const handleFilterChange = (newShowOnlyValid, newStatusFilter) => {
    setShowOnlyValid(newShowOnlyValid)
    setStatusFilter(newStatusFilter)
    
    const filtered = processedData.map(person => ({
      ...person,
      emails: person.emails.filter(email => {
        const validFilter = newShowOnlyValid ? email.isValid : true
        const statusFilterMatch = newStatusFilter === 'all' || email.status === newStatusFilter
        return validFilter && statusFilterMatch
      })
    })).filter(person => person.emails.length > 0)
    
    onFilterChange?.(filtered)
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8">
      <h3 className="text-3xl font-bold text-white mb-8 flex items-center">
        <svg className="w-8 h-8 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Email Recipients Preview
      </h3>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50">
          <div className="text-2xl font-bold text-blue-400">{processedData.length}</div>
          <div className="text-sm text-slate-300">Total People</div>
        </div>
        <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50">
          <div className="text-2xl font-bold text-green-400">{totalEmails}</div>
          <div className="text-sm text-slate-300">Total Emails</div>
        </div>
        <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50">
          <div className="text-2xl font-bold text-yellow-400">{validEmails}</div>
          <div className="text-sm text-slate-300">Valid Emails</div>
        </div>
        <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50">
          <div className="text-2xl font-bold text-purple-400">{filteredEmails}</div>
          <div className="text-sm text-slate-300">After Filters</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600/50 mb-8">
        <h4 className="text-lg font-semibold text-white mb-4">Filters</h4>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyValid}
              onChange={(e) => handleFilterChange(e.target.checked, statusFilter)}
              className="rounded border-slate-500 text-green-500 focus:ring-green-500 bg-slate-600"
            />
            <span className="text-slate-200">Show only valid emails</span>
          </label>

          <div className="flex items-center space-x-2">
            <label className="text-slate-200">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(showOnlyValid, e.target.value)}
              className="px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            >
              <option value="all">All Statuses</option>
              {allStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Email List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredData.map((person, personIndex) => (
          <div key={personIndex} className="bg-slate-700/50 rounded-xl border border-slate-600/50">
            {/* Person Header */}
            <div className="p-4 border-b border-slate-600/50">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-lg font-semibold text-white">
                    {person.firstName} {person.lastName}
                    {!person.firstName && !person.lastName && (
                      <span className="text-slate-400">Row {person.rowIndex}</span>
                    )}
                  </h5>
                  <p className="text-sm text-slate-400">{person.emails.length} email(s)</p>
                </div>
                <div className="text-sm text-slate-400">
                  Excel Row: {person.rowIndex}
                </div>
              </div>
            </div>

            {/* Email Entries */}
            <div className="p-4 space-y-3">
              {person.emails.map((emailEntry, emailIndex) => (
                <div
                  key={emailIndex}
                  className={`p-3 rounded-lg border ${
                    emailEntry.isValid
                      ? 'bg-green-900/20 border-green-700/50'
                      : 'bg-red-900/20 border-red-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${
                          emailEntry.isValid ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {emailEntry.email}
                        </span>
                        {emailEntry.isValid ? (
                          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Column: {emailEntry.column}
                        {emailEntry.status !== 'unknown' && (
                          <span className="ml-2">Status: {emailEntry.status}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-8">
          <div className="text-slate-400 text-lg">No emails match the current filters</div>
          <p className="text-slate-500 text-sm mt-2">
            Try adjusting your filters to see more results
          </p>
        </div>
      )}
    </div>
  )
}

export default EmailPreview