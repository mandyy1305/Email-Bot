import { useState } from 'react'

const ManualEntry = ({ manualData, setManualData, processedData, setProcessedData }) => {
  const [currentEntry, setCurrentEntry] = useState({
    firstName: '',
    lastName: '',
    email: ''
  })

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const addEntry = () => {
    if (!currentEntry.email.trim()) {
      alert('Email is required')
      return
    }

    if (!isValidEmail(currentEntry.email.trim())) {
      alert('Please enter a valid email address')
      return
    }

    const newEntry = {
      id: Date.now() + Math.random(),
      firstName: currentEntry.firstName.trim(),
      lastName: currentEntry.lastName.trim(),
      email: currentEntry.email.trim(),
      isValid: true
    }

    setManualData(prev => [...prev, newEntry])
    setCurrentEntry({ firstName: '', lastName: '', email: '' })
    
    // Clear processed data so it gets regenerated
    setProcessedData(null)
  }

  const removeEntry = (id) => {
    setManualData(prev => prev.filter(entry => entry.id !== id))
    setProcessedData(null)
  }

  const editEntry = (id, field, value) => {
    setManualData(prev => prev.map(entry => 
      entry.id === id 
        ? { ...entry, [field]: value, isValid: field === 'email' ? isValidEmail(value) : entry.isValid }
        : entry
    ))
    setProcessedData(null)
  }

  const processData = () => {
    if (manualData.length === 0) {
      alert('Please add at least one recipient')
      return
    }

    const processed = manualData.map((entry, index) => ({
      rowIndex: index + 1,
      firstName: entry.firstName,
      lastName: entry.lastName,
      emails: [{
        column: 'Manual Entry',
        email: entry.email,
        status: 'manual',
        isValid: isValidEmail(entry.email)
      }]
    }))

    setProcessedData(processed)
  }

  const clearAll = () => {
    if (manualData.length > 0 && confirm('Are you sure you want to clear all entries?')) {
      setManualData([])
      setProcessedData(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8">
        <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
          <svg className="w-8 h-8 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Manual Entry
        </h2>

        {/* Add Entry Form */}
        <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600/50 mb-8">
          <h3 className="text-xl font-semibold text-white mb-6">Add Recipients</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={currentEntry.firstName}
                onChange={(e) => setCurrentEntry(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="John"
                className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={currentEntry.lastName}
                onChange={(e) => setCurrentEntry(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Doe"
                className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={currentEntry.email}
                onChange={(e) => setCurrentEntry(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
                className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400"
                onKeyPress={(e) => e.key === 'Enter' && addEntry()}
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={addEntry}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Add
              </button>
            </div>
          </div>

          {/* Basic Controls */}
          <div className="flex flex-wrap gap-4">
            {manualData.length > 0 && (
              <button
                onClick={clearAll}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                🗑️ Clear All
              </button>
            )}
          </div>
        </div>

        {/* Recipients List */}
        {manualData.length > 0 && (
          <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600/50 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                Recipients ({manualData.length})
              </h3>
              <button
                onClick={processData}
                className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Process Data & Create Preview
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {manualData.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`p-4 rounded-lg border ${
                    entry.isValid
                      ? 'bg-slate-600/50 border-slate-500/50'
                      : 'bg-red-900/20 border-red-700/50'
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <input
                        type="text"
                        value={entry.firstName}
                        onChange={(e) => editEntry(entry.id, 'firstName', e.target.value)}
                        placeholder="First Name"
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white text-sm"
                      />
                    </div>
                    
                    <div>
                      <input
                        type="text"
                        value={entry.lastName}
                        onChange={(e) => editEntry(entry.id, 'lastName', e.target.value)}
                        placeholder="Last Name"
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white text-sm"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="email"
                        value={entry.email}
                        onChange={(e) => editEntry(entry.id, 'email', e.target.value)}
                        placeholder="Email"
                        className={`flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-1 text-white text-sm ${
                          entry.isValid
                            ? 'bg-slate-700 border-slate-600 focus:ring-blue-500'
                            : 'bg-red-900/30 border-red-700 focus:ring-red-500'
                        }`}
                      />
                      {entry.isValid ? (
                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-400">#{index + 1}</span>
                      <button
                        onClick={() => removeEntry(entry.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {manualData.length === 0 && (
          <div className="text-center py-12">
            <div className="text-slate-400 text-lg mb-4">No recipients added yet</div>
            <p className="text-slate-500 text-sm">
              Add recipients manually to get started
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManualEntry