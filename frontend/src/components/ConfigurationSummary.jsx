const ConfigurationSummary = ({ excelData, columns, selectedFields, emailConfig, processedData, filteredData, manualData }) => {
  // Calculate email statistics
  const totalEmails = processedData ? processedData.reduce((sum, person) => sum + person.emails.length, 0) : 0
  const validEmails = processedData ? processedData.reduce((sum, person) => 
    sum + person.emails.filter(email => email.isValid).length, 0
  ) : 0
  const filteredEmails = filteredData ? filteredData.reduce((sum, person) => sum + person.emails.length, 0) : totalEmails
  
  // Determine data source
  const dataSource = excelData ? 'Excel' : manualData && manualData.length > 0 ? 'Manual' : 'None'

  return (
    <div className="mt-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8">
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
        <svg className="w-6 h-6 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Configuration Summary
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600/50">
          <h4 className="font-semibold text-slate-200 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel Data
          </h4>
          <div className="space-y-2 text-sm text-slate-300">
            <p className="flex justify-between">
              <span>Data Source:</span>
              <span className={`font-semibold ${dataSource === 'Excel' ? 'text-blue-400' : dataSource === 'Manual' ? 'text-green-400' : 'text-slate-400'}`}>
                {dataSource}
              </span>
            </p>
            {dataSource === 'Excel' && (
              <>
                <p className="flex justify-between">
                  <span>Rows:</span>
                  <span className="font-semibold">{excelData ? excelData.rows.length : 0}</span>
                </p>
                <p className="flex justify-between">
                  <span>Columns:</span>
                  <span className="font-semibold">{columns.length}</span>
                </p>
                <p className="flex justify-between">
                  <span>Email Columns:</span>
                  <span className="font-semibold">{selectedFields.emails.length}</span>
                </p>
                <p className="flex justify-between">
                  <span>Status Columns:</span>
                  <span className="font-semibold">{selectedFields.emailStatuses.length}</span>
                </p>
              </>
            )}
            {dataSource === 'Manual' && (
              <p className="flex justify-between">
                <span>Manual Entries:</span>
                <span className="font-semibold">{manualData ? manualData.length : 0}</span>
              </p>
            )}
          </div>
        </div>
        
        <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600/50">
          <h4 className="font-semibold text-slate-200 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Recipients
          </h4>
          <div className="space-y-2 text-sm text-slate-300">
            <p className="flex justify-between">
              <span>Total People:</span>
              <span className="font-semibold">{processedData ? processedData.length : 0}</span>
            </p>
            <p className="flex justify-between">
              <span>Total Emails:</span>
              <span className="font-semibold">{totalEmails}</span>
            </p>
            <p className="flex justify-between">
              <span>Valid Emails:</span>
              <span className="font-semibold text-green-400">{validEmails}</span>
            </p>
            <p className="flex justify-between">
              <span>Will Send To:</span>
              <span className="font-semibold text-blue-400">{filteredEmails}</span>
            </p>
          </div>
        </div>

        <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600/50">
          <h4 className="font-semibold text-slate-200 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email Settings
          </h4>
          <div className="space-y-2 text-sm text-slate-300">
            <p className="flex justify-between">
              <span>Subject:</span>
              <span className="font-semibold">{emailConfig.subject || 'Not set'}</span>
            </p>
            <p className="flex justify-between">
              <span>Body Length:</span>
              <span className="font-semibold">{emailConfig.body.length} characters</span>
            </p>
            <p className="flex justify-between">
              <span>Attachments:</span>
              <span className="font-semibold">{emailConfig.attachments.length} files</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationSummary;