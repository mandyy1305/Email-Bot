import { useRef } from 'react'

const EmailConfiguration = ({ emailConfig, setEmailConfig }) => {
  const attachmentInputRef = useRef(null)

  const handleAttachmentUpload = (event) => {
    const files = Array.from(event.target.files)
    setEmailConfig(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }))
  }

  const removeAttachment = (index) => {
    setEmailConfig(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8">
      <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
        <svg className="w-8 h-8 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Email Configuration
      </h2>
      
      <div className="space-y-8">
        {/* Email Subject */}
        <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600/50">
          <label className="block text-sm font-semibold text-slate-300 mb-3">
            Email Subject
          </label>
          <input
            type="text"
            value={emailConfig.subject}
            onChange={(e) => setEmailConfig(prev => ({ ...prev, subject: e.target.value }))}
            placeholder="Welcome {{firstName}}! Your account is ready"
            className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400"
          />
          <p className="text-xs text-slate-400 mt-2">
            💡 Use placeholders: {'{{firstName}}'}, {'{{lastName}}'}, {'{{fullName}}'}
          </p>
        </div>

        {/* Email Body */}
        <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600/50">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-slate-300">
              Email Body
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setEmailConfig(prev => ({ ...prev, body: prev.body + '{{firstName}}' }))}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              >
                +{'{{firstName}}'}
              </button>
              <button
                onClick={() => setEmailConfig(prev => ({ ...prev, body: prev.body + '{{lastName}}' }))}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              >
                +{'{{lastName}}'}
              </button>
              <button
                onClick={() => setEmailConfig(prev => ({ ...prev, body: prev.body + '{{fullName}}' }))}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              >
                +{'{{fullName}}'}
              </button>
            </div>
          </div>
          <textarea
            value={emailConfig.body}
            onChange={(e) => setEmailConfig(prev => ({ ...prev, body: e.target.value }))}
            placeholder="Dear {{firstName}},&#10;&#10;Thank you for joining us! We're excited to have {{fullName}} as part of our community.&#10;&#10;Best regards,&#10;The Team"
            rows={8}
            className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400 resize-none"
          />
          <div className="mt-3 p-3 bg-slate-600/50 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-300 mb-2">Available Placeholders:</h4>
            <div className="text-xs text-slate-400 space-y-1">
              <div><code className="bg-slate-700 px-2 py-1 rounded">{'{{firstName}}'}</code> - Recipient's first name</div>
              <div><code className="bg-slate-700 px-2 py-1 rounded">{'{{lastName}}'}</code> - Recipient's last name</div>
              <div><code className="bg-slate-700 px-2 py-1 rounded">{'{{fullName}}'}</code> - Full name (firstName + lastName)</div>
              <div><code className="bg-slate-700 px-2 py-1 rounded">{'{{email}}'}</code> - Recipient's email address</div>
            </div>
          </div>
        </div>

        {/* File Attachments */}
        <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600/50">
          <label className="block text-sm font-semibold text-slate-300 mb-4">
            Attachments
          </label>
          <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-blue-400 transition-all duration-300 bg-slate-600/30">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </div>
            </div>
            <input
              type="file"
              multiple
              onChange={handleAttachmentUpload}
              ref={attachmentInputRef}
              className="hidden"
            />
            <button
              onClick={() => attachmentInputRef.current?.click()}
              className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Add Files
            </button>
            <p className="text-slate-400 mt-3 text-sm">Select multiple files to attach</p>
          </div>

          {/* Attachment List */}
          {emailConfig.attachments.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-slate-300 mb-3">Selected Files:</h4>
              <div className="space-y-2">
                {emailConfig.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-600/50 px-4 py-3 rounded-lg border border-slate-500/50">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-slate-200">{file.name}</span>
                    </div>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmailConfiguration